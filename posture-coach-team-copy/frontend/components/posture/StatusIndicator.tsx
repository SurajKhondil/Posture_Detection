import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface PostureIndicatorProps {
    status: 'good' | 'warning' | 'bad';
    size?: 'sm' | 'md' | 'lg';
    showPulse?: boolean;
    style?: ViewStyle;
}

export function PostureIndicator({
    status,
    size = 'md',
    showPulse = false,
    style
}: PostureIndicatorProps) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (showPulse) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.5,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [showPulse, pulseAnim]);

    const sizeValue = size === 'sm' ? 12 : size === 'md' ? 20 : 32;

    return (
        <View style={[styles.container, style]}>
            {showPulse && (
                <Animated.View
                    style={[
                        styles.pulse,
                        {
                            width: sizeValue,
                            height: sizeValue,
                            borderRadius: sizeValue / 2,
                            transform: [{ scale: pulseAnim }],
                        },
                        status === 'good' && styles.pulseGood,
                        status === 'warning' && styles.pulseWarning,
                        status === 'bad' && styles.pulseBad,
                    ]}
                />
            )}
            <View
                style={[
                    styles.indicator,
                    {
                        width: sizeValue,
                        height: sizeValue,
                        borderRadius: sizeValue / 2,
                    },
                    status === 'good' && styles.indicatorGood,
                    status === 'warning' && styles.indicatorWarning,
                    status === 'bad' && styles.indicatorBad,
                ]}
            />
        </View>
    );
}

export function PostureStatusBadge({ status, darkMode = false }: { status: 'good' | 'warning' | 'bad'; darkMode?: boolean }) {
    const labels = {
        good: 'Good Posture',
        warning: 'Adjust Position',
        bad: 'Poor Posture',
    };

    return (
        <View style={[
            styles.badge,
            status === 'good' && styles.badgeGood,
            status === 'warning' && styles.badgeWarning,
            status === 'bad' && styles.badgeBad,
        ]}>
            <PostureIndicator status={status} size="sm" />
            <Text style={[
                styles.badgeText,
                status === 'good' && styles.badgeTextGood,
                status === 'warning' && styles.badgeTextWarning,
                status === 'bad' && styles.badgeTextBad,
            ]}>
                {labels[status]}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulse: {
        position: 'absolute',
        opacity: 0.4,
    },
    pulseGood: {
        backgroundColor: '#10b981',
    },
    pulseWarning: {
        backgroundColor: '#f59e0b',
    },
    pulseBad: {
        backgroundColor: '#ef4444',
    },
    indicator: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 5,
    },
    indicatorGood: {
        backgroundColor: '#10b981',
        shadowColor: '#10b981',
    },
    indicatorWarning: {
        backgroundColor: '#f59e0b',
        shadowColor: '#f59e0b',
    },
    indicatorBad: {
        backgroundColor: '#ef4444',
        shadowColor: '#ef4444',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    badgeGood: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    badgeWarning: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    badgeBad: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '500',
    },
    badgeTextGood: {
        color: '#10b981',
    },
    badgeTextWarning: {
        color: '#f59e0b',
    },
    badgeTextBad: {
        color: '#ef4444',
    },
});
