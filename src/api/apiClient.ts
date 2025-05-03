import { auth } from '@/lib/firebase/config';

/**
 * API基本URL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-wxn2tlzhia-an.a.run.app/api/v1';

/**
 * APIレスポンスの型定義
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  status: number;
  data: T | null;
  error?: string;
}

/**
 * APIクライアント
 * Firebase Authenticationのトークンを使用した認証付きリクエストを実行
 */
export class ApiClient {
  /**
   * 認証トークンを取得
   */
  private static async getAuthToken(): Promise<string | null> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('ユーザーが認証されていません');
        throw new Error('認証エラー: ログインしてください');
      }

      return await currentUser.getIdToken();
    } catch (error) {
      console.error('認証トークン取得エラー:', error);
      throw error;
    }
  }

  /**
   * GETリクエスト
   */
  public static async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `APIエラー: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`GET ${endpoint} エラー:`, error);
      throw error;
    }
  }

  /**
   * POSTリクエスト
   */
  public static async post<T = any, D = any>(endpoint: string, data: D): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `APIエラー: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`POST ${endpoint} エラー:`, error);
      throw error;
    }
  }

  /**
   * PUTリクエスト
   */
  public static async put<T = any, D = any>(endpoint: string, data: D): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `APIエラー: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`PUT ${endpoint} エラー:`, error);
      throw error;
    }
  }

  /**
   * DELETEリクエスト
   */
  public static async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `APIエラー: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`DELETE ${endpoint} エラー:`, error);
      throw error;
    }
  }
}