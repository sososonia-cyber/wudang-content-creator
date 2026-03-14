import axios from 'axios';
import { config } from '../config/env';
import { logger } from '../utils/logger';

interface TikTokTrend {
  title: string;
  heat: number;
  videoUrl?: string;
  coverUrl?: string;
}

export class TikAPIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.apis.tikapi || '';
    this.baseUrl = 'https://api.tikapi.io/v1';
  }

  // 获取TikTok热门内容
  async getTrendingVideos(): Promise<TikTokTrend[]> {
    try {
      if (!this.apiKey) {
        logger.warn('TikAPI Key未配置，使用模拟数据');
        return this.getMockTrends();
      }

      const response = await axios.get(
        `${this.baseUrl}/trending`,
        {
          headers: {
            'X-API-Key': this.apiKey
          },
          params: {
            region: 'US',
            limit: 20
          },
          timeout: 15000
        }
      );

      const videos = response.data?.data || [];

      return videos.map((video: any) => ({
        title: video.desc || video.title || 'TikTok Trending',
        heat: video.stats?.playCount || video.stats?.diggCount || 0,
        videoUrl: video.video?.url || video.share_url || '',
        coverUrl: video.cover?.url || video.video?.dynamicCover || ''
      })).filter((t: TikTokTrend) => t.heat > 10000);

    } catch (error: any) {
      logger.error('获取TikTok热门内容失败:', error.message);
      return this.getMockTrends();
    }
  }

  // 搜索TikTok内容
  async searchVideos(keyword: string): Promise<TikTokTrend[]> {
    try {
      if (!this.apiKey) {
        return this.getMockTrends().filter(t => 
          t.title.toLowerCase().includes(keyword.toLowerCase())
        );
      }

      const response = await axios.get(
        `${this.baseUrl}/search`,
        {
          headers: {
            'X-API-Key': this.apiKey
          },
          params: {
            keyword,
            limit: 20
          },
          timeout: 15000
        }
      );

      const videos = response.data?.data || [];

      return videos.map((video: any) => ({
        title: video.desc || video.title || '',
        heat: video.stats?.playCount || 0,
        videoUrl: video.video?.url || '',
        coverUrl: video.cover?.url || ''
      }));

    } catch (error: any) {
      logger.error('搜索TikTok内容失败:', error.message);
      return this.getMockTrends().filter(t => 
        t.title.toLowerCase().includes(keyword.toLowerCase())
      );
    }
  }

  // 获取KungFu相关内容
  async getKungFuContent(): Promise<TikTokTrend[]> {
    const keywords = ['kungfu', 'wushu', 'martialarts', 'taichi', 'shaolin'];
    const allResults: TikTokTrend[] = [];

    for (const keyword of keywords) {
      const results = await this.searchVideos(keyword);
      allResults.push(...results);
    }

    // 去重并排序
    const unique = this.deduplicateTrends(allResults);
    return unique.sort((a, b) => b.heat - a.heat).slice(0, 20);
  }

  // 去重
  private deduplicateTrends(trends: TikTokTrend[]): TikTokTrend[] {
    const seen = new Set<string>();
    return trends.filter(trend => {
      const key = trend.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // 模拟数据
  private getMockTrends(): TikTokTrend[] {
    return [
      { title: 'Kung Fu Master Shows Amazing Skills', heat: 1200000, videoUrl: '', coverUrl: '' },
      { title: 'Wushu Training in the Mountains', heat: 890000, videoUrl: '', coverUrl: '' },
      { title: 'Tai Chi Morning Routine', heat: 760000, videoUrl: '', coverUrl: '' },
      { title: 'Chinese Martial Arts Heritage', heat: 650000, videoUrl: '', coverUrl: '' },
      { title: 'Meditation in Wudang Mountain', heat: 540000, videoUrl: '', coverUrl: '' },
      { title: 'Traditional Daoist Practices', heat: 430000, videoUrl: '', coverUrl: '' },
      { title: 'Shaolin vs Wudang Styles', heat: 380000, videoUrl: '', coverUrl: '' },
      { title: 'Learning Tai Chi from Master', heat: 320000, videoUrl: '', coverUrl: '' }
    ];
  }
}

export const tikapiService = new TikAPIService();
