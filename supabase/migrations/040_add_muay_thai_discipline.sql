-- Add Muay Thai discipline
INSERT INTO disciplines (name, slug, has_belt_system, color, sort_order)
VALUES ('Muay Thai', 'muay-thai', false, '#E11D48', 9)
ON CONFLICT (slug) DO NOTHING;
