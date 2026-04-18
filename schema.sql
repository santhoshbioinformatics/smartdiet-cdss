CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'RN',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Patient" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    mrn TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    age INT NOT NULL,
    sex TEXT NOT NULL,
    weight TEXT NOT NULL,
    height TEXT NOT NULL,
    bmi TEXT NOT NULL,
    unit TEXT NOT NULL,
    attending TEXT NOT NULL,
    admitted TEXT NOT NULL,
    conditions TEXT[] DEFAULT '{}',
    restrictions TEXT[] DEFAULT '{}',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "DietOrder" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "patientId" TEXT NOT NULL REFERENCES "Patient"(id),
    "userId" TEXT NOT NULL REFERENCES "User"(id),
    "dietType" TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    confidence TEXT,
    "overrideReason" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"(id),
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    "patientMrn" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AlertSnooze" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "alertId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    reason TEXT NOT NULL,
    "snoozedUntil" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
