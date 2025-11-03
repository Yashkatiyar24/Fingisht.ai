ALTER TABLE categorization_rules ADD CONSTRAINT unique_user_merchant_pattern UNIQUE (user_id, merchant_pattern);
