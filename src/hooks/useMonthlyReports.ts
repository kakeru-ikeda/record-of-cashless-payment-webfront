'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MonthlyReport } from '@/types';

// 年月から月次レポートのパスを取得する関数
const getMonthlyReportPath = (year: number, month: number) => {
  const yearDoc = `details/${year}`;
  const monthPath = String(month).padStart(2, '0');
  return `${yearDoc}/${monthPath}/reports`;
};

// Firestoreから特定の年月の月次レポートを取得するカスタムフック
export const useMonthlyReport = (year: number, month: number) => {
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMonthlyReport = async () => {
      try {
        setLoading(true);
        
        // 正しいコレクション・ドキュメント構造でパスを構築
        const yearDocRef = doc(db, `details/${year}`);
        const monthPadded = String(month).padStart(2, '0');
        const reportsDocRef = doc(collection(yearDocRef, monthPadded), 'reports');
        
        try {
          const reportDoc = await getDoc(reportsDocRef);
          
          if (reportDoc.exists()) {
            setMonthlyReport(reportDoc.data() as MonthlyReport);
          } else {
            console.log(`月次レポートが見つかりません: ${year}年${month}月`);
            setMonthlyReport(null);
          }
        } catch (fetchErr) {
          console.warn('最初のパスでの取得に失敗しました、代替パスを試みます');
          
          // 代替パターン試行
          try {
            const legacyPath = getMonthlyReportPath(year, month);
            const legacyReportDoc = await getDoc(doc(db, legacyPath));
            
            if (legacyReportDoc.exists()) {
              setMonthlyReport(legacyReportDoc.data() as MonthlyReport);
            } else {
              setMonthlyReport(null);
            }
          } catch (legacyErr) {
            console.error('代替パスでの取得にも失敗しました', legacyErr);
            throw legacyErr;
          }
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