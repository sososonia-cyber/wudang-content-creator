#!/usr/bin/env python3
"""
AI合规自检模块
检查生成内容是否符合平台规范和武当文化调性
"""

import json
import os
import re
from typing import Dict, List, Tuple, Optional


class ComplianceChecker:
    """合规检查器"""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path or os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "references", "sensitive_words.json"
        )
        self.sensitive_words = self._load_sensitive_words()
    
    def _load_sensitive_words(self) -> Dict:
        """加载敏感词库"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"警告：敏感词库文件未找到：{self.config_path}")
            return {}
        except json.JSONDecodeError:
            print(f"错误：敏感词库文件格式错误")
            return {}
    
    def check_text(self, text: str) -> Dict:
        """
        检查文本内容合规性
        
        参数：
            text: 要检查的文本
        
        返回：
            检查结果
        """
        if not text:
            return {"passed": True, "risks": [], "suggestions": []}
        
        text_lower = text.lower()
        risks = []
        suggestions = []
        
        # 检查各类敏感词
        for category, config in self.sensitive_words.items():
            if category == "copyright":
                continue
            
            words = config.get("words", [])
            found_words = []
            
            for word in words:
                if word in text or word in text_lower:
                    found_words.append(word)
            
            if found_words:
                risk = {
                    "category": category,
                    "category_name": config.get("name", category),
                    "level": config.get("level", "medium"),
                    "words_found": found_words,
                    "message": f"发现{config.get('name', category)}敏感词"
                }
                risks.append(risk)
                
                # 生成修改建议
                suggestion_config = config.get("suggestions", {})
                for word in found_words:
                    if word in suggestion_config:
                        suggestions.append({
                            "word": word,
                            "suggestion": suggestion_config[word]
                        })
        
        # 检查道教内容规范性
        daoism_check = self._check_daoism_proper(text)
        if daoism_check["has_improper"]:
            risks.append({
                "category": "daoism_proper",
                "category_name": "道教内容规范性",
                "level": "medium",
                "message": "道教相关内容表述需规范，避免神秘化/迷信化",
                "details": daoism_check["details"]
            })
        
        # 版权提示
        copyright_notes = self.sensitive_words.get("copyright", {}).get("notes", [])
        
        return {
            "passed": len(risks) == 0,
            "risks": risks,
            "suggestions": suggestions,
            "copyright_notes": copyright_notes,
            "risk_level": self._calculate_risk_level(risks)
        }
    
    def _check_daoism_proper(self, text: str) -> Dict:
        """
        检查道教内容是否规范
        
        避免：
        - 过度神秘化
        - 迷信色彩
        - 夸大功效
        """
        improper_patterns = [
            (r"(修仙|练功).{0,5}(成仙|成功|飞升)", "避免承诺修仙结果"),
            (r"(包治|治愈|根治).{0,5}(百病|所有病|绝症)", "避免夸大医疗效果"),
            (r"(绝对|一定|肯定).{0,3}(有效|成功|灵验)", "避免绝对化表述"),
            (r"(只要|只需).{0,10}(就能|就可以).{0,5}(成仙|长生|成功)", "避免简单化承诺"),
        ]
        
        details = []
        for pattern, message in improper_patterns:
            if re.search(pattern, text):
                details.append(message)
        
        return {
            "has_improper": len(details) > 0,
            "details": details
        }
    
    def _calculate_risk_level(self, risks: List[Dict]) -> str:
        """计算整体风险等级"""
        if not risks:
            return "none"
        
        levels = [r.get("level", "medium") for r in risks]
        
        if "high" in levels:
            return "high"
        elif "medium" in levels:
            return "medium"
        else:
            return "low"
    
    def check_video_params(self, params: Dict) -> Dict:
        """
        检查视频生成参数合规性
        
        参数：
            params: 视频参数字典
        
        返回：
            检查结果
        """
        risks = []
        suggestions = []
        
        prompt = params.get("prompt", "")
        
        # 检查提示词
        text_check = self.check_text(prompt)
        
        # 检查是否包含人物肖像风险
        if "人像" in prompt or "人脸" in prompt or "特写" in prompt:
            if "授权" not in prompt and "官方" not in prompt:
                risks.append({
                    "category": "portrait",
                    "category_name": "人物肖像",
                    "level": "low",
                    "message": "使用人物肖像需注意授权问题",
                    "suggestion": "建议使用官方授权素材或AI生成形象"
                })
        
        # 检查素材来源
        if params.get("image_url"):
            risks.append({
                "category": "copyright",
                "category_name": "素材版权",
                "level": "low",
                "message": "使用外部图片素材需确认版权",
                "suggestion": "建议使用原创或授权素材"
            })
        
        return {
            "passed": text_check["passed"] and len([r for r in risks if r["level"] == "high"]) == 0,
            "text_check": text_check,
            "param_risks": risks,
            "suggestions": text_check["suggestions"] + [r.get("suggestion", "") for r in risks],
            "risk_level": text_check["risk_level"]
        }
    
    def format_report(self, result: Dict) -> str:
        """格式化检查报告"""
        lines = []
        lines.append("\n" + "=" * 60)
        lines.append("🔍 AI合规自检报告")
        lines.append("=" * 60)
        
        # 总体结果
        if result.get("passed"):
            lines.append("\n✅ 检查通过")
        else:
            lines.append(f"\n⚠️  发现风险（等级：{result.get('risk_level', 'unknown')}）")
        
        # 风险详情
        if result.get("risks") or (result.get("text_check") and result["text_check"].get("risks")):
            lines.append("\n📋 风险提示：")
            
            text_risks = result.get("text_check", {}).get("risks", [])
            for risk in text_risks:
                level_icon = "🔴" if risk["level"] == "high" else "🟡" if risk["level"] == "medium" else "🟢"
                lines.append(f"\n{level_icon} {risk['category_name']}")
                lines.append(f"   发现敏感词：{', '.join(risk.get('words_found', []))}")
                lines.append(f"   建议：修改相关表述")
            
            param_risks = result.get("param_risks", [])
            for risk in param_risks:
                level_icon = "🔴" if risk["level"] == "high" else "🟡" if risk["level"] == "medium" else "🟢"
                lines.append(f"\n{level_icon} {risk['category_name']}")
                lines.append(f"   {risk['message']}")
                if risk.get("suggestion"):
                    lines.append(f"   建议：{risk['suggestion']}")
        
        # 修改建议
        suggestions = result.get("suggestions", [])
        if suggestions:
            lines.append("\n💡 修改建议：")
            for sugg in suggestions:
                if isinstance(sugg, dict):
                    lines.append(f"   • '{sugg['word']}' → {sugg['suggestion']}")
                elif isinstance(sugg, str) and sugg:
                    lines.append(f"   • {sugg}")
        
        # 版权提示
        copyright_notes = result.get("copyright_notes", [])
        if not copyright_notes and result.get("text_check"):
            copyright_notes = result["text_check"].get("copyright_notes", [])
        
        if copyright_notes:
            lines.append("\n📌 版权提示：")
            for note in copyright_notes:
                lines.append(f"   • {note}")
        
        lines.append("\n" + "=" * 60)
        
        return "\n".join(lines)


def main():
    """测试合规检查"""
    checker = ComplianceChecker()
    
    # 测试用例
    test_cases = [
        "武当山春天风景，道士练习太极拳，养生健身",
        "修仙成功，长生不老，包治百病",
        "武当山道教文化，道家养生智慧，太极功夫"
    ]
    
    for i, text in enumerate(test_cases, 1):
        print(f"\n{'='*60}")
        print(f"测试用例 {i}: {text[:30]}...")
        print('='*60)
        
        result = checker.check_text(text)
        print(checker.format_report(result))


if __name__ == "__main__":
    main()
