'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { DailyReport } from '@/types';

// 特定日の日次レポートを取得するフック
export const useDailyReport = (year: number, month: number, day: number, term: string) => {
    const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchDailyReport = async () => {
            try {
                setLoading(true);
                const paddedMonth = String(month).padStart(2, '0');
                const paddedDay = String(day).padStart(2, '0');

                // 新しいパス構造: reports/daily/{year}-{month}/{day}
                try {
                    const dailyReportRef = doc(db, 'reports', 'daily', `${year}-${paddedMonth}`, paddedDay);
                    const reportDoc = await getDoc(dailyReportRef);

                    if (reportDoc.exists()) {
                        setDailyReport(reportDoc.data() as DailyReport);
                        console.log(`日次レポートを取得しました: ${year}年${month}月${day}日`);
                    } else {
                        console.log(`日次レポートが見つかりません: ${year}年${month}月${day}日`);
                        setDailyReport(null);
                    }
                } catch (err) {
                    console.error('日次レポートの取得に失敗しました:', err);
                    throw err;
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
                const paddedMonth = String(month).padStart(2, '0');
                const reports: Record<string, DailyReport> = {};

                // 新しいパス構造: reports/daily/{year}-{month}
                try {
                    const dailyReportsRef = collection(db, 'reports', 'daily', `${year}-${paddedMonth}`);
                    const reportDocs = await getDocs(dailyReportsRef);

                    reportDocs.forEach(doc => {
                        if (/^\d+$/.test(doc.id) && doc.id.length <= 2) {
                            reports[doc.id] = doc.data() as DailyReport;
                        }
                    });

                    console.log(`日次レポートを${Object.keys(reports).length}件取得しました: ${year}年${month}月`);
                    setDailyReports(reports);
                } catch (err) {
                    console.error('日次レポートの取得に失敗しました:', err);
                    throw err;
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