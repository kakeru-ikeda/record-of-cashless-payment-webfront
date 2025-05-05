import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Autocomplete,
    CircularProgress,
    Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { CardUsageApi } from '@/api/cardUsageApi';
import { Timestamp } from 'firebase/firestore';

interface AddCardUsageModalProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
}

export default function AddCardUsageModal({ open, onClose, onSave }: AddCardUsageModalProps) {
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // フォーム値を管理
    const [formValues, setFormValues] = useState({
        datetime_of_use: new Date(),
        amount: '',  // 空文字列に変更
        where_to_use: '',
        card_name: '',
        memo: ''
    });

    // 過去の利用店舗と利用カードのリスト
    const [previousStores, setPreviousStores] = useState<string[]>([]);
    const [previousCards, setPreviousCards] = useState<string[]>([]);

    // 過去の利用データを読み込む
    useEffect(() => {
        const fetchPreviousData = async () => {
            if (!open) return;

            try {
                setLoading(true);
                setError(null);

                // 現在の年月を取得
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth() + 1;

                // カード利用情報を取得（直近の月）
                const cardUsages = await CardUsageApi.getCardUsagesByMonth(year, month);

                // 店舗とカードの一覧を抽出（重複を除去）
                const storeSet = new Set<string>();
                const cardSet = new Set<string>();

                cardUsages.forEach(usage => {
                    if (usage.where_to_use) storeSet.add(usage.where_to_use);
                    if (usage.card_name) cardSet.add(usage.card_name);
                });

                // 前月のデータも取得
                let previousMonth = month - 1;
                let previousYear = year;

                if (previousMonth === 0) {
                    previousMonth = 12;
                    previousYear = year - 1;
                }

                const previousMonthUsages = await CardUsageApi.getCardUsagesByMonth(previousYear, previousMonth);

                previousMonthUsages.forEach(usage => {
                    if (usage.where_to_use) storeSet.add(usage.where_to_use);
                    if (usage.card_name) cardSet.add(usage.card_name);
                });

                // 店舗とカードのリストをセット
                setPreviousStores(Array.from(storeSet));
                setPreviousCards(Array.from(cardSet));

            } catch (err) {
                console.error('過去の利用データ取得中にエラーが発生しました:', err);
                setError('過去のデータの読み込みに失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchPreviousData();
    }, [open]);

    // モーダルを閉じる際のリセット処理
    const handleClose = () => {
        resetForm();
        onClose();
    };

    // フォームのリセット
    const resetForm = () => {
        setFormValues({
            datetime_of_use: new Date(),
            amount: '',
            where_to_use: '',
            card_name: '',
            memo: ''
        });
        setError(null);
    };

    // 入力フィールドの変更ハンドラ
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const name = e.target.name as string;
        const value = e.target.value;

        setFormValues(prev => ({
            ...prev,
            [name]: name === 'amount' ? Number(value) : value
        }));
    };

    // 日時の変更ハンドラ
    const handleDateChange = (newDate: Date | null) => {
        if (newDate) {
            setFormValues(prev => ({
                ...prev,
                datetime_of_use: newDate
            }));
        }
    };

    // オートコンプリートの変更ハンドラ（店舗）
    const handleStoreChange = (event: React.SyntheticEvent, value: string | null) => {
        setFormValues(prev => ({
            ...prev,
            where_to_use: value || ''
        }));
    };

    // オートコンプリートの変更ハンドラ（カード）
    const handleCardChange = (event: React.SyntheticEvent, value: string | null) => {
        setFormValues(prev => ({
            ...prev,
            card_name: value || ''
        }));
    };

    // 保存処理
    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            // バリデーション
            if (!formValues.datetime_of_use) {
                setError('利用日時を入力してください');
                setSaving(false);
                return;
            }

            // 金額が入力されているか、正の数かをチェック
            if (!formValues.amount || Number(formValues.amount) <= 0) {
                setError('正しい金額を入力してください');
                setSaving(false);
                return;
            }

            if (!formValues.where_to_use.trim()) {
                setError('利用店舗を入力してください');
                setSaving(false);
                return;
            }

            if (!formValues.card_name.trim()) {
                setError('カード名を入力してください');
                setSaving(false);
                return;
            }

            // FirestoreのTimestamp型に変換
            const timestamp = Timestamp.fromDate(formValues.datetime_of_use);

            // APIを呼び出して保存
            const result = await CardUsageApi.createCardUsage({
                datetime_of_use: timestamp,
                amount: Number(formValues.amount),
                where_to_use: formValues.where_to_use.trim(),
                card_name: formValues.card_name.trim(),
                memo: formValues.memo.trim(),
                is_active: true
            });

            if (result) {
                console.log('カード利用情報が正常に作成されました:', result);
                resetForm();
                onSave();
            } else {
                setError('保存に失敗しました');
            }
        } catch (err) {
            console.error('カード利用情報の保存中にエラーが発生しました:', err);
            setError('保存処理中にエラーが発生しました');
        } finally {
            setSaving(false);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>新規カード利用明細を追加</DialogTitle>

                <DialogContent>
                    {error && (
                        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                            {error}
                        </Typography>
                    )}

                    <Box sx={{ mt: 2 }}>
                        <DateTimePicker
                            label="利用日時"
                            value={formValues.datetime_of_use}
                            onChange={handleDateChange}
                            format="yyyy年MM月dd日 HH:mm"
                            sx={{ width: '100%', mb: 2 }}
                        />

                        <TextField
                            label="利用金額"
                            name="amount"
                            type="number"
                            value={formValues.amount}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            placeholder="金額を入力"
                            InputProps={{
                                endAdornment: <Typography variant="body2">円</Typography>
                            }}
                        />

                        <Autocomplete
                            options={previousStores}
                            freeSolo
                            fullWidth
                            value={formValues.where_to_use}
                            onChange={handleStoreChange}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="利用店舗"
                                    name="where_to_use"
                                    onChange={handleChange}
                                    margin="normal"
                                />
                            )}
                            loading={loading}
                        />

                        <Autocomplete
                            options={previousCards}
                            freeSolo
                            fullWidth
                            value={formValues.card_name}
                            onChange={handleCardChange}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="カード名"
                                    name="card_name"
                                    onChange={handleChange}
                                    margin="normal"
                                />
                            )}
                            loading={loading}
                        />

                        <TextField
                            label="メモ"
                            name="memo"
                            value={formValues.memo}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            multiline
                            rows={3}
                        />
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose} disabled={saving}>
                        キャンセル
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        color="primary"
                        disabled={saving}
                    >
                        {saving ? <CircularProgress size={24} /> : '保存'}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}