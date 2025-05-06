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

    // カレンダーイベントを作成するヘルパー関数
    const createCalendarEvent = (usage: CardUsage): CalendarEvent => {
        const date: Date = convertTimestampToDate(usage.datetime_of_use);

        // 時刻を含む開始時間を設定
        const startTime = new Date(date);

        // 終了時間を計算（開始時間の15分後に設定）
        const endTime = new Date(date);
        endTime.setMinutes(endTime.getMinutes() + 15);

        // 終了時間が翌日になるかチェック
        // 日が変わるか、または23:45以降の場合は、終了時間を23:59:59に設定
        if (endTime.getDate() !== startTime.getDate() || startTime.getHours() === 23 && startTime.getMinutes() >= 45) {
            endTime.setHours(23, 59, 59, 999);
            endTime.setDate(startTime.getDate());
            endTime.setMonth(startTime.getMonth());
            endTime.setFullYear(startTime.getFullYear());
        }

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
            isActive: usage.is_active !== undefined ? usage.is_active : true
        };
    };

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
            const calendarEvents = usages.map(createCalendarEvent);

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
                const calendarEvents = usages.map(createCalendarEvent);

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