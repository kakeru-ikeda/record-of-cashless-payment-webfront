'use client';

import { useState, useEffect, useCallback } from 'react';
import { CardUsage, CalendarEvent } from '@/types';
import { CardUsageApi } from '@/api/cardUsageApi';
import { convertTimestampToDate } from '@/utils/dateUtils';

// APIからカード利用情報を取得するカスタムフック
export const useCardUsages = (year: number, month: number) => {
    const [cardUsages, setCardUsages] = useState<CardUsage[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // データを再取得するための関数
    const refreshData = useCallback(async () => {
        try {
            setLoading(true);
            console.log(`API: データ更新 ${year}年${month}月`);

            // APIからカード利用情報を再取得
            const usages = await CardUsageApi.getCardUsagesByMonth(year, month);
            console.log(`取得したカード利用情報: ${usages.length}件`);

            setCardUsages(usages);

            // カレンダー表示用のイベントデータを作成
            const calendarEvents = usages.map(usage => {
                const date: Date = convertTimestampToDate(usage.datetime_of_use);

                // 時刻を含む開始・終了時間を設定
                const startTime = new Date(date);

                // デフォルトでは終了時間を開始時間の30分後に設定
                const endTime = new Date(date);
                endTime.setMinutes(endTime.getMinutes() + 30);

                return {
                    id: usage.id || date.getTime().toString(),
                    title: `${usage.amount}円 - ${usage.where_to_use}`,
                    start: startTime,
                    end: endTime,
                    allDay: false,
                    amount: usage.amount,
                    where: usage.where_to_use,
                    cardName: usage.card_name,
                    memo: usage.memo || '',
                    isActive: usage.is_active !== undefined ? usage.is_active : true // デフォルトはtrue
                };
            });

            setEvents(calendarEvents);
            setLoading(false);

        } catch (err) {
            console.error('カード利用情報の更新中にエラーが発生しました:', err);
            setError(err instanceof Error ? err : new Error('データ更新中に不明なエラーが発生しました'));
            setLoading(false);
        }
    }, [year, month]);

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
                    const date: Date = convertTimestampToDate(usage.datetime_of_use);

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
                        cardName: usage.card_name,
                        memo: usage.memo || '', // メモ情報を追加
                        isActive: usage.is_active !== undefined ? usage.is_active : true // デフォルトはtrue
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

    return { cardUsages, events, loading, error, refreshData };
};