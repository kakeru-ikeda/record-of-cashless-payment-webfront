import { ApiClient } from './apiClient';
import { DailyReport, WeeklyReport, MonthlyReport } from '@/types';

/**
 * レポート関連のAPI操作を行うサービスクラス
 */
export class ReportsApi {
  /**
   * 特定の年月日の日次レポートを取得
   * @param year 年
   * @param month 月
   * @param day 日
   */
  public static async getDailyReport(year: number, month: number, day: number): Promise<DailyReport | null> {
    try {
      const paddedMonth = month.toString().padStart(2, '0');
      const paddedDay = day.toString().padStart(2, '0');
      const response = await ApiClient.get<DailyReport>(`/reports/daily/${year}/${paddedMonth}/${paddedDay}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error(`日次レポートの取得に失敗しました: ${year}年${month}月${day}日`, error);
      throw error;
    }
  }

  /**
   * 月内の全日次レポートを取得
   * @param year 年
   * @param month 月
   */
  public static async getAllDailyReports(year: number, month: number): Promise<Record<string, DailyReport>> {
    try {
      const paddedMonth = month.toString().padStart(2, '0');
      const response = await ApiClient.get<Record<string, DailyReport>>(`/reports/daily/${year}/${paddedMonth}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      return {};
    } catch (error) {
      console.error(`月次の日次レポート取得に失敗しました: ${year}年${month}月`, error);
      throw error;
    }
  }

  /**
   * 特定の週次レポートを取得
   * @param year 年
   * @param month 月
   * @param term 期間（例: 'term1'）
   */
  public static async getWeeklyReport(year: number, month: number, term: string): Promise<WeeklyReport | null> {
    try {
      const paddedMonth = month.toString().padStart(2, '0');
      const response = await ApiClient.get<WeeklyReport>(`/reports/weekly/${year}/${paddedMonth}/${term}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error(`週次レポートの取得に失敗しました: ${year}年${month}月${term}`, error);
      throw error;
    }
  }

  /**
   * 月内の全週次レポートを取得
   * @param year 年
   * @param month 月
   */
  public static async getAllWeeklyReports(year: number, month: number): Promise<Record<string, WeeklyReport>> {
    try {
      const paddedMonth = month.toString().padStart(2, '0');
      const response = await ApiClient.get<Record<string, WeeklyReport>>(`/reports/weekly/${year}/${paddedMonth}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      return {};
    } catch (error) {
      console.error(`月次の週次レポート取得に失敗しました: ${year}年${month}月`, error);
      throw error;
    }
  }

  /**
   * 月次レポートを取得
   * @param year 年
   * @param month 月
   */
  public static async getMonthlyReport(year: number, month: number): Promise<MonthlyReport | null> {
    try {
      const paddedMonth = month.toString().padStart(2, '0');
      const response = await ApiClient.get<MonthlyReport>(`/reports/monthly/${year}/${paddedMonth}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error(`月次レポートの取得に失敗しました: ${year}年${month}月`, error);
      throw error;
    }
  }
}