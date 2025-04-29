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
    Grid
} from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useCardUsages } from '@/hooks/useCardUsages';
import { useMonthlyReport } from '@/hooks/useMonthlyReports';

export default function DashboardPage() {
    const today = new Date();
    const [year, setYear] = useState<number>(today.getFullYear());
    const [month, setMonth] = useState<number>(today.getMonth() + 1);

    const { cardUsages, events, loading: usagesLoading } = useCardUsages(year, month);
    const { monthlyReport, loading: reportLoading } = useMonthlyReport(year, month);

    // 直近5件の利用履歴を取得
    const recentTransactions = [...cardUsages]
        .sort((a, b) => b.datetime_of_use.toDate().getTime() - a.datetime_of_use.toDate().getTime())
        .slice(0, 5);

    // 月の合計金額を計算
    const totalAmount = cardUsages.reduce((sum, usage) => sum + usage.amount, 0);

    // 店舗ごとの利用頻度を集計
    const frequentStores = cardUsages.reduce((acc, usage) => {
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

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '—';
        const date = timestamp.toDate();
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const loading = usagesLoading || reportLoading;

    return (
        <ProtectedRoute>
            <MainLayout>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" gutterBottom component="h1">
                        ダッシュボード
                    </Typography>
                    <Typography variant="h6" gutterBottom color="textSecondary">
                        {year}年{month}月の利用状況
                    </Typography>

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
                                            {cardUsages.length}件の利用
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
                                                            {formatDate(transaction.datetime_of_use)}
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
                </Box>
            </MainLayout>
        </ProtectedRoute>
    );
}