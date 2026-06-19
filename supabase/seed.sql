-- Run this in the Supabase SQL Editor to add more menu items.
-- Matches the actual schema: categories(id, name, display_order),
-- menu_items(id, category_id, name, description, base_price, image_url, is_available, avg_prep_time_min, created_at)
-- Existing categories: 1 = Beverages, 2 = Food

insert into menu_items (category_id, name, description, base_price, is_available, avg_prep_time_min) values
  (1, 'Cold Brew',              'Smooth and bold, slow-steeped for 12 hours',         175, true, 1),
  (1, 'Vanilla Latte',          'Espresso with vanilla and steamed milk',             160, true, 3),
  (1, 'Mocha Frappuccino',      'Blended coffee with chocolate and whipped cream',    195, true, 5),
  (1, 'Matcha Latte',           'Earthy matcha with steamed milk',                    170, true, 3),
  (1, 'Hot Chocolate',          'Rich cocoa with steamed milk',                       140, true, 3),
  (1, 'Strawberry Refresher',   'Fruity and refreshing iced tea',                     165, true, 2),
  (2, 'Blueberry Muffin',       'Soft muffin with blueberries',                       110, true, 1),
  (2, 'Ham & Cheese Croissant', 'Buttery croissant with ham and cheese',              130, true, 2),
  (2, 'Chocolate Chip Cookie',  'Classic chewy cookie',                                85, true, 1);
