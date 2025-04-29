'use client';

import React, { useState } from 'react';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    CircularProgress
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signIn } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('メールアドレスとパスワードを入力してください');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await signIn(email, password);
            // 認証成功後、リダイレクトはProtectedRouteコンポーネントで処理される
        } catch (err) {
            setError('ログインに失敗しました。メールアドレスまたはパスワードが正しくありません。');
            console.error('ログインエラー:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute>
            <Container maxWidth="sm">
                <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            borderRadius: 2,
                            width: '100%',
                        }}
                    >
                        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                            RoCP - カード利用明細管理
                        </Typography>
                        <Typography component="h2" variant="h6" sx={{ mb: 3 }}>
                            ログイン
                        </Typography>
                        {error && (
                            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="メールアドレス"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="パスワード"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2, py: 1.2 }}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'ログイン'}
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </ProtectedRoute>
    );
}