---
name: wudang-content-creator
description: 武当山文旅集团内容创作助手。用于将网络热点、时事新闻、传统文化与武当山IP融合，生成创意内容并规划短视频/短剧制作流程。适用场景：(1) 每日热点追踪与内容选题，(2) 武当文化与现代话题融合的创意策划，(3) 短视频脚本生成，(4) 短剧剧本创作，(5) 内容实施流程拆分与项目管理。
---

# 武当内容创作者

## 概述

本技能帮助武当山文旅集团内容团队将网络热点、时事新闻与武当山传统文化IP融合，创作具有传播力的短视频和短剧内容。

**核心能力**：
- 热点追踪与文化融合
- 创意策划与选题生成
- 短视频/短剧脚本创作
- 实施流程拆分与任务分配

## 工作流程决策树

```
用户输入需求
    │
    ├── 热点追踪 → 搜索今日热点 → 匹配武当IP → 生成选题
    │
    ├── 创意策划 → 分析目标受众 → 融合文化元素 → 输出创意方案
    │
    ├── 内容生成 → 选择内容类型 → 套用模板 → 生成脚本
    │       ├── 短视频脚本
    │       └── 短剧剧本
    │
    └── 实施规划 → 拆分制作流程 → 分配任务 → 制定时间表
```

## 第一步：热点追踪与选题生成

### 1.1 获取今日热点

使用工具获取热点信息：
- **qveris-discover**：搜索小红书、抖音、知乎、微博等平台热点
- **serper-search**：获取新闻时事、行业动态
- **web_search**：补充热点背景信息

### 1.2 武当IP匹配

参考 [references/wudang-ip-database.md](references/wudang-ip-database.md) 中的IP素材库，将热点与以下类别匹配：

| IP类别 | 内容元素 | 适用热点类型 |
|--------|----------|--------------|
| 武术文化 | 太极拳、剑法、内功 | 健身、养生、运动 |
| 道教文化 | 道家哲学、养生智慧 | 心灵、生活方式 |
| 建筑景观 | 金顶、紫霄宫、南岩 | 旅游、摄影、建筑 |
| 历史人物 | 张三丰、道教祖师 | 历史、人物故事 |
| 神话传说 | 武当神话、修仙故事 | 玄幻、故事创作 |
| 自然环境 | 云海、日出、四季 | 自然、风光、节气 |

### 1.3 选题评估标准

优质选题应满足：
- ✅ 热点时效性（24-72小时内）
- ✅ 武当元素融合自然
- ✅ 目标受众明确
- ✅ 可操作性强（可拍摄/制作）
- ✅ 符合平台调性

## 第二步：创意策划

### 2.1 受众分析

**主要受众群体**：
- **Z世代（18-25岁）**：喜欢玄幻、武侠、潮流融合
- **新中产（26-35岁）**：关注养生、心灵、品质生活
- **文旅爱好者（35-50岁）**：喜欢历史、文化、深度游

### 2.2 创意角度模板

参考 [references/content-templates.md](references/content-templates.md) 中的创意模板：

1. **古今对话**：古人穿越到现代的反应
2. **反差萌**：威严道长的日常生活
3. **知识科普**：用有趣方式讲解道教文化
4. **场景种草**：沉浸式体验武当风光
5. **挑战赛**：武当功夫模仿/学习挑战

### 2.3 内容角度矩阵

| 热点类型 | 武当角度 | 内容形式建议 |
|----------|----------|--------------|
| 健身热潮 | 太极拳教学 | 短视频跟练 |
| 职场焦虑 | 道家养生智慧 | 治愈系短剧 |
| 古风热潮 | 武当仙侠 | 剧情短片 |
| 旅游推荐 | 金顶日出 | 风光大片 |

## 第三步：内容生成

### 3.1 短视频脚本（15-60秒）

**方式一：使用AI生成（火山方舟）**

配置环境变量后，使用脚本自动生成：
```bash
export VOLCENGINE_API_KEY="你的API密钥"
export VOLCENGINE_MODEL_ID="doubao-pro-32k"

python3 scripts/volcengine_ark.py --mode script \
  --topic "年轻人学太极" \
  --platform douyin \
  --duration 30
```

**方式二：使用模板**

参考 [assets/video-script-template.md](assets/video-script-template.md)

**脚本结构**：
```
【黄金3秒】吸睛开头（冲突/疑问/视觉冲击）
【内容主体】信息传递/故事展开
【互动设计】引导点赞/评论/关注
【记忆点】金句/标志性动作/视觉符号
```

### 3.2 短剧剧本（1-3分钟）

**方式一：使用AI生成（火山方舟）**

```bash
export VOLCENGINE_API_KEY="你的API密钥"

python3 scripts/volcengine_ark.py --mode drama \
  --topic "职场白领在武当山找到内心平静" \
  --duration 2 \
  --genre 治愈
```

**方式二：使用模板**

参考 [assets/short-drama-template.md](assets/short-drama-template.md)

**剧本结构**：
```
【场景设定】时间、地点、人物
【起】背景介绍，人物出场
【承】情节发展，冲突出现
【转】高潮冲突，转折发生
【合】问题解决，升华主题
```

## 第四步：实施流程拆分

### 4.1 短视频制作流程

| 阶段 | 任务 | 责任人 | 耗时 |
|------|------|--------|------|
| 策划 | 脚本确认、分镜设计 | 编导 | 2h |
| 筹备 | 场地、服装、道具准备 | 制片 | 4h |
| 拍摄 | 现场拍摄 | 摄影+演员 | 4h |
| 后期 | 剪辑、配音、特效 | 剪辑 | 6h |
| 发布 | 平台发布、互动维护 | 运营 | 1h |

### 4.2 短剧制作流程

| 阶段 | 任务 | 责任人 | 耗时 |
|------|------|--------|------|
| 策划 | 剧本打磨、分镜脚本 | 编剧+导演 | 8h |
| 筹备 | 选角、场地、服化道 | 制片 | 2天 |
| 拍摄 | 现场拍摄 | 剧组 | 2-3天 |
| 后期 | 剪辑、调色、音效 | 后期团队 | 5天 |
| 发布 | 多平台分发、数据追踪 | 运营 | 持续 |

## 第五步：质量控制

### 5.1 内容审核清单

- [ ] 武当文化元素准确无误
- [ ] 热点融合不生硬
- [ ] 价值观正确积极
- [ ] 画面质量达标
- [ ] 音频清晰无杂音
- [ ] 字幕无错别字
- [ ] 时长符合平台要求

### 5.2 数据追踪指标

**短视频指标**：
- 播放量、完播率
- 点赞率、评论率、分享率
- 粉丝增长

**短剧指标**：
- 集均播放量
- 追看率、完播率
- 互动讨论热度

## 使用示例

### 示例1：热点追踪+选题

用户：今天有什么热点可以结合武当山做内容？

执行流程：
1. 使用 qveris-discover 搜索今日热点
2. 使用 serper-search 搜索新闻时事
3. 对照 wudang-ip-database.md 匹配可融合的IP
4. 输出3-5个选题建议，包含：
   - 热点概述
   - 武当融合角度
   - 建议内容形式
   - 预估传播潜力

### 示例2：短视频脚本生成

用户：帮我写一个关于"当代年轻人学太极"的15秒短视频脚本

执行流程：
1. 确认目标受众（Z世代）
2. 使用 video-script-template.md 模板
3. 生成包含以下要素的脚本：
   - 吸睛开头（年轻人腰痛场景）
   - 内容（道长教太极动作）
   - 互动（评论区打卡挑战）
   - 金句（"太极不是老年专利"）

### 示例3：短剧剧本创作

用户：写一个3分钟短剧，主题是"加班族在武当山找到内心平静"

执行流程：
1. 分析受众痛点（职场焦虑）
2. 使用 short-drama-template.md 模板
3. 创作完整剧本：
   - 场景：写字楼→武当山
   - 人物：焦虑白领→智慧道长
   - 情节：崩溃边缘→偶遇道长→学太极→领悟→回归

### 示例4：实施流程拆分

用户：我有了一个短剧创意，帮我拆分制作流程

执行流程：
1. 确认内容类型（短剧）
2. 根据预算和团队规模调整流程
3. 输出甘特图式时间线
4. 标注关键节点和风险点

## 素材包说明

本技能包含完整的武当内容创作素材包，支持图文视频多模态创作：

```
assets/
├── images/                    # 图片素材（风景/武术/建筑/文化）
├── videos/                    # 视频素材（模板/示例/背景）
├── audios/                    # 音频素材（音乐/音效/配音）
├── short-drama-template.md   # 短剧剧本模板
├── video-script-template.md  # 短视频脚本模板
└── README.md                 # 素材包使用指南
```

### 素材包使用方式

**1. 图片素材**
- 存放位置：`assets/images/{类别}/`
- 类别：landscape(风景)/martial_arts(武术)/architecture(建筑)/culture(文化)
- 用途：AI视频生成参考图、内容创作灵感、图文制作

**2. 视频素材**
- 存放位置：`assets/videos/{类别}/`
- 类别：templates(模板)/samples(示例)/backgrounds(背景)
- 用途：剪辑素材、AI风格参考、模板复用

**3. 音频素材**
- 存放位置：`assets/audios/{类别}/`
- 类别：music(音乐)/sound_effects(音效)/voice(配音)
- 用途：视频配乐、音效增强、旁白配音

**4. 文字素材**
- 存放位置：`references/wudang-ip-database.md`
- 内容：武当文化IP完整素材库

详细使用说明请参阅 [assets/README.md](assets/README.md)

---

## 资源文件说明

### scripts/volcengine_ark.py
火山方舟API调用脚本，用于AI文本内容生成：
- 短视频脚本自动生成
- 短剧剧本自动生成
- 创意策划生成
- 支持自定义模型参数

**配置方法**：
```bash
# 方式1：环境变量
export VOLCENGINE_API_KEY="your-api-key"
export VOLCENGINE_MODEL_ID="doubao-pro-32k"
export VOLCENGINE_ENDPOINT="https://ark.cn-beijing.volces.com/api/v3"

# 方式2：OpenClaw配置
openclaw config set env.VOLCENGINE_API_KEY "your-api-key"
```

**使用方法**：
```bash
# 生成短视频脚本
python3 scripts/volcengine_ark.py --mode script --topic "主题" --platform douyin --duration 30

# 生成短剧剧本
python3 scripts/volcengine_ark.py --mode drama --topic "剧情梗概" --duration 2 --genre 治愈

# 生成创意策划
python3 scripts/volcengine_ark.py --mode idea --hot-topic "热点" --wudang-ip "武当元素"
```

### scripts/seedance_video.py
Seedance 1.5 Pro 视频生成脚本，用于AI视频内容生成：
- 根据提示词生成视频
- 支持多种武当山场景预设
- 任务状态查询和等待完成

**配置方法**：
```bash
export VOLCENGINE_API_KEY="your-api-key"
export SEEDANCE_MODEL_ID="seedance-1.5-pro"
```

**使用方法**：
```bash
# 使用场景预设生成视频
python3 scripts/seedance_video.py --scene-type landscape --mood serene --elements "云海,日出" --wait

# 使用自定义提示词生成视频
python3 scripts/seedance_video.py --prompt "Wudang Mountain sunrise, golden temple, sea of clouds" --duration 5 --wait

# 查询任务状态
python3 scripts/seedance_video.py --check <task_id>
```

**场景类型（--scene-type）**：
- `landscape` - 风景（金顶、云海、古建筑）
- `martial_arts` - 武术（武当功夫表演）
- `taichi` - 太极（太极拳演练）
- `culture` - 文化（道教文化场景）

**氛围选项（--mood）**：
- `serene` - 宁静（晨雾、柔和光线）
- `dynamic` - 动感（快速运动、戏剧性角度）
- `epic` - 史诗（宏大场面、电影感）
- `peaceful` - 平和（晨光、微风）

**配置方法**：
```bash
export VOLCENGINE_API_KEY="你的API密钥"
export SEEDANCE_MODEL_ID="doubao-seedance-1-5-pro-251215"
```

**使用方法**：
```bash
# 生成单条视频（默认10秒，1080p，9:16竖屏）
python3 scripts/seedance_video.py --scene-type landscape --mood serene --elements "云海,日出" --wait

# 生成三条视频组成完整故事（三幕式结构）
# 第一幕：开场（引入场景）
python3 scripts/seedance_video.py \
  --prompt "武当山清晨，薄雾笼罩，金顶若隐若现，宁静祥和" \
  --duration 10 --wait

# 第二幕：发展（人物/动作）
python3 scripts/seedance_video.py \
  --prompt "武当山道长身穿白衣，在金顶云海前练习太极拳，动作行云流水" \
  --duration 10 --wait

# 第三幕：高潮/结尾（升华主题）
python3 scripts/seedance_video.py \
  --prompt "武当山日出，金光普照，道长收势，云海翻腾，仙境般的画面" \
  --duration 10 --wait

# 查询任务状态
python3 scripts/seedance_video.py --check <task_id>
```

**默认参数（已优化为短视频最佳配置）**：
- `--duration`：10秒（适合短视频平台）
- `--resolution`：1080p（高清画质）
- `--ratio`：9:16（竖屏，适合抖音/视频号/小红书）

**场景类型（--scene-type）**：
- `landscape` - 风景（金顶、云海、古建筑）
- `martial_arts` - 武术（武当功夫表演）
- `taichi` - 太极（太极拳演练）
- `culture` - 文化（道教文化场景）

**氛围选项（--mood）**：
- `serene` - 宁静（晨雾、柔和光线）
- `dynamic` - 动感（快速运动、戏剧性角度）
- `epic` - 史诗（宏大场面、电影感）
- `peaceful` - 平和（晨光、微风）

**视频比例选项（--ratio）**：
- `9:16` - 竖屏（默认，适合抖音/视频号/小红书）
- `16:9` - 横屏（适合B站/YouTube）
- `1:1` - 方形（适合Instagram）
- `3:4` - 竖屏（适合小红书图文视频）

**三幕式视频创作建议**：
为了制作连贯的短视频内容，建议按以下结构生成三条10秒视频：

| 幕次 | 时长 | 内容 | 作用 |
|------|------|------|------|
| 第一幕 | 10秒 | 场景铺垫，环境展示 | 引入，建立氛围 |
| 第二幕 | 10秒 | 人物动作，故事发展 | 承上启下，展示主体 |
| 第三幕 | 10秒 | 高潮/结尾，情感升华 | 收束，留下印象 |

剪辑时将三条视频拼接，即可得到30秒的完整短视频。

### references/wudang-ip-database.md
武当山IP素材库，包含：
- 武术文化素材
- 道教文化素材
- 建筑景观素材
- 历史人文素材
- 神话传说素材

### references/content-templates.md
内容创意模板，包含：
- 热门内容角度
- 文案模板
- 标题公式

### references/hot-topics-sources.md
热点信息源配置，包含：
- 推荐搜索平台
- 关键词设置
- 监测频率建议

### assets/video-script-template.md
短视频脚本模板，包含：
- 15秒/30秒/60秒结构
- 分镜表格
- 示例脚本

### assets/short-drama-template.md
短剧剧本模板，包含：
- 剧本格式规范
- 场景描述模板
- 对白写作技巧

### scripts/content_pipeline.py
内容生成辅助脚本，功能：
- 热点内容格式化
- 选题评分计算
- 发布排期规划

## 最佳实践

1. **热点时效性**：热点窗口期通常只有48-72小时，要快速响应
2. **文化准确性**：武当文化元素要经过核实，避免错误传播
3. **平台适配**：不同平台（抖音/快手/视频号）调性不同，需调整内容
4. **数据复盘**：每周回顾数据，优化内容策略
5. **素材积累**：建立常用素材库，提高制作效率
