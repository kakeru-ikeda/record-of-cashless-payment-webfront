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
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
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
    const [year, setYear] = useState<number>(today.getFullYear());
    const [month, setMonth] = useState<number>(today.getMonth() + 1);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [view, setView] = useState<View>('month');
    // 編集モードの状態
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
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    // 新規明細追加モーダル用のステート
    const [addModalOpen, setAddModalOpen] = useState<boolean>(false);

    // カレンダーの日付範囲に基づいてデータを取得
    const { events, cardUsages, loading, error, refreshData } = useCardUsages(year, month);

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
            // 共通のconvertTimestampToDate関数を使用
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
                return formatSimpleDate(date);
            default:
                return `${date.getFullYear()}年${date.getMonth() + 1}月`;
        }
    };

    // イベントクリック時のハンドラー
    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        // フォーム値を初期化
        setEditFormValues({
            amount: event.amount,
            where: event.where,
            cardName: event.cardName,
            memo: event.memo || '',
            isActive: event.isActive
        });
        setIsEditing(false); // 表示モードで開始
        setDialogOpen(true);
    };

    // ダイアログを閉じる
    const handleCloseDialog = () => {
        setDialogOpen(false);
        setIsEditing(false);
    };

    // 編集モードの切り替え
    const toggleEditMode = () => {
        if (isEditing) {
            // 編集モードからビューモードに戻る場合、変更を破棄
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

    // フォーム値の変更ハンドラ
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditFormValues(prev => ({
            ...prev,
            [name]: name === 'amount' ? Number(value) : value
        }));
    };

    // スイッチの変更ハンドラ
    const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setEditFormValues(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    // アクティブ/非アクティブ状態を切り替える
    const toggleActiveStatus = async () => {
        if (!selectedEvent || !selectedEvent.id) return;

        try {
            setIsSaving(true);
            const newActiveStatus = !selectedEvent.isActive;

            // APIでデータを更新
            const result = await CardUsageApi.updateCardUsage(selectedEvent.id, {
                is_active: newActiveStatus
            });

            if (result) {
                // 成功メッセージを表示
                setSnackbarMessage(newActiveStatus ? '表示に設定しました' : '非表示に設定しました');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);

                // 全データを再取得して表示を更新
                await refreshData();

                // 表示中のイベントも更新
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

    // カード利用情報の保存
    const handleSaveChanges = async () => {
        if (!selectedEvent || !selectedEvent.id) return;

        try {
            setIsSaving(true);

            // APIでデータを更新
            const result = await CardUsageApi.updateCardUsage(selectedEvent.id, {
                amount: editFormValues.amount,
                where_to_use: editFormValues.where,
                card_name: editFormValues.cardName,
                memo: editFormValues.memo,
                is_active: editFormValues.isActive
            });

            if (result) {
                // 成功メッセージを表示
                setSnackbarMessage('利用情報を更新しました');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);

                // 保存後は編集モードを終了
                setIsEditing(false);

                // 全データを再取得して表示を更新
                await refreshData();

                // 表示中のイベントも更新
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

    // スナックバーを閉じる
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    // カレンダーのイベントのスタイル
    const eventStyleGetter = (event: CalendarEvent) => {
        const amount = event.amount;
        let backgroundColor = '#3174ad';

        if (event.isActive === false) {
            // 非アクティブな項目はグレーアウト表示
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

        // アクティブな項目は金額に応じた色分け
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
                                                    label="表示/非表示"
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
                                                    label="表示/非表示"
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