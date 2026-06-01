-- ============================================================
-- HOMIES MILK TEA 🧋 — SEED DATA FOR STORE-001 (PILOT STORE)
-- Run AFTER pilot_ready_v1_schema.sql
-- ============================================================

-- ==============================
-- 1. ORGANIZATION
-- ==============================
INSERT INTO organizations (id, name, address, phone, email, tax_code, settings) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'Trà Sữa Homies',
    '123 Đường Ba Tháng Hai, Quận 10, TP.HCM',
    '0909 123 456',
    'contact@homiesmilktea.vn',
    '0317654321',
    '{"working_hours_per_month": 208, "overtime_rate": 1.5, "late_penalty_per_minute": 5000, "currency": "VND"}'
);

-- ==============================
-- 2. POSITIONS
-- ==============================
INSERT INTO positions (id, organization_id, name, code, level, base_salary) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Pha chế (Barista)',    'POS-001', 1,  5500000),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Thu ngân (Cashier)',    'POS-002', 1,  5000000),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Trưởng ca',             'POS-003', 3,  7000000),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Quản lý cửa hàng',      'POS-004', 5,  12000000),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Ban giám đốc',          'POS-005', 10, 25000000);

-- ==============================
-- 3. STORES (Pilot Store-001)
-- ==============================
INSERT INTO stores (id, organization_id, name, code, address, phone, latitude, longitude, radius_meters, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Homies Milk Tea - Quận 1', 'ST-001', '123 Nguyễn Huệ, Quận 1, TP.HCM', '028 3821 1111', 10.7736000, 106.7024000, 100, 'active');

-- ==============================
-- 4. SHIFTS
-- ==============================
INSERT INTO shifts (id, organization_id, name, code, start_time, end_time, break_minutes, is_overnight, color) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Ca Sáng',  'SHIFT_AM',    '07:00', '14:00', 30, FALSE, '#001D3D'),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Ca Chiều', 'SHIFT_PM',    '14:00', '21:00', 30, FALSE, '#2F6FA8'),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Ca Tối',   'SHIFT_NIGHT', '21:00', '02:00', 15, TRUE,  '#F6C85F');

-- ==============================
-- 5. USERS (Homies Store-001 Pilot Crew)
-- ==============================
-- Password placeholder hash for bcrypt('123456')
DO $$
DECLARE
    pwd TEXT := '$2a$10$X7XkGk0NqPh5IYaOz7NFC.fP7KPLsIbHjElvCHQk3I5fVzjgL/hSe';
BEGIN

-- 1. CEO Nguyễn Minh Tuấn (emp-001)
INSERT INTO users (id, organization_id, store_id, position_id, employee_code, email, phone, password_hash, full_name, date_of_birth, gender, address, start_date, contract_type, status, role) VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'BH-001', 'tuan@bobahouse.vn', '0901234567', pwd, 'Nguyễn Minh Tuấn', '1988-10-12', 'male', '10 Lê Lợi, Quận 1, TP.HCM', '2023-01-01', 'fulltime', 'active', 'ceo');

-- 2. HR Admin Hoàng Thị Yến (emp-016)
INSERT INTO users (id, organization_id, store_id, position_id, employee_code, email, phone, password_hash, full_name, date_of_birth, gender, address, start_date, contract_type, status, role) VALUES
('e0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'BH-016', 'yen@bobahouse.vn', '0956677889', pwd, 'Hoàng Thị Yến', '1992-05-18', 'female', '20 Hàm Nghi, Quận 1, TP.HCM', '2023-02-01', 'fulltime', 'active', 'hr_admin');

-- 3. Quản lý cửa hàng Trần Thị Lan (emp-002)
INSERT INTO users (id, organization_id, store_id, position_id, employee_code, email, phone, password_hash, full_name, date_of_birth, gender, address, start_date, contract_type, status, role) VALUES
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'BH-002', 'lan@bobahouse.vn', '0912345678', pwd, 'Trần Thị Lan', '1994-08-25', 'female', '30 Lý Tự Trọng, Quận 1, TP.HCM', '2023-03-15', 'fulltime', 'active', 'store_manager');

-- 4. Nhân viên pha chế Võ Thanh Bình (emp-005)
INSERT INTO users (id, organization_id, store_id, position_id, employee_code, email, phone, password_hash, full_name, date_of_birth, gender, address, start_date, contract_type, status, role) VALUES
('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BH-005', 'binh@bobahouse.vn', '0945678901', pwd, 'Võ Thanh Bình', '2001-04-05', 'male', '45 Bùi Viện, Quận 1, TP.HCM', '2024-06-01', 'parttime', 'active', 'employee');

-- 5. Nhân viên thu ngân Nguyễn Thị Mai (emp-006)
INSERT INTO users (id, organization_id, store_id, position_id, employee_code, email, phone, password_hash, full_name, date_of_birth, gender, address, start_date, contract_type, status, role) VALUES
('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'BH-006', 'mai@bobahouse.vn', '0956789012', pwd, 'Nguyễn Thị Mai', '2002-12-14', 'female', '88 Trần Hưng Đạo, Quận 1, TP.HCM', '2024-07-15', 'fulltime', 'active', 'employee');

-- Liên kết Store Manager vào Store 1
UPDATE stores SET manager_id = 'e0000000-0000-0000-0000-000000000002' WHERE id = 'c0000000-0000-0000-0000-000000000001';

END $$;

-- ==============================
-- 6. SCHEDULES (Current Week Mon-Sat for Store-001)
-- ==============================
DO $$
DECLARE
    d DATE;
    day_offset INT;
BEGIN
    FOR day_offset IN 0..5 LOOP
        d := date_trunc('week', CURRENT_DATE)::DATE + day_offset;

        -- Võ Thanh Bình (Ca Sáng)
        INSERT INTO schedules (user_id, store_id, shift_id, date, status, created_by) VALUES
        ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', d, 'scheduled', 'e0000000-0000-0000-0000-000000000002');

        -- Nguyễn Thị Mai (Ca Chiều)
        INSERT INTO schedules (user_id, store_id, shift_id, date, status, created_by) VALUES
        ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', d, 'scheduled', 'e0000000-0000-0000-0000-000000000002');
    END LOOP;
END $$;

-- ==============================
-- 7. ATTENDANCE (Realistic logs for last 14 days)
-- ==============================
DO $$
DECLARE
    d DATE;
    day_idx INT;
    rand_val FLOAT;
    checkin_dt TIMESTAMPTZ;
    checkout_dt TIMESTAMPTZ;
    late_mins INT;
    hrs DECIMAL;
BEGIN
    FOR day_idx IN 1..14 LOOP
        d := CURRENT_DATE - day_idx;
        
        -- Skip Sunday
        IF EXTRACT(DOW FROM d) = 0 THEN
            CONTINUE;
        END IF;

        -- 1. Võ Thanh Bình - Ca Sáng (07:00 - 14:00)
        rand_val := random();
        IF rand_val < 0.10 THEN
            -- Absent
            INSERT INTO attendance (user_id, store_id, date, status, late_minutes)
            VALUES ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', d, 'absent', 0);
        ELSIF rand_val < 0.25 THEN
            -- Late
            late_mins := 5 + floor(random() * 20)::INT;
            checkin_dt := (d + TIME '07:00')::TIMESTAMPTZ + (late_mins || ' minutes')::INTERVAL;
            checkout_dt := (d + TIME '14:00')::TIMESTAMPTZ;
            hrs := EXTRACT(EPOCH FROM (checkout_dt - checkin_dt)) / 3600.0;
            
            INSERT INTO attendance (user_id, store_id, date, check_in_time, check_out_time, check_in_latitude, check_in_longitude, check_in_method, actual_hours, status, late_minutes)
            VALUES ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', d, checkin_dt, checkout_dt, 10.773612, 106.702431, 'gps', ROUND(hrs::NUMERIC, 2), 'late', late_mins);
        ELSE
            -- On time
            checkin_dt := (d + TIME '06:50')::TIMESTAMPTZ + (floor(random() * 9) || ' minutes')::INTERVAL;
            checkout_dt := (d + TIME '14:00')::TIMESTAMPTZ + (floor(random() * 15) || ' minutes')::INTERVAL;
            hrs := EXTRACT(EPOCH FROM (checkout_dt - checkin_dt)) / 3600.0;
            
            INSERT INTO attendance (user_id, store_id, date, check_in_time, check_out_time, check_in_latitude, check_in_longitude, check_in_method, actual_hours, status, late_minutes)
            VALUES ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', d, checkin_dt, checkout_dt, 10.773601, 106.702405, 'gps', ROUND(hrs::NUMERIC, 2), 'on_time', 0);
        END IF;

        -- 2. Nguyễn Thị Mai - Ca Chiều (14:00 - 21:00)
        rand_val := random();
        IF rand_val < 0.05 THEN
            -- Absent
            INSERT INTO attendance (user_id, store_id, date, status, late_minutes)
            VALUES ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', d, 'absent', 0);
        ELSIF rand_val < 0.20 THEN
            -- Late
            late_mins := 2 + floor(random() * 15)::INT;
            checkin_dt := (d + TIME '14:00')::TIMESTAMPTZ + (late_mins || ' minutes')::INTERVAL;
            checkout_dt := (d + TIME '21:00')::TIMESTAMPTZ;
            hrs := EXTRACT(EPOCH FROM (checkout_dt - checkin_dt)) / 3600.0;
            
            INSERT INTO attendance (user_id, store_id, date, check_in_time, check_out_time, check_in_latitude, check_in_longitude, check_in_method, actual_hours, status, late_minutes)
            VALUES ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', d, checkin_dt, checkout_dt, 10.773615, 106.702422, 'gps', ROUND(hrs::NUMERIC, 2), 'late', late_mins);
        ELSE
            -- On time
            checkin_dt := (d + TIME '13:52')::TIMESTAMPTZ + (floor(random() * 7) || ' minutes')::INTERVAL;
            checkout_dt := (d + TIME '21:00')::TIMESTAMPTZ + (floor(random() * 10) || ' minutes')::INTERVAL;
            hrs := EXTRACT(EPOCH FROM (checkout_dt - checkin_dt)) / 3600.0;
            
            INSERT INTO attendance (user_id, store_id, date, check_in_time, check_out_time, check_in_latitude, check_in_longitude, check_in_method, actual_hours, status, late_minutes)
            VALUES ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', d, checkin_dt, checkout_dt, 10.773602, 106.702409, 'gps', ROUND(hrs::NUMERIC, 2), 'on_time', 0);
        END IF;

    END LOOP;
END $$;

-- ==============================
-- 8. LEAVE REQUESTS
-- ==============================
INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason, status, approved_by, approved_at) VALUES
('e0000000-0000-0000-0000-000000000005', 'annual', CURRENT_DATE + 3, CURRENT_DATE + 4, 2.0, 'Em xin phép nghỉ phép giải quyết việc gia đình', 'approved', 'e0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day'),
('e0000000-0000-0000-0000-000000000006', 'sick', CURRENT_DATE - 5, CURRENT_DATE - 5, 1.0, 'Em bị sốt xuất huyết xin nghỉ điều trị', 'approved', 'e0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '6 days'),
('e0000000-0000-0000-0000-000000000005', 'personal', CURRENT_DATE + 10, CURRENT_DATE + 10, 1.0, 'Em xin nghỉ thi học kỳ', 'pending', NULL, NULL);

-- ==============================
-- 9. PAYROLL (Safety Lock - January 2026 for Pilot Store)
-- ==============================
INSERT INTO payroll (user_id, period_month, period_year, base_salary, working_days, actual_days, overtime_hours, overtime_pay, kpi_bonus, social_insurance, health_insurance, unemployment_insurance, personal_income_tax, net_salary, status) VALUES
('e0000000-0000-0000-0000-000000000002', 1, 2026, 12000000, 26, 26, 0,   0,      1500000, 960000, 180000, 120000, 750000, 11490000, 'paid'),
('e0000000-0000-0000-0000-000000000005', 1, 2026, 5500000, 26, 24, 8.5,  382500, 500000,  440000, 82500, 55000,  0,       5805000, 'paid'),
('e0000000-0000-0000-0000-000000000006', 1, 2026, 5000000, 26, 25, 3.0,  112500, 300000,  400000, 75000, 50000,  0,       4887500, 'paid');

-- ============================================================
-- ✅ SEED DATA COMPLETE FOR STORE-001 (PILOT READY)
-- ============================================================
