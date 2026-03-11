#!/usr/bin/env python3
"""
节日/节气提醒模块
自动检测当前时间附近的节日和节气，提供应景创作建议
"""

import json
import datetime
from typing import Dict, List, Optional

class FestivalReminder:
    """节日节气提醒器"""
    
    def __init__(self):
        self.festivals = self._load_festivals()
        self.solar_terms = self._load_solar_terms()
    
    def _load_festivals(self) -> Dict:
        """加载节日数据"""
        return {
            "01-01": {"name": "元旦", "theme": "新年新气象，武当祈福", "keywords": ["新年", "祈福", "开始"]},
            "春节": {"name": "春节", "theme": "新春祈福，道家纳祥", "keywords": ["过年", "团圆", "祝福"], "lunar": "01-01"},
            "元宵": {"name": "元宵节", "theme": "月圆人团圆，道法自然", "keywords": ["花灯", "团圆", "圆满"], "lunar": "01-15"},
            "清明": {"name": "清明节", "theme": "踏青问道，清明养生", "keywords": ["踏青", "养生", "缅怀"], "lunar": "03-05"},
            "劳动": {"name": "劳动节", "theme": "劳动养生，太极调息", "keywords": ["劳动", "休息", "养生"], "solar": "05-01"},
            "端午": {"name": "端午节", "theme": "端午安康，道家驱邪", "keywords": ["安康", "驱邪", "传统"], "lunar": "05-05"},
            "中秋": {"name": "中秋节", "theme": "月圆武当，道法圆满", "keywords": ["团圆", "月亮", "圆满"], "lunar": "08-15"},
            "国庆": {"name": "国庆节", "theme": "祖国华诞，武当献礼", "keywords": ["国庆", "祝福", "山河"], "solar": "10-01"},
            "重阳": {"name": "重阳节", "theme": "重阳登高，武当养生", "keywords": ["登高", "敬老", "长寿"], "lunar": "09-09"},
        }
    
    def _load_solar_terms(self) -> Dict:
        """加载24节气数据（2024-2026年）"""
        return {
            "2026": {
                "立春": "02-04", "雨水": "02-18", "惊蛰": "03-05", "春分": "03-20",
                "清明": "04-05", "谷雨": "04-20", "立夏": "05-05", "小满": "05-21",
                "芒种": "06-05", "夏至": "06-21", "小暑": "07-07", "大暑": "07-23",
                "立秋": "08-07", "处暑": "08-23", "白露": "09-07", "秋分": "09-23",
                "寒露": "10-08", "霜降": "10-23", "立冬": "11-07", "小雪": "11-22",
                "大雪": "12-07", "冬至": "12-22", "小寒": "01-05", "大寒": "01-20"
            }
        }
    
    def check_upcoming(self, days_ahead: int = 3) -> List[Dict]:
        """
        检查即将到来的节日/节气
        
        参数：
            days_ahead: 提前检查的天数（默认3天）
        
        返回：
            即将到来的节日/节气列表
        """
        today = datetime.datetime.now()
        upcoming = []
        
        # 检查公历节日
        for date_str, info in self.festivals.items():
            if "solar" in info:
                # 公历节日
                festival_date = datetime.datetime.strptime(
                    f"{today.year}-{info['solar']}", "%Y-%m-%d"
                )
                days_diff = (festival_date - today).days
                if 0 <= days_diff <= days_ahead:
                    upcoming.append({
                        "type": "节日",
                        "name": info["name"],
                        "date": info["solar"],
                        "days_left": days_diff,
                        "theme": info["theme"],
                        "keywords": info["keywords"]
                    })
        
        # 检查24节气
        year = str(today.year)
        if year in self.solar_terms:
            for term, date_str in self.solar_terms[year].items():
                term_date = datetime.datetime.strptime(
                    f"{today.year}-{date_str}", "%Y-%m-%d"
                )
                days_diff = (term_date - today).days
                if 0 <= days_diff <= days_ahead:
                    upcoming.append({
                        "type": "节气",
                        "name": term,
                        "date": date_str,
                        "days_left": days_diff,
                        "theme": self._get_term_theme(term),
                        "keywords": self._get_term_keywords(term)
                    })
        
        # 按时间排序
        upcoming.sort(key=lambda x: x["days_left"])
        return upcoming
    
    def _get_term_theme(self, term: str) -> str:
        """获取节气主题"""
        themes = {
            "立春": "立春养生，太极迎春",
            "雨水": "雨水润物，道法自然",
            "惊蛰": "惊蛰醒春，武当练功",
            "春分": "春分平衡，阴阳调和",
            "清明": "清明踏青，问道武当",
            "谷雨": "谷雨养生，采茶问禅",
            "立夏": "立夏养心，武当避暑",
            "小满": "小满满意，知足常乐",
            "芒种": "芒种忙种，功夫不负",
            "夏至": "夏至最长，练功正当时",
            "小暑": "小暑养生，心静自然凉",
            "大暑": "大暑避暑，武当清凉",
            "立秋": "立秋养肺，太极调息",
            "处暑": "处暑出暑，秋意渐浓",
            "白露": "白露为霜，问道仙山",
            "秋分": "秋分平分，阴阳平衡",
            "寒露": "寒露凝霜，武当秋景",
            "霜降": "霜降养生，御寒保暖",
            "立冬": "立冬藏养，内功修炼",
            "小雪": "小雪纷飞，武当冬韵",
            "大雪": "大雪封山，静修问道",
            "冬至": "冬至一阳生，太极转运",
            "小寒": "小寒养生，御寒功法",
            "大寒": "大寒练功，冬藏待发"
        }
        return themes.get(term, f"{term}养生，武当问道")
    
    def _get_term_keywords(self, term: str) -> List[str]:
        """获取节气关键词"""
        keywords = {
            "立春": ["春天", "开始", "养生"],
            "雨水": ["春雨", "滋润", "生长"],
            "惊蛰": ["春雷", "苏醒", "活力"],
            "春分": ["平衡", "昼夜", "调和"],
            "清明": ["踏青", "清新", "自然"],
            "谷雨": ["春雨", "茶叶", "养生"],
            "立夏": ["夏天", "养心", "避暑"],
            "小满": ["饱满", "收获", "期待"],
            "芒种": ["忙碌", "耕种", "收获"],
            "夏至": ["最长", "阳光", "练功"],
            "小暑": ["炎热", "心静", "清凉"],
            "大暑": ["酷暑", "避暑", "清凉"],
            "立秋": ["秋天", "养肺", "收获"],
            "处暑": ["出暑", "凉爽", "秋意"],
            "白露": ["露水", "清晨", "凉爽"],
            "秋分": ["平分", "平衡", "收获"],
            "寒露": ["寒冷", "露水", "秋景"],
            "霜降": ["霜冻", "寒冷", "保暖"],
            "立冬": ["冬天", "藏养", "内功"],
            "小雪": ["雪花", "初冬", "静美"],
            "大雪": ["大雪", "封山", "静修"],
            "冬至": ["最长夜", "转运", "一阳生"],
            "小寒": ["寒冷", "御寒", "练功"],
            "大寒": ["最冷", "冬藏", "待发"]
        }
        return keywords.get(term, [term, "养生", "武当"])
    
    def get_festival_ideas(self, festival_name: str) -> List[Dict]:
        """
        获取节日创意建议
        
        参数：
            festival_name: 节日名称
        
        返回：
            创意建议列表
        """
        ideas = []
        
        # 查找节日信息
        for date_str, info in self.festivals.items():
            if info["name"] == festival_name:
                ideas = [
                    {
                        "title": f"{festival_name}特辑 - 武当祈福",
                        "content": f"结合{festival_name}传统，展现武当山的{info['theme']}",
                        "keywords": info["keywords"],
                        "scenes": ["金顶祈福", "道长祝福", "云海仙境"]
                    },
                    {
                        "title": f"{festival_name}养生 - 道家智慧",
                        "content": f"分享{festival_name}期间的道家养生方法",
                        "keywords": info["keywords"] + ["养生", "健康"],
                        "scenes": ["太极演示", "养生讲解", "自然风景"]
                    },
                    {
                        "title": f"{festival_name}游武当 - 打卡攻略",
                        "content": f"{festival_name}期间武当山游览推荐",
                        "keywords": info["keywords"] + ["旅游", "攻略"],
                        "scenes": ["景点推荐", "路线规划", "美食住宿"]
                    }
                ]
                break
        
        return ideas
    
    def format_reminder(self, upcoming: List[Dict]) -> str:
        """格式化提醒消息"""
        if not upcoming:
            return ""
        
        messages = []
        for item in upcoming:
            if item["days_left"] == 0:
                time_desc = "今天"
            elif item["days_left"] == 1:
                time_desc = "明天"
            else:
                time_desc = f"{item['days_left']}天后"
            
            messages.append(
                f"🎉 {time_desc}是【{item['name']}】\n"
                f"   主题：{item['theme']}\n"
                f"   关键词：{', '.join(item['keywords'][:3])}"
            )
        
        return "\n\n".join(messages)


def main():
    """测试功能"""
    reminder = FestivalReminder()
    
    # 检查即将到来的节日/节气
    upcoming = reminder.check_upcoming(days_ahead=7)
    
    if upcoming:
        print("=== 节日/节气提醒 ===")
        print(reminder.format_reminder(upcoming))
        
        # 获取第一个节日的创意
        first = upcoming[0]
        if first["type"] == "节日":
            print(f"\n=== {first['name']}创意建议 ===")
            ideas = reminder.get_festival_ideas(first["name"])
            for i, idea in enumerate(ideas, 1):
                print(f"\n{i}. {idea['title']}")
                print(f"   内容：{idea['content']}")
                print(f"   场景：{', '.join(idea['scenes'])}")
    else:
        print("未来7天没有特殊的节日或节气")


if __name__ == "__main__":
    main()
