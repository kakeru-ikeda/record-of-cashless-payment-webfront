'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Grid,
    IconButton,
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
    CardContent
} from '@mui/material';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ja';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useCardUsages } from '@/hooks/useCardUsages';
import { CalendarEvent } from '@/types';

// カレンダーの日本語化
moment.locale('ja');
const localizer = momentLocalizer(moment);

export default function CalendarPage() {
    const today = new Date();
    const [year, setYear] = useState<number>(today.getFullYear());
    const [month, setMonth] = useState<number>(today.getMonth() + 1);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);

    // カレンダーの日付範囲に基づいてデータを取得
    const { events, cardUsages, loading, error } = useCardUsages(year, month);

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
            const date = usage.datetime_of_use.toDate();
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

    // 前の月へ
    const handlePreviousMonth = () => {
        if (month === 1) {
            setYear(year - 1);
            setMonth(12);
        } else {
            setMonth(month - 1);
        }
    };

    // 次の月へ
    const handleNextMonth = () => {
        if (month === 12) {
            setYear(year + 1);
            setMonth(1);
        } else {
            setMonth(month + 1);
        }
    };

    // 今月へ
    const handleCurrentMonth = () => {
        setYear(today.getFullYear());
        setMonth(today.getMonth() + 1);
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

    // 日付のフォーマット
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short',
        }).format(date);
    };

    // カレンダーのイベントのスタイル
    const eventStyleGetter = (event: CalendarEvent) => {
        const amount = event.amount;
        let backgroundColor = '#3174ad'; // デフォルト色

        // 金額に応じて色を変更
        if (amount < 1000) {
            backgroundColor = '#4caf50'; // 緑 (少額)
        } else if (amount < 3000) {
            backgroundColor = '#2196f3'; // 青 (中程度)
        } else if (amount < 10000) {
            backgroundColor = '#ff9800'; // オレンジ (高額)
        } else {
            backgroundColor = '#f44336'; // 赤 (非常に高額)
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

    return (
        <ProtectedRoute>
            <MainLayout>
                <Box sx={{ flexGrow: 1 }}>
                    <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                        <Grid size={1}>
                            <IconButton onClick={handlePreviousMonth} color="primary">
                                <ChevronLeftIcon />
                            </IconButton>
                        </Grid>
                        <Grid size={3}>
                            <Typography variant="h5" component="h1">
                                {year}年{month}月
                            </Typography>
                        </Grid>
                        <Grid size={1}>
                            <IconButton onClick={handleNextMonth} color="primary">
                                <ChevronRightIcon />
                            </IconButton>
                        </Grid>
                        <Grid size={2}>
                            <Button variant="outlined" size="small" onClick={handleCurrentMonth}>
                                今月
                            </Button>
                        </Grid>
                        <Grid size="grow" />
                        <Grid size={4}>
                            <Typography variant="body1">
                                合計: ¥{monthSummary.total.toLocaleString()} ({monthSummary.count}件)
                            </Typography>
                        </Grid>
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
                                        style={{ height: '100%' }}
                                        views={['month', 'week', 'day']}
                                        defaultView='month'
                                        date={new Date(year, month - 1, 1)}
                                        onNavigate={() => { }}
                                        onSelectEvent={(event) => handleEventClick(event as CalendarEvent)}
                                        eventPropGetter={eventStyleGetter}
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
                                        <Typography variant="body1" gutterBottom>
                                            {formatDate(selectedEvent.start)}
                                        </Typography>

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