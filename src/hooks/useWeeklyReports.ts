'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { WeeklyReport } from '@/types';

// 特定の週次レポートを取得するフック
export const useWeeklyReport = (year: number, month: number, term: string) => {
    const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchWeeklyReport = async () => {
            try {
                setLoading(true);
                const paddedMonth = String(month).padStart(2, '0');

                // 新しいパス構造: reports/weekly/{year}-{month}/{term}
                try {
                    const weeklyReportRef = doc(db, 'reports', 'weekly', `${year}-${paddedMonth}`, term);
                    const reportDoc = await getDoc(weeklyReportRef);

                    if (reportDoc.exists()) {
                        setWeeklyReport(reportDoc.data() as WeeklyReport);
                        console.log(`週次レポートを取得しました: ${year}年${month}月 ${term}`);
                    } else {
                        console.log(`週次レポートが見つかりません: ${year}年${month}月 ${term}`);
                        setWeeklyReport(null);
                    }
                } catch (err) {
                    console.error('週次レポートの取得に失敗しました:', err);
                    throw err;
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
                const paddedMonth = String(month).padStart(2, '0');
                const reports: Record<string, WeeklyReport> = {};

                // 新しいパス構造: reports/weekly/{year}-{month}
                try {
                    const weeklyReportsRef = collection(db, 'reports', 'weekly', `${year}-${paddedMonth}`);
                    const reportDocs = await getDocs(weeklyReportsRef);

                    reportDocs.forEach(doc => {
                        if (doc.id.startsWith('term')) {
                            reports[doc.id] = doc.data() as WeeklyReport;
                        }
                    });

                    console.log(`週次レポートを${Object.keys(reports).length}件取得しました: ${year}年${month}月`);
                    setWeeklyReports(reports);
                } catch (err) {
                    console.error('週次レポートの取得に失敗しました:', err);
                    throw err;
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