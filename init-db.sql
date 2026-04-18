-- Create smartdiet user with superuser privileges for this database
CREATE USER smartdiet WITH LOGIN ENCRYPTED PASSWORD 'smartdiet123' SUPERUSER;
ALTER DATABASE smartdiet OWNER TO smartdiet;

-- Create demo users table
CREATE TABLE IF NOT EXISTS "User" (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create demo patient table
CREATE TABLE IF NOT EXISTS "Patient" (
  id SERIAL PRIMARY KEY,
  mrn VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  age INT,
  sex VARCHAR(50),
  weight VARCHAR(50),
  height VARCHAR(50),
  bmi VARCHAR(10),
  unit VARCHAR(255),
  attending VARCHAR(255),
  admitted VARCHAR(50),
  conditions VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
  restrictions VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS "DietOrder" (
  id SERIAL PRIMARY KEY,
  mrn VARCHAR(50) NOT NULL,
  diet VARCHAR(255) NOT NULL,
  overridden BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS "AuditLog" (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255),
  action TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS "AlertSnooze" (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255),
  alert_type VARCHAR(255),
  snoozed_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
