-- Create user_rate_limits table for tracking daily request limits
CREATE TABLE IF NOT EXISTS user_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_date DATE NOT NULL,
  request_count INTEGER DEFAULT 0,
  last_request_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, request_date)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_rate_limits_user_date ON user_rate_limits(user_id, request_date);

-- Create function to increment rate limit count
CREATE OR REPLACE FUNCTION increment_rate_limit(p_user_id UUID, p_request_date DATE)
RETURNS VOID AS $$
BEGIN
  UPDATE user_rate_limits 
  SET 
    request_count = request_count + 1,
    last_request_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id AND request_date = p_request_date;
  
  -- If no rows were updated, insert a new record
  IF NOT FOUND THEN
    INSERT INTO user_rate_limits (user_id, request_date, request_count, last_request_at)
    VALUES (p_user_id, p_request_date, 1, NOW());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own rate limits" ON user_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own rate limits" ON user_rate_limits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rate limits" ON user_rate_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_rate_limits TO authenticated;
GRANT EXECUTE ON FUNCTION increment_rate_limit TO authenticated;
