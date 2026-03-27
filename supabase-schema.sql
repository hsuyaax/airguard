-- AirGuard Database Schema
-- PASTE THIS ENTIRE BLOCK into Supabase Dashboard → SQL Editor → New Query → Run

CREATE TABLE stations (
  id BIGSERIAL PRIMARY KEY,
  station_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  city TEXT DEFAULT 'Delhi',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE readings (
  id BIGSERIAL PRIMARY KEY,
  station_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  pm25 DOUBLE PRECISION,
  pm10 DOUBLE PRECISION,
  no2 DOUBLE PRECISION,
  so2 DOUBLE PRECISION,
  co DOUBLE PRECISION,
  o3 DOUBLE PRECISION,
  aqi DOUBLE PRECISION,
  source TEXT DEFAULT 'waqi',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(station_id, timestamp)
);
CREATE INDEX idx_readings_ts ON readings(timestamp DESC);

CREATE TABLE ward_aqi (
  id BIGSERIAL PRIMARY KEY,
  ward_no INTEGER NOT NULL,
  ward_name TEXT,
  pm25 DOUBLE PRECISION,
  aqi INTEGER,
  category TEXT,
  primary_source TEXT,
  source_breakdown JSONB,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ward_ts ON ward_aqi(timestamp DESC);

CREATE TABLE weather (
  id BIGSERIAL PRIMARY KEY,
  temperature DOUBLE PRECISION,
  humidity DOUBLE PRECISION,
  wind_speed DOUBLE PRECISION,
  wind_direction DOUBLE PRECISION,
  pressure DOUBLE PRECISION,
  description TEXT,
  source TEXT DEFAULT 'openweathermap',
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE complaints (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  ward_name TEXT NOT NULL,
  ward_no INTEGER,
  pollution_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_complaints_ts ON complaints(created_at DESC);

CREATE TABLE enforcement_notices (
  id BIGSERIAL PRIMARY KEY,
  ward_name TEXT NOT NULL,
  ward_no INTEGER,
  aqi_at_issue DOUBLE PRECISION,
  primary_source TEXT,
  grap_stage INTEGER,
  notice_text TEXT NOT NULL,
  language TEXT DEFAULT 'english',
  mode TEXT DEFAULT 'template',
  issued_by TEXT,
  status TEXT DEFAULT 'issued',
  compliance_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE aqi_history (
  id BIGSERIAL PRIMARY KEY,
  avg_aqi DOUBLE PRECISION NOT NULL,
  worst_ward TEXT,
  worst_aqi DOUBLE PRECISION,
  best_ward TEXT,
  best_aqi DOUBLE PRECISION,
  grap_stage INTEGER,
  ward_count INTEGER,
  severe_count INTEGER,
  very_poor_count INTEGER,
  station_count INTEGER,
  source TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_history_ts ON aqi_history(timestamp DESC);

CREATE TABLE alert_log (
  id BIGSERIAL PRIMARY KEY,
  ward_name TEXT NOT NULL,
  ward_no INTEGER,
  aqi DOUBLE PRECISION NOT NULL,
  alert_type TEXT NOT NULL,
  priority TEXT DEFAULT 'high',
  message TEXT,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: allow public reads, anon inserts on complaints
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_aqi ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE enforcement_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE aqi_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_all" ON stations FOR SELECT USING (true);
CREATE POLICY "read_all" ON readings FOR SELECT USING (true);
CREATE POLICY "read_all" ON ward_aqi FOR SELECT USING (true);
CREATE POLICY "read_all" ON weather FOR SELECT USING (true);
CREATE POLICY "read_all" ON complaints FOR SELECT USING (true);
CREATE POLICY "read_all" ON enforcement_notices FOR SELECT USING (true);
CREATE POLICY "read_all" ON aqi_history FOR SELECT USING (true);
CREATE POLICY "read_all" ON alert_log FOR SELECT USING (true);
CREATE POLICY "anon_insert" ON complaints FOR INSERT WITH CHECK (true);
