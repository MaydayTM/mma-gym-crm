-- 059_activate_shop_module.sql
-- Activate Shop module for Reconnect (trial expired on ~8 januari 2026)
-- Datum: 24 januari 2026

-- Change shop module from trial to active status for Reconnect tenant
UPDATE tenant_module_subscriptions
SET
  status = 'active',
  trial_ends_at = NULL
WHERE tenant_id = 'reconnect'
  AND module_id = (SELECT id FROM modules WHERE slug = 'shop');

-- Also ensure Email module is active (same situation)
UPDATE tenant_module_subscriptions
SET
  status = 'active',
  trial_ends_at = NULL
WHERE tenant_id = 'reconnect'
  AND module_id = (SELECT id FROM modules WHERE slug = 'email');
