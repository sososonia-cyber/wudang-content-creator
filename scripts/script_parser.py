#!/usr/bin/env python3
"""
剧本与分镜头解析模块
根据剧本内容自动分析分镜头，决定视频生成策略

功能：
1. 剧本解析：从文本中提取场景、动作、情感
2. 分镜头生成：自动或手动定义分镜头
3. 视频生成策略：根据分镜头决定数量、时长、提示词
"""

import json
import re
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict


@dataclass
class Shot:
    """分镜头定义"""
    shot_id: str           # 镜头编号
    shot_type: str         # 镜头类型: wide/medium/close/dynamic
    description: str       # 镜头描述
    duration: int          # 时长(秒)
    mood: str              # 情感氛围
    key_elements: List[str]  # 关键元素
    prompt: str            # 生成的AI提示词
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class Script:
    """剧本定义"""
    script_id: str
    title: str
    theme: str
    total_duration: int    # 总时长(秒)
    shots: List[Shot]      # 分镜头列表
    summary: str           # 剧本摘要
    
    def to_dict(self) -> Dict:
        return {
            "script_id": self.script_id,
            "title": self.title,
            "theme": self.theme,
            "total_duration": self.total_duration,
            "summary": self.summary,
            "shot_count": len(self.shots),
            "shots": [s.to_dict() for s in self.shots]
        }


class ScriptParser:
    """剧本解析器"""
    
    # 镜头类型关键词映射
    SHOT_TYPE_KEYWORDS = {
        "wide": ["全景", "远景", "大场景", "航拍", "全貌", "overview", "wide shot", "aerial"],
        "medium": ["中景", "人物", "半身", "对话", "medium shot", "medium"],
        "close": ["特写", "近景", "细节", "表情", "close up", "close-up", "特写镜头"],
        "dynamic": ["运动", "跟拍", "手持", "动态", "tracking", "dynamic", "motion"]
    }
    
    # 情感关键词映射
    MOOD_KEYWORDS = {
        "serene": ["宁静", "安详", "平和", "calm", "peaceful", "serene"],
        "epic": ["宏大", "壮观", "震撼", "epic", "grand", "magnificent"],
        "mysterious": ["神秘", "幽深", "玄妙", "mysterious", "mystical"],
        "dynamic": ["动感", "活力", "激烈", "dynamic", "energetic"],
        "warm": ["温暖", "温馨", "柔和", "warm", "cozy"]
    }
    
    def __init__(self):
        pass
    
    def parse_from_text(self, text: str, title: str = "未命名剧本") -> Script:
        """
        从自然文本解析剧本
        
        自动识别：
        - 场景分割
        - 镜头类型
        - 情感氛围
        - 建议时长
        """
        # 1. 分割场景（按句号、分号、换行等）
        segments = self._split_scenes(text)
        
        shots = []
        for i, segment in enumerate(segments, 1):
            if len(segment.strip()) < 10:  # 跳过太短的内容
                continue
                
            shot = self._analyze_segment(segment, i)
            shots.append(shot)
        
        # 如果没有解析出分镜头，创建一个默认的
        if not shots:
            shots.append(self._create_default_shot(text, 1))
        
        total_duration = sum(s.duration for s in shots)
        
        return Script(
            script_id=f"script_{hash(text) % 10000:04d}",
            title=title,
            theme=self._detect_theme(text),
            total_duration=total_duration,
            shots=shots,
            summary=text[:100] + "..." if len(text) > 100 else text
        )
    
    def _split_scenes(self, text: str) -> List[str]:
        """分割场景"""
        # 按多种分隔符分割
        separators = r'[。；\n\r]+'
        segments = re.split(separators, text)
        return [s.strip() for s in segments if s.strip()]
    
    def _analyze_segment(self, segment: str, index: int) -> Shot:
        """分析单个片段，生成分镜头"""
        # 检测镜头类型
        shot_type = self._detect_shot_type(segment)
        
        # 检测情感
        mood = self._detect_mood(segment)
        
        # 提取关键元素
        key_elements = self._extract_key_elements(segment)
        
        # 生成提示词
        prompt = self._generate_prompt(segment, shot_type, mood)
        
        # 建议时长（根据镜头类型）
        duration = self._suggest_duration(shot_type, segment)
        
        return Shot(
            shot_id=f"shot_{index:03d}",
            shot_type=shot_type,
            description=segment[:100],
            duration=duration,
            mood=mood,
            key_elements=key_elements,
            prompt=prompt
        )
    
    def _detect_shot_type(self, text: str) -> str:
        """检测镜头类型"""
        text_lower = text.lower()
        
        scores = {}
        for shot_type, keywords in self.SHOT_TYPE_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            scores[shot_type] = score
        
        # 返回得分最高的，默认 medium
        return max(scores, key=scores.get) if max(scores.values()) > 0 else "medium"
    
    def _detect_mood(self, text: str) -> str:
        """检测情感氛围"""
        text_lower = text.lower()
        
        scores = {}
        for mood, keywords in self.MOOD_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            scores[mood] = score
        
        return max(scores, key=scores.get) if max(scores.values()) > 0 else "serene"
    
    def _detect_theme(self, text: str) -> str:
        """检测主题"""
        themes = {
            "landscape": ["风景", "山水", "云海", "日出", "金顶", "自然"],
            "taichi": ["太极", "拳法", "练功", "晨练", "武术"],
            "culture": ["道教", "文化", "古建筑", "历史", "传统"],
            "martial_arts": ["功夫", "武术", "剑法", "练功"]
        }
        
        text_lower = text.lower()
        scores = {}
        for theme, keywords in themes.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            scores[theme] = score
        
        return max(scores, key=scores.get) if max(scores.values()) > 0 else "landscape"
    
    def _extract_key_elements(self, text: str) -> List[str]:
        """提取关键元素"""
        elements = []
        
        # 常见元素关键词
        keywords = [
            "云海", "日出", "金顶", "紫霄宫", "古建筑", "道士", "太极", "武术",
            "晨雾", "阳光", "山峦", "青松", "瀑布", "溪流", "云雾"
        ]
        
        for kw in keywords:
            if kw in text:
                elements.append(kw)
        
        return elements[:5]  # 最多5个
    
    def _generate_prompt(self, segment: str, shot_type: str, mood: str) -> str:
        """生成AI视频提示词"""
        # 镜头类型描述
        shot_descriptions = {
            "wide": "wide angle shot, panoramic view, grand landscape",
            "medium": "medium shot, showing character and environment",
            "close": "close-up shot, detailed view, intimate perspective",
            "dynamic": "dynamic camera movement, tracking shot, energetic motion"
        }
        
        # 情感描述
        mood_descriptions = {
            "serene": "serene and peaceful atmosphere, soft lighting",
            "epic": "epic and majestic, cinematic lighting",
            "mysterious": "mysterious and ethereal, misty atmosphere",
            "dynamic": "dynamic and energetic, vibrant colors",
            "warm": "warm and cozy, golden hour lighting"
        }
        
        shot_desc = shot_descriptions.get(shot_type, "medium shot")
        mood_desc = mood_descriptions.get(mood, "serene atmosphere")
        
        prompt = f"{segment}, {shot_desc}, {mood_desc}, Wudang Mountain, high quality, 4K, cinematic"
        
        return prompt
    
    def _suggest_duration(self, shot_type: str, text: str) -> int:
        """建议时长"""
        # 基础时长
        base_duration = {
            "wide": 5,      # 全景5秒
            "medium": 4,    # 中景4秒
            "close": 3,     # 特写3秒
            "dynamic": 5    # 动态5秒
        }
        
        duration = base_duration.get(shot_type, 4)
        
        # 根据文本长度微调（每20字增加1秒，最多增加3秒）
        extra = min(len(text) // 20, 3)
        
        return min(duration + extra, 10)  # 最多10秒
    
    def _create_default_shot(self, text: str, index: int) -> Shot:
        """创建默认分镜头"""
        return Shot(
            shot_id=f"shot_{index:03d}",
            shot_type="medium",
            description=text[:100],
            duration=5,
            mood="serene",
            key_elements=[],
            prompt=f"{text}, medium shot, serene atmosphere, high quality"
        )
    
    def create_manual_script(self, title: str, shots_data: List[Dict]) -> Script:
        """
        手动创建剧本
        
        Args:
            shots_data: 分镜头数据列表
                [{"shot_type": "wide", "description": "...", "duration": 5, ...}]
        """
        shots = []
        for i, data in enumerate(shots_data, 1):
            shot = Shot(
                shot_id=f"shot_{i:03d}",
                shot_type=data.get("shot_type", "medium"),
                description=data.get("description", ""),
                duration=data.get("duration", 5),
                mood=data.get("mood", "serene"),
                key_elements=data.get("key_elements", []),
                prompt=data.get("prompt", data.get("description", ""))
            )
            shots.append(shot)
        
        total_duration = sum(s.duration for s in shots)
        
        return Script(
            script_id=f"manual_{hash(str(shots_data)) % 10000:04d}",
            title=title,
            theme="custom",
            total_duration=total_duration,
            shots=shots,
            summary=f"手动创建剧本，共{len(shots)}个分镜头"
        )
    
    def format_script_report(self, script: Script) -> str:
        """格式化剧本报告"""
        lines = []
        lines.append("=" * 60)
        lines.append(f"🎬 剧本解析报告: {script.title}")
        lines.append("=" * 60)
        lines.append(f"剧本ID: {script.script_id}")
        lines.append(f"主题: {script.theme}")
        lines.append(f"总分镜头数: {len(script.shots)}")
        lines.append(f"预计总时长: {script.total_duration}秒")
        lines.append("")
        
        for i, shot in enumerate(script.shots, 1):
            lines.append(f"【镜头 {i}】{shot.shot_id}")
            lines.append(f"  类型: {shot.shot_type}")
            lines.append(f"  时长: {shot.duration}秒")
            lines.append(f"  氛围: {shot.mood}")
            lines.append(f"  描述: {shot.description[:50]}...")
            lines.append(f"  关键元素: {', '.join(shot.key_elements) if shot.key_elements else '无'}")
            lines.append(f"  提示词: {shot.prompt[:60]}...")
            lines.append("")
        
        lines.append("=" * 60)
        return "\n".join(lines)


# 测试代码
if __name__ == "__main__":
    parser = ScriptParser()
    
    # 测试1: 从文本解析
    test_script = """
    清晨，武当山金顶云海翻腾，航拍展现壮观全景。
    道士在紫霄宫前练习太极拳，动作行云流水。
    特写镜头捕捉太极拳手部动作细节，展现武术之美。
    阳光穿透晨雾，照亮金殿，温暖而神圣。
    """
    
    print("=" * 60)
    print("测试1: 从自然文本解析剧本")
    print("=" * 60)
    
    script = parser.parse_from_text(test_script, "武当山晨景")
    print(parser.format_script_report(script))
    
    # 测试2: 手动创建
    print("\n" + "=" * 60)
    print("测试2: 手动创建剧本")
    print("=" * 60)
    
    manual_shots = [
        {
            "shot_type": "wide",
            "description": "武当山全景，云海日出",
            "duration": 6,
            "mood": "epic",
            "key_elements": ["云海", "日出", "金顶"],
            "prompt": "Wudang Mountain aerial view, sea of clouds at sunrise, golden light, epic cinematic shot"
        },
        {
            "shot_type": "medium",
            "description": "道士练太极",
            "duration": 5,
            "mood": "serene",
            "key_elements": ["道士", "太极"],
            "prompt": "Taoist practicing Tai Chi on Wudang Mountain, flowing movements, serene atmosphere"
        }
    ]
    
    manual_script = parser.create_manual_script("武当太极", manual_shots)
    print(parser.format_script_report(manual_script))
