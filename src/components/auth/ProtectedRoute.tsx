'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        // 認証状態のローディングが完了したら処理を実行
        if (!loading) {
            // ログインページにいる場合、認証済みならダッシュボードへリダイレクト
            if (pathname === '/login') {
                if (currentUser) {
                    router.push('/dashboard');
                } else {
                    setIsAuthorized(true);
                }
            }
            // その他のページでは、未認証ならログインページへリダイレクト
            else {
                if (!currentUser) {
                    router.push('/login');
                } else {
                    setIsAuthorized(true);
                }
            }
        }
    }, [currentUser, loading, router, pathname]);

    if (loading || isAuthorized === null) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    width: '100%',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return isAuthorized ? <>{children}</> : null;
};

export default ProtectedRoute;