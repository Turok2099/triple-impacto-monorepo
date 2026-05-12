-- Migration: 006_create_user_payment_methods
-- Purpose: Store Fiserv payment tokens for recurring payments (REST API)

CREATE TABLE IF NOT EXISTS user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Fiserv Token Info
  fiserv_token TEXT NOT NULL, -- Hosted Data ID or paymentToken
  scheme_transaction_id TEXT, -- ID de transacción de marca (VISA)
  
  -- Card Metadata (No sensible)
  card_brand VARCHAR(50), -- VISA, MASTERCARD, etc.
  last_4 VARCHAR(4),      -- Últimos 4 dígitos
  exp_month VARCHAR(2),
  exp_year VARCHAR(4),
  cardholder_name VARCHAR(255),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_token ON user_payment_methods(fiserv_token);

-- Trigger for updated_at (uses existing function from supabase-schema.sql)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_methods_updated_at') THEN
    CREATE TRIGGER update_payment_methods_updated_at
      BEFORE UPDATE ON user_payment_methods
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies usually use auth.uid(), but for testing/backend we might need service_role.
-- Adding a basic policy for the user to see their own tokens.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own payment methods' AND tablename = 'user_payment_methods') THEN
    CREATE POLICY "Users can view their own payment methods"
      ON user_payment_methods
      FOR SELECT
      USING (user_id = (select auth.uid()));
  END IF;
END $$;
