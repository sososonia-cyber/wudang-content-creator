import axios from 'axios';
import { config } from '../config/env';
import { logger } from '../utils/logger';

interface TrendData {
  title: string;
  heat: number;
  source: string;
  url?: string;
}

export class QverisService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.apis.qveris;
    this.baseUrl = 'https://api.qveris.com/v1';
  }

  // 获取微博热点
  async getWeiboTrends(): Promise<TrendData[]> {
    try {
      if (!this.apiKey) {
        logger.warn('Qveris API Key未配置，使用模拟数据');
        return this.getMockTrends('weibo');
      }

      const response = await axios.post(
        `${this.baseUrl}/tools/execute`,
        {
          tool_id: 'weibo_hot_search',
          params: {
            limit: 20
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      // 适配Qveris返回数据结构
      const data = response.data?.result?.data?.data?.weibo_list || 
                   response.data?.data?.weibo_list ||
                   response.data?.data || [];

      return data.map((item: any) => ({
        title: item.title || item.keyword || '',
        heat: this.parseHeat(item.heat || item.hot_value || 0),
        source: 'weibo',
        url: item.url || `https://s.weibo.com/weibo?q=${encodeURIComponent(item.title || '')}`
      })).filter((t: TrendData) => t.title);

    } catch (error: any) {
      logger.error('获取微博热点失败:', error.message);
      return this.getMockTrends('weibo');
    }
  }

  // 获取头条热点
  async getToutiaoTrends(): Promise<TrendData[]> {
    try {
      if (!this.apiKey) {
        return this.getMockTrends('toutiao');
      }

      const response = await axios.post(
        `${this.baseUrl}/tools/execute`,
        {
          tool_id: 'toutiao_hot',
          params: {
            limit: 20
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const data = response.data?.result?.data?.data || 
                   response.data?.data || [];

      return data.map((item: any) => ({
        title: item.Title || item.title || '',
        heat: this.parseHeat(item.HotValue || item.hot_value || 0),
        source: 'toutiao',
        url: item.Url || item.url || ''
      })).filter((t: TrendData) => t.title);

    } catch (error: any) {
      logger.error('获取头条热点失败:', error.message);
      return this.getMockTrends('toutiao');
    }
  }

  // 获取小红书热点
  async getXiaohongshuTrends(): Promise<TrendData[]> {
    try {
      if (!this.apiKey) {
        return this.getMockTrends('xiaohongshu');
      }

      const response = await axios.post(
        `${this.baseUrl}/tools/execute`,
        {
          tool_id: 'xiaohongshu_hot',
          params: {
            limit: 20
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const data = response.data?.result?.data?.data || 
                   response.data?.data || [];

      return data.map((item: any) => ({
        title: item.title || item.keyword || '',
        heat: this.parseHeat(item.hot_value || item.heat || 0),
        source: 'xiaohongshu',
        url: item.url || `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(item.title || '')}`
      })).filter((t: TrendData) => t.title);

    } catch (error: any) {
      logger.error('获取小红书热点失败:', error.message);
      return this.getMockTrends('xiaohongshu');
    }
  }

  // 获取所有国内热点
  async getAllDomesticTrends(): Promise<TrendData[]> {
    const [weibo, toutiao, xiaohongshu] = await Promise.all([
      this.getWeiboTrends(),
      this.getToutiaoTrends(),
      this.getXiaohongshuTrends()
    ]);

    // 合并并去重
    const allTrends = [...weibo, ...toutiao, ...xiaohongshu];
    const uniqueTrends = this.deduplicateTrends(allTrends);

    // 按热度排序
    return uniqueTrends.sort((a, b) => b.heat - a.heat);
  }

  // 解析热度值
  private parseHeat(heatValue: string | number): number {
    if (typeof heatValue === 'number') return heatValue;
    
    // 处理 "98.5万" 格式
    if (typeof heatValue === 'string') {
      if (heatValue.includes('万')) {
        return parseFloat(heatValue.replace('万', '')) * 10000;
      }
      if (heatValue.includes('w')) {
        return parseFloat(heatValue.replace('w', '')) * 10000;
      }
      return parseFloat(heatValue) || 0;
    }
    return 0;
  }

  // 去重
  private deduplicateTrends(trends: TrendData[]): TrendData[] {
    const seen = new Set<string>();
    return trends.filter(trend => {
      const key = trend.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // 模拟数据（API未配置时使用）
  private getMockTrends(source: string): TrendData[] {
    const mockData: Record<string, TrendData[]> = {
      weibo: [
        { title: '#武当山雪景', heat: 985000, source: 'weibo', url: 'https://s.weibo.com/weibo?q=武当山雪景' },
        { title: '#春季养生', heat: 652000, source: 'weibo', url: 'https://s.weibo.com/weibo?q=春季养生' },
        { title: '#太极拳入门', heat: 534000, source: 'weibo', url: 'https://s.weibo.com/weibo?q=太极拳入门' },
        { title: '#武当功夫', heat: 421000, source: 'weibo', url: 'https://s.weibo.com/weibo?q=武当功夫' },
        { title: '#道教文化', heat: 387000, source: 'weibo', url: 'https://s.weibo.com/weibo?q=道教文化' }
      ],
      toutiao: [
        { title: '武当山金顶云海奇观', heat: 823000, source: 'toutiao', url: '' },
        { title: '太极养生法走红网络', heat: 612000, source: 'toutiao', url: '' },
        { title: '年轻人爱上武当武术', heat: 445000, source: 'toutiao', url: '' },
        { title: '武当山旅游攻略', heat: 334000, source: 'toutiao', url: '' },
        { title: '传统武术传承现状', heat: 278000, source: 'toutiao', url: '' }
      ],
      xiaohongshu: [
        { title: '被问爆的武当日出攻略', heat: 567000, source: 'xiaohongshu', url: '' },
        { title: '武当山小众打卡点', heat: 445000, source: 'xiaohongshu', url: '' },
        { title: '太极初体验', heat: 334000, source: 'xiaohongshu', url: '' },
        { title: '治愈系风景 武当云海', heat: 289000, source: 'xiaohongshu', url: '' },
        { title: '周末去哪儿 武当山', heat: 223000, source: 'xiaohongshu', url: '' }
      ]
    };

    return mockData[source] || [];
  }
}

export const qverisService = new QverisService();
