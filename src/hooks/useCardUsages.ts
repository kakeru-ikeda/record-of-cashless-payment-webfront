'use client';

import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CardUsage, CalendarEvent } from '@/types';

// Firestoreから特定の年月のカード利用情報を取得するカスタムフック
export const useCardUsages = (year: number, month: number) => {
  const [cardUsages, setCardUsages] = useState<CardUsage[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCardUsages = async () => {
      try {
        setLoading(true);
        const usages: CardUsage[] = [];
        const paddedMonth = String(month).padStart(2, '0');
        
        try {
          console.log(`Fetching data for ${year}/${paddedMonth}`);
          
          // detailsコレクション -> yearドキュメント
          const yearDocRef = doc(db, 'details', String(year));
          
          // yearドキュメント -> monthコレクション
          const monthCollection = collection(yearDocRef, paddedMonth);
          const monthQuery = await getDocs(monthCollection);
          
          // 月コレクション内の各ドキュメントを処理
          for (const monthDoc of monthQuery.docs) {
            // 日付のドキュメントIDは純粋な数字で（例: "20", "21", "22"...）
            if (/^\d+$/.test(monthDoc.id) && monthDoc.id.length <= 2) {
              // 日付のドキュメントを処理
              try {
                // 日付IDコレクション内のドキュメントを取得
                const dayCollection = collection(monthCollection, monthDoc.id);
                const dayDocs = await getDocs(dayCollection);
                
                dayDocs.forEach(dayDoc => {
                  // reportsドキュメント以外を処理
                  if (dayDoc.id !== 'reports') {
                    const data = dayDoc.data() as CardUsage;
                    if (data.datetime_of_use && data.amount) {
                      usages.push(data);
                    }
                  }
                });
              } catch (dayErr) {
                console.error(`日付 ${monthDoc.id} の処理中にエラーが発生しました:`, dayErr);
              }
            } else if (monthDoc.id !== 'reports' && !monthDoc.id.startsWith('term')) {
              // タイムスタンプのドキュメントIDの場合（13桁の数字）
              try {
                if (/^\d+$/.test(monthDoc.id) && monthDoc.id.length > 5) {
                  const data = monthDoc.data() as CardUsage;
                  if (data.datetime_of_use && data.amount) {
                    usages.push(data);
                  }
                }
              } catch (usageErr) {
                console.error(`Usage document ${monthDoc.id} の処理中にエラーが発生しました:`, usageErr);
              }
            }
          }
          
          console.log(`Retrieved ${usages.length} card usages for ${year}/${paddedMonth}`);
        } catch (err) {
          console.error('データ取得中にエラーが発生しました:', err);
          throw err;
        }
        
        // 取得したデータを日付順にソート
        const sortedUsages = usages.sort((a, b) => {
          return a.datetime_of_use.toDate().getTime() - b.datetime_of_use.toDate().getTime();
        });
        
        setCardUsages(sortedUsages);
        
        // カレンダー表示用のイベントデータを作成
        const calendarEvents = sortedUsages.map(usage => {
          const date = usage.datetime_of_use.toDate();
          return {
            id: date.getTime().toString(),
            title: `${usage.amount}円 - ${usage.where_to_use}`,
            start: date,
            end: date,
            allDay: true,
            amount: usage.amount,
            where: usage.where_to_use,
            cardName: usage.card_name
          };
        });
        
        setEvents(calendarEvents);
        setLoading(false);
      } catch (err) {
        console.error('カード利用情報の取得中にエラーが発生しました:', err);
        setError(err instanceof Error ? err : new Error('データ取得中に不明なエラーが発生しました'));
        setLoading(false);
      }
    };

    fetchCardUsages();
  }, [year, month]);

  return { cardUsages, events, loading, error };
};