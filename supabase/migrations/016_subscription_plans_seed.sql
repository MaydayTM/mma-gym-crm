-- 016_subscription_plans_seed.sql
-- Seed data voor Reconnect Academy prijsstructuur 2026

-- ============================================
-- AGE GROUPS
-- ============================================
INSERT INTO age_groups (slug, name, subtitle, min_age, max_age, starting_price, sort_order) VALUES
('kids', 'Kids', 'Tot 12 jaar', 0, 11, 40.00, 1),
('students', 'Jongeren & Studenten', '12-21 jaar', 12, 21, 50.00, 2),
('adults', 'Volwassenen', 'Vanaf 22 jaar', 22, NULL, 55.00, 3);

-- ============================================
-- PLAN TYPES
-- ============================================
INSERT INTO plan_types (slug, name, description, features, highlight_text, sort_order) VALUES
('basic', '1 Sport', 'Kies één discipline naar keuze',
 '["1 sport naar keuze", "Groep I & II lessen", "Flexibel opzegbaar"]'::jsonb,
 NULL, 1),
('allin', 'All-In', 'Toegang tot alle disciplines',
 '["Alle sporten onbeperkt", "Open mats & sparring", "Workshops & seminars", "Groep I & II lessen", "Flexibel opzegbaar"]'::jsonb,
 'BESTE WAARDE', 2);

-- ============================================
-- PRICING MATRIX
-- Kids pricing
-- ============================================
INSERT INTO pricing_matrix (age_group_id, plan_type_id, duration_months, price, price_per_month, savings, includes_insurance) VALUES
-- Kids Basic
((SELECT id FROM age_groups WHERE slug = 'kids'), (SELECT id FROM plan_types WHERE slug = 'basic'), 1, 40.00, 40.00, 0, false),
((SELECT id FROM age_groups WHERE slug = 'kids'), (SELECT id FROM plan_types WHERE slug = 'basic'), 3, 105.00, 35.00, 15.00, false),
((SELECT id FROM age_groups WHERE slug = 'kids'), (SELECT id FROM plan_types WHERE slug = 'basic'), 12, 360.00, 30.00, 120.00, false),
-- Kids All-In
((SELECT id FROM age_groups WHERE slug = 'kids'), (SELECT id FROM plan_types WHERE slug = 'allin'), 1, 50.00, 50.00, 0, false),
((SELECT id FROM age_groups WHERE slug = 'kids'), (SELECT id FROM plan_types WHERE slug = 'allin'), 3, 135.00, 45.00, 15.00, false),
((SELECT id FROM age_groups WHERE slug = 'kids'), (SELECT id FROM plan_types WHERE slug = 'allin'), 12, 480.00, 40.00, 120.00, true);

-- ============================================
-- Students pricing
-- ============================================
INSERT INTO pricing_matrix (age_group_id, plan_type_id, duration_months, price, price_per_month, savings, includes_insurance) VALUES
-- Students Basic
((SELECT id FROM age_groups WHERE slug = 'students'), (SELECT id FROM plan_types WHERE slug = 'basic'), 1, 50.00, 50.00, 0, false),
((SELECT id FROM age_groups WHERE slug = 'students'), (SELECT id FROM plan_types WHERE slug = 'basic'), 3, 135.00, 45.00, 15.00, false),
((SELECT id FROM age_groups WHERE slug = 'students'), (SELECT id FROM plan_types WHERE slug = 'basic'), 12, 480.00, 40.00, 120.00, false),
-- Students All-In
((SELECT id FROM age_groups WHERE slug = 'students'), (SELECT id FROM plan_types WHERE slug = 'allin'), 1, 65.00, 65.00, 0, false),
((SELECT id FROM age_groups WHERE slug = 'students'), (SELECT id FROM plan_types WHERE slug = 'allin'), 3, 180.00, 60.00, 15.00, false),
((SELECT id FROM age_groups WHERE slug = 'students'), (SELECT id FROM plan_types WHERE slug = 'allin'), 12, 660.00, 55.00, 120.00, true);

-- ============================================
-- Adults pricing
-- ============================================
INSERT INTO pricing_matrix (age_group_id, plan_type_id, duration_months, price, price_per_month, savings, includes_insurance) VALUES
-- Adults Basic
((SELECT id FROM age_groups WHERE slug = 'adults'), (SELECT id FROM plan_types WHERE slug = 'basic'), 1, 55.00, 55.00, 0, false),
((SELECT id FROM age_groups WHERE slug = 'adults'), (SELECT id FROM plan_types WHERE slug = 'basic'), 3, 150.00, 50.00, 15.00, false),
((SELECT id FROM age_groups WHERE slug = 'adults'), (SELECT id FROM plan_types WHERE slug = 'basic'), 12, 540.00, 45.00, 120.00, false),
-- Adults All-In
((SELECT id FROM age_groups WHERE slug = 'adults'), (SELECT id FROM plan_types WHERE slug = 'allin'), 1, 70.00, 70.00, 0, false),
((SELECT id FROM age_groups WHERE slug = 'adults'), (SELECT id FROM plan_types WHERE slug = 'allin'), 3, 195.00, 65.00, 15.00, false),
((SELECT id FROM age_groups WHERE slug = 'adults'), (SELECT id FROM plan_types WHERE slug = 'allin'), 12, 720.00, 60.00, 120.00, true);

-- ============================================
-- PLAN ADDONS
-- ============================================
INSERT INTO plan_addons (slug, name, description, price, billing_type, applicable_to, is_required, sort_order) VALUES
('insurance', 'Sportverzekering', 'Verplicht bij deelname aan wedstrijden', 26.00, 'yearly', '["subscription"]'::jsonb, false, 1),
('equipment-rental', 'Materiaalhuur', 'Bokshandschoenen + scheenplaten (per sessie)', 5.00, 'once', '["daypass"]'::jsonb, false, 2);

-- ============================================
-- FAMILY DISCOUNTS
-- ============================================
INSERT INTO family_discounts (position, discount_amount, description) VALUES
(2, 20.00, '2e gezinslid: -€20/maand'),
(3, 30.00, '3e gezinslid: -€30/maand'),
(4, 30.00, '4e gezinslid: -€30/maand'),
(5, 30.00, '5e gezinslid: -€30/maand');

-- ============================================
-- ONE-TIME PRODUCTS
-- ============================================
INSERT INTO one_time_products (slug, name, product_type, price, sessions, validity_days, description, sort_order) VALUES
('daypass', 'Dagpas', 'daypass', 15.00, 1, 1, 'Eenmalige toegang voor 1 training', 1),
('5-sessions', '5-Beurtenkaart', 'punch_card', 70.00, 5, 90, '5 beurten, 3 maanden geldig', 2),
('10-sessions', '10-Beurtenkaart', 'punch_card', 120.00, 10, 180, '10 beurten, 6 maanden geldig', 3);
