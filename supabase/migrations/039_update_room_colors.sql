-- Update room kleuren naar Reconnect Academy brand colors
-- Geel (#FBBF24) voor Goro's Lair (amber-400)
-- Paars (#8B5CF6) voor The Pit (violet-500)

UPDATE rooms SET color = '#FBBF24' WHERE name = 'Goro''s Lair';
UPDATE rooms SET color = '#8B5CF6' WHERE name = 'The Pit';
