-- ============================================
-- 武当内容创作系统 v3.0 - 数据库初始化脚本
-- ============================================

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- 用于全文搜索

-- 视频表
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    theme VARCHAR(50) CHECK (theme IN ('landscape', 'taichi', 'martial_arts', 'culture', 'other')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed', 'reviewing', 'published')),
    versions INTEGER DEFAULT 1,
    seedance_task_id VARCHAR(100),
    video_urls JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_theme ON videos(theme);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);

-- 平台内容表
CREATE TABLE IF NOT EXISTS platform_contents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('douyin', 'xiaohongshu', 'kuaishou', 'bilibili', 'wechat_video', 'weibo')),
    title VARCHAR(255),
    description TEXT,
    tags TEXT[],
    cover_image_url TEXT,
    video_url TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'publishing', 'published', 'failed')),
    platform_video_id VARCHAR(100),
    platform_url TEXT,
    stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_platform_contents_video_id ON platform_contents(video_id);
CREATE INDEX idx_platform_contents_platform ON platform_contents(platform);
CREATE INDEX idx_platform_contents_status ON platform_contents(status);
CREATE INDEX idx_platform_contents_scheduled_at ON platform_contents(scheduled_at);

-- 热点表
CREATE TABLE IF NOT EXISTS trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    source VARCHAR(50) NOT NULL,
    source_url TEXT,
    heat_score DECIMAL(10,2),
    heat_level VARCHAR(20) CHECK (heat_level IN ('high', 'medium', 'low')),
    risk_level VARCHAR(20) CHECK (risk_level IN ('high', 'medium', 'low')),
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    is_wudang_related BOOLEAN DEFAULT FALSE,
    prediction_result JSONB,
    keywords TEXT[],
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_trends_heat_score ON trends(heat_score DESC);
CREATE INDEX idx_trends_is_wudang_related ON trends(is_wudang_related) WHERE is_wudang_related = TRUE;
CREATE INDEX idx_trends_created_at ON trends(created_at DESC);
CREATE INDEX idx_trends_title_trgm ON trends USING gin(title gin_trgm_ops);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) DEFAULT 'content' CHECK (task_type IN ('content', 'review', 'approval', 'publish')),
    assignee VARCHAR(100),
    creator VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'revising', 'pending_approval', 'approved', 'published', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    related_video_id UUID REFERENCES videos(id),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    comments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- 内容日历表
CREATE TABLE IF NOT EXISTS content_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id),
    platform_content_id UUID REFERENCES platform_contents(id),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_calendar_date ON content_calendar(scheduled_date);
CREATE INDEX idx_content_calendar_status ON content_calendar(status);

-- 统计数据表
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    platform VARCHAR(50),
    video_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    new_followers INTEGER DEFAULT 0,
    stats_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_daily_stats_date ON daily_stats(date DESC);
CREATE INDEX idx_daily_stats_platform ON daily_stats(platform);

-- 用户表 (简化版，可对接企业SSO)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'editor' CHECK (role IN ('admin', 'manager', 'editor', 'reviewer')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
('system.name', '武当内容创作系统', '系统名称'),
('system.version', '3.0.0', '系统版本'),
('video.default_versions', '1', '默认生成视频版本数'),
('video.max_duration', '60', '视频最大时长(秒)'),
('hotspot.prediction_enabled', 'true', '是否启用热点预测'),
('publishing.auto_schedule', 'false', '是否自动排期')
ON CONFLICT (config_key) DO NOTHING;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要自动更新 updated_at 的表创建触发器
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_contents_updated_at BEFORE UPDATE ON platform_contents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON daily_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建清理过期热点数据的定时任务 (需要 pg_cron 扩展)
-- SELECT cron.schedule('clean-expired-trends', '0 0 * * *', 
--   $$DELETE FROM trends WHERE expires_at < NOW() - INTERVAL '7 days'$$);
