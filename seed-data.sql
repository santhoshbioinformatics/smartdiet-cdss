-- Insert users
INSERT INTO "User" (id, email, password, name, role) VALUES
  (gen_random_uuid()::text, 'nurse@smartdiet.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWDeS86E36P4/LaK2', 'J. Martinez, RN', 'RN'),
  (gen_random_uuid()::text, 'doctor@smartdiet.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWDeS86E36P4/LaK2', 'Dr. A. Patel, MD', 'MD'),
  (gen_random_uuid()::text, 'dietitian@smartdiet.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWDeS86E36P4/LaK2', 'S. Chen, RD', 'RD'),
  (gen_random_uuid()::text, 'admin@smartdiet.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWDeS86E36P4/LaK2', 'Admin User', 'Admin');

-- Insert patients
INSERT INTO "Patient" (id, mrn, name, age, sex, weight, height, bmi, unit, attending, admitted, conditions, restrictions) VALUES
  (gen_random_uuid()::text, '04-827-3951', 'Margaret H.', 68, 'Female', '72 kg', '163 cm', '27.1', '4-North Med/Surg', 'Dr. Okonkwo', '03/25/2026', ARRAY['Lactose Intolerance'], ARRAY['lactose']),
  (gen_random_uuid()::text, '07-112-4823', 'Thomas B.', 34, 'Male', '81 kg', '178 cm', '25.6', '2-South GI', 'Dr. Sharma', '03/24/2026', ARRAY['Celiac Disease'], ARRAY['gluten']),
  (gen_random_uuid()::text, '11-334-7762', 'Eleanor V.', 57, 'Female', '88 kg', '160 cm', '34.4', '3-East Endocrine', 'Dr. Rivera', '03/26/2026', ARRAY['Type 2 Diabetes Mellitus', 'Hypertension (Stage 2)'], ARRAY[]::text[]),
  (gen_random_uuid()::text, '09-445-2210', 'Robert K.', 72, 'Male', '68 kg', '175 cm', '22.2', '5-West Nephrology', 'Dr. Nguyen', '03/23/2026', ARRAY['Chronic Kidney Disease (Stage 3b)', 'Hypertension (Stage 1)'], ARRAY[]::text[]),
  (gen_random_uuid()::text, '03-991-5541', 'Priya S.', 45, 'Female', '64 kg', '158 cm', '25.6', '4-North Med/Surg', 'Dr. Okonkwo', '03/26/2026', ARRAY['Type 2 Diabetes Mellitus', 'Chronic Kidney Disease (Stage 3b)', 'Hypertension (Stage 2)'], ARRAY['gluten', 'nut']);

SELECT 'Seed data inserted successfully!';
