'use client';

import React, { useState, ReactNode } from 'react';
import {
    AppBar,
    Box,
    Toolbar,
    IconButton,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Container,
    Button,
    useMediaQuery,
    Theme,
} from '@mui/material';
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
    CalendarMonth as CalendarIcon,
    BarChart as BarChartIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    Brightness4 as Brightness4Icon,
    Brightness7 as Brightness7Icon,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface MainLayoutProps {
    children: ReactNode;
}

const drawerWidth = 240;

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { signOut } = useAuth();
    const { mode, toggleThemeMode } = useTheme();
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

    const menuItems = [
        { text: 'ダッシュボード', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'カレンダー', icon: <CalendarIcon />, path: '/calendar' },
        { text: 'レポート', icon: <BarChartIcon />, path: '/reports' },
        { text: '設定', icon: <SettingsIcon />, path: '/settings' },
    ];

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleNavigation = (path: string) => {
        router.push(path);
        if (isMobile) {
            setOpen(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('ログアウト中にエラーが発生しました:', error);
        }
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${open ? drawerWidth : 0}px)` },
                    ml: { sm: `${open ? drawerWidth : 0}px` },
                    transition: (theme) =>
                        theme.transitions.create(['margin', 'width'], {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2 }}
                    >
                        {open ? <ChevronLeftIcon /> : <MenuIcon />}
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        RoCP - カード利用明細管理
                    </Typography>
                    <IconButton color="inherit" onClick={toggleThemeMode}>
                        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                    <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
                        ログアウト
                    </Button>
                </Toolbar>
            </AppBar>
            <Drawer
                variant={isMobile ? 'temporary' : 'persistent'}
                open={open}
                onClose={isMobile ? handleDrawerToggle : undefined}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton
                                    selected={pathname === item.path}
                                    onClick={() => handleNavigation(item.path)}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                    <List>
                        <ListItem disablePadding>
                            <ListItemButton onClick={handleLogout}>
                                <ListItemIcon>
                                    <LogoutIcon />
                                </ListItemIcon>
                                <ListItemText primary="ログアウト" />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${open ? drawerWidth : 0}px)` },
                    transition: (theme) =>
                        theme.transitions.create('margin', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                    ml: { sm: `${open ? drawerWidth : 0}px` },
                    mt: { xs: 8, sm: 9 },
                }}
            >
                <Container maxWidth="xl">{children}</Container>
            </Box>
        </Box>
    );
};

export default MainLayout;