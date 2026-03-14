#!/usr/bin/env python3
"""
武当文旅热点追踪模块 v1.0
整合 Qveris（国内热点）+ TikAPI（海外热点）
实现国内外热点挖掘和实时跟踪
"""

import os
import json
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass

# Phase 1: 导入 MiroFish 预测模块
try:
    from mirofish_predictor import MiroFishPredictor, HotspotPrediction
    MIROFISH_AVAILABLE = True
except ImportError:
    MIROFISH_AVAILABLE = False


@dataclass
class Hotspot:
    """热点数据模型"""
    id: str
    title: str
    platform: str
    source: str
    heat_score: int
    publish_time: str
    engagement: Dict
    category: str
    url: str = ""
    keywords: List[str] = None
    content_type: str = "text"
    region: str = "domestic"  # domestic 国内 / international 海外
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "title": self.title,
            "platform": self.platform,
            "source": self.source,
            "heat_score": self.heat_score,
            "publish_time": self.publish_time,
            "engagement": self.engagement,
            "category": self.category,
            "url": self.url,
            "keywords": self.keywords or [],
            "content_type": self.content_type,
            "region": self.region
        }


class QverisTrendProvider:
    """Qveris 热点数据提供者（国内平台）"""
    
    API_BASE = "https://qveris.ai/api/v1"
    
    def __init__(self):
        self.api_key = os.environ.get("QVERIS_API_KEY")
        self.available = self.api_key is not None
    
    def search_tools(self, query: str, limit: int = 10) -> List[Dict]:
        """搜索可用的热点工具"""
        if not self.available:
            return []
        
        try:
            resp = requests.post(
                f"{self.API_BASE}/search",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"query": query, "limit": limit},
                timeout=30
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("results", [])
        except Exception as e:
            print(f"Qveris 搜索失败: {e}")
        return []
    
    def execute_tool(self, tool_id: str, search_id: str, params: Dict) -> Dict:
        """执行指定的热点工具"""
        if not self.available:
            return {"error": "QVERIS_API_KEY 未配置"}
        
        try:
            # 正确的端点: /api/v1/tools/execute?tool_id=xxx
            resp = requests.post(
                f"{self.API_BASE}/tools/execute?tool_id={tool_id}",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "search_id": search_id,
                    "parameters": params,
                    "max_response_size": 20480
                },
                timeout=60
            )
            if resp.status_code == 200:
                return resp.json()
            else:
                return {"error": f"HTTP {resp.status_code}: {resp.text}"}
        except Exception as e:
            return {"error": str(e)}
    
    def get_weibo_hotspots(self, keyword: str = "旅游", days: int = 1, limit: int = 20) -> List[Hotspot]:
        """获取微博热点"""
        hotspots = []
        
        # 先搜索微博工具
        tools = self.search_tools("微博关键词搜索", limit=5)
        weibo_tool = None
        for tool in tools:
            if "weibo" in tool.get("tool_id", "").lower():
                weibo_tool = tool
                break
        
        if not weibo_tool:
            return hotspots
        
        tool_id = weibo_tool.get("tool_id")
        search_id = weibo_tool.get("search_id", "")
        
        # 计算时间范围
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        params = {
            "q": keyword,
            "startDay": start_date.strftime("%Y-%m-%d"),
            "startHour": start_date.hour,
            "endDay": end_date.strftime("%Y-%m-%d"),
            "endHour": end_date.hour,
            "page": 1
        }
        
        result = self.execute_tool(tool_id, search_id, params)
        
        if "error" in result:
            print(f"微博热点获取失败: {result['error']}")
            return hotspots
        
        # 解析返回数据 (新结构: result.result.data.data.weibo_list)
        try:
            items = []
            if "result" in result and "data" in result["result"]:
                data_wrapper = result["result"]["data"]
                if "data" in data_wrapper and "weibo_list" in data_wrapper["data"]:
                    items = data_wrapper["data"]["weibo_list"]
            
            for i, item in enumerate(items[:limit]):
                try:
                    # 计算热度分数
                    heat_score = item.get("attitudes_count", 0) + item.get("reposts_count", 0) * 2 + item.get("comments_count", 0)
                    
                    # 提取文本
                    text = item.get("text", "")
                    # 清理HTML标签
                    import re
                    text_clean = re.sub(r'<[^>]+>', '', text)
                    
                    hotspot = Hotspot(
                        id=f"weibo_{item.get('id', i)}",
                        title=text_clean[:100] if text_clean else "微博内容",
                        platform="微博",
                        source=item.get("screen_name", "微博用户"),
                        heat_score=heat_score,
                        publish_time=item.get("created_at", datetime.now().isoformat()),
                        engagement={
                            "likes": item.get("attitudes_count", 0),
                            "comments": item.get("comments_count", 0),
                            "shares": item.get("reposts_count", 0)
                        },
                        category=self._categorize_content(text_clean),
                        region="domestic"
                    )
                    hotspots.append(hotspot)
                except Exception as e:
                    continue
        except Exception as e:
            print(f"解析微博数据失败: {e}")
        
        return hotspots
    
    def get_toutiao_hotspots(self, keyword: str = "旅游", limit: int = 20) -> List[Hotspot]:
        """获取今日头条热点"""
        hotspots = []
        
        tools = self.search_tools("今日头条搜索", limit=5)
        toutiao_tool = None
        for tool in tools:
            if "toutiao" in tool.get("tool_id", "").lower():
                toutiao_tool = tool
                break
        
        if not toutiao_tool:
            return hotspots
        
        tool_id = toutiao_tool.get("tool_id")
        search_id = toutiao_tool.get("search_id", "")
        
        result = self.execute_tool(tool_id, search_id, {"keyword": keyword})
        
        if "error" in result:
            return hotspots
        
        items = result.get("results", []) or result.get("data", [])
        for i, item in enumerate(items[:limit]):
            try:
                hotspot = Hotspot(
                    id=f"toutiao_{item.get('id', i)}",
                    title=item.get("title", "未知标题"),
                    platform="今日头条",
                    source=item.get("source", "头条号"),
                    heat_score=item.get("read_count", 0) + item.get("comment_count", 0) * 3,
                    publish_time=item.get("publish_time", datetime.now().isoformat()),
                    engagement={
                        "likes": item.get("like_count", 0),
                        "comments": item.get("comment_count", 0),
                        "shares": item.get("share_count", 0)
                    },
                    category=self._categorize_content(item.get("title", "")),
                    content_type=item.get("type", "article"),
                    region="domestic"
                )
                hotspots.append(hotspot)
            except Exception:
                continue
        
        return hotspots
    
    def get_xiaohongshu_kol_content(self, category: str = "出行", limit: int = 15) -> List[Hotspot]:
        """获取小红书KOL热门内容"""
        hotspots = []
        
        tools = self.search_tools("小红书 KOL 搜索 旅游", limit=5)
        xhs_tool = None
        for tool in tools:
            if "xiaohongshu" in tool.get("tool_id", "").lower():
                xhs_tool = tool
                break
        
        if not xhs_tool:
            return hotspots
        
        tool_id = xhs_tool.get("tool_id")
        search_id = xhs_tool.get("search_id", "")
        
        params = {
            "searchType": "NOTE",
            "keyword": "旅游",
            "first_category": category,
            "page": 1
        }
        
        result = self.execute_tool(tool_id, search_id, params)
        
        if "error" in result:
            return hotspots
        
        items = result.get("results", []) or result.get("data", [])
        for i, item in enumerate(items[:limit]):
            try:
                hotspot = Hotspot(
                    id=f"xhs_{item.get('note_id', i)}",
                    title=item.get("title", item.get("desc", "未知内容")),
                    platform="小红书",
                    source=item.get("nickname", "小红书用户"),
                    heat_score=item.get("likes", 0) + item.get("collects", 0) * 2,
                    publish_time=item.get("publish_time", datetime.now().isoformat()),
                    engagement={
                        "likes": item.get("likes", 0),
                        "collects": item.get("collects", 0),
                        "comments": item.get("comments", 0)
                    },
                    category="旅游",
                    region="domestic"
                )
                hotspots.append(hotspot)
            except Exception:
                continue
        
        return hotspots
    
    def _categorize_content(self, text: str) -> str:
        """内容分类"""
        categories = {
            "风景": ["风景", "景区", "山", "水", "云海", "日出", "美景"],
            "文化": ["文化", "历史", "传统", "非遗", "道教", "太极"],
            "美食": ["美食", "小吃", "特产", "餐厅"],
            "住宿": ["酒店", "民宿", "住宿", "客栈"],
            "攻略": ["攻略", "指南", "路线", "行程"]
        }
        
        text_lower = text.lower()
        for cat, keywords in categories.items():
            if any(kw in text_lower for kw in keywords):
                return cat
        return "其他"


class TikAPIProvider:
    """TikAPI 热点数据提供者（海外TikTok）"""
    
    API_BASE = "https://api.tikapi.io/public"
    
    def __init__(self):
        self.api_key = os.environ.get("TIKAPI_KEY")
        self.available = self.api_key is not None
    
    def _request(self, endpoint: str, params: Dict = None) -> Dict:
        """发送API请求"""
        if not self.available:
            return {"error": "TIKAPI_KEY 未配置"}
        
        headers = {
            "X-API-KEY": self.api_key,
            "Accept": "application/json"
        }
        
        try:
            resp = requests.get(
                f"{self.API_BASE}/{endpoint}",
                headers=headers,
                params=params,
                timeout=30
            )
            if resp.status_code == 200:
                return resp.json()
            else:
                return {"error": f"HTTP {resp.status_code}: {resp.text}"}
        except Exception as e:
            return {"error": str(e)}
    
    def get_trending_hashtags(self, limit: int = 20) -> List[Hotspot]:
        """获取TikTok热门话题标签"""
        hotspots = []
        
        # 获取发现页面热门
        result = self._request("check", {"username": "wudang"})
        
        if "error" in result:
            print(f"TikAPI 调用失败: {result['error']}")
            return hotspots
        
        # 搜索武当相关热门内容
        search_result = self._request("search", {"query": "wudang mountain", "count": limit})
        
        if "error" in search_result:
            return hotspots
        
        items = search_result.get("itemList", [])
        for i, item in enumerate(items):
            try:
                stats = item.get("stats", {})
                author = item.get("author", {})
                
                hotspot = Hotspot(
                    id=f"tiktok_{item.get('id', i)}",
                    title=item.get("desc", "TikTok Video"),
                    platform="TikTok",
                    source=author.get("nickname", "TikTok User"),
                    heat_score=stats.get("diggCount", 0) + stats.get("shareCount", 0) * 2,
                    publish_time=datetime.now().isoformat(),
                    engagement={
                        "likes": stats.get("diggCount", 0),
                        "comments": stats.get("commentCount", 0),
                        "shares": stats.get("shareCount", 0),
                        "plays": stats.get("playCount", 0)
                    },
                    category=self._categorize_tiktok_content(item.get("desc", "")),
                    content_type="video",
                    region="international"
                )
                hotspots.append(hotspot)
            except Exception:
                continue
        
        return hotspots
    
    def get_trending_music(self, limit: int = 10) -> List[Dict]:
        """获取TikTok热门音乐"""
        result = self._request("trending/music", {"count": limit})
        
        if "error" in result:
            return []
        
        music_list = result.get("musicList", [])
        return [
            {
                "id": m.get("id"),
                "title": m.get("title"),
                "author": m.get("author"),
                "play_url": m.get("playUrl"),
                "cover": m.get("cover"),
                "duration": m.get("duration")
            }
            for m in music_list
        ]
    
    def get_hashtag_posts(self, hashtag: str, limit: int = 20) -> List[Hotspot]:
        """获取特定话题标签下的热门内容"""
        hotspots = []
        
        result = self._request("search", {"query": f"#{hashtag}", "count": limit})
        
        if "error" in result:
            return hotspots
        
        items = result.get("itemList", [])
        for i, item in enumerate(items):
            try:
                stats = item.get("stats", {})
                author = item.get("author", {})
                
                hotspot = Hotspot(
                    id=f"tiktok_tag_{item.get('id', i)}",
                    title=item.get("desc", f"#{hashtag}"),
                    platform="TikTok",
                    source=author.get("nickname", "TikTok User"),
                    heat_score=stats.get("diggCount", 0),
                    publish_time=datetime.now().isoformat(),
                    engagement={
                        "likes": stats.get("diggCount", 0),
                        "comments": stats.get("commentCount", 0),
                        "shares": stats.get("shareCount", 0)
                    },
                    category="hashtag",
                    region="international"
                )
                hotspots.append(hotspot)
            except Exception:
                continue
        
        return hotspots
    
    def _categorize_tiktok_content(self, text: str) -> str:
        """TikTok内容分类"""
        categories = {
            "martial_arts": ["kungfu", "martial", "taichi", "tai chi", "wushu", "功夫"],
            "landscape": ["mountain", "scenery", "nature", "view", "landscape", "云海"],
            "culture": ["taoism", "daoism", "temple", "culture", "traditional", "道教"],
            "travel": ["travel", "trip", "visit", "tour", "vacation", "旅游"]
        }
        
        text_lower = text.lower()
        for cat, keywords in categories.items():
            if any(kw in text_lower for kw in keywords):
                return cat
        return "other"


class TrendTracker:
    """
    热点追踪器 - 整合国内外热点
    """
    
    def __init__(self):
        self.qveris = QverisTrendProvider()
        self.tikapi = TikAPIProvider()
        self.cache_file = os.path.expanduser("~/clawd/skills/wudang-content-creator/data/trend_cache.json")
        self._ensure_cache_dir()
        
        # Phase 1: 初始化 MiroFish 预测器
        if MIROFISH_AVAILABLE:
            self.predictor = MiroFishPredictor()
            self.prediction_enabled = self.predictor.available
        else:
            self.predictor = None
            self.prediction_enabled = False
    
    def _ensure_cache_dir(self):
        """确保缓存目录存在"""
        cache_dir = os.path.dirname(self.cache_file)
        if not os.path.exists(cache_dir):
            os.makedirs(cache_dir, exist_ok=True)
    
    def fetch_all_hotspots(self, keywords: List[str] = None) -> Dict:
        """
        获取所有平台的热点数据
        
        Returns:
            Dict: 包含 domestic（国内）和 international（海外）热点的字典
        """
        if keywords is None:
            keywords = ["旅游", "武当", "太极", "道教", "山景"]
        
        result = {
            "timestamp": datetime.now().isoformat(),
            "domestic": [],
            "international": [],
            "summary": {}
        }
        
        # 国内热点 - Qveris
        if self.qveris.available:
            print("🔍 正在获取国内热点...")
            
            # 微博热点
            for keyword in keywords[:2]:
                weibo_hot = self.qveris.get_weibo_hotspots(keyword=keyword, days=1, limit=10)
                result["domestic"].extend(weibo_hot)
            
            # 头条热点
            toutiao_hot = self.qveris.get_toutiao_hotspots(keyword="旅游", limit=10)
            result["domestic"].extend(toutiao_hot)
            
            # 小红书内容
            xhs_hot = self.qveris.get_xiaohongshu_kol_content(category="出行", limit=10)
            result["domestic"].extend(xhs_hot)
        
        # 海外热点 - TikAPI
        if self.tikapi.available:
            print("🌍 正在获取海外热点...")
            
            # TikTok热门内容
            tiktok_hot = self.tikapi.get_trending_hashtags(limit=20)
            result["international"].extend(tiktok_hot)
            
            # 武当相关话题
            wudang_posts = self.tikapi.get_hashtag_posts("wudang", limit=10)
            result["international"].extend(wudang_posts)
            
            taichi_posts = self.tikapi.get_hashtag_posts("taichi", limit=10)
            result["international"].extend(taichi_posts)
        
        # 去重和排序
        result["domestic"] = self._deduplicate_hotspots(result["domestic"])
        result["international"] = self._deduplicate_hotspots(result["international"])
        
        # 按热度排序
        result["domestic"].sort(key=lambda x: x.heat_score, reverse=True)
        result["international"].sort(key=lambda x: x.heat_score, reverse=True)
        
        # 生成摘要
        result["summary"] = self._generate_summary(result)
        
        # 保存缓存
        self._save_cache(result)
        
        return result
    
    def _deduplicate_hotspots(self, hotspots: List[Hotspot]) -> List[Hotspot]:
        """去重"""
        seen = set()
        unique = []
        for h in hotspots:
            key = h.title[:30]  # 用前30字符作为去重键
            if key not in seen:
                seen.add(key)
                unique.append(h)
        return unique
    
    def _generate_summary(self, result: Dict) -> Dict:
        """生成热点摘要"""
        domestic = result["domestic"]
        international = result["international"]
        
        # 统计各平台数量
        platform_stats = {}
        for h in domestic + international:
            platform = h.platform
            platform_stats[platform] = platform_stats.get(platform, 0) + 1
        
        # 获取Top热点
        top_domestic = domestic[:5] if domestic else []
        top_international = international[:5] if international else []
        
        return {
            "total_domestic": len(domestic),
            "total_international": len(international),
            "platform_distribution": platform_stats,
            "top_domestic": [h.to_dict() for h in top_domestic],
            "top_international": [h.to_dict() for h in top_international],
            "categories": self._analyze_categories(domestic + international)
        }
    
    def _analyze_categories(self, hotspots: List[Hotspot]) -> Dict:
        """分析热点类别分布"""
        categories = {}
        for h in hotspots:
            cat = h.category
            categories[cat] = categories.get(cat, 0) + 1
        return categories
    
    def _save_cache(self, data: Dict):
        """保存缓存"""
        try:
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"缓存保存失败: {e}")
    
    def load_cache(self) -> Optional[Dict]:
        """加载缓存"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"缓存加载失败: {e}")
        return None
    
    def get_wudang_related_hotspots(self) -> List[Hotspot]:
        """获取与武当相关的热点"""
        all_hotspots = self.fetch_all_hotspots()
        
        wudang_keywords = ["武当", "wudang", "太极", "taichi", "道教", "taoism", "武术", "kungfu"]
        
        related = []
        for region in ["domestic", "international"]:
            for h in all_hotspots.get(region, []):
                title_lower = h.title.lower()
                if any(kw in title_lower for kw in wudang_keywords):
                    related.append(h)
        
        return related
    
    def format_report(self, data: Dict, limit: int = 10) -> str:
        """格式化热点报告"""
        lines = []
        lines.append("=" * 70)
        lines.append("🔥 武当文旅 - 国内外热点追踪报告")
        lines.append("=" * 70)
        lines.append(f"生成时间: {data.get('timestamp', 'N/A')}")
        lines.append("")
        
        # 摘要
        summary = data.get("summary", {})
        lines.append("📊 数据概览")
        lines.append("-" * 70)
        lines.append(f"  国内热点: {summary.get('total_domestic', 0)} 条")
        lines.append(f"  海外热点: {summary.get('total_international', 0)} 条")
        lines.append("")
        
        # 平台分布
        platform_dist = summary.get("platform_distribution", {})
        if platform_dist:
            lines.append("📱 平台分布")
            lines.append("-" * 70)
            for platform, count in sorted(platform_dist.items(), key=lambda x: x[1], reverse=True):
                lines.append(f"  {platform}: {count} 条")
            lines.append("")
        
        # 国内Top热点
        top_domestic = summary.get("top_domestic", [])
        if top_domestic:
            lines.append("🇨🇳 国内热门 TOP 5")
            lines.append("-" * 70)
            for i, h in enumerate(top_domestic[:5], 1):
                lines.append(f"  {i}. {h.get('title', 'N/A')[:40]}")
                lines.append(f"     平台: {h.get('platform', 'N/A')} | 热度: {h.get('heat_score', 0)}")
                lines.append("")
        
        # 海外Top热点
        top_international = summary.get("top_international", [])
        if top_international:
            lines.append("🌍 海外热门 TOP 5")
            lines.append("-" * 70)
            for i, h in enumerate(top_international[:5], 1):
                lines.append(f"  {i}. {h.get('title', 'N/A')[:40]}")
                lines.append(f"     平台: {h.get('platform', 'N/A')} | 热度: {h.get('heat_score', 0)}")
                lines.append("")
        
        # 类别分析
        categories = summary.get("categories", {})
        if categories:
            lines.append("📂 内容类别分布")
            lines.append("-" * 70)
            for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
                lines.append(f"  {cat}: {count} 条")
            lines.append("")
        
        lines.append("=" * 70)
        return "\n".join(lines)
    
    def get_recommendations(self, data: Dict) -> List[Dict]:
        """基于热点生成内容建议"""
        recommendations = []
        
        # 分析国内热点
        for h in data.get("domestic", [])[:5]:
            rec = {
                "type": "domestic_hotspot",
                "title": h.title,
                "platform": h.platform,
                "suggestion": self._generate_suggestion(h),
                "priority": "high" if h.heat_score > 1000 else "medium"
            }
            recommendations.append(rec)
        
        # 分析海外热点
        for h in data.get("international", [])[:5]:
            rec = {
                "type": "international_trend",
                "title": h.title,
                "platform": h.platform,
                "suggestion": self._generate_suggestion(h, international=True),
                "priority": "medium"
            }
            recommendations.append(rec)
        
        return recommendations
    
    # ========== Phase 1: MiroFish 预测功能 ==========
    
    def predict_hotspot_impacts(self, top_n: int = 3) -> Dict:
        """
        对 Top N 热点进行影响预测
        
        Args:
            top_n: 预测热点数量（Phase 1 限制为 3）
        
        Returns:
            Dict: 包含预测结果的字典
        """
        if not self.prediction_enabled:
            return {
                "error": "MiroFish 预测功能未启用",
                "reason": "LLM_API_KEY 未配置",
                "predictions": []
            }
        
        # 获取热点数据
        data = self.fetch_all_hotspots()
        
        # 合并国内和海外热点
        all_hotspots = data.get("domestic", []) + data.get("international", [])
        
        if not all_hotspots:
            return {
                "error": "暂无热点数据",
                "predictions": []
            }
        
        # 转换为字典格式用于预测
        hotspot_dicts = [h.to_dict() for h in all_hotspots]
        
        # 批量预测
        predictions = self.predictor.batch_predict(hotspot_dicts, top_n=top_n)
        
        return {
            "timestamp": datetime.now().isoformat(),
            "total_hotspots": len(all_hotspots),
            "predicted_count": len(predictions),
            "predictions": [p.to_dict() for p in predictions]
        }
    
    def format_prediction_report(self, prediction_data: Dict) -> str:
        """格式化预测报告"""
        if "error" in prediction_data:
            return f"⚠️ {prediction_data['error']}"
        
        predictions = prediction_data.get("predictions", [])
        
        if not predictions:
            return "暂无预测结果"
        
        # 转换回 HotspotPrediction 对象
        prediction_objects = []
        for p in predictions:
            prediction_objects.append(HotspotPrediction(
                hotspot_id=p.get("hotspot_id", ""),
                hotspot_title=p.get("hotspot_title", ""),
                risk_level=p.get("risk_level", "medium"),
                sentiment=p.get("sentiment", "neutral"),
                impact_scope=p.get("impact_scope", ""),
                recommendation=p.get("recommendation", ""),
                brand_keywords=p.get("brand_keywords", []),
                confidence=p.get("confidence", 0.5),
                reasoning=p.get("reasoning", ""),
                created_at=p.get("created_at", "")
            ))
        
        return self.predictor.format_prediction_report(prediction_objects)
    
    def get_prediction_status(self) -> str:
        """获取预测功能状态"""
        if not MIROFISH_AVAILABLE:
            return "❌ MiroFish 模块未安装"
        
        if not self.prediction_enabled:
            return "⚠️ MiroFish 预测功能已禁用（LLM_API_KEY 未配置）"
        
        return f"✅ MiroFish 预测功能已启用（模型: {self.predictor.llm_model}）"
    
    def _generate_suggestion(self, hotspot: Hotspot, international: bool = False) -> str:
        """生成内容建议"""
        if international:
            suggestions = {
                "martial_arts": "可制作太极/武术教学短视频，配英文字幕",
                "landscape": "制作武当山风景航拍，突出自然之美",
                "culture": "介绍道教文化故事，适合知识分享类内容",
                "travel": "制作旅行攻略，突出实用信息"
            }
        else:
            suggestions = {
                "风景": "结合武当山实景，制作视觉冲击力强的风景短片",
                "文化": "深挖武当文化故事，制作文化解读类内容",
                "美食": "展示武当山特色美食，吸引美食爱好者",
                "攻略": "提供实用的游览攻略，服务计划出行的游客",
                "其他": "紧跟热点话题，快速响应制作相关内容"
            }
        
        return suggestions.get(hotspot.category, "结合热点制作相关内容")


# 测试代码
if __name__ == "__main__":
    tracker = TrendTracker()
    
    # 检查API配置
    if not tracker.qveris.available:
        print("⚠️ QVERIS_API_KEY 未配置，国内热点功能不可用")
    if not tracker.tikapi.available:
        print("⚠️ TIKAPI_KEY 未配置，海外热点功能不可用")
    
    # 获取热点
    print("\n开始获取热点数据...")
    data = tracker.fetch_all_hotspots()
    
    # 打印报告
    print("\n" + tracker.format_report(data))
    
    # 获取建议
    print("\n💡 内容创作建议:")
    recommendations = tracker.get_recommendations(data)
    for i, rec in enumerate(recommendations[:5], 1):
        print(f"\n{i}. {rec['title'][:30]}")
        print(f"   建议: {rec['suggestion']}")
        print(f"   优先级: {rec['priority']}")
