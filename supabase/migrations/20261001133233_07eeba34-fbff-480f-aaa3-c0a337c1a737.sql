ALTER TABLE public.plan_requests ALTER COLUMN status SET DEFAULT 'pending';
UPDATE public.plan_requests SET status = 'pending' WHERE status = 'new';
DROP POLICY IF EXISTS "Anyone submits plan requests" ON public.plan_requests;
CREATE POLICY "Anyone submits plan requests" ON public.plan_requests FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
ALTER TABLE public.plan_requests ADD CONSTRAINT plan_requests_status_check CHECK (status IN ('pending','contacted','completed'));
CREATE UNIQUE INDEX IF NOT EXISTS businesses_slug_key ON public.businesses(slug);

INSERT INTO public.businesses (slug,name,category,zone,address,phone,whatsapp,description,services,hours,status,is_featured,logo_url,images) VALUES
('pepperpot-palace','Pepperpot Palace','Restaurants','Kitty','12 Vlissengen Rd, Kitty, Georgetown','+5926001234','5926001234','Authentic Guyanese home cooking since 2009. Cook-up rice, pepperpot, curry and fresh roti daily.',ARRAY['Dine-in','Takeaway','Delivery','Catering'],'[[10,16],[9,21],[9,21],[9,21],[9,21],[9,23],[9,23]]',  'active',true,'/seed/food.jpg',ARRAY['/seed/food.jpg','/seed/market.jpg']),
('fixit-mobile','FixIt Mobile GY','Phone Repair','Stabroek','Water St, Stabroek, Georgetown','+5926115678','5926115678','iPhone, Samsung and Tecno repairs. Original parts and 90-day warranty.',ARRAY['Screen replacement','Battery swap','Water damage','Unlocking','Accessories'],'[null,[8,18],[8,18],[8,18],[8,18],[8,20],[9,16]]','active',false,'/seed/phone.jpg',ARRAY['/seed/phone.jpg']),
('glow-studio','Glow Beauty Studio','Beauty Salons','Campbellville','45 Sheriff St, Campbellville, Georgetown','+5926229012','5926229012','Hair, nails and lashes by certified stylists. Walk-ins welcome.',ARRAY['Braids','Silk press','Manicure & pedicure','Lash extensions','Makeup'],'[null,null,[9,19],[9,19],[9,19],[9,20],[8,18]]','active',true,'/seed/salon.jpg',ARRAY['/seed/salon.jpg']),
('bourda-fresh','Bourda Fresh Market','Markets & Groceries','Bourda','Robb St, Bourda, Georgetown','+5926333456','5926333456','Local fruits, vegetables, fresh juices and spices from Essequibo and Berbice farms.',ARRAY['Fresh produce','Juices','Spices','Home delivery'],'[[6,12],[6,18],[6,18],[6,18],[6,18],[6,18],[5,18]]','active',false,'/seed/market.jpg',ARRAY['/seed/market.jpg']),
('alberttown-grill','Alberttown Grill & Chill','Restaurants','Alberttown','Light St, Alberttown, Georgetown','+5926445566','5926445566','Grilled chicken, fish and fresh fruit punch. Open late on weekends.',ARRAY['Dine-in','Takeaway','Delivery'],'[[12,22],[11,22],[11,22],[11,22],[11,22],[11,24],[11,24]]','active',false,'/seed/food.jpg',ARRAY['/seed/food.jpg'])
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.promotions_stories (business_id,title,description,coupon,image_url,expires_at)
SELECT b.id, p.title, p.descr, p.coupon, p.img, now() + interval '60 days'
FROM (VALUES
 ('pepperpot-palace','Lunch special: Pepperpot + roti + drink for GYD 1,800','Every weekday 11am–3pm.','LUNCH18','/seed/food.jpg'),
 ('fixit-mobile','Screen replacement from GYD 8,000 — done in 1 hour','Original parts, 90-day warranty.','SCREEN10','/seed/phone.jpg'),
 ('glow-studio','20% off braids & silk press this week','Book on WhatsApp to secure your slot.','GLOW20','/seed/salon.jpg'),
 ('bourda-fresh','Fresh juice 2-for-1 every morning until 10am','Sorrel, passion fruit and more.',NULL,'/seed/market.jpg'),
 ('alberttown-grill','Friday wings bucket GYD 3,500','12 wings + fries, Fridays only.','WINGS',  '/seed/food.jpg')
) AS p(slug,title,descr,coupon,img)
JOIN public.businesses b ON b.slug = p.slug
WHERE NOT EXISTS (SELECT 1 FROM public.promotions_stories s WHERE s.business_id = b.id AND s.title = p.title);