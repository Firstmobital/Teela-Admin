-- Seed activities for Teela luxury glamping experiences.
delete from public.activities
where name in (
  'ATV Off-Roading',
  'Paintball',
  'Sundowner Nature Walk',
  'Pottery with Locals',
  'Hot Air Balloon',
  'Helipad Dinner',
  'Helicopter Tour',
  'Jungle Rasoi Dining',
  'Nature Trek',
  'Star Gazing Session'
);

insert into public.activities (
  name,
  description,
  duration_minutes,
  max_capacity,
  price_per_person,
  is_free,
  image_url,
  is_active,
  available_slots
)
values
  (
    'ATV Off-Roading',
    'Guided forest trail ride with safety briefing and premium protective gear.',
    75,
    8,
    4200.00,
    false,
    'https://images.teela.app/activities/atv-off-roading.jpg',
    true,
    '["08:00-09:15","16:30-17:45"]'::jsonb
  ),
  (
    'Paintball',
    'Team strategy arena with supervised rounds in a curated woodland course.',
    90,
    14,
    3200.00,
    false,
    'https://images.teela.app/activities/paintball.jpg',
    true,
    '["10:00-11:30","15:00-16:30"]'::jsonb
  ),
  (
    'Sundowner Nature Walk',
    'Golden hour interpretive walk led by a naturalist with tea at the viewpoint.',
    60,
    18,
    1800.00,
    false,
    'https://images.teela.app/activities/sundowner-nature-walk.jpg',
    true,
    '["17:30-18:30"]'::jsonb
  ),
  (
    'Pottery with Locals',
    'Hands-on clay workshop with village artisans and kiln-fired keepsake.',
    120,
    10,
    2600.00,
    false,
    'https://images.teela.app/activities/pottery-with-locals.jpg',
    true,
    '["11:00-13:00"]'::jsonb
  ),
  (
    'Hot Air Balloon',
    'Sunrise balloon drift over the valley with champagne-free wellness breakfast hamper.',
    60,
    6,
    14500.00,
    false,
    'https://images.teela.app/activities/hot-air-balloon.jpg',
    true,
    '["06:00-07:00"]'::jsonb
  ),
  (
    'Helipad Dinner',
    'Private chef-curated sattvic tasting menu at the helipad under lantern lighting.',
    150,
    2,
    22000.00,
    false,
    'https://images.teela.app/activities/helipad-dinner.jpg',
    true,
    '["19:30-22:00"]'::jsonb
  ),
  (
    'Helicopter Tour',
    'Aerial circuit over forests and water bodies with in-flight commentary.',
    35,
    5,
    25000.00,
    false,
    'https://images.teela.app/activities/helicopter-tour.jpg',
    true,
    '["09:30-10:05","16:00-16:35"]'::jsonb
  ),
  (
    'Jungle Rasoi Dining',
    'Live-fire vegetarian degustation in an open jungle kitchen setting.',
    120,
    20,
    4800.00,
    false,
    'https://images.teela.app/activities/jungle-rasoi-dining.jpg',
    true,
    '["20:00-22:00"]'::jsonb
  ),
  (
    'Nature Trek',
    'Moderate guided trek through shaded ridgelines with hydration stops.',
    150,
    16,
    2100.00,
    false,
    'https://images.teela.app/activities/nature-trek.jpg',
    true,
    '["06:30-09:00"]'::jsonb
  ),
  (
    'Star Gazing Session',
    'Astronomy-led sky interpretation with telescopes and warm herbal infusions.',
    90,
    24,
    1700.00,
    false,
    'https://images.teela.app/activities/star-gazing-session.jpg',
    true,
    '["21:00-22:30"]'::jsonb
  );

-- Seed sattvic vegetarian menu for a detox-oriented luxury resort.
delete from public.menu_items
where category in (
  'Soups & Starters',
  'Mains',
  'Breads & Rice',
  'Desserts',
  'Beverages'
);

insert into public.menu_items (
  category,
  name,
  description,
  price,
  is_active,
  display_order
)
values
  ('Soups & Starters', 'Ash Gourd Shorba', 'Light sattvic broth with ash gourd, tulsi, and black pepper.', 420.00, true, 1),
  ('Soups & Starters', 'Steamed Millet Momo', 'Foxtail millet dumplings stuffed with seasonal vegetables.', 480.00, true, 2),
  ('Soups & Starters', 'Lotus Stem Crisp', 'Baked lotus stem coins with amaranth crust and mint dip.', 510.00, true, 3),
  ('Soups & Starters', 'Tender Coconut Chaat', 'Tender coconut, cucumber, pomegranate, and rock salt dressing.', 460.00, true, 4),
  ('Soups & Starters', 'Pumpkin and Carrot Veloute', 'Silky pumpkin carrot veloute finished with cold-pressed coconut milk.', 440.00, true, 5),

  ('Mains', 'Moringa Khichdi Bowl', 'Slow-cooked rice and moong with moringa, ghee, and cumin.', 690.00, true, 6),
  ('Mains', 'Jackfruit Seed Kofta Curry', 'Soft kofta in cashew tomato gravy without onion or garlic.', 760.00, true, 7),
  ('Mains', 'Himalayan Vegetable Stew', 'Seasonal vegetables in light almond and saffron broth.', 740.00, true, 8),
  ('Mains', 'Quinoa and Paneer Garden Plate', 'Grilled paneer with herbed quinoa and sautéed greens.', 820.00, true, 9),
  ('Mains', 'Barnyard Millet Pilaf Platter', 'Barnyard millet pilaf, beetroot raita, and sautéed beans.', 710.00, true, 10),

  ('Breads & Rice', 'Ancient Grain Phulka Basket', 'Soft phulka assortment of jowar, bajra, and whole wheat.', 280.00, true, 11),
  ('Breads & Rice', 'Saffron Steamed Rice', 'Fragrant long-grain rice lightly infused with saffron.', 320.00, true, 12),
  ('Breads & Rice', 'Jeera Brown Rice', 'Nutty brown rice tempered with cumin and clarified butter.', 340.00, true, 13),
  ('Breads & Rice', 'Amaranth Laccha Paratha', 'Layered amaranth and wheat paratha finished on stone griddle.', 360.00, true, 14),
  ('Breads & Rice', 'Lemon Herb Red Rice', 'Kerala red rice tossed with lemon zest and fresh herbs.', 350.00, true, 15),

  ('Desserts', 'Date and Fig Ladoo', 'Naturally sweet laddoo rolled with nuts and dry coconut.', 360.00, true, 16),
  ('Desserts', 'Jaggery Baked Rosogolla', 'Cottage cheese dumplings baked in light palm jaggery syrup.', 420.00, true, 17),
  ('Desserts', 'Saffron Poached Pear', 'Poached pear with saffron reduction and pistachio dust.', 480.00, true, 18),
  ('Desserts', 'Millet Kheer', 'Barnyard millet pudding with dates, cardamom, and almond slivers.', 390.00, true, 19),
  ('Desserts', 'Cocoa and Avocado Mousse', 'Refined sugar free dark cocoa mousse with seasonal berries.', 450.00, true, 20),

  ('Beverages', 'Amla Ginger Cooler', 'Fresh amla, ginger, and mint tonic with no added sugar.', 310.00, true, 21),
  ('Beverages', 'Tulsi Lemongrass Infusion', 'Warm herbal infusion to aid digestion and relaxation.', 260.00, true, 22),
  ('Beverages', 'Beetroot Kanji Shot', 'Probiotic kanji with beetroot, mustard seed, and pink salt.', 290.00, true, 23),
  ('Beverages', 'Tender Coconut Kefir', 'Light fermented coconut probiotic drink with basil seeds.', 340.00, true, 24),
  ('Beverages', 'Golden Turmeric Almond Milk', 'Warm almond milk with turmeric, cinnamon, and black pepper.', 330.00, true, 25);
