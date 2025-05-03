'use client';

import { useState, useEffect } from 'react';
import { MonthlyReport } from '@/types';
import { ReportsApi } from '@/api/reportsApi';

// APIから特定の年月の月次レポートを取得するカスタムフック
export const useMonthlyReport = (year: number, month: number) => {
    const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchMonthlyReport = async () => {
            try {
                setLoading(true);
                console.log(`API: 月次レポート取得 ${year}年${month}月`);
                
                // APIから月次レポートを取得
                const report = await ReportsApi.getMonthlyReport(year, month);
                
                if (report) {
                    setMonthlyReport(report);
                    console.log(`月次レポートを取得しました: ${year}年${month}月`);
                } else {
                    console.log(`月次レポートが見つかりません: ${year}年${month}月`);
                    setMonthlyReport(null);
                }
                
                setLoading(false);
            } catch (err) {
                console.error('月次レポートの取得中にエラーが発生しました:', err);
                setError(err instanceof Error ? err : new Error('月次レポート取得中に不明なエラーが発生しました'));
                setLoading(false);
            }
        };

        fetchMonthlyReport();
    }, [year, month]);

    return { monthlyReport, loading, error };
};