import { useAppStore } from '@/store/userStore';
import { Tabs } from 'expo-router';
import { BarChart3, Camera, Home, Settings } from 'lucide-react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
    const { darkMode } = useAppStore();
    const insets = useSafeAreaInsets();

    const bgColor = darkMode ? '#0F172A' : '#F8FAFC';
    const borderColor = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
    const activeColor = '#3B5BDB';
    const inactiveColor = darkMode ? '#6B7280' : '#64748B';

    // Add bottom inset so tab bar sits ABOVE phone nav buttons
    const tabBarHeight = 56 + insets.bottom;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: activeColor,
                tabBarInactiveTintColor: inactiveColor,
                tabBarStyle: {
                    backgroundColor: bgColor,
                    borderTopWidth: 1,
                    borderTopColor: borderColor,
                    height: tabBarHeight,
                    paddingBottom: insets.bottom + 4,
                    paddingTop: 8,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 0.2,
                },
            }}
        >
            <Tabs.Screen name="_layout" options={{ href: null }} />
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size || 22} />,
                }}
            />
            <Tabs.Screen
                name="live"
                options={{
                    title: 'Live',
                    tabBarIcon: ({ color, size }) => <Camera color={color} size={size || 22} />,
                }}
            />
            <Tabs.Screen
                name="reports"
                options={{
                    title: 'Reports',
                    tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size || 22} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, size }) => <Settings color={color} size={size || 22} />,
                }}
            />
        </Tabs>
    );
}
