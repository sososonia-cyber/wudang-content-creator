# 武当文旅AI短视频生成 Skill - 2周MVP迭代计划

**版本**: v2.0 MVP  
**周期**: 2周（10个工作日）  
**目标**: 基于现有Skill快速构建最小可用版本

---

## 一、当前版本现状

### 已实现功能
- ✅ 热点追踪（qveris/serper搜索）
- ✅ AI创意生成（火山方舟文本生成）
- ✅ AI视频生成（Seedance 1.5 Pro）
- ✅ 三幕式视频结构
- ✅ 竖屏1080p高清输出
- ✅ 基础素材库框架

### 待增强功能
- ❌ 节日/节气自动提醒
- ❌ 多版本视频生成（目前单条）
- ❌ AI合规自检
- ❌ 视频状态管理
- ❌ 数据记录

---

## 二、2周MVP开发计划

### Week 1: 核心功能增强

#### Day 1: 节日/节气自动提醒模块
**开发内容**:
```python
# scripts/festival_reminder.py
- 农历节气数据库（24节气）
- 传统节日数据库（春节/清明/端午/中秋等）
- 自动检测临近节日（3天内）
- 生成节日创意提示
```

**对话示例**:
```
用户: 帮我创作视频
AI: 🎉 后天是【清明节】，是否需要生成应景视频？
     今日功能：
     1️⃣ 结合清明热点做头脑风暴
     2️⃣ 直接开始日常创作
```

**文件变更**:
- 新增: `scripts/festival_reminder.py`
- 修改: `SKILL.md` 添加节日提醒流程

---

#### Day 2-3: 多版本视频生成
**开发内容**:
```python
# scripts/batch_video_generator.py
- 同参数生成3个不同版本
- 自动切换提示词变体
- 批量提交生成任务
- 统一查询状态
```

**实现逻辑**:
```python
def generate_three_versions(base_prompt, style, duration):
    """基于同一创意生成3个不同版本"""
    versions = [
        f"{base_prompt}，远景航拍，宏大场面",
        f"{base_prompt}，中景人物，动作细节",
        f"{base_prompt}，特写镜头，情感表达"
    ]
    
    task_ids = []
    for i, prompt in enumerate(versions, 1):
        result = generate_video(prompt, style, duration)
        task_ids.append({
            "version": f"版本{i}",
            "task_id": result["task_id"],
            "prompt": prompt
        })
    
    return task_ids
```

**对话示例**:
```
用户: 生成春天武当山视频
AI: ✅ 已生成3个版本：
     版本1 - 远景航拍（云海金顶）
     版本2 - 中景人物（道长练功）
     版本3 - 特写镜头（杜鹃花细节）
     
     请选择预览或全部下载。
```

**文件变更**:
- 新增: `scripts/batch_video_generator.py`
- 修改: `scripts/seedance_video.py` 支持批量查询

---

#### Day 4-5: AI合规自检模块
**开发内容**:
```python
# scripts/compliance_checker.py
- 敏感词库（宗教/政治/暴恐/色情）
- 道教相关敏感词（避免亵渎/迷信）
- 素材版权风险提示
- 生成内容自检报告
```

**敏感词库示例**:
```json
{
  "religion": ["邪教", "迷信活动", "神棍"],
  "daoism": ["修仙成真", "长生不老药", "驱鬼"],
  "political": ["反动", "颠覆"],
  "general": ["暴力", "恐怖", "色情"]
}
```

**自检流程**:
```python
def check_compliance(text, image_url=None):
    """内容合规检查"""
    risks = []
    
    # 1. 文本敏感词检查
    for category, words in sensitive_words.items():
        found = [w for w in words if w in text]
        if found:
            risks.append({"type": category, "words": found})
    
    # 2. 宗教内容规范性检查
    if "道教" in text:
        if not check_daoism_proper(text):
            risks.append({"type": "daoism_improper", "msg": "道教内容表述需规范"})
    
    # 3. 版权风险提示
    if image_url and not is_authorized(image_url):
        risks.append({"type": "copyright", "msg": "素材版权待确认"})
    
    return {
        "passed": len(risks) == 0,
        "risks": risks,
        "suggestions": generate_suggestions(risks)
    }
```

**对话示例**:
```
AI: 🔍 正在进行内容合规自检...
     
     ✅ 敏感词检查通过
     ✅ 宗教内容表述规范
     ⚠️ 素材版权提示：建议使用官方授权素材
     
     【继续生成】 【更换素材】
```

**文件变更**:
- 新增: `scripts/compliance_checker.py`
- 新增: `references/sensitive_words.json`
- 修改: `scripts/seedance_video.py` 集成自检

---

### Week 2: 管理与数据

#### Day 6-7: 视频状态管理
**开发内容**:
```python
# scripts/video_manager.py
- 视频任务状态追踪（JSON文件存储）
- 分类管理：草稿/生成中/已完成/已发布
- 视频元数据记录（prompt/参数/生成时间）
- 简单的检索功能
```

**数据结构**:
```json
{
  "videos": [
    {
      "id": "vid_20260311_001",
      "task_id": "cgt-xxxxx",
      "title": "春天武当山",
      "status": "completed",
      "versions": [
        {"version": 1, "url": "...", "status": "success"},
        {"version": 2, "url": "...", "status": "success"},
        {"version": 3, "url": "...", "status": "success"}
      ],
      "params": {
        "prompt": "...",
        "style": "serene",
        "duration": 10
      },
      "created_at": "2026-03-11T10:00:00",
      "compliance_check": {"passed": true}
    }
  ]
}
```

**对话示例**:
```
用户: 查看我的视频
AI: 📁 你的视频库：
     
     【已完成】3个
     1. 春天武当山（3版本）- 今天 10:00
     2. 太极养生（3版本）- 今天 14:30
     3. 清明祈福（3版本）- 昨天 09:15
     
     【生成中】1个
     4. 金顶日出 - 预计2分钟后完成
     
     请输入序号查看详情或下载。
```

**文件变更**:
- 新增: `scripts/video_manager.py`
- 新增: `data/video_library.json` (视频库数据)
- 修改: 所有生成脚本集成状态记录

---

#### Day 8-9: 基础数据记录
**开发内容**:
```python
# scripts/analytics.py
- 生成记录（时间/参数/成功率）
- 简单的使用统计
- 生成效率分析
```

**记录内容**:
```json
{
  "daily_stats": {
    "2026-03-11": {
      "generated": 12,
      "success": 10,
      "failed": 2,
      "avg_time": 45
    }
  },
  "hotspot_usage": {
    "春天": 5,
    "太极": 3,
    "清明": 2
  }
}
```

**对话示例**:
```
用户: 查看数据统计
AI: 📊 使用统计（最近7天）：
     
     生成视频：32条
     成功率：94%
     平均耗时：42秒/条
     
     热门主题：
     1. 春天武当（8条）
     2. 太极养生（6条）
     3. 云海日出（5条）
```

**文件变更**:
- 新增: `scripts/analytics.py`
- 新增: `data/analytics.json`

---

#### Day 10: 整合测试与文档
**开发内容**:
- 完整对话流程测试
- Bug修复
- 更新SKILL.md文档
- 打包发布

**完整对话流程测试**:
```
用户: 帮我创作视频
↓
AI: 🎉 后天是【清明节】，是否需要生成应景视频？
    1️⃣ 结合清明热点创作
    2️⃣ 日常创作
↓
用户: 1
↓
AI: 📈 清明相关热搜：
    - 清明踏青
    - 春季养生
    - 传统习俗
    
    为你定制3条创意：
    1. 清明踏青武当山，洗去尘世烦恼
    2. 春季养生练太极，道家智慧传承
    3. 清明雨上武当山，云海仙境如画
    
    请选择（1-3）：
↓
用户: 2
↓
AI: 🔍 正在进行内容合规自检...
    ✅ 检查通过
    
    正在生成3个版本视频...
    [进度显示]
↓
AI: ✅ 已生成3个版本：
    版本1: [链接]
    版本2: [链接]
    版本3: [链接]
    
    已保存到视频库，可随时查看。
```

---

## 三、文件结构变更

### 新增文件
```
wudang-content-creator/
├── scripts/
│   ├── festival_reminder.py      # 节日提醒
│   ├── batch_video_generator.py  # 批量生成
│   ├── compliance_checker.py     # 合规检查
│   ├── video_manager.py          # 视频管理
│   └── analytics.py              # 数据分析
├── references/
│   ├── sensitive_words.json      # 敏感词库
│   └── festivals.json            # 节日数据库
├── data/                         # 数据存储
│   ├── video_library.json        # 视频库
│   └── analytics.json            # 统计数据
└── SKILL.md                      # 更新文档
```

### 修改文件
```
scripts/seedance_video.py    # 集成批量生成、合规检查
SKILL.md                     # 更新使用流程
```

---

## 四、MVP功能清单

### ✅ Week 1 交付功能
- [ ] 节日/节气自动提醒
- [ ] 多版本视频生成（3版）
- [ ] AI合规自检

### ✅ Week 2 交付功能
- [ ] 视频状态管理（草稿/已完成）
- [ ] 基础数据记录
- [ ] 完整对话流程

### ❌ 延期功能（后续迭代）
- 定时发布（需Cron权限）
- 平台自动发布（需API权限）
- 素材上传管理
- 数据看板可视化

---

## 五、使用流程示例

### 场景：日常创作
```
用户: 帮我生成视频
AI: 🎉 后天是【清明节】...
用户: 2（日常创作）
AI: 📈 今日热点...
用户: 选择创意 / 输入想法
AI: 🔍 合规检查...
AI: 🎬 生成3个版本...
AI: ✅ 完成，请下载
```

### 场景：查看管理
```
用户: 查看我的视频
AI: 📁 视频库列表...
用户: 1
AI: 视频详情 + 下载链接
```

### 场景：数据统计
```
用户: 数据统计
AI: 📊 本周生成32条，成功率94%...
```

---

## 六、风险与应对

| 风险 | 应对策略 |
|------|---------|
| Seedance API不稳定 | 增加重试机制，失败提示用户 |
| 敏感词库不全 | 先用基础词库，逐步完善 |
| JSON文件过大 | 定期归档历史数据 |
| 生成时间过长 | 异步生成，支持后台等待 |

---

## 七、验收标准

### 功能验收
- [ ] 节日提醒准确率100%
- [ ] 多版本生成成功率>90%
- [ ] 合规检查覆盖率>95%
- [ ] 视频状态管理无丢失

### 性能验收
- [ ] 单次对话响应<3秒
- [ ] 3版本生成总时间<5分钟
- [ ] 视频库查询<1秒

### 体验验收
- [ ] 完整流程无需技术背景
- [ ] 错误提示清晰可理解
- [ ] 视频下载链接有效24小时

---

**确认后开始开发？**
- [ ] 确认2周MVP计划
- [ ] 开始Week 1开发
