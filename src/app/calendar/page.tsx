'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    ListItem,
    ListItemText,
    Divider,
    List,
    Card,
    CardContent,
    Chip
} from '@mui/material';
import {
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ja';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar-responsive.css'; // カスタムレスポンシブスタイル
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useCardUsages } from '@/hooks/useCardUsages';
import { CalendarEvent } from '@/types';

// カレンダーの日本語化
moment.locale('ja');
const localizer = momentLocalizer(moment);

export default function CalendarPage() {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState<Date>(today);
    const [year, setYear] = useState<number>(today.getFullYear());
    const [month, setMonth] = useState<number>(today.getMonth() + 1);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [view, setView] = useState<View>('month');

    // カレンダーの日付範囲に基づいてデータを取得
    const { events, cardUsages, loading, error } = useCardUsages(year, month);

    // ビュー切替時に現在の日付に移動
    useEffect(() => {
        updateDateByView(currentDate);
    }, [view, currentDate]);

    // currentDateが変更された時にyearとmonthも更新
    useEffect(() => {
        setYear(currentDate.getFullYear());
        setMonth(currentDate.getMonth() + 1);
    }, [currentDate]);

    // 月次集計データ
    const monthSummary = useMemo(() => {
        const total = cardUsages.reduce((sum, usage) => sum + usage.amount, 0);
        const count = cardUsages.length;
        const average = count > 0 ? Math.round(total / count) : 0;

        return {
            total,
            count,
            average
        };
    }, [cardUsages]);

    // 日付別集計データ
    const dailySummary = useMemo(() => {
        const summary = cardUsages.reduce((acc, usage) => {
            // datetime_of_useの型に応じて適切に日付を抽出
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

            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            if (!acc[dateKey]) {
                acc[dateKey] = {
                    count: 0,
                    total: 0,
                    date: new Date(date.getFullYear(), date.getMonth(), date.getDate())
                };
            }

            acc[dateKey].count += 1;
            acc[dateKey].total += usage.amount;

            return acc;
        }, {} as Record<string, { count: number; total: number; date: Date }>);

        // 日付でソートした配列に変換
        return Object.values(summary).sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [cardUsages]);

    // 指定された日付に基づいてカレンダーの表示を更新
    const updateDateByView = (date: Date) => {
        setYear(date.getFullYear());
        setMonth(date.getMonth() + 1);
    };

    // タイトル表示用のフォーマット
    const formatTitleDate = () => {
        const date = currentDate;
        switch (view) {
            case 'month':
                return `${date.getFullYear()}年${date.getMonth() + 1}月`;
            case 'week':
                const startOfWeek = new Date(date);
                startOfWeek.setDate(date.getDate() - date.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
                    return `${startOfWeek.getFullYear()}年${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日〜${endOfWeek.getDate()}日`;
                } else if (startOfWeek.getFullYear() === endOfWeek.getFullYear()) {
                    return `${startOfWeek.getFullYear()}年${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日〜${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`;
                } else {
                    return `${startOfWeek.getFullYear()}年${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日〜${endOfWeek.getFullYear()}年${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`;
                }
            case 'day':
                return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
            default:
                return `${date.getFullYear()}年${date.getMonth() + 1}月`;
        }
    };

    // 日付のフォーマット
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short',
        }).format(date);
    };

    // 時刻のみのフォーマット
    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // イベントクリック時のハンドラー
    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setDialogOpen(true);
    };

    // ダイアログを閉じる
    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    // カレンダーのイベントのスタイル
    const eventStyleGetter = (event: CalendarEvent) => {
        const amount = event.amount;
        let backgroundColor = '#3174ad';

        if (amount < 1000) {
            backgroundColor = '#4caf50';
        } else if (amount < 3000) {
            backgroundColor = '#2196f3';
        } else if (amount < 10000) {
            backgroundColor = '#ff9800';
        } else {
            backgroundColor = '#f44336';
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.9,
                color: 'white',
                border: 'none',
                display: 'block'
            }
        };
    };

    // ビューに応じてイベント表示を調整するためのカスタムコンポーネント
    const EventComponent = ({ event }: { event: CalendarEvent }) => {
        if (view === 'month') {
            // スマートフォン表示の場合はより簡潔な表示にする
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

            if (isMobile) {
                // モバイル向けにより簡潔な表示
                return (
                    <div style={{
                        fontSize: '0.75rem',
                        padding: '1px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        ¥{event.amount.toLocaleString()}
                    </div>
                );
            }

            // PC向け表示（元のまま）
            return (
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    ¥{event.amount.toLocaleString()} - {event.where}
                </div>
            );
        }

        // 週表示・日表示の場合は利用店舗名を主に表示
        return (
            <div style={{ padding: '0 4px' }}>
                <div style={{ fontWeight: '0.85em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    ¥{event.amount.toLocaleString()} - {event.where}
                </div>
            </div>
        );
    };

    // ウィンドウサイズの変更を検知して再レンダリング
    useEffect(() => {
        const handleResize = () => {
            // 強制的に再レンダリングを行う
            setView(currentView => currentView);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ビューに応じてイベントの表示形式を変更
    const components = {
        event: EventComponent,
    };

    return (
        <ProtectedRoute>
            <MainLayout>
                <Box sx={{ flexGrow: 1 }}>
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Grid size={4}>
                            <Typography variant="h4" component="h1">
                                {formatTitleDate()}
                            </Typography>
                        </Grid>
                        <Grid size="grow" />
                    </Grid>
                    <Grid container spacing={2} size={4} sx={{ mb: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            合計: ¥{monthSummary.total.toLocaleString()} ({monthSummary.count}件)
                        </Typography>
                    </Grid>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            データの読み込み中にエラーが発生しました
                        </Alert>
                    )}

                    <Grid container spacing={3}>
                        {/* カレンダー */}
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Paper
                                elevation={2}
                                sx={{
                                    p: 2,
                                    height: 'calc(100vh - 200px)',
                                    minHeight: '600px',
                                    position: 'relative'
                                }}
                            >
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    <Calendar
                                        localizer={localizer}
                                        events={events}
                                        startAccessor="start"
                                        endAccessor="end"
                                        titleAccessor={(event) => `¥${event.amount.toLocaleString()} - ${event.where}`} // タイトルとして店舗名を使用
                                        style={{ height: '100%' }}
                                        views={['month', 'week', 'day']}
                                        view={view}
                                        onView={setView}
                                        date={currentDate}
                                        onNavigate={(date) => setCurrentDate(date)}
                                        onSelectEvent={(event) => handleEventClick(event as CalendarEvent)}
                                        eventPropGetter={eventStyleGetter}
                                        components={components}
                                        // フォーマット設定：時間表示のカスタマイズ
                                        formats={{
                                            // 週・日表示での時間表示を無効化（店舗名のみ表示）
                                            eventTimeRangeFormat: () => '',
                                            eventTimeRangeStartFormat: () => '',
                                            eventTimeRangeEndFormat: () => '',
                                            // その他の標準フォーマット
                                            dayHeaderFormat: (date) =>
                                                localizer.format(date, 'dddd MMM DD'),
                                            dayRangeHeaderFormat: ({ start, end }) =>
                                                `${localizer.format(start, 'MMM DD')} – ${localizer.format(end, 'MMM DD')}`,
                                        }}
                                        // 月表示では終日イベントとして扱う
                                        dayPropGetter={(date) => {
                                            const today = new Date();
                                            return {
                                                className: date.getDate() === today.getDate() &&
                                                    date.getMonth() === today.getMonth() &&
                                                    date.getFullYear() === today.getFullYear()
                                                    ? 'rbc-today'
                                                    : undefined,
                                                style: {
                                                    backgroundColor: undefined
                                                }
                                            };
                                        }}
                                        // 月表示では終日イベントとして扱い、週・日表示では時刻を考慮
                                        defaultView={view}
                                        popup={view === 'month'}
                                        showMultiDayTimes={view !== 'month'}
                                        step={30}
                                        timeslots={2}
                                        min={new Date(0, 0, 0, 0, 0)} // 0:00 AM
                                        max={new Date(0, 0, 0, 23, 59)} // 11:59 PM
                                        messages={{
                                            today: '今日',
                                            previous: '前へ',
                                            next: '次へ',
                                            month: '月',
                                            week: '週',
                                            day: '日',
                                            agenda: '予定リスト',
                                            date: '日付',
                                            time: '時間',
                                            event: 'イベント',
                                            allDay: '終日',
                                            noEventsInRange: 'この期間の利用データはありません',
                                        }}
                                    />
                                )}
                            </Paper>
                        </Grid>

                        {/* 日別集計 */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper elevation={2} sx={{ p: 2, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
                                <Typography variant="h6" gutterBottom>
                                    日別利用金額
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : dailySummary.length > 0 ? (
                                    <List dense>
                                        {dailySummary.map((day, index) => (
                                            <React.Fragment key={index}>
                                                <ListItem>
                                                    <ListItemText
                                                        primary={formatDate(day.date)}
                                                        secondary={`${day.count}件の利用`}
                                                    />
                                                    <Typography variant="body1" color={day.total > 5000 ? "error" : "primary"} fontWeight="bold">
                                                        ¥{day.total.toLocaleString()}
                                                    </Typography>
                                                </ListItem>
                                                {index < dailySummary.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                        データがありません
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* 詳細ダイアログ */}
                    <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                        <DialogTitle>
                            利用詳細
                        </DialogTitle>
                        <DialogContent>
                            {selectedEvent && (
                                <Card variant="outlined" sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" color="text.secondary">
                                            利用日時
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="body1" gutterBottom>
                                                {formatDate(selectedEvent.start)}
                                            </Typography>
                                            <Chip
                                                icon={<ScheduleIcon fontSize="small" />}
                                                label={formatTime(selectedEvent.start)}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </Box>

                                        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                                            利用金額
                                        </Typography>
                                        <Typography variant="h5" color="primary" gutterBottom>
                                            ¥{selectedEvent.amount.toLocaleString()}
                                        </Typography>

                                        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                                            利用店舗
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {selectedEvent.where}
                                        </Typography>

                                        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                                            カード
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {selectedEvent.cardName}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>閉じる</Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            </MainLayout>
        </ProtectedRoute>
    );
}