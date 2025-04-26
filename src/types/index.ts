import { Timestamp } from 'firebase/firestore';

// カード利用情報の型定義
export interface CardUsage {
  card_name: string;
  datetime_of_use: Timestamp;
  amount: number;
  where_to_use: string;
  created_at: Timestamp;
}

// デイリーレポートの型定義
export interface DailyReport {
  totalAmount: number;
  totalCount: number;
  date: Timestamp;
  lastUpdated: Timestamp;
  lastUpdatedBy: string;
  documentIdList: string[];
  hasNotified: boolean;
}

// ウィークリーレポートの型定義
export interface WeeklyReport {
  totalAmount: number;
  totalCount: number;
  lastUpdated: Timestamp;
  lastUpdatedBy: string;
  documentIdList: string[];
  termStartDate: Timestamp;
  termEndDate: Timestamp;
  hasNotifiedLevel1: boolean;
  hasNotifiedLevel2: boolean;
  hasNotifiedLevel3: boolean;
  hasReportSent: boolean;
}

// マンスリーレポートの型定義
export interface MonthlyReport {
  totalAmount: number;
  totalCount: number;
  lastUpdated: Timestamp;
  lastUpdatedBy: string;
  documentIdList: string[];
  monthStartDate: Timestamp;
  monthEndDate: Timestamp;
  hasReportSent: boolean;
}

// カレンダーイベントの型定義
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  amount: number;
  where: string;
  cardName: string;
}