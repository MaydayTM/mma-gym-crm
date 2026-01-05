-- ===========================================
-- Extra kolommen voor member_subscriptions
-- ===========================================
-- Migratie: 049_member_subscriptions_extra_fields.sql
-- Probleem: notes en payment_status kolommen ontbraken

-- Notes kolom voor interne notities
ALTER TABLE member_subscriptions
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Payment status voor tracking
ALTER TABLE member_subscriptions
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Commentaar
COMMENT ON COLUMN member_subscriptions.notes IS 'Interne notities over dit abonnement';
COMMENT ON COLUMN member_subscriptions.payment_status IS 'Betaalstatus: pending, paid, failed, free';
