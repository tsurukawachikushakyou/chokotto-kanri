-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Skills table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time slots table
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    period VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supporters table
CREATE TABLE supporters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    area VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT '応募受付' CHECK (status IN ('応募受付', '面接済み', '登録完了', '休止中')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service users table
CREATE TABLE service_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    area VARCHAR(100),
    special_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity statuses master table
CREATE TABLE activity_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supporter_id UUID NOT NULL REFERENCES supporters(id) ON DELETE CASCADE,
    service_user_id UUID NOT NULL REFERENCES service_users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
    activity_date DATE NOT NULL,
    time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE RESTRICT,
    status_id UUID NOT NULL REFERENCES activity_statuses(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table: supporter_skills
CREATE TABLE supporter_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supporter_id UUID NOT NULL REFERENCES supporters(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supporter_id, skill_id)
);

-- Junction table: supporter_schedules
CREATE TABLE supporter_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supporter_id UUID NOT NULL REFERENCES supporters(id) ON DELETE CASCADE,
    time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supporter_id, time_slot_id)
);

-- Indexes for performance
CREATE INDEX idx_supporters_status ON supporters(status);
CREATE INDEX idx_supporters_area ON supporters(area);
CREATE INDEX idx_service_users_area ON service_users(area);
CREATE INDEX idx_activities_supporter_id ON activities(supporter_id);
CREATE INDEX idx_activities_service_user_id ON activities(service_user_id);
CREATE INDEX idx_activities_skill_id ON activities(skill_id);
CREATE INDEX idx_activities_status_id ON activities(status_id);
CREATE INDEX idx_activities_date ON activities(activity_date);
CREATE INDEX idx_supporter_skills_supporter_id ON supporter_skills(supporter_id);
CREATE INDEX idx_supporter_skills_skill_id ON supporter_skills(skill_id);
CREATE INDEX idx_supporter_schedules_supporter_id ON supporter_schedules(supporter_id);
CREATE INDEX idx_supporter_schedules_time_slot_id ON supporter_schedules(time_slot_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON time_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supporters_updated_at BEFORE UPDATE ON supporters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_users_updated_at BEFORE UPDATE ON service_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activity_statuses_updated_at BEFORE UPDATE ON activity_statuses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO activity_statuses (name, description) VALUES
('予定', '活動が予定されている状態'),
('完了', '活動が完了した状態'),
('キャンセル', '活動がキャンセルされた状態'),
('仮予約', '仮予約の状態');

INSERT INTO time_slots (day_of_week, period, display_name) VALUES
(1, '午前', '月曜日 午前'),
(1, '午後', '月曜日 午後'),
(1, '夜間', '月曜日 夜間'),
(2, '午前', '火曜日 午前'),
(2, '午後', '火曜日 午後'),
(2, '夜間', '火曜日 夜間'),
(3, '午前', '水曜日 午前'),
(3, '午後', '水曜日 午後'),
(3, '夜間', '水曜日 夜間'),
(4, '午前', '木曜日 午前'),
(4, '午後', '木曜日 午後'),
(4, '夜間', '木曜日 夜間'),
(5, '午前', '金曜日 午前'),
(5, '午後', '金曜日 午後'),
(5, '夜間', '金曜日 夜間'),
(6, '午前', '土曜日 午前'),
(6, '午後', '土曜日 午後'),
(6, '夜間', '土曜日 夜間'),
(0, '午前', '日曜日 午前'),
(0, '午後', '日曜日 午後'),
(0, '夜間', '日曜日 夜間');

INSERT INTO skills (name, category, is_active) VALUES
('家事支援', '生活支援', true),
('買い物代行', '生活支援', true),
('通院付き添い', '医療支援', true),
('話し相手', 'コミュニケーション', true),
('パソコン操作', 'IT支援', true),
('庭仕事', '生活支援', true),
('料理', '生活支援', true),
('掃除', '生活支援', true),
('洗濯', '生活支援', true),
('子育て支援', '育児支援', true);
