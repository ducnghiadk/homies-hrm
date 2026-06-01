-- ============================================
-- HRM Trà Sữa — Phase 3: Engagement Schema
-- Gamification, Recognition, Chat, Wellness
-- ============================================

-- ========== GAMIFICATION ==========

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(50) NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('attendance', 'sales', 'service', 'training', 'teamwork')),
  points_required INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE employee_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  badge_id UUID NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, badge_id)
);

CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  points INT NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('earn', 'spend')),
  reason TEXT NOT NULL,
  source VARCHAR(20),  -- 'checkin', 'kpi', 'kudos', 'redemption'
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reward_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  emoji VARCHAR(10),
  points_cost INT NOT NULL,
  stock INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  catalog_item_id UUID NOT NULL REFERENCES reward_catalog(id),
  points_spent INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== RECOGNITION ==========

CREATE TABLE kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id UUID NOT NULL REFERENCES employees(id),
  to_id UUID NOT NULL REFERENCES employees(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('thank_you', 'great_job', 'team_player', 'creative', 'helpful')),
  message TEXT NOT NULL,
  points INT DEFAULT 5,
  is_shoutout BOOLEAN DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wall_of_fame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  month VARCHAR(7) NOT NULL, -- '2026-02'
  title VARCHAR(100) NOT NULL,
  category VARCHAR(20),
  total_kudos INT DEFAULT 0,
  UNIQUE(org_id, employee_id, month)
);

-- ========== COMMUNICATION ==========

CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('store', 'announcement', 'dm')),
  store_id UUID REFERENCES stores(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, employee_id)
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id),
  sender_id UUID NOT NULL REFERENCES employees(id),
  content TEXT NOT NULL,
  type VARCHAR(10) DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== WELLNESS ==========

CREATE TABLE mood_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  mood INT NOT NULL CHECK (mood BETWEEN 1 AND 5),
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

CREATE TABLE feedback_box (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  category VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  reviewed_by UUID REFERENCES employees(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== INDEXES ==========

CREATE INDEX idx_points_emp ON points_transactions(employee_id);
CREATE INDEX idx_points_date ON points_transactions(date);
CREATE INDEX idx_kudos_to ON kudos(to_id);
CREATE INDEX idx_kudos_from ON kudos(from_id);
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_time ON chat_messages(created_at);
CREATE INDEX idx_mood_emp_date ON mood_checkins(employee_id, date);
CREATE INDEX idx_feedback_status ON feedback_box(status);
