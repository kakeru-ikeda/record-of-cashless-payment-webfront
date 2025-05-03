'use client';

import { useState, useEffect } from 'react';
import { DailyReport } from '@/types';
import { ReportsApi } from '@/api/reportsApi';

// 特定日の日次レポートを取得するフック
export const useDailyReport = (year: number, month: number, day: number, term: string) => {
    const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchDailyReport = async () => {
            try {
                setLoading(true);
                console.log(`API: 日次レポート取得 ${year}年${month}月${day}日`);

                // APIから日次レポートを取得
                const report = await ReportsApi.getDailyReport(year, month, day);
                
                if (report) {
                    setDailyReport(report);
                    console.log(`日次レポートを取得しました: ${year}年${month}月${day}日`);
                } else {
                    console.log(`日次レポートが見つかりません: ${year}年${month}月${day}日`);
                    setDailyReport(null);
                }

                setLoading(false);
            } catch (err) {
                console.error('日次レポートの取得中にエラーが発生しました:', err);
                setError(err instanceof Error ? err : new Error('日次レポート取得中に不明なエラーが発生しました'));
                setLoading(false);
            }
        };

        if (year && month && day) {
            fetchDailyReport();
        }
    }, [year, month, day, term]);

    return { dailyReport, loading, error };
};

// 月内の全日次レポートを取得するフック
export const useAllDailyReports = (year: number, month: number) => {
    const [dailyReports, setDailyReports] = useState<Record<string, DailyReport>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchAllDailyReports = async () => {
            try {
                setLoading(true);
                console.log(`API: 全日次レポート取得 ${year}年${month}月`);

                // APIから全日次レポートを取得
                const reports = await ReportsApi.getAllDailyReports(year, month);
                
                if (Object.keys(reports).length > 0) {
                    console.log(`日次レポートを${Object.keys(reports).length}件取得しました: ${year}年${month}月`);
                    setDailyReports(reports);
                } else {
                    console.log(`日次レポートが見つかりません: ${year}年${month}月`);
                    setDailyReports({});
                }

                setLoading(false);
            } catch (err) {
                console.error('日次レポートの取得中にエラーが発生しました:', err);
                setError(err instanceof Error ? err : new Error('日次レポート取得中に不明なエラーが発生しました'));
                setLoading(false);
            }
        };

        if (year && month) {
            fetchAllDailyReports();
        }
    }, [year, month]);

    return { dailyReports, loading, error };
};