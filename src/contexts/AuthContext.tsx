'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

// コンテキストの型定義
interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

// デフォルト値
const defaultContext: AuthContextType = {
    currentUser: null,
    loading: true,
    signIn: async () => { },
    signOut: async () => { }
};

// コンテキスト作成
const AuthContext = createContext<AuthContextType>(defaultContext);

// コンテキストプロバイダーのProps型
interface AuthProviderProps {
    children: ReactNode;
}

// コンテキストプロバイダーコンポーネント
export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // 認証状態の監視
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // サインイン処理
    const signIn = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('サインインエラー:', error);
            throw error;
        }
    };

    // サインアウト処理
    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('サインアウトエラー:', error);
            throw error;
        }
    };

    const value = {
        currentUser,
        loading,
        signIn,
        signOut
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

// カスタムフック
export const useAuth = () => useContext(AuthContext);