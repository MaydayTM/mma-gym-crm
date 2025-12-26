-- 033_add_boksen_discipline.sql
-- Voegt Boksen (Boxing) discipline toe

INSERT INTO disciplines (name, slug, has_belt_system, color, sort_order) 
VALUES ('Boksen', 'boksen', false, '#F59E0B', 9)
ON CONFLICT (slug) DO NOTHING;
