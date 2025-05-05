/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 様々な形式のタイムスタンプをDate型に安全に変換する関数
 * FirestoreのTimestampや、JSONで変換された形式(_seconds/_nanoseconds)、
 * または文字列や数値形式の日時を処理します
 * 
 * @param timestamp - 変換するタイムスタンプ（複数の形式に対応）
 * @returns 変換されたDate型のオブジェクト、変換できない場合は現在時刻
 */
export function convertTimestampToDate(timestamp: any): Date {
    if (!timestamp) {
        // 日時情報がない場合は現在時刻をデフォルト値として使用
        console.warn('日時データがありません');
        return new Date();
    }

    try {
        if (typeof timestamp.toDate === 'function') {
            // Firestoreのタイムスタンプオブジェクトの場合
            return timestamp.toDate();
        } else if (
            typeof timestamp === 'object' &&
            timestamp !== null &&
            typeof timestamp._seconds === 'number' &&
            typeof timestamp._nanoseconds === 'number'
        ) {
            // JSON化されたFirestoreのタイムスタンプの場合
            return new Date(timestamp._seconds * 1000);
        } else if (timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
            // 別の形式のタイムスタンプオブジェクトの場合
            return new Date(timestamp.seconds * 1000);
        } else if (typeof timestamp === 'string') {
            // ISO文字列の場合
            return new Date(timestamp);
        } else if (typeof timestamp === 'number' || !isNaN(Number(timestamp))) {
            // 数値またはnumber型に変換可能な場合はミリ秒として処理
            return new Date(Number(timestamp));
        } else {
            // その他の場合は現在時刻をデフォルト値として使用
            console.warn('不明な日時形式です:', timestamp);
            return new Date();
        }
    } catch (error) {
        console.error('日時の変換に失敗しました:', error);
        return new Date();
    }
}

/**
 * 日付をYYYY年MM月DD日形式で表示
 * @param date 日付
 * @returns フォーマットされた文字列
 */
export function formatDate(date: Date): string {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/**
 * 日付をYYYY年MM月DD日(曜日)形式で表示
 * @param date 日付
 * @returns フォーマットされた文字列
 */
export function formatSimpleDate(date: Date): string {
    const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${weekDays[date.getDay()]})`;
}

/**
 * 時刻をHH:MM形式で表示
 * @param date 日付
 * @returns フォーマットされた時刻文字列
 */
export function formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}