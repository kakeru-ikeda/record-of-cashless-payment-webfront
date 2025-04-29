'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MonthlyReport } from '@/types';

// Firestoreから特定の年月の月次レポートを取得するカスタムフック
export const useMonthlyReport = (year: number, month: number) => {
    const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchMonthlyReport = async () => {
            try {
                setLoading(true);
                const paddedMonth = String(month).padStart(2, '0');

                // 新しいパス構造: reports/monthly/{year}/{month}
                try {
                    const monthlyReportRef = doc(db, 'reports', 'monthly', String(year), paddedMonth);
                    const reportDoc = await getDoc(monthlyReportRef);

                    if (reportDoc.exists()) {
                        setMonthlyReport(reportDoc.data() as MonthlyReport);
                        console.log(`月次レポートを取得しました: ${year}年${month}月`);
                    } else {
                        console.log(`月次レポートが見つかりません: ${year}年${month}月`);
                        setMonthlyReport(null);
                    }
                } catch (err) {
                    console.error('月次レポートの取得に失敗しました:', err);
                    throw err;
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