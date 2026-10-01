CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.business_status AS ENUM ('active', 'paused');
CREATE TYPE public.plan_tier AS ENUM ('free', 'business', 'featured', 'campaign');
CREATE TYPE public.click_type AS ENUM ('whatsapp', 'call', 'map', 'view');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  zone text NOT NULL,
  address text,
  phone text,
  whatsapp text,
  description text,
  services text[] NOT NULL DEFAULT '{}',
  hours jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.business_status NOT NULL DEFAULT 'active',
  is_featured boolean NOT NULL DEFAULT false,
  logo_url text,
  images text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.businesses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active businesses" ON public.businesses FOR SELECT TO anon, authenticated
  USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert businesses" ON public.businesses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update businesses" ON public.businesses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete businesses" ON public.businesses FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.promotions_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  coupon text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.promotions_stories(business_id);
GRANT SELECT ON public.promotions_stories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions_stories TO authenticated;
GRANT ALL ON public.promotions_stories TO service_role;
ALTER TABLE public.promotions_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active promotions" ON public.promotions_stories FOR SELECT TO anon, authenticated
  USING (
    (is_active AND (expires_at IS NULL OR expires_at > now())
      AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.status = 'active'))
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admins insert promotions" ON public.promotions_stories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update promotions" ON public.promotions_stories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete promotions" ON public.promotions_stories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER promotions_updated_at BEFORE UPDATE ON public.promotions_stories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.plan_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan public.plan_tier NOT NULL,
  business_name text NOT NULL CHECK (char_length(business_name) BETWEEN 1 AND 120),
  contact_name text NOT NULL CHECK (char_length(contact_name) BETWEEN 1 AND 120),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 5 AND 30),
  email text CHECK (email IS NULL OR char_length(email) <= 255),
  message text CHECK (message IS NULL OR char_length(message) <= 1000),
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.plan_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_requests TO authenticated;
GRANT ALL ON public.plan_requests TO service_role;
ALTER TABLE public.plan_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits plan requests" ON public.plan_requests FOR INSERT TO anon, authenticated WITH CHECK (status = 'new');
CREATE POLICY "Admins read plan requests" ON public.plan_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update plan requests" ON public.plan_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete plan requests" ON public.plan_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type public.click_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.click_events(business_id, created_at);
GRANT INSERT ON public.click_events TO anon;
GRANT SELECT, INSERT, DELETE ON public.click_events TO authenticated;
GRANT ALL ON public.click_events TO service_role;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone logs clicks on active businesses" ON public.click_events FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.status = 'active'));
CREATE POLICY "Admins read clicks" ON public.click_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete clicks" ON public.click_events FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public reads business photos" ON storage.objects FOR SELECT USING (bucket_id = 'business-photos');
CREATE POLICY "Admins upload business photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'business-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update business photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'business-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete business photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'business-photos' AND public.has_role(auth.uid(), 'admin'));