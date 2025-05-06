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
    Chip,
    TextField,
    Snackbar,
    FormControlLabel,
    Switch,
    Tooltip,
} from '@mui/material';
import {
    Schedule as ScheduleIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { Calendar, momentLocalizer, View, DateRange } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ja';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar-responsive.css'; // カスタムレスポンシブスタイル
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useCardUsages } from '@/hooks/useCardUsages';
import { CalendarEvent } from '@/types';
import { CardUsageApi } from '@/api/cardUsageApi';
import { convertTimestampToDate, formatDate, formatTime, formatSimpleDate } from '@/utils/dateUtils';
import AddCardUsageModal from '@/components/ui/AddCardUsageModal';

// カレンダーの日本語化
moment.locale('ja');
const localizer = momentLocalizer(moment);

export default function CalendarPage() {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState<Date>(today);
    const [, setYear] = useState<number>(today.getFullYear());
    const [, setMonth] = useState<number>(today.getMonth() + 1);
    const [dateRange, setDateRange] = useState<DateRange>({
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 0)
    });
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [view, setView] = useState<View>('month');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editFormValues, setEditFormValues] = useState({
        amount: 0,
        where: '',
        cardName: '',
        memo: '',
        isActive: true,
    });
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [addModalOpen, setAddModalOpen] = useState<boolean>(false);

    const { events, cardUsages, loading, error, refreshData } = useCardUsages(dateRange);

    useEffect(() => {
        console.log('カレンダービュー変更:', view);
        console.log('現在の日付:', currentDate);
        console.log('日付範囲:', `${dateRange.start.toLocaleDateString()} 〜 ${dateRange.end.toLocaleDateString()}`);
    }, [view, currentDate, dateRange]);

    useEffect(() => {
        updateDateByView(currentDate);
    }, [view]);

    useEffect(() => {
        updateDateByView(currentDate);
    }, [currentDate]);

    const monthSummary = useMemo(() => {
        const activeUsages = cardUsages.filter(usage => usage.is_active !== false);

        const filteredUsages = activeUsages.filter(usage => {
            const date = convertTimestampToDate(usage.datetime_of_use);
            return date >= dateRange.start && date <= dateRange.end;
        });

        const total = filteredUsages.reduce((sum, usage) => sum + usage.amount, 0);
        const count = filteredUsages.length;
        const average = count > 0 ? Math.round(total / count) : 0;

        return {
            total,
            count,
            average
        };
    }, [cardUsages, dateRange]);

    const dailySummary = useMemo(() => {
        const activeUsages = cardUsages.filter(usage => usage.is_active !== false);

        const filteredUsages = activeUsages.filter(usage => {
            const date = convertTimestampToDate(usage.datetime_of_use);
            return date >= dateRange.start && date <= dateRange.end;
        });

        const summary = filteredUsages.reduce((acc, usage) => {
            const date = convertTimestampToDate(usage.datetime_of_use);
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

        return Object.values(summary).sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [cardUsages, dateRange]);

    const updateDateByView = (date: Date) => {
        setYear(date.getFullYear());
        setMonth(date.getMonth() + 1);

        console.log('ビュー更新の呼び出し:', view, date.toLocaleDateString());

        let start: Date, end: Date;

        switch (view) {
            case 'month':
                start = new Date(date.getFullYear(), date.getMonth(), 1);
                // 月末日を確実に取得するよう修正（次の月の0日 = 今月の末日）
                end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
                console.log('月表示の範囲計算:', `${start.toLocaleDateString()} 〜 ${end.toLocaleDateString()}`);
                break;
            case 'week':
                const dayOfWeek = date.getDay();
                start = new Date(date);
                start.setDate(date.getDate() - dayOfWeek);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                // 週の終了日の終わりまで含める
                end.setHours(23, 59, 59, 999);
                console.log('週表示の範囲計算:', `${start.toLocaleDateString()} 〜 ${end.toLocaleDateString()}`);
                break;
            case 'day':
                // 日表示の場合は、その日の00:00:00から23:59:59までを範囲とする
                start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
                end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
                console.log('日表示の範囲計算:', `${start.toLocaleDateString()} (${start.toLocaleTimeString()} 〜 ${end.toLocaleTimeString()})`);
                break;
            default:
                start = new Date(date.getFullYear(), date.getMonth(), 1);
                end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
                console.log('デフォルトの範囲計算:', `${start.toLocaleDateString()} 〜 ${end.toLocaleDateString()}`);
        }

        console.log('日付範囲を設定:', `${start.toLocaleDateString()} 〜 ${end.toLocaleDateString()}`);
        setDateRange({ start, end });
    };

    const handleNavigate = (newDate: Date) => {
        console.log('ナビゲーション:', newDate.toLocaleDateString());
        setCurrentDate(newDate);
    };

    const handleViewChange = (newView: View) => {
        console.log('ビュー変更:', newView);
        setView(newView);
        updateDateByView(currentDate);
    };

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
                return formatSimpleDate(date);
            default:
                return `${date.getFullYear()}年${date.getMonth() + 1}月`;
        }
    };

    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setEditFormValues({
            amount: event.amount,
            where: event.where,
            cardName: event.cardName,
            memo: event.memo || '',
            isActive: event.isActive
        });
        setIsEditing(false);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setIsEditing(false);
    };

    const toggleEditMode = () => {
        if (isEditing) {
            if (selectedEvent) {
                setEditFormValues({
                    amount: selectedEvent.amount,
                    where: selectedEvent.where,
                    cardName: selectedEvent.cardName,
                    memo: selectedEvent.memo || '',
                    isActive: selectedEvent.isActive
                });
            }
        }
        setIsEditing(!isEditing);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditFormValues(prev => ({
            ...prev,
            [name]: name === 'amount' ? Number(value) : value
        }));
    };

    const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setEditFormValues(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const toggleActiveStatus = async () => {
        if (!selectedEvent || !selectedEvent.id) return;

        try {
            setIsSaving(true);
            const newActiveStatus = !selectedEvent.isActive;

            const result = await CardUsageApi.updateCardUsage(selectedEvent.id, {
                is_active: newActiveStatus
            });

            if (result) {
                setSnackbarMessage(newActiveStatus ? '表示に設定しました' : '非表示に設定しました');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);

                await refreshData();

                if (selectedEvent) {
                    setSelectedEvent({
                        ...selectedEvent,
                        isActive: newActiveStatus
                    });
                }
            }
        } catch (error) {
            console.error('状態の更新に失敗しました:', error);
            setSnackbarMessage('更新に失敗しました');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!selectedEvent || !selectedEvent.id) return;

        try {
            setIsSaving(true);

            const result = await CardUsageApi.updateCardUsage(selectedEvent.id, {
                amount: editFormValues.amount,
                where_to_use: editFormValues.where,
                card_name: editFormValues.cardName,
                memo: editFormValues.memo,
                is_active: editFormValues.isActive
            });

            if (result) {
                setSnackbarMessage('利用情報を更新しました');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);

                setIsEditing(false);

                await refreshData();

                if (selectedEvent) {
                    setSelectedEvent({
                        ...selectedEvent,
                        amount: editFormValues.amount,
                        where: editFormValues.where,
                        cardName: editFormValues.cardName,
                        memo: editFormValues.memo,
                        isActive: editFormValues.isActive
                    });
                }
            }
        } catch (error) {
            console.error('情報の更新に失敗しました:', error);
            setSnackbarMessage('更新に失敗しました');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const eventStyleGetter = (event: CalendarEvent) => {
        const amount = event.amount;
        let backgroundColor = '#3174ad';

        if (event.isActive === false) {
            return {
                style: {
                    backgroundColor: '#9e9e9e',
                    borderRadius: '4px',
                    opacity: 0.6,
                    color: 'white',
                    border: 'none',
                    display: 'block',
                    textDecoration: 'line-through'
                }
            };
        }

        if (amount < 1000) {
            backgroundColor = '#4caf50';
        } else if (amount < 3000) {
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

    const EventComponent = ({ event }: { event: CalendarEvent }) => {
        if (view === 'month') {
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

            if (isMobile) {
                return (
                    <div style={{
                        fontSize: '0.75rem',
                        padding: '1px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden'
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

    // 追加ボタンクリックハンドラ
    const handleAddButtonClick = () => {
        setAddModalOpen(true);
    };

    // モーダルを閉じるハンドラ
    const handleAddModalClose = () => {
        setAddModalOpen(false);
    };

    // 保存成功時のハンドラ
    const handleAddSuccess = async () => {
        setAddModalOpen(false);

        // 保存メッセージを表示
        setSnackbarMessage('利用明細を追加しました');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        // データを再読み込み
        await refreshData();
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
                        <Grid>
                            <Tooltip title="新規明細を追加">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddButtonClick}
                                >
                                    新規追加
                                </Button>
                            </Tooltip>
                        </Grid>
                    </Grid>
                    <Grid container spacing={2} size={4} sx={{ mb: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            合計: ¥{monthSummary.total.toLocaleString()} ({monthSummary.count}件)
                            {view === 'month' && (
                                <Typography variant="body2" component="span" sx={{ ml: 2 }}>
                                    {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
                                </Typography>
                            )}
                            {view === 'week' && (
                                <Typography variant="body2" component="span" sx={{ ml: 2 }}>
                                    {dateRange.start.toLocaleDateString('ja-JP')} 〜 {dateRange.end.toLocaleDateString('ja-JP')}
                                </Typography>
                            )}
                            {view === 'day' && (
                                <Typography variant="body2" component="span" sx={{ ml: 2 }}>
                                    {currentDate.toLocaleDateString('ja-JP')}
                                </Typography>
                            )}
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
                                        titleAccessor={(event) => `¥${event.amount.toLocaleString()} - ${event.where}`}
                                        style={{ height: '100%' }}
                                        views={['month', 'week', 'day']}
                                        view={view}
                                        onView={handleViewChange}
                                        date={currentDate}
                                        onNavigate={handleNavigate}
                                        onSelectEvent={(event) => handleEventClick(event as CalendarEvent)}
                                        eventPropGetter={eventStyleGetter}
                                        components={components}
                                        formats={{
                                            eventTimeRangeFormat: () => '',
                                            eventTimeRangeStartFormat: () => '',
                                            eventTimeRangeEndFormat: () => '',
                                            dayHeaderFormat: (date) =>
                                                localizer.format(date, 'dddd MMM DD'),
                                            dayRangeHeaderFormat: ({ start, end }) =>
                                                `${localizer.format(start, 'MMM DD')} – ${localizer.format(end, 'MMM DD')}`,
                                        }}
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
                                        defaultView={view}
                                        popup={view === 'month'}
                                        showMultiDayTimes={view !== 'month'}
                                        step={30}
                                        timeslots={2}
                                        min={new Date(0, 0, 0, 0, 0)}
                                        max={new Date(0, 0, 0, 23, 59)}
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
                                        onRangeChange={(range) => {
                                            console.log('カレンダー範囲変更:', range);
                                            if (Array.isArray(range)) {
                                                console.log('日付配列:', range.map(d => d.toLocaleDateString()).join(', '));
                                            } else if (range.start && range.end) {
                                                console.log('日付範囲オブジェクト:', range.start.toLocaleDateString(), '〜', range.end.toLocaleDateString());
                                                setDateRange({
                                                    start: new Date(range.start),
                                                    end: new Date(range.end)
                                                });
                                            }
                                        }}
                                    />
                                )}
                            </Paper>
                        </Grid>

                        {/* 日別集計 */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper elevation={2} sx={{ p: 2, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
                                <Typography variant="h6" gutterBottom>
                                    {view === 'month'
                                        ? `日別利用金額 (${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月)`
                                        : view === 'week'
                                            ? '日別利用金額 (選択中の週)'
                                            : '日別利用金額'}
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
                                                    <Typography variant="body1" color={
                                                        day.total <= 1000
                                                            ? "success.main"
                                                            : day.total <= 3000
                                                                ? "warning.main"
                                                                : "error"
                                                    } fontWeight="bold">
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
                                        {isEditing ? (
                                            <>
                                                <TextField
                                                    label="利用金額"
                                                    name="amount"
                                                    type="number"
                                                    value={editFormValues.amount}
                                                    onChange={handleFormChange}
                                                    fullWidth
                                                    margin="normal"
                                                />
                                                <TextField
                                                    label="利用店舗"
                                                    name="where"
                                                    value={editFormValues.where}
                                                    onChange={handleFormChange}
                                                    fullWidth
                                                    margin="normal"
                                                />
                                                <TextField
                                                    label="カード名"
                                                    name="cardName"
                                                    value={editFormValues.cardName}
                                                    onChange={handleFormChange}
                                                    fullWidth
                                                    margin="normal"
                                                />
                                                <TextField
                                                    label="メモ"
                                                    name="memo"
                                                    value={editFormValues.memo}
                                                    onChange={handleFormChange}
                                                    fullWidth
                                                    margin="normal"
                                                    multiline
                                                    rows={3}
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={editFormValues.isActive}
                                                            onChange={handleSwitchChange}
                                                            name="isActive"
                                                        />
                                                    }
                                                    label="有効"
                                                />
                                            </>
                                        ) : (
                                            <>
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
                                                <Typography variant="h5" color={
                                                    selectedEvent.amount <= 1000
                                                        ? "success.main"
                                                        : selectedEvent.amount <= 3000
                                                            ? "warning.main"
                                                            : "error"
                                                } gutterBottom>
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

                                                {selectedEvent.memo && (
                                                    <>
                                                        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                                                            メモ
                                                        </Typography>
                                                        <Typography variant="body1" gutterBottom sx={{ whiteSpace: 'pre-wrap' }}>
                                                            {selectedEvent.memo}
                                                        </Typography>
                                                    </>
                                                )}

                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={selectedEvent.isActive}
                                                            onChange={toggleActiveStatus}
                                                            name="isActive"
                                                        />
                                                    }
                                                    label="有効"
                                                />
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </DialogContent>
                        <DialogActions>
                            {isEditing ? (
                                <>
                                    <Button onClick={toggleEditMode} startIcon={<CancelIcon />} disabled={isSaving}>
                                        キャンセル
                                    </Button>
                                    <Button onClick={handleSaveChanges} startIcon={<SaveIcon />} disabled={isSaving}>
                                        保存
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button onClick={toggleEditMode} startIcon={<EditIcon />}>
                                        編集
                                    </Button>
                                    <Button onClick={handleCloseDialog}>閉じる</Button>
                                </>
                            )}
                        </DialogActions>
                    </Dialog>

                    {/* 新規明細追加モーダル */}
                    <AddCardUsageModal
                        open={addModalOpen}
                        onClose={handleAddModalClose}
                        onSave={handleAddSuccess}
                    />

                    {/* スナックバー */}
                    <Snackbar
                        open={snackbarOpen}
                        autoHideDuration={6000}
                        onClose={handleSnackbarClose}
                        message={snackbarMessage}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    />
                </Box>
            </MainLayout>
        </ProtectedRoute>
    );
}