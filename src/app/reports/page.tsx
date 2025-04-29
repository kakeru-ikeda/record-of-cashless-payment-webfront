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
    Button,
    Tabs,
    Tab,
    Divider,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from '@mui/material';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    TrendingUp as TrendingUpIcon,
    BarChart as BarChartIcon,
    CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useCardUsages } from '@/hooks/useCardUsages';
import { useMonthlyReport } from '@/hooks/useMonthlyReports';
import { useAllWeeklyReports } from '@/hooks/useWeeklyReports';
import { WeeklyReport } from '@/types';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

// タブパネルコンポーネント
function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`report-tabpanel-${index}`}
            aria-labelledby={`report-tab-${index}`}
            {...other}
            style={{ paddingTop: 20 }}
        >
            {value === index && <Box>{children}</Box>}
        </div>
    );
}

export default function ReportsPage() {
    const today = new Date();
    const [year, setYear] = useState<number>(today.getFullYear());
    const [month, setMonth] = useState<number>(today.getMonth() + 1);
    const [tabValue, setTabValue] = useState<number>(0);

    const { cardUsages, loading: usagesLoading, error: usagesError } = useCardUsages(year, month);
    const { monthlyReport, loading: monthlyReportLoading, error: monthlyReportError } = useMonthlyReport(year, month);
    const { weeklyReports, loading: weeklyReportsLoading, error: weeklyReportsError } = useAllWeeklyReports(year, month);

    const loading = usagesLoading || monthlyReportLoading || weeklyReportsLoading;
    const error = usagesError || monthlyReportError || weeklyReportsError;

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

    // タブの切り替え
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // 週ごとの集計データ
    const weeklyData = useMemo(() => {
        // バックエンドから取得した週次レポートがある場合はそれを優先
        if (Object.keys(weeklyReports).length > 0) {
            return Object.entries(weeklyReports)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([term, data]) => ({
                    term,
                    termName: term.replace('term', '第') + '週',
                    total: data.totalAmount,
                    count: data.totalCount,
                    // その他のレポート情報も含める
                    startDate: data.termStartDate?.toDate(),
                    endDate: data.termEndDate?.toDate(),
                    hasReportSent: data.hasReportSent,
                }));
        }

        // バックエンドからの週次レポートがない場合は、cardUsagesからフロントエンドで集計
        const weekMap: Record<string, { total: number, count: number, items: any[] }> = {};

        cardUsages.forEach(usage => {
            const dateObj = usage.datetime_of_use.toDate();
            const day = dateObj.getDate();

            // 週番号を計算（簡易版: 日付から概算）
            let weekTerm = 'term1';
            if (day > 7 && day <= 14) weekTerm = 'term2';
            else if (day > 14 && day <= 21) weekTerm = 'term3';
            else if (day > 21 && day <= 28) weekTerm = 'term4';
            else if (day > 28) weekTerm = 'term5';

            if (!weekMap[weekTerm]) {
                weekMap[weekTerm] = { total: 0, count: 0, items: [] };
            }

            weekMap[weekTerm].total += usage.amount;
            weekMap[weekTerm].count += 1;
            weekMap[weekTerm].items.push(usage);
        });

        // 週番号順にソート
        return Object.entries(weekMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([term, data]) => ({
                term,
                termName: term.replace('term', '第') + '週',
                ...data
            }));
    }, [cardUsages, weeklyReports]);

    // カテゴリ別集計（ここでは店舗ごと）
    const categoryData = useMemo(() => {
        const storeMap: Record<string, { total: number, count: number }> = {};

        cardUsages.forEach(usage => {
            const store = usage.where_to_use;

            if (!storeMap[store]) {
                storeMap[store] = { total: 0, count: 0 };
            }

            storeMap[store].total += usage.amount;
            storeMap[store].count += 1;
        });

        // 金額順にソート
        return Object.entries(storeMap)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([store, data]) => ({
                store,
                ...data,
                average: data.count > 0 ? Math.round(data.total / data.count) : 0
            }));
    }, [cardUsages]);

    // 月間合計 - monthlyReportがある場合はそれを使用、ない場合はcardUsagesから計算
    const monthTotal = monthlyReport
        ? monthlyReport.totalAmount
        : cardUsages.reduce((sum, usage) => sum + usage.amount, 0);

    // 取引件数 - monthlyReportがある場合はそれを使用、ない場合はcardUsagesから計算
    const transactionCount = monthlyReport
        ? monthlyReport.totalCount
        : cardUsages.length;

    const averagePerTransaction = transactionCount > 0 ? Math.round(monthTotal / transactionCount) : 0;

    // 日付のフォーマット
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
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
                        <Grid size={4}>
                            <Typography variant="h5" component="h1">
                                {year}年{month}月のレポート
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
                    </Grid>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            データの読み込み中にエラーが発生しました
                        </Alert>
                    )}

                    {loading ? (
                        <Box display="flex" justifyContent="center" my={4}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            {/* サマリーカード */}
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Card elevation={2}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                月間合計
                                            </Typography>
                                            <Typography variant="h4" component="div" color="primary">
                                                ¥{monthTotal.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {transactionCount}件の利用
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Card elevation={2}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                平均利用金額
                                            </Typography>
                                            <Typography variant="h4" component="div" color="info.main">
                                                ¥{averagePerTransaction.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                1回あたり
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Card elevation={2}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                日別平均
                                            </Typography>
                                            <Typography variant="h4" component="div" color="success.main">
                                                ¥{Math.round(monthTotal / new Date(year, month, 0).getDate()).toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                1日あたり
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* タブ */}
                            <Paper elevation={2} sx={{ borderRadius: 2 }}>
                                <Tabs
                                    value={tabValue}
                                    onChange={handleTabChange}
                                    variant="fullWidth"
                                    indicatorColor="primary"
                                    textColor="primary"
                                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                                >
                                    <Tab icon={<BarChartIcon />} label="週次" />
                                    <Tab icon={<TrendingUpIcon />} label="カテゴリ別" />
                                    <Tab icon={<CalendarIcon />} label="日別" />
                                </Tabs>

                                {/* 週次レポート */}
                                <TabPanel value={tabValue} index={0}>
                                    <Box sx={{ p: 2 }}>
                                        {weeklyData.length > 0 ? (
                                            <>
                                                <TableContainer>
                                                    <Table>
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>週</TableCell>
                                                                <TableCell align="right">件数</TableCell>
                                                                <TableCell align="right">合計金額</TableCell>
                                                                <TableCell align="right">平均金額</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {weeklyData.map((week) => (
                                                                <TableRow key={week.term}>
                                                                    <TableCell component="th" scope="row">
                                                                        {week.termName}
                                                                    </TableCell>
                                                                    <TableCell align="right">{week.count}件</TableCell>
                                                                    <TableCell align="right">¥{week.total.toLocaleString()}</TableCell>
                                                                    <TableCell align="right">
                                                                        ¥{(week.count > 0 ? Math.round(week.total / week.count) : 0).toLocaleString()}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                                データがありません
                                            </Typography>
                                        )}
                                    </Box>
                                </TabPanel>

                                {/* カテゴリ別レポート */}
                                <TabPanel value={tabValue} index={1}>
                                    <Box sx={{ p: 2 }}>
                                        {categoryData.length > 0 ? (
                                            <>
                                                <TableContainer>
                                                    <Table>
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>店舗</TableCell>
                                                                <TableCell align="right">利用回数</TableCell>
                                                                <TableCell align="right">合計金額</TableCell>
                                                                <TableCell align="right">平均金額</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {categoryData.map((category) => (
                                                                <TableRow key={category.store}>
                                                                    <TableCell component="th" scope="row">
                                                                        {category.store}
                                                                    </TableCell>
                                                                    <TableCell align="right">{category.count}回</TableCell>
                                                                    <TableCell align="right">¥{category.total.toLocaleString()}</TableCell>
                                                                    <TableCell align="right">¥{category.average.toLocaleString()}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                                データがありません
                                            </Typography>
                                        )}
                                    </Box>
                                </TabPanel>

                                {/* 日別レポート */}
                                <TabPanel value={tabValue} index={2}>
                                    <Box sx={{ p: 2 }}>
                                        {cardUsages.length > 0 ? (
                                            <>
                                                <TableContainer>
                                                    <Table>
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>日付</TableCell>
                                                                <TableCell>店舗</TableCell>
                                                                <TableCell>カード</TableCell>
                                                                <TableCell align="right">金額</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {[...cardUsages]
                                                                .sort((a, b) => a.datetime_of_use.toDate().getTime() - b.datetime_of_use.toDate().getTime())
                                                                .map((usage, index) => (
                                                                    <TableRow key={index}>
                                                                        <TableCell>
                                                                            {formatDate(usage.datetime_of_use.toDate())}
                                                                        </TableCell>
                                                                        <TableCell>{usage.where_to_use}</TableCell>
                                                                        <TableCell>
                                                                            {usage.card_name.length > 15
                                                                                ? `${usage.card_name.substring(0, 15)}...`
                                                                                : usage.card_name}
                                                                        </TableCell>
                                                                        <TableCell align="right">¥{usage.amount.toLocaleString()}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                                データがありません
                                            </Typography>
                                        )}
                                    </Box>
                                </TabPanel>
                            </Paper>
                        </>
                    )}
                </Box>
            </MainLayout>
        </ProtectedRoute>
    );
}