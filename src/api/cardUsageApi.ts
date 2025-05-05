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