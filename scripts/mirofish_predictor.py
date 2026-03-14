#!/usr/bin/env python3
"""
MiroFish 预测模块 - Phase 1 MVP
用于预测热点事件对武当品牌的影响

功能：
1. 热点影响预测：评估热点对武当品牌的潜在影响
2. 风险评级：高/中/低
3. 策略建议：一句话应对建议

限制（Phase 1）：
- 每日只处理 Top 3 热点
- 简化预测维度
- 输出供人工决策参考
"""

import os
import json
import requests
from datetime import datetime
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class HotspotPrediction:
    """热点预测结果"""
    hotspot_id: str
    hotspot_title: str
    risk_level: str  # high / medium / low
    sentiment: str   # positive / negative / neutral
    impact_scope: str  # 影响范围描述
    recommendation: str  # 一句话建议
    brand_keywords: List[str]  # 相关的品牌关键词
    confidence: float  # 预测置信度 0-1
    reasoning: str  # 预测理由（简要）
    created_at: str
    
    def to_dict(self) -> Dict:
        return {
            "hotspot_id": self.hotspot_id,
            "hotspot_title": self.hotspot_title,
            "risk_level": self.risk_level,
            "sentiment": self.sentiment,
            "impact_scope": self.impact_scope,
            "recommendation": self.recommendation,
            "brand_keywords": self.brand_keywords,
            "confidence": self.confidence,
            "reasoning": self.reasoning,
            "created_at": self.created_at
        }


class MiroFishPredictor:
    """
    MiroFish 预测引擎客户端
    Phase 1 MVP：简化版预测，不依赖完整 MiroFish 部署
    """
    
    def __init__(self):
        # LLM API 配置（支持 OpenAI SDK 格式）
        self.llm_api_key = os.environ.get("LLM_API_KEY") or os.environ.get("MIROFISH_LLM_KEY")
        self.llm_base_url = os.environ.get("LLM_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
        self.llm_model = os.environ.get("LLM_MODEL_NAME", "qwen-plus")
        
        # 武当品牌关键词库
        self.brand_keywords = {
            "core": ["武当山", "武当", "Wudang"],
            "culture": ["太极", "Taichi", "道教", "Taoism", "武术", "Kungfu", "功夫"],
            "tourism": ["武当文旅", "金顶", "紫霄宫", "南岩宫", "武当旅游"],
            "symbols": ["张三丰", "真武大帝", "武当派", "道家养生"]
        }
        
        self.available = self.llm_api_key is not None
    
    def _call_llm(self, prompt: str, temperature: float = 0.7) -> str:
        """调用 LLM API"""
        if not self.available:
            return ""
        
        headers = {
            "Authorization": f"Bearer {self.llm_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.llm_model,
            "messages": [
                {"role": "system", "content": "你是一个专业的品牌舆情分析师，擅长评估热点事件对文旅品牌的影响。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": temperature,
            "max_tokens": 1000
        }
        
        try:
            resp = requests.post(
                f"{self.llm_base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"LLM 调用失败: {e}")
        
        return ""
    
    def predict_hotspot_impact(self, hotspot: Dict, max_keywords: int = 3) -> HotspotPrediction:
        """
        预测热点对武当品牌的影响
        
        Args:
            hotspot: 热点数据字典
            max_keywords: 最多关联的品牌关键词数量
        
        Returns:
            HotspotPrediction: 预测结果
        """
        hotspot_title = hotspot.get("title", "")
        hotspot_id = hotspot.get("id", "")
        platform = hotspot.get("platform", "")
        
        # 1. 识别相关的品牌关键词
        related_keywords = self._extract_related_keywords(hotspot_title)
        
        # 2. 构建预测提示词
        prompt = self._build_prediction_prompt(hotspot, related_keywords)
        
        # 3. 调用 LLM 进行预测
        prediction_text = self._call_llm(prompt, temperature=0.3)
        
        # 4. 解析预测结果
        parsed = self._parse_prediction(prediction_text)
        
        return HotspotPrediction(
            hotspot_id=hotspot_id,
            hotspot_title=hotspot_title,
            risk_level=parsed.get("risk_level", "medium"),
            sentiment=parsed.get("sentiment", "neutral"),
            impact_scope=parsed.get("impact_scope", "待定"),
            recommendation=parsed.get("recommendation", "建议观望"),
            brand_keywords=related_keywords[:max_keywords],
            confidence=parsed.get("confidence", 0.5),
            reasoning=parsed.get("reasoning", ""),
            created_at=datetime.now().isoformat()
        )
    
    def _extract_related_keywords(self, text: str) -> List[str]:
        """从热点文本中提取相关的品牌关键词"""
        text_lower = text.lower()
        related = []
        
        for category, keywords in self.brand_keywords.items():
            for kw in keywords:
                if kw.lower() in text_lower and kw not in related:
                    related.append(kw)
        
        return related
    
    def _build_prediction_prompt(self, hotspot: Dict, related_keywords: List[str]) -> str:
        """构建预测提示词"""
        title = hotspot.get("title", "")
        platform = hotspot.get("platform", "")
        heat_score = hotspot.get("heat_score", 0)
        
        keywords_str = ", ".join(related_keywords) if related_keywords else "暂无直接关联"
        
        prompt = f"""请分析以下热点事件对"武当山文旅品牌"的潜在影响：

【热点信息】
- 标题：{title}
- 平台：{platform}
- 热度：{heat_score}
- 关联关键词：{keywords_str}

【品牌背景】
武当山文旅品牌核心元素：
- 核心：武当山、道教圣地、世界文化遗产
- 文化：太极拳发源地、道教文化、武术文化
- 旅游：金顶、紫霄宫、古建筑群、自然风光
- 形象：清静、养生、传统、神秘

【分析要求】
请从以下维度进行分析，并严格按格式输出：

风险等级：[high/medium/low] 
- high: 可能对品牌造成负面影响或需要紧急应对
- medium: 有一定关联，建议关注
- low: 关联度低或无明显影响

情感走向：[positive/negative/neutral]
- positive: 可能带来正面曝光
- negative: 可能带来负面舆情
- neutral: 中性或难以判断

影响范围：[一句话描述，如"主要在抖音平台传播，潜在触达100万+用户"]

应对建议：[一句话具体建议，如"建议制作太极文化科普内容跟进热点"]

置信度：[0-1之间的数字，如0.75]

预测理由：[简要说明，50字以内]

请确保输出格式严格遵循上述模板。"""
        
        return prompt
    
    def _parse_prediction(self, text: str) -> Dict:
        """解析 LLM 返回的预测文本"""
        result = {
            "risk_level": "medium",
            "sentiment": "neutral",
            "impact_scope": "待定",
            "recommendation": "建议观望",
            "confidence": 0.5,
            "reasoning": ""
        }
        
        lines = text.strip().split("\n")
        
        for line in lines:
            line = line.strip()
            lower = line.lower()
            
            # 风险等级
            if "风险等级" in line or "risk_level" in lower:
                if "high" in lower or "高" in line:
                    result["risk_level"] = "high"
                elif "low" in lower or "低" in line:
                    result["risk_level"] = "low"
                elif "medium" in lower or "中" in line:
                    result["risk_level"] = "medium"
            
            # 情感走向
            elif "情感" in line or "sentiment" in lower:
                if "positive" in lower or "正面" in line:
                    result["sentiment"] = "positive"
                elif "negative" in lower or "负面" in line:
                    result["sentiment"] = "negative"
                elif "neutral" in lower or "中性" in line:
                    result["sentiment"] = "neutral"
            
            # 影响范围
            elif "影响范围" in line or "impact_scope" in lower:
                parts = line.split("：", 1)
                if len(parts) > 1:
                    result["impact_scope"] = parts[1].strip()
            
            # 应对建议
            elif "应对建议" in line or "recommendation" in lower:
                parts = line.split("：", 1)
                if len(parts) > 1:
                    result["recommendation"] = parts[1].strip()
            
            # 置信度
            elif "置信度" in line or "confidence" in lower:
                import re
                numbers = re.findall(r'0?\.\d+', line)
                if numbers:
                    result["confidence"] = float(numbers[0])
            
            # 预测理由
            elif "预测理由" in line or "reasoning" in lower:
                parts = line.split("：", 1)
                if len(parts) > 1:
                    result["reasoning"] = parts[1].strip()
        
        return result
    
    def batch_predict(self, hotspots: List[Dict], top_n: int = 3) -> List[HotspotPrediction]:
        """
        批量预测 Top N 热点
        
        Args:
            hotspots: 热点列表
            top_n: 最多预测数量（Phase 1 限制为 3）
        
        Returns:
            List[HotspotPrediction]: 预测结果列表
        """
        predictions = []
        
        # 按热度排序，取 Top N
        sorted_hotspots = sorted(hotspots, key=lambda x: x.get("heat_score", 0), reverse=True)
        
        print(f"\n🔮 开始对 Top {top_n} 热点进行影响预测...")
        
        for i, hotspot in enumerate(sorted_hotspots[:top_n], 1):
            print(f"  [{i}/{top_n}] 预测: {hotspot.get('title', 'N/A')[:30]}...")
            
            try:
                prediction = self.predict_hotspot_impact(hotspot)
                predictions.append(prediction)
            except Exception as e:
                print(f"    ⚠️ 预测失败: {e}")
                continue
        
        return predictions
    
    def format_prediction_report(self, predictions: List[HotspotPrediction]) -> str:
        """格式化预测报告"""
        if not predictions:
            return "暂无预测结果"
        
        lines = []
        lines.append("=" * 70)
        lines.append("🔮 MiroFish 热点影响预测报告")
        lines.append("=" * 70)
        lines.append(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        lines.append(f"预测热点数: {len(predictions)}")
        lines.append("")
        
        # 按风险等级分组
        high_risk = [p for p in predictions if p.risk_level == "high"]
        medium_risk = [p for p in predictions if p.risk_level == "medium"]
        low_risk = [p for p in predictions if p.risk_level == "low"]
        
        if high_risk:
            lines.append("🔴 高风险热点（需重点关注）")
            lines.append("-" * 70)
            for p in high_risk:
                lines.extend(self._format_single_prediction(p))
                lines.append("")
        
        if medium_risk:
            lines.append("🟡 中风险热点（建议关注）")
            lines.append("-" * 70)
            for p in medium_risk:
                lines.extend(self._format_single_prediction(p))
                lines.append("")
        
        if low_risk:
            lines.append("🟢 低风险热点（可观望）")
            lines.append("-" * 70)
            for p in low_risk:
                lines.extend(self._format_single_prediction(p))
                lines.append("")
        
        lines.append("=" * 70)
        lines.append("💡 使用建议：")
        lines.append("  - 高风险：建议人工复核后决策")
        lines.append("  - 中风险：可作为内容创作参考")
        lines.append("  - 低风险：可自行判断是否跟进")
        lines.append("=" * 70)
        
        return "\n".join(lines)
    
    def _format_single_prediction(self, p: HotspotPrediction) -> List[str]:
        """格式化单个预测"""
        risk_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(p.risk_level, "⚪")
        sentiment_emoji = {"positive": "😊", "negative": "😟", "neutral": "😐"}.get(p.sentiment, "😐")
        
        lines = [
            f"{risk_emoji} {p.hotspot_title[:40]}",
            f"   风险等级: {p.risk_level.upper()} | 情感: {sentiment_emoji} {p.sentiment}",
            f"   关联品牌: {', '.join(p.brand_keywords) if p.brand_keywords else '无直接关联'}",
            f"   影响范围: {p.impact_scope}",
            f"   💡 建议: {p.recommendation}",
            f"   置信度: {p.confidence:.0%} | 理由: {p.reasoning[:50]}..."
        ]
        return lines
    
    def export_to_feishu_format(self, predictions: List[HotspotPrediction]) -> str:
        """导出为飞书文档格式"""
        lines = []
        lines.append("# MiroFish 热点影响预测报告")
        lines.append(f"\n生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        
        # 汇总表
        lines.append("## 预测汇总")
        lines.append("| 热点 | 风险 | 情感 | 建议 | 置信度 |")
        lines.append("|------|------|------|------|--------|")
        
        for p in predictions:
            title = p.hotspot_title[:20] + "..." if len(p.hotspot_title) > 20 else p.hotspot_title
            lines.append(f"| {title} | {p.risk_level} | {p.sentiment} | {p.recommendation[:15]}... | {p.confidence:.0%} |")
        
        lines.append("\n## 详细分析\n")
        
        for p in predictions:
            lines.append(f"### {p.hotspot_title}")
            lines.append(f"- **风险等级**: {p.risk_level}")
            lines.append(f"- **情感走向**: {p.sentiment}")
            lines.append(f"- **关联品牌词**: {', '.join(p.brand_keywords) if p.brand_keywords else '无'}")
            lines.append(f"- **影响范围**: {p.impact_scope}")
            lines.append(f"- **应对建议**: {p.recommendation}")
            lines.append(f"- **置信度**: {p.confidence:.0%}")
            lines.append(f"- **预测理由**: {p.reasoning}")
            lines.append("")
        
        return "\n".join(lines)


# 测试代码
if __name__ == "__main__":
    predictor = MiroFishPredictor()
    
    if not predictor.available:
        print("⚠️ LLM_API_KEY 未配置，预测功能不可用")
        print("请设置环境变量: export LLM_API_KEY=your_key")
        exit(1)
    
    # 测试预测
    test_hotspot = {
        "id": "test_001",
        "title": "某明星在武当山拍摄综艺节目，现场学习太极拳",
        "platform": "微博",
        "heat_score": 8500
    }
    
    print("🧪 测试热点影响预测...")
    result = predictor.predict_hotspot_impact(test_hotspot)
    
    print("\n预测结果:")
    print(f"  风险等级: {result.risk_level}")
    print(f"  情感走向: {result.sentiment}")
    print(f"  建议: {result.recommendation}")
    print(f"  置信度: {result.confidence}")
