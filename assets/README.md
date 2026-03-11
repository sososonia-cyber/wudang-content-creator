# 武当素材包使用指南

本文档说明武当内容创作者技能中的素材包结构和使用方法。

## 📁 素材包目录结构

```
assets/
├── images/                    # 图片素材
│   ├── landscape/            # 风景图片
│   ├── martial_arts/         # 武术图片
│   ├── architecture/         # 建筑图片
│   └── culture/              # 文化图片
├── videos/                    # 视频素材
│   ├── templates/            # 视频模板
│   ├── samples/              # 示例视频
│   └── backgrounds/          # 背景视频
├── audios/                    # 音频素材
│   ├── music/                # 背景音乐
│   ├── sound_effects/        # 音效
│   └── voice/                # 配音素材
├── short-drama-template.md   # 短剧剧本模板
└── video-script-template.md  # 短视频脚本模板
```

---

## 🖼️ 图片素材 (images/)

### 存放内容
- **风景图片**：金顶、云海、日出、杜鹃花等
- **武术图片**：太极拳、剑法、功夫表演
- **建筑图片**：紫霄宫、南岩宫、太子坡等
- **文化图片**：道教仪式、道长日常、文化符号

### 命名规范
```
{类别}_{描述}_{编号}.{扩展名}
示例：
- landscape_jinding_sunrise_01.jpg
- martial_taichi_practice_01.jpg
- architecture_zixiao_palace_01.jpg
```

### 使用场景
1. **AI视频生成参考图**：使用 `--image-url` 参数传入图片URL
2. **内容创作参考**：查看图片获取创作灵感
3. **图文内容制作**：配合文字制作小红书/图文内容

---

## 🎬 视频素材 (videos/)

### 存放内容
- **视频模板**：通用的开场/转场/结尾模板
- **示例视频**：AI生成的示例视频，供参考
- **背景视频**：云海、流水、风吹树叶等氛围视频

### 命名规范
```
{类别}_{描述}_{时长}s.{扩展名}
示例：
- template_opening_5s.mp4
- sample_spring_wudang_10s.mp4
- background_clouds_flowing_15s.mp4
```

### 使用场景
1. **视频剪辑素材**：作为剪辑时的素材库
2. **AI生成参考**：上传参考视频进行风格迁移
3. **模板复用**：统一风格的系列视频制作

---

## 🎵 音频素材 (audios/)

### 存放内容
- **背景音乐**：国风音乐、道教音乐、轻音乐
- **音效**：钟声、风声、流水声、脚步声
- **配音素材**：开场白、金句、宣传语

### 命名规范
```
{类别}_{描述}_{情绪}.{扩展名}
示例：
- music_guofeng_peaceful.mp3
- sfx_temple_bell_ring.mp3
- voice_opening_welcome.mp3
```

### 使用场景
1. **视频配乐**：为生成的视频添加背景音乐
2. **音效增强**：增加环境音效提升沉浸感
3. **配音合成**：配合视频添加旁白

---

## 📝 文字素材 (references/)

详见 `references/wudang-ip-database.md`

包含：
- 武术文化素材
- 道教文化素材
- 建筑景观素材
- 历史人文素材
- 神话传说素材

---

## 🚀 使用示例

### 1. 使用图片生成视频（图生视频）
```bash
python3 scripts/seedance_video.py \
  --prompt "道长在此练习太极" \
  --image-url "file://./assets/images/martial/taiji_sample_01.jpg" \
  --duration 10
```

### 2. 批量生成系列视频
```bash
# 使用同一张参考图，生成不同动作的视频
for action in "起势" "云手" "收势"; do
  python3 scripts/seedance_video.py \
    --prompt "道长练习太极拳${action}动作" \
    --image-url "./assets/images/martial/taiji_base.jpg" \
    --duration 10
done
```

### 3. 添加背景音乐
```bash
# 生成视频后，使用FFmpeg添加BGM
ffmpeg -i generated_video.mp4 -i assets/audios/music/guofeng.mp3 \
  -c:v copy -c:a aac -shortest output_with_music.mp4
```

---

## 📥 素材获取渠道

### 官方素材
- 武当山文旅集团官方图片库
- 武当山官方网站
- 武当山官方社交媒体

### AI生成素材
- 使用 Seedance/Seedream 生成专属素材
- 使用其他AI绘画工具生成概念图

### 购买正版素材
- 视觉中国
- 站酷海洛
- 图虫网

### 注意事项
- 确保素材版权合规
- 优先使用原创或授权素材
- AI生成素材注意平台规则

---

## 🔄 素材更新维护

建议定期：
1. **按季节更新**：春夏秋冬不同景观
2. **按热点更新**：结合时事热点创作
3. **按活动更新**：武当山节庆活动素材
4. **按反馈更新**：根据使用反馈优化

---

## 📝 素材清单模板

创建 `assets/INVENTORY.md` 记录素材清单：

```markdown
# 素材清单

## 图片素材
| 文件名 | 类别 | 描述 | 尺寸 | 来源 |
|--------|------|------|------|------|
| landscape_jinding_01.jpg | 风景 | 金顶日出 | 1920x1080 | AI生成 |

## 视频素材
| 文件名 | 类别 | 描述 | 时长 | 分辨率 |
|--------|------|------|------|--------|
| sample_spring_01.mp4 | 示例 | 春天武当 | 10s | 1080p |

## 音频素材
| 文件名 | 类别 | 描述 | 时长 | 来源 |
|--------|------|------|------|------|
| music_guofeng_01.mp3 | 音乐 | 国风背景 | 3min | 正版购买 |
```
