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
                    const detailsCollection = collection(db, 'details');
                    const yearDocRef = doc(detailsCollection, String(year));

                    // yearドキュメント -> monthコレクション
                    const monthCollection = collection(yearDocRef, paddedMonth);
                    const monthQuery = await getDocs(monthCollection);

                    // 各termドキュメントを処理
                    for (const termDoc of monthQuery.docs) {
                        console.log(`Processing term document: ${termDoc.id}`);

                        if (termDoc.id.startsWith('term')) {
                            // termドキュメント -> 日コレクション
                            const daysCollection = collection(monthCollection, termDoc.id);
                            const daysQuery = await getDocs(daysCollection);

                            console.log(`Fetching data for ${year}/${paddedMonth}`);


                            // 各日のドキュメントを処理
                            for (const dayDoc of daysQuery.docs) {
                                if (dayDoc.id !== 'reports') {
                                    // 日付ドキュメント -> カード利用情報コレクション
                                    const usageCollection = collection(daysCollection, dayDoc.id);
                                    const usagesQuery = await getDocs(usageCollection);

                                    usagesQuery.forEach(usageDoc => {
                                        if (usageDoc.id !== 'reports') {
                                            const data = usageDoc.data() as CardUsage;
                                            if (data.datetime_of_use && data.amount) {
                                                usages.push(data);
                                            }
                                        }
                                    });
                                }
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