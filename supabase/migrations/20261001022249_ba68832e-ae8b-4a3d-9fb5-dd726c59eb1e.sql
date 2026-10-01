REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

DROP POLICY "Public reads active businesses" ON public.businesses;
CREATE POLICY "Anon reads active businesses" ON public.businesses FOR SELECT TO anon USING (status = 'active');
CREATE POLICY "Users read active businesses" ON public.businesses FOR SELECT TO authenticated
  USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

DROP POLICY "Public reads active promotions" ON public.promotions_stories;
CREATE POLICY "Anon reads active promotions" ON public.promotions_stories FOR SELECT TO anon
  USING (is_active AND (expires_at IS NULL OR expires_at > now())
    AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.status = 'active'));
CREATE POLICY "Users read active promotions" ON public.promotions_stories FOR SELECT TO authenticated
  USING ((is_active AND (expires_at IS NULL OR expires_at > now())
    AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.status = 'active'))
    OR public.has_role(auth.uid(), 'admin'));