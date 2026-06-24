-- Seeds customization_options (Size + Milk) for every drink that doesn't
-- already have them, and fixes up item 1's existing Size rows (Tall was
-- seeded as the ₱0 base with no Short row at all — Short is now the base
-- and Tall carries its own charge).
--
-- Size ladder: Short ₱0 (base) · Tall +₱15 · Grande +₱20 · Venti +₱35
-- Milk ladder: Whole ₱0 (base) · Oat +₱25
--
-- Run this in the Supabase SQL Editor (or `supabase db execute`). Idempotent:
-- safe to re-run. Adjust values below before running if your menu differs.

-- 0a. Fix-up: any existing Tall row still priced at the old 0 (Tall used to
-- be the base) now carries the +15 charge.
update customization_options
set price_modifier = 15
where option_group = 'Size' and option_value = 'Tall' and price_modifier = 0;

-- 0b. Fix-up: add the missing Short row (₱0 base) to any item that already
-- has other Size rows but never had Short seeded.
insert into customization_options (menu_item_id, option_group, option_value, price_modifier)
select mi.id, 'Size', 'Short', 0
from menu_items mi
join categories c on c.id = mi.category_id
where lower(c.name) <> 'food'
  and exists (
    select 1 from customization_options co
    where co.menu_item_id = mi.id and co.option_group = 'Size'
  )
  and not exists (
    select 1 from customization_options co
    where co.menu_item_id = mi.id and co.option_group = 'Size' and co.option_value = 'Short'
  );

-- 1. Size options for every drink that has NO Size rows yet at all.
insert into customization_options (menu_item_id, option_group, option_value, price_modifier)
select mi.id, 'Size', v.option_value, v.price_modifier
from menu_items mi
join categories c on c.id = mi.category_id
cross join (values
  ('Short',  0),
  ('Tall',   15),
  ('Grande', 20),
  ('Venti',  35)
) as v(option_value, price_modifier)
where lower(c.name) <> 'food'
  and not exists (
    select 1 from customization_options co
    where co.menu_item_id = mi.id and co.option_group = 'Size'
  );

-- 2. Milk options: Whole (base), Oat (+25)
-- Applies to every non-Food item where has_milk_options is true (or null,
-- which the app treats as "has milk options").
insert into customization_options (menu_item_id, option_group, option_value, price_modifier)
select mi.id, 'Milk', v.option_value, v.price_modifier
from menu_items mi
join categories c on c.id = mi.category_id
cross join (values
  ('Whole', 0),
  ('Oat',   25)
) as v(option_value, price_modifier)
where lower(c.name) <> 'food'
  and coalesce(mi.has_milk_options, true) = true
  and not exists (
    select 1 from customization_options co
    where co.menu_item_id = mi.id and co.option_group = 'Milk'
  );

-- Sanity check: see what's seeded per item afterwards
-- select mi.name, co.option_group, co.option_value, co.price_modifier
-- from customization_options co
-- join menu_items mi on mi.id = co.menu_item_id
-- order by mi.id, co.option_group, co.price_modifier;
