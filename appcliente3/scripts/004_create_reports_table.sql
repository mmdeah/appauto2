-- Create reports table for technical diagnostics
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate TEXT NOT NULL,
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view reports" ON reports;
DROP POLICY IF EXISTS "Technicians can create reports" ON reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON reports;

-- Create policies
CREATE POLICY "Anyone can view reports" ON reports
  FOR SELECT
  USING (true);

CREATE POLICY "Technicians can create reports" ON reports
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their own reports" ON reports
  FOR DELETE
  USING (created_by = auth.uid() OR auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_license_plate ON reports(license_plate);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
