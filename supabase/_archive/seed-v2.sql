-- ============================================================
-- HRM TRÀ SỮA — SEED DATA v2.0
-- Run AFTER schema-v2.sql
-- ============================================================

-- ==============================
-- 1. ORGANIZATION
-- ==============================
INSERT INTO organizations (id, name, address, phone, email, tax_code, settings) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'Trà Sữa ABC',
    '100 Nguyễn Huệ, Quận 1, TP.HCM',
    '028 1234 5678',
    'hr@trasua-abc.vn',
    '0312345678',
    '{"working_hours_per_month": 208, "overtime_rate": 1.5, "late_penalty_per_minute": 5000, "currency": "VND"}'
);


-- ==============================
-- 2. POSITIONS (5)
-- ==============================
INSERT INTO positions (id, organization_id, name, code, level, base_salary) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Barista',        'POS001', 1,  5500000),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Cashier',         'POS002', 1,  5000000),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Shift Leader',    'POS003', 3,  7000000),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Store Manager',   'POS004', 5,  12000000),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'HR Admin',        'POS005', 7,  15000000);


-- ==============================
-- 3. STORES (3)
-- ==============================
INSERT INTO stores (id, organization_id, name, code, address, phone, latitude, longitude, radius_meters, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Chi nhánh Quận 1', 'ST001', '123 Nguyễn Huệ, Quận 1, TP.HCM',    '028 1111 1111', 10.7736000, 106.7024000, 100, 'active'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Chi nhánh Quận 3', 'ST002', '456 Lê Văn Sỹ, Quận 3, TP.HCM',      '028 2222 2222', 10.7845000, 106.6679000, 100, 'active'),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Chi nhánh Quận 7', 'ST003', '789 Nguyễn Thị Thập, Quận 7, TP.HCM', '028 3333 3333', 10.7340000, 106.7220000, 120, 'active');


-- ==============================
-- 4. SHIFTS (3)
-- ==============================
INSERT INTO shifts (id, organization_id, name, code, start_time, end_time, break_minutes, is_overnight, color) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Ca Sáng',  'SHIFT_AM',    '07:00', '14:00', 30, FALSE, '#4CAF50'),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Ca Chiều', 'SHIFT_PM',    '14:00', '21:00', 30, FALSE, '#2196F3'),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Ca Tối',   'SHIFT_NIGHT', '21:00', '02:00', 15, TRUE,  '#9C27B0');


-- ==============================
-- 5. USERS (15)
-- ==============================
-- Password hash = bcrypt('123456')
-- Using a placeholder hash for seed data
DO $$
DECLARE
    pwd TEXT := '$2a$10$X7XkGk0NqPh5IYaOz7NFC.fP7KPLsIbHjElvCHQk3I5fVzjgL/hSe';
BEGIN

-- CEO (1)
INSERT INTO users (id, organization_id, store_id, position_id, employee_code, email, phone, password_hash, full_name, date_of_birth, gender, id_number, address, bank_name, bank_account, start_date, contract_type, status, role) VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'NV001', 'ceo@trasua-abc.vn',      '0901000001', pwd, 'Nguyễn Văn An',     '1985-03-15', 'male',   '079185000001', '10 Nguyễn Du, Q.1',        'Vietcombank', '0071000123456', '2022-01-01', 'fulltime', 'active', 'ceo');

-- HR Admin (1)
INSERT INTO users (id, organization_id, store_id, position_id, employee_code, email, phone, password_hash, full_name, date_of_birth, gender, id_number, address, bank_name, bank_account, start_date, contract_type, status, role) VALUES
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'NV002', 'hr@trasua-abc.vn',       '0901000002', pwd, 'Trần Thị Bích',     '1990-07-20', 'female', '079190000002', '20 Trần Hưng Đạo, Q.1',    'Techcombank', '1901000234567', '2022-06-01', 'fulltime', 'active', 'hr_admin');

-- Store Managers (3)
INSERT INTO users (id, organization_id, store_id, position_id, employee_code, email, phone, password_hash, full_name, date_of_birth, gender, id_number, address, bank_name, bank_account, start_date, contract_type, status, role) VALUES
('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'NV003', 'manager.q1@trasua-abc.vn', '0901000003', pwd, 'Lê Hoàng Cường',  '1992-11-05', 'male',   '079192000003', '30 Lý Tự Trọng, Q.1',      'MB Bank',     '6801000345678', '2023-01-15', 'fulltime', 'active', 'store_manager'),
('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'NV004', 'manager.q3@trasua-abc.vn', '0901000004', pwd, 'Phạm Thị Dung',   '1993-04-12', 'female', '079193000004', '40 Lê Văn Sỹ, Q.3',        'ACB',         '2501000456789', '2023-03-01', 'fulltime', 'active', 'store_manager'),
('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'NV005', 'manager.q7@trasua-abc.vn', '0901000005', pwd, 'Võ Thanh Em',      '1991-09-28', 'male',   '079191000005', '50 Nguyễn Thị Thập, Q.7',  'BIDV',        '3101000567890', '2023-06-01', 'fulltime', 'active', 'store_manager');

-- Shift Leaders (3)
INSERT INTO users (id, organization_id, store_id, position_id, employee_code, email, phone, password_hash, full_name, date_of_birth, gender, id_number, address, bank_name, bank_account, start_date, contract_type, status, role) VALUES
('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'NV006', 'leader1@trasua-abc.vn',    '0901000006', pwd, 'Nguyễn Thị Phụng', '1997-01-10', 'female', '079197000006', '60 Bùi Viện, Q.1',         'TPBank',      '0371000678901', '2024-01-01', 'fulltime', 'active', 'shift_leader'),
('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'NV007', 'leader2@trasua-abc.vn',    '0901000007', pwd, 'Đặng Minh Giang',  '1998-05-22', 'male',   '079198000007', '70 Kha Vạn Cân, Thủ Đức',  'VPBank',      '0511000789012', '2024-02-01', 'fulltime', 'active', 'shift_leader'),
('e0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'NV008', 'leader3@trasua-abc.vn',    '0901000008', pwd, 'Huỳnh Thị Hạnh',   '1999-08-15', 'female', '079199000008', '80 Nguyễn Văn Linh, Q.7',  'Sacombank',   '0601000890123', '2024-03-01', 'fulltime', 'active', 'shift_leader');

-- Baristas (5)
INSERT INTO users (id, organization_id, store_id, position_id, employee_code, email, phone, password_hash, full_name, date_of_birth, gender, id_number, address, bank_name, bank_account, start_date, contract_type, status, role) VALUES
('e0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'NV009', 'barista1@trasua-abc.vn',  '0901000009', pwd, 'Trần Quốc Khánh', '2001-02-14', 'male',   '079201000009', '90 Đề Thám, Q.1',          'Vietcombank', '0071000901234', '2024-06-01', 'fulltime',  'active', 'employee'),
('e0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'NV010', 'barista2@trasua-abc.vn',  '0901000010', pwd, 'Lý Thị Lan',       '2002-06-30', 'female', '079202000010', '100 Phạm Ngũ Lão, Q.1',    'Techcombank', '1901000012345', '2024-07-15', 'parttime',  'active', 'employee'),
('e0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'NV011', 'barista3@trasua-abc.vn',  '0901000011', pwd, 'Ngô Minh Long',    '2000-10-08', 'male',   '079200000011', '110 Cách Mạng T8, Q.3',    'MB Bank',     '6801000123456', '2024-08-01', 'fulltime',  'active', 'employee'),
('e0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'NV012', 'barista4@trasua-abc.vn',  '0901000012', pwd, 'Mai Thị Ngọc',     '2001-12-25', 'female', '079201000012', '120 Trường Sa, Q.3',       'ACB',         '2501000234567', '2024-09-01', 'fulltime',  'active', 'employee'),
('e0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'NV013', 'barista5@trasua-abc.vn',  '0901000013', pwd, 'Bùi Văn Oanh',     '2003-03-18', 'male',   '079203000013', '130 Lâm Văn Bền, Q.7',     'BIDV',        '3101000345678', '2025-01-10', 'probation', 'active', 'employee');

-- Cashiers (2)
INSERT INTO users (id, organization_id, store_id, position_id, employee_code, email, phone, password_hash, full_name, date_of_birth, gender, id_number, address, bank_name, bank_account, start_date, contract_type, status, role) VALUES
('e0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'NV014', 'cashier1@trasua-abc.vn', '0901000014', pwd, 'Dương Thu Phương', '2002-07-04', 'female', '079202000014', '140 Cống Quỳnh, Q.1',      'TPBank',      '0371000456789', '2024-10-01', 'fulltime', 'active', 'employee'),
('e0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'NV015', 'cashier2@trasua-abc.vn', '0901000015', pwd, 'Phan Quỳnh Như',   '2003-11-20', 'female', '079203000015', '150 Huỳnh Tấn Phát, Q.7',  'VPBank',      '0511000567890', '2025-02-01', 'intern',   'active', 'employee');

-- Update store managers
UPDATE stores SET manager_id = 'e0000000-0000-0000-0000-000000000003' WHERE id = 'c0000000-0000-0000-0000-000000000001';
UPDATE stores SET manager_id = 'e0000000-0000-0000-0000-000000000004' WHERE id = 'c0000000-0000-0000-0000-000000000002';
UPDATE stores SET manager_id = 'e0000000-0000-0000-0000-000000000005' WHERE id = 'c0000000-0000-0000-0000-000000000003';

END $$;


-- ==============================
-- 6. SCHEDULES (current week, Mon-Sat)
-- ==============================
DO $$
DECLARE
    d DATE;
    day_offset INT;
    -- Employee assignments: (user_id, store_id, shift_id)
    -- Store 1: NV009 (AM), NV010 (AM), NV014 (AM), NV006 (PM)
    -- Store 2: NV011 (AM), NV012 (PM), NV007 (AM)
    -- Store 3: NV013 (AM), NV015 (PM), NV008 (PM)
BEGIN
    FOR day_offset IN 0..5 LOOP -- Mon to Sat
        d := date_trunc('week', CURRENT_DATE)::DATE + day_offset;

        -- Store 1
        INSERT INTO schedules (user_id, store_id, shift_id, date, status, created_by) VALUES
        ('e0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', d, 'scheduled', 'e0000000-0000-0000-0000-000000000003'),
        ('e0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', d, 'scheduled', 'e0000000-0000-0000-0000-000000000003'),
        ('e0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', d, 'scheduled', 'e0000000-0000-0000-0000-000000000003'),
        ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', d, 'scheduled', 'e0000000-0000-0000-0000-000000000003');

        -- Store 2
        INSERT INTO schedules (user_id, store_id, shift_id, date, status, created_by) VALUES
        ('e0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', d, 'scheduled', 'e0000000-0000-0000-0000-000000000004'),
        ('e0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', d, 'scheduled', 'e0000000-0000-0000-0000-000000000004'),
        ('e0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', d, 'scheduled', 'e0000000-0000-0000-0000-000000000004');

        -- Store 3
        INSERT INTO schedules (user_id, store_id, shift_id, date, status, created_by) VALUES
        ('e0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', d, 'scheduled', 'e0000000-0000-0000-0000-000000000005'),
        ('e0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', d, 'scheduled', 'e0000000-0000-0000-0000-000000000005'),
        ('e0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', d, 'scheduled', 'e0000000-0000-0000-0000-000000000005');
    END LOOP;
END $$;


-- ==============================
-- 7. ATTENDANCE (last 30 days — realistic pattern)
-- ==============================
DO $$
DECLARE
    d DATE;
    day_idx INT;
    rand_val FLOAT;
    checkin_dt TIMESTAMPTZ;
    checkout_dt TIMESTAMPTZ;
    late_mins INT;
    att_status attendance_status;
    hrs DECIMAL;
    
    -- User arrays
    store1_am UUID[] := ARRAY['e0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000014']::UUID[];
    store2_am UUID[] := ARRAY['e0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000007']::UUID[];
    store3_pm UUID[] := ARRAY['e0000000-0000-0000-0000-000000000015', 'e0000000-0000-0000-0000-000000000008']::UUID[];
    
    uid UUID;
BEGIN
    FOR day_idx IN 1..30 LOOP
        d := CURRENT_DATE - day_idx;
        
        -- Skip Sundays
        IF EXTRACT(DOW FROM d) = 0 THEN
            CONTINUE;
        END IF;

        -- Store 1 Morning shift employees
        FOREACH uid IN ARRAY store1_am LOOP
            rand_val := random();
            
            IF rand_val < 0.05 THEN
                -- 5% absent
                INSERT INTO attendance (user_id, store_id, date, status, late_minutes)
                VALUES (uid, 'c0000000-0000-0000-0000-000000000001', d, 'absent', 0);
            ELSIF rand_val < 0.20 THEN
                -- 15% late (1-15 min)
                late_mins := 1 + floor(random() * 15)::INT;
                checkin_dt := (d + TIME '07:00')::TIMESTAMPTZ + (late_mins || ' minutes')::INTERVAL;
                checkout_dt := (d + TIME '14:00')::TIMESTAMPTZ + (floor(random() * 10) || ' minutes')::INTERVAL;
                hrs := EXTRACT(EPOCH FROM (checkout_dt - checkin_dt)) / 3600.0;
                INSERT INTO attendance (user_id, store_id, date, check_in_time, check_out_time, check_in_latitude, check_in_longitude, check_in_method, actual_hours, status, late_minutes)
                VALUES (uid, 'c0000000-0000-0000-0000-000000000001', d, checkin_dt, checkout_dt, 10.7736 + random()*0.001, 106.7024 + random()*0.001, 'gps', ROUND(hrs::NUMERIC, 2), 'late', late_mins);
            ELSE
                -- 80% on time
                checkin_dt := (d + TIME '06:45')::TIMESTAMPTZ + (floor(random() * 15) || ' minutes')::INTERVAL;
                checkout_dt := (d + TIME '14:00')::TIMESTAMPTZ + (floor(random() * 15) || ' minutes')::INTERVAL;
                hrs := EXTRACT(EPOCH FROM (checkout_dt - checkin_dt)) / 3600.0;
                INSERT INTO attendance (user_id, store_id, date, check_in_time, check_out_time, check_in_latitude, check_in_longitude, check_in_method, actual_hours, overtime_hours, status, late_minutes)
                VALUES (uid, 'c0000000-0000-0000-0000-000000000001', d, checkin_dt, checkout_dt, 10.7736 + random()*0.001, 106.7024 + random()*0.001, 'gps', ROUND(hrs::NUMERIC, 2), GREATEST(0, ROUND((hrs - 7)::NUMERIC, 2)), 'on_time', 0);
            END IF;
        END LOOP;

        -- Store 2 Morning shift employees
        FOREACH uid IN ARRAY store2_am LOOP
            rand_val := random();
            IF rand_val < 0.08 THEN
                INSERT INTO attendance (user_id, store_id, date, status, late_minutes)
                VALUES (uid, 'c0000000-0000-0000-0000-000000000002', d, 'absent', 0);
            ELSE
                late_mins := CASE WHEN rand_val < 0.25 THEN 1 + floor(random() * 12)::INT ELSE 0 END;
                att_status := CASE WHEN late_mins > 0 THEN 'late'::attendance_status ELSE 'on_time'::attendance_status END;
                checkin_dt := (d + TIME '07:00')::TIMESTAMPTZ + (late_mins || ' minutes')::INTERVAL;
                checkout_dt := (d + TIME '14:00')::TIMESTAMPTZ + (floor(random() * 10) || ' minutes')::INTERVAL;
                hrs := EXTRACT(EPOCH FROM (checkout_dt - checkin_dt)) / 3600.0;
                INSERT INTO attendance (user_id, store_id, date, check_in_time, check_out_time, check_in_latitude, check_in_longitude, check_in_method, actual_hours, status, late_minutes)
                VALUES (uid, 'c0000000-0000-0000-0000-000000000002', d, checkin_dt, checkout_dt, 10.7845 + random()*0.001, 106.6679 + random()*0.001, 'gps', ROUND(hrs::NUMERIC, 2), att_status, late_mins);
            END IF;
        END LOOP;

        -- Store 3 Afternoon shift employees
        FOREACH uid IN ARRAY store3_pm LOOP
            rand_val := random();
            IF rand_val < 0.06 THEN
                INSERT INTO attendance (user_id, store_id, date, status, late_minutes)
                VALUES (uid, 'c0000000-0000-0000-0000-000000000003', d, 'absent', 0);
            ELSE
                late_mins := CASE WHEN rand_val < 0.22 THEN 1 + floor(random() * 10)::INT ELSE 0 END;
                att_status := CASE WHEN late_mins > 0 THEN 'late'::attendance_status ELSE 'on_time'::attendance_status END;
                checkin_dt := (d + TIME '14:00')::TIMESTAMPTZ + (late_mins || ' minutes')::INTERVAL;
                checkout_dt := (d + TIME '21:00')::TIMESTAMPTZ + (floor(random() * 10) || ' minutes')::INTERVAL;
                hrs := EXTRACT(EPOCH FROM (checkout_dt - checkin_dt)) / 3600.0;
                INSERT INTO attendance (user_id, store_id, date, check_in_time, check_out_time, check_in_latitude, check_in_longitude, check_in_method, actual_hours, status, late_minutes)
                VALUES (uid, 'c0000000-0000-0000-0000-000000000003', d, checkin_dt, checkout_dt, 10.7340 + random()*0.001, 106.7220 + random()*0.001, 'gps', ROUND(hrs::NUMERIC, 2), att_status, late_mins);
            END IF;
        END LOOP;

    END LOOP;
END $$;


-- ==============================
-- 8. KPI TEMPLATES & INDICATORS
-- ==============================
INSERT INTO kpi_templates (id, organization_id, position_id, name, description) VALUES
('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'KPI Barista Q1/2026', 'Bộ KPI đánh giá Barista quý 1 năm 2026');

INSERT INTO kpi_indicators (template_id, name, code, category, unit, target_value, min_value, max_value, weight, data_source) VALUES
('f0000000-0000-0000-0000-000000000001', 'Doanh thu ca',        'REV_001',  'financial', 'VND',  5000000, 3000000, 8000000, 30.00, 'auto_pos'),
('f0000000-0000-0000-0000-000000000001', 'Tốc độ pha chế',     'SPD_001',  'process',   'phút', 3,       2,       5,       20.00, 'manual'),
('f0000000-0000-0000-0000-000000000001', 'Đánh giá khách hàng', 'SAT_001',  'customer',  'sao',  4.5,     3.0,     5.0,     25.00, 'manual'),
('f0000000-0000-0000-0000-000000000001', 'Tỷ lệ đi làm đúng giờ', 'ATT_001', 'process', '%',    95,      80,      100,     15.00, 'auto_attendance'),
('f0000000-0000-0000-0000-000000000001', 'Hoàn thành đào tạo',  'LRN_001',  'learning',  '%',    100,     50,      100,     10.00, 'manual');


-- ==============================
-- 9. LEAVE REQUESTS (sample)
-- ==============================
INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason, status, approved_by, approved_at) VALUES
('e0000000-0000-0000-0000-000000000009', 'annual',   CURRENT_DATE + 7,  CURRENT_DATE + 8,  2.0, 'Em về quê thăm gia đình ạ',                  'approved', 'e0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '2 days'),
('e0000000-0000-0000-0000-000000000012', 'sick',     CURRENT_DATE - 3,  CURRENT_DATE - 3,  1.0, 'Em bị sốt, cần nghỉ 1 ngày ạ',               'approved', 'e0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '4 days'),
('e0000000-0000-0000-0000-000000000010', 'personal', CURRENT_DATE + 14, CURRENT_DATE + 14, 1.0, 'Em đi làm giấy tờ tại UBND quận',             'pending',  NULL, NULL),
('e0000000-0000-0000-0000-000000000013', 'annual',   CURRENT_DATE + 21, CURRENT_DATE + 23, 3.0, 'Em xin nghỉ phép đi du lịch cùng gia đình',  'pending',  NULL, NULL);


-- ==============================
-- 10. PAYROLL (January 2026)
-- ==============================
INSERT INTO payroll (user_id, period_month, period_year, base_salary, working_days, actual_days, overtime_hours, overtime_pay, kpi_bonus, social_insurance, health_insurance, unemployment_insurance, personal_income_tax, net_salary, status) VALUES
('e0000000-0000-0000-0000-000000000009', 1, 2026, 5500000, 26, 24, 8.5,  382500, 500000,  440000, 82500, 55000,  0,       5805000, 'paid'),
('e0000000-0000-0000-0000-000000000010', 1, 2026, 2750000, 26, 22, 0,    0,      200000,  220000, 41250, 27500,  0,       2661250, 'paid'),
('e0000000-0000-0000-0000-000000000011', 1, 2026, 5500000, 26, 25, 6.0,  270000, 450000,  440000, 82500, 55000,  0,       5642500, 'paid'),
('e0000000-0000-0000-0000-000000000012', 1, 2026, 5500000, 26, 23, 4.5,  202500, 350000,  440000, 82500, 55000,  0,       5475000, 'paid'),
('e0000000-0000-0000-0000-000000000014', 1, 2026, 5000000, 26, 25, 3.0,  112500, 300000,  400000, 75000, 50000,  0,       4887500, 'paid'),
('e0000000-0000-0000-0000-000000000015', 1, 2026, 4000000, 26, 24, 2.0,  60000,  150000,  320000, 60000, 40000,  0,       3790000, 'paid'),
('e0000000-0000-0000-0000-000000000003', 1, 2026, 12000000, 26, 26, 0,   0,      1500000, 960000, 180000, 120000, 750000, 11490000, 'paid'),
('e0000000-0000-0000-0000-000000000006', 1, 2026, 7000000, 26, 25, 10.0, 525000, 700000,  560000, 105000, 70000,  0,       7490000, 'paid');


-- ============================================================
-- ✅ SEED DATA COMPLETE
-- Organization: 1 | Stores: 3 | Positions: 5 | Shifts: 3
-- Users: 15 (1 CEO, 1 HR, 3 Managers, 3 Leaders, 7 Staff)
-- Schedules: Current week (Mon-Sat)
-- Attendance: 30 days with realistic patterns
-- KPI: 1 template + 5 indicators
-- Leave: 4 requests (2 approved, 2 pending)
-- Payroll: January 2026 (8 employees)
-- ============================================================
