'use client';

import { useState, useEffect } from 'react';
import { collection, doc, getDocs, query, getDoc, where, documentId } from 'firebase/firestore';
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

                console.log(`Fetching data for ${year}/${paddedMonth}`);

                // 戦略1: まず月次レポートをチェックして、documentIdListを取得する
                try {
                    const monthlyReportRef = doc(db, 'reports', 'monthly', String(year), paddedMonth);
                    const monthlyReportDoc = await getDoc(monthlyReportRef);

                    if (monthlyReportDoc.exists()) {
                        const monthlyReport = monthlyReportDoc.data();
                        console.log(`月次レポートを取得しました: ${year}年${month}月`);

                        // documentIdListがあればそこからデータを取得
                        if (monthlyReport.documentIdList && monthlyReport.documentIdList.length > 0) {
                            console.log(`月次レポートから ${monthlyReport.documentIdList.length} 件のドキュメントIDを取得しました`);

                            // 配列が大きすぎる場合は分割して取得（Firestoreの制限による）
                            const chunkSize = 10;
                            for (let i = 0; i < monthlyReport.documentIdList.length; i += chunkSize) {
                                const chunk = monthlyReport.documentIdList.slice(i, i + chunkSize);

                                // 各IDに対応するドキュメントを取得
                                for (const docId of chunk) {
                                    try {
                                        // パスを分解してドキュメントを取得
                                        // details/年/月/term週番号/日/タイムスタンプ の形式
                                        console.log(`ドキュメント ${docId} を取得します`);

                                        const parts: string[] = docId.split('/').filter((part: string) => part !== '');

                                        if (parts.length >= 6) {
                                            const [DETAILS, docYear, docMonth, docTerm, docDay, docTimestamp] = parts;
                                            const docRef = doc(db, 'details', docYear, docMonth, docTerm, docDay, docTimestamp);
                                            const docSnap = await getDoc(docRef);

                                            console.log(`ドキュメント ${docId} を取得しました: ${docSnap.data()}`);


                                            if (docSnap.exists()) {
                                                const data = docSnap.data() as CardUsage;
                                                if (data.datetime_of_use && data.amount) {
                                                    usages.push({
                                                        ...data,
                                                        id: docSnap.id
                                                    });
                                                }
                                                console.log(`ドキュメント ${docId} を取得しました:`, data);
                                            }
                                        } else {
                                            console.warn(`Invalid document path: ${docId}`);
                                        }
                                    } catch (docErr) {
                                        console.error(`ドキュメント ${docId} の取得中にエラー:`, docErr);
                                    }
                                }
                            }

                            console.log(`月次レポートから ${usages.length} 件のカード利用データを取得しました`);
                        }
                    } else {
                        console.log(`月次レポートがありません: ${year}年${month}月`);

                        // 戦略2: 月次レポートがない場合は週次レポートを確認
                        const weeklyReportsRef = collection(db, 'reports', 'weekly', `${year}-${paddedMonth}`);
                        const weeklyReportDocs = await getDocs(weeklyReportsRef);

                        if (!weeklyReportDocs.empty) {
                            console.log(`週次レポートを ${weeklyReportDocs.size} 件取得しました`);

                            for (const weeklyDoc of weeklyReportDocs.docs) {
                                const weeklyReport = weeklyDoc.data();

                                if (weeklyReport.documentIdList && weeklyReport.documentIdList.length > 0) {
                                    console.log(`週次レポートから ${weeklyReport.documentIdList.length} 件のドキュメントIDを取得しました`);

                                    // 各IDに対応するドキュメントを取得
                                    for (const docId of weeklyReport.documentIdList) {
                                        try {
                                            // パスを分解してドキュメントを取得
                                            const parts = docId.split('/');
                                            if (parts.length >= 6) {
                                                const [, docYear, docMonth, docTerm, docDay, docTimestamp] = parts;

                                                const docRef = doc(db, 'details', docYear, docMonth, docTerm, docDay, docTimestamp);
                                                const docSnap = await getDoc(docRef);

                                                if (docSnap.exists()) {
                                                    const data = docSnap.data() as CardUsage;
                                                    if (data.datetime_of_use && data.amount) {
                                                        usages.push({
                                                            ...data,
                                                            id: docSnap.id
                                                        });
                                                    }
                                                }
                                            }
                                        } catch (docErr) {
                                            console.error(`ドキュメント ${docId} の取得中にエラー:`, docErr);
                                        }
                                    }
                                }
                            }

                            console.log(`週次レポートから ${usages.length} 件のカード利用データを取得しました`);
                        } else {
                            console.log(`週次レポートもありません: ${year}年${month}月`);

                            // 戦略3: 週次レポートもない場合は日次レポートを確認
                            const dailyReportsRef = collection(db, 'reports', 'daily', `${year}-${paddedMonth}`);
                            const dailyReportDocs = await getDocs(dailyReportsRef);

                            if (!dailyReportDocs.empty) {
                                console.log(`日次レポートを ${dailyReportDocs.size} 件取得しました`);

                                for (const dailyDoc of dailyReportDocs.docs) {
                                    const dailyReport = dailyDoc.data();

                                    if (dailyReport.documentIdList && dailyReport.documentIdList.length > 0) {
                                        console.log(`日次レポートから ${dailyReport.documentIdList.length} 件のドキュメントIDを取得しました`);

                                        // 各IDに対応するドキュメントを取得
                                        for (const docId of dailyReport.documentIdList) {
                                            try {
                                                // パスを分解してドキュメントを取得
                                                const parts = docId.split('/');
                                                if (parts.length >= 6) {
                                                    const [, docYear, docMonth, docTerm, docDay, docTimestamp] = parts;

                                                    const docRef = doc(db, 'details', docYear, docMonth, docTerm, docDay, docTimestamp);
                                                    const docSnap = await getDoc(docRef);

                                                    if (docSnap.exists()) {
                                                        const data = docSnap.data() as CardUsage;
                                                        if (data.datetime_of_use && data.amount) {
                                                            usages.push({
                                                                ...data,
                                                                id: docSnap.id
                                                            });
                                                        }
                                                    }
                                                }
                                            } catch (docErr) {
                                                console.error(`ドキュメント ${docId} の取得中にエラー:`, docErr);
                                            }
                                        }
                                    }
                                }

                                console.log(`日次レポートから ${usages.length} 件のカード利用データを取得しました`);
                            } else {
                                console.log(`日次レポートもありません: ${year}年${month}月`);
                                console.log('当該月のデータはありません');
                            }
                        }
                    }
                } catch (err) {
                    console.error('レポートデータ取得中にエラーが発生しました:', err);
                }

                console.log(`Retrieved ${usages.length} card usages for ${year}/${paddedMonth}`);

                // 重複を除去（同じIDのデータが複数回取得される可能性があるため）
                const uniqueUsages = Array.from(
                    new Map(usages.map(item => [item.id, item])).values()
                );

                // 取得したデータを日付順にソート
                const sortedUsages = uniqueUsages.sort((a, b) => {
                    return a.datetime_of_use.toDate().getTime() - b.datetime_of_use.toDate().getTime();
                });

                setCardUsages(sortedUsages);

                // カレンダー表示用のイベントデータを作成
                const calendarEvents = sortedUsages.map(usage => {
                    const date = usage.datetime_of_use.toDate();
                    
                    // 時刻を含む開始・終了時間を設定
                    const startTime = new Date(date);
                    
                    // デフォルトでは終了時間を開始時間の30分後に設定
                    // これにより日・週ビューで適切な時間枠で表示される
                    const endTime = new Date(date);
                    endTime.setMinutes(endTime.getMinutes() + 30);
                    
                    return {
                        id: usage.id || date.getTime().toString(),
                        title: `${usage.amount}円 - ${usage.where_to_use}`,
                        start: startTime,
                        end: endTime,
                        allDay: false, // 終日イベントではなく、時間指定イベントとして扱う
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