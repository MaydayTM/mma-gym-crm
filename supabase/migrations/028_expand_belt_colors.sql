-- ===========================================
-- Expand Belt Colors for All Disciplines
-- ===========================================
-- Migratie: 028_expand_belt_colors.sql
-- Doel: Voeg meer gordelkleuren toe voor disciplines zoals Luta Livre, Judo, Karate

-- Drop de oude constraint
ALTER TABLE member_belts DROP CONSTRAINT IF EXISTS member_belts_belt_color_check;

-- Voeg nieuwe constraint toe met uitgebreide kleuren
ALTER TABLE member_belts ADD CONSTRAINT member_belts_belt_color_check
  CHECK (belt_color IN (
    -- Basis kleuren (alle sporten)
    'white',
    'yellow',
    'orange',
    'green',
    'blue',
    'purple',
    'brown',
    'black',
    'red',
    -- Speciale kleuren
    'grey',        -- Sommige systemen
    'red_white',   -- Judo/BJJ 6e-8e dan
    'red_black',   -- Judo coral belt
    'coral'        -- BJJ coral belt
  ));

-- Ook voor belt_history from_belt en to_belt (geen constraint hier, maar goed om te documenteren)
-- belt_history heeft VARCHAR(20) zonder CHECK, dus die accepteert al alle kleuren

COMMENT ON COLUMN member_belts.belt_color IS 'Gordelkleur. Ondersteunde kleuren: white, yellow, orange, green, blue, purple, brown, black, red, grey, red_white, red_black, coral';
