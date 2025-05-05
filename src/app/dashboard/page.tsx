'use client';

import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    CardContent,
    Card,
    CircularProgress,
    Divider,
    Grid,
    Button,
    Tooltip,
    Snackbar
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useCardUsages } from '@/hooks/useCardUsages';
import { useMonthlyReport } from '@/hooks/useMonthlyReports';
import { convertTimestampToDate, formatDate } from '@/utils/dateUtils';
import AddCardUsageModal from '@/components/ui/AddCardUsageModal';

export default function DashboardPage() {
    const today = new Date();
    const [year] = useState<number>(today.getFullYear());
    const [month] = useState<number>(today.getMonth() + 1);
    // 新規明細追加モーダル用のステート
    const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');

    const { cardUsages, loading: usagesLoading, refreshData } = useCardUsages(year, month);
    const { loading: reportLoading } = useMonthlyReport(year, month);

    // 直近5件の利用履歴を取得
    const recentTransactions = [...cardUsages]
        .filter(usage => usage.is_active !== false)  // アクティブな項目のみフィルタリング
        .sort((a, b) => {
            // convertTimestampToDate関数を使用して日付変換を簡素化
            const dateA = convertTimestampToDate(a.datetime_of_use);
            const dateB = convertTimestampToDate(b.datetime_of_use);
            return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);

    // 月の合計金額を計算（アクティブな項目のみ）
    const activeUsages = cardUsages.filter(usage => usage.is_active !== false);
    const totalAmount = activeUsages.reduce((sum, usage) => sum + usage.amount, 0);

    // 店舗ごとの利用頻度を集計（アクティブな項目のみ）
    const frequentStores = activeUsages.reduce((acc, usage) => {
        const store = usage.where_to_use;
        if (!acc[store]) {
            acc[store] = { count: 0, total: 0 };
        }
        acc[store].count += 1;
        acc[store].total += usage.amount;
        return acc;
    }, {} as Record<string, { count: number; total: number }>);

    // 利用頻度順にソート
    const topStores = Object.entries(frequentStores)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

    const loading = usagesLoading || reportLoading;

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
        setSnackbarOpen(true);

        // データを再読み込み
        await refreshData();
    };

    // スナックバーを閉じる
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    return (
        <ProtectedRoute>
            <MainLayout>
                <Box sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <div>
                            <Typography variant="h4" gutterBottom component="h1">
                                ダッシュボード
                            </Typography>
                            <Typography variant="h6" gutterBottom color="textSecondary">
                                {year}年{month}月の利用状況
                            </Typography>
                        </div>
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
                    </Box>

                    {loading ? (
                        <Box display="flex" justifyContent="center" my={4}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            {/* 月間集計 */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card elevation={2}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            月間合計
                                        </Typography>
                                        <Typography variant="h4" component="div" color="primary">
                                            ¥{totalAmount.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {activeUsages.length}件の利用
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* 今月の残り日数 */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card elevation={2}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            今月の残り日数
                                        </Typography>
                                        {today.getFullYear() === year && today.getMonth() + 1 === month ? (
                                            <>
                                                <Typography variant="h4" component="div" color="info.main">
                                                    {new Date(year, month, 0).getDate() - today.getDate()} 日
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    月末まで
                                                </Typography>
                                            </>
                                        ) : (
                                            <Typography variant="body1" color="text.secondary">
                                                表示中の月ではありません
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* 前月比 */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Card elevation={2}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            月間目標
                                        </Typography>
                                        <Typography variant="h4" component="div" color={totalAmount > 100000 ? "error" : "success.main"}>
                                            {totalAmount > 100000 ? "超過" : "達成中"}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            目標: ¥100,000
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* 最近の利用履歴 */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                                    <Typography variant="h6" gutterBottom>
                                        最近の利用履歴
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    {recentTransactions.length > 0 ? (
                                        recentTransactions.map((transaction, index) => (
                                            <Box key={index} sx={{ mb: 1.5 }}>
                                                <Grid container spacing={1} alignItems="center">
                                                    <Grid size={8}>
                                                        <Typography variant="body1">
                                                            {transaction.where_to_use}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatDate(convertTimestampToDate(transaction.datetime_of_use))}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid size={4} textAlign="right">
                                                        <Typography variant="body1" fontWeight="bold">
                                                            ¥{transaction.amount.toLocaleString()}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {transaction.card_name.substring(0, 10)}...
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                                {index < recentTransactions.length - 1 && (
                                                    <Divider sx={{ my: 1.5 }} />
                                                )}
                                            </Box>
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" align="center">
                                            データがありません
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>

                            {/* 利用頻度の高い店舗 */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                                    <Typography variant="h6" gutterBottom>
                                        よく利用する店舗
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    {topStores.length > 0 ? (
                                        topStores.map(([store, data], index) => (
                                            <Box key={store} sx={{ mb: 1.5 }}>
                                                <Grid container spacing={1} alignItems="center">
                                                    <Grid size={7}>
                                                        <Typography variant="body1">
                                                            {store}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {data.count}回利用
                                                        </Typography>
                                                    </Grid>
                                                    <Grid size={5} textAlign="right">
                                                        <Typography variant="body1" fontWeight="bold">
                                                            ¥{data.total.toLocaleString()}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            平均 ¥{Math.round(data.total / data.count).toLocaleString()}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                                {index < topStores.length - 1 && (
                                                    <Divider sx={{ my: 1.5 }} />
                                                )}
                                            </Box>
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" align="center">
                                            データがありません
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

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