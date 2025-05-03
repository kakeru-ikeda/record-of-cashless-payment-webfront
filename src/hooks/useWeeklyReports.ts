'use client';

import { useState, useEffect } from 'react';
import { WeeklyReport } from '@/types';
import { ReportsApi } from '@/api/reportsApi';

// 特定の週次レポートを取得するフック
export const useWeeklyReport = (year: number, month: number, term: string) => {
    const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchWeeklyReport = async () => {
            try {
                setLoading(true);
                console.log(`API: 週次レポート取得 ${year}年${month}月 ${term}`);

                // APIから週次レポートを取得
                const report = await ReportsApi.getWeeklyReport(year, month, term);
                
                if (report) {
                    setWeeklyReport(report);
                    console.log(`週次レポートを取得しました: ${year}年${month}月 ${term}`);
                } else {
                    console.log(`週次レポートが見つかりません: ${year}年${month}月 ${term}`);
                    setWeeklyReport(null);
                }
                
                setLoading(false);
            } catch (err) {
                console.error('週次レポートの取得中にエラーが発生しました:', err);
                setError(err instanceof Error ? err : new Error('週次レポート取得中に不明なエラーが発生しました'));
                setLoading(false);
            }
        };

        if (year && month && term) {
            fetchWeeklyReport();
        }
    }, [year, month, term]);

    return { weeklyReport, loading, error };
};

// 月内の全週次レポートを取得するフック
export const useAllWeeklyReports = (year: number, month: number) => {
    const [weeklyReports, setWeeklyReports] = useState<Record<string, WeeklyReport>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchAllWeeklyReports = async () => {
            try {
                setLoading(true);
                console.log(`API: 全週次レポート取得 ${year}年${month}月`);

                // APIから全週次レポートを取得
                const reports = await ReportsApi.getAllWeeklyReports(year, month);
                
                if (Object.keys(reports).length > 0) {
                    console.log(`週次レポートを${Object.keys(reports).length}件取得しました: ${year}年${month}月`);
                    setWeeklyReports(reports);
                } else {
                    console.log(`週次レポートが見つかりません: ${year}年${month}月`);
                    setWeeklyReports({});
                }
                
                setLoading(false);
            } catch (err) {
                console.error('週次レポートの取得中にエラーが発生しました:', err);
                setError(err instanceof Error ? err : new Error('週次レポート取得中に不明なエラーが発生しました'));
                setLoading(false);
            }
        };

        if (year && month) {
            fetchAllWeeklyReports();
        }
    }, [year, month]);

    return { weeklyReports, loading, error };
};