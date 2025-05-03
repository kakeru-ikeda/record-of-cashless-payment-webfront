'use client';

import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { CardUsage, CalendarEvent } from '@/types';
import { CardUsageApi } from '@/api/cardUsageApi';

// APIからカード利用情報を取得するカスタムフック
export const useCardUsages = (year: number, month: number) => {
    const [cardUsages, setCardUsages] = useState<CardUsage[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchCardUsages = async () => {
            try {
                setLoading(true);
                console.log(`API: データ取得 ${year}年${month}月`);

                // APIからカード利用情報を取得
                const usages = await CardUsageApi.getCardUsagesByMonth(year, month);
                console.log(`取得したカード利用情報: ${usages.length}件`);
                
                setCardUsages(usages);

                // カレンダー表示用のイベントデータを作成
                const calendarEvents = usages.map(usage => {
                    // datetime_of_useがTimestampオブジェクト、日付文字列、またはタイムスタンプオブジェクトの場合に対応
                    let date: Date;
                    
                    if (usage.datetime_of_use) {
                        if (typeof usage.datetime_of_use.toDate === 'function') {
                            // Firestoreのタイムスタンプオブジェクトの場合
                            date = usage.datetime_of_use.toDate();
                        } else if (usage.datetime_of_use._seconds !== undefined && usage.datetime_of_use._nanoseconds !== undefined) {
                            // JSON形式のタイムスタンプオブジェクトの場合
                            date = new Date(usage.datetime_of_use._seconds * 1000);
                        } else if (usage.datetime_of_use.seconds !== undefined && usage.datetime_of_use.nanoseconds !== undefined) {
                            // 別の形式のタイムスタンプオブジェクトの場合
                            date = new Date(usage.datetime_of_use.seconds * 1000);
                        } else if (typeof usage.datetime_of_use === 'string') {
                            // ISO文字列の場合
                            date = new Date(usage.datetime_of_use);
                        } else {
                            // その他の場合は数値としてミリ秒で処理
                            date = new Date(Number(usage.datetime_of_use));
                        }
                    } else {
                        // 日時情報がない場合は現在時刻をデフォルト値として使用
                        date = new Date();
                        console.warn('利用情報に日時データがありません:', usage);
                    }

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