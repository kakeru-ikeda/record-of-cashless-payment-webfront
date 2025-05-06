import { ApiClient } from './apiClient';
import { CardUsage } from '@/types';

/**
 * カード利用情報のAPI操作を行うサービスクラス
 */
export class CardUsageApi {
  /**
   * 特定の年月のカード利用情報を取得
   * @param year 年
   * @param month 月
   */
  public static async getCardUsagesByMonth(year: number, month: number): Promise<CardUsage[]> {
    try {
      const paddedMonth = month.toString().padStart(2, '0');
      const response = await ApiClient.get<CardUsage[]>(`/card-usages?year=${year}&month=${paddedMonth}`);

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('カード利用情報の取得に失敗しました:', error);
      throw error;
    }
  }

  /**
   * 日付範囲に基づいてカード利用情報を取得
   * 複数の月にまたがる場合も対応
   * @param startDate 開始日
   * @param endDate 終了日
   */
  public static async getCardUsagesByDateRange(startDate: Date, endDate: Date): Promise<CardUsage[]> {
    try {
      console.log('日付範囲でデータ取得:', startDate.toLocaleDateString(), '〜', endDate.toLocaleDateString());
      
      // 必要なすべての年月の組み合わせを計算
      const months: { year: number, month: number }[] = [];
      
      // 開始日の年月を取得
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth() + 1;
      
      // 終了日の年月を取得
      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth() + 1;
      
      // 同じ年の場合
      if (startYear === endYear) {
        // 開始月から終了月までを追加
        for (let month = startMonth; month <= endMonth; month++) {
          months.push({ year: startYear, month });
        }
      } else {
        // 開始年の残りの月を追加
        for (let month = startMonth; month <= 12; month++) {
          months.push({ year: startYear, month });
        }
        
        // 中間の年があれば、その年の全ての月を追加
        for (let year = startYear + 1; year < endYear; year++) {
          for (let month = 1; month <= 12; month++) {
            months.push({ year, month });
          }
        }
        
        // 終了年の月を追加
        for (let month = 1; month <= endMonth; month++) {
          months.push({ year: endYear, month });
        }
      }
      
      console.log('取得する年月:', months.map(m => `${m.year}年${m.month}月`).join(', '));
      
      // 各月のデータを並行して取得
      const promises = months.map(({ year, month }) => {
        console.log(`${year}年${month}月のデータを取得`);
        return this.getCardUsagesByMonth(year, month);
      });
      
      const results = await Promise.all(promises);
      const allUsages = results.flat();
      
      console.log(`取得したデータ: 合計 ${allUsages.length}件`);
      
      return allUsages;
    } catch (error) {
      console.error('日付範囲のカード利用情報の取得に失敗しました:', error);
      throw error;
    }
  }

  /**
   * IDによりカード利用情報を取得
   * @param id カード利用情報ID
   */
  public static async getCardUsageById(id: string): Promise<CardUsage | null> {
    try {
      const response = await ApiClient.get<CardUsage>(`/card-usages/${id}`);

      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error(`ID:${id} のカード利用情報の取得に失敗しました:`, error);
      throw error;
    }
  }

  /**
   * カード利用情報を新規作成
   * @param cardUsage カード利用情報
   */
  public static async createCardUsage(cardUsage: Partial<CardUsage>): Promise<CardUsage | null> {
    try {
      const response = await ApiClient.post<CardUsage, Partial<CardUsage>>('/card-usages', cardUsage);

      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('カード利用情報の作成に失敗しました:', error);
      throw error;
    }
  }

  /**
   * カード利用情報を更新
   * @param id カード利用情報ID
   * @param cardUsage 更新するカード利用情報
   */
  public static async updateCardUsage(id: string, cardUsage: Partial<CardUsage>): Promise<CardUsage | null> {
    try {
      const response = await ApiClient.put<CardUsage, Partial<CardUsage>>(`/card-usages/${id}`, cardUsage);

      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error(`ID:${id} のカード利用情報の更新に失敗しました:`, error);
      throw error;
    }
  }

  /**
   * カード利用情報を削除（論理削除）
   * @param id カード利用情報ID
   */
  public static async deleteCardUsage(id: string): Promise<boolean> {
    try {
      const response = await ApiClient.delete(`/card-usages/${id}`);
      return response.success;
    } catch (error) {
      console.error(`ID:${id} のカード利用情報の削除に失敗しました:`, error);
      throw error;
    }
  }
}