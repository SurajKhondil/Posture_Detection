import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
    style?: ViewStyle;
    darkMode?: boolean;
}

export function StatCard({
    icon: Icon,
    label,
    value,
    subValue,
    trend,
    variant = 'default',
    style,
    darkMode = false
}: StatCardProps) {
    return (
        <View style={[
            styles.container,
            darkMode && styles.containerDark,
            variant === 'success' && (darkMode ? styles.containerSuccessDark : styles.containerSuccess),
            variant === 'warning' && (darkMode ? styles.containerWarningDark : styles.containerWarning),
            variant === 'danger' && (darkMode ? styles.containerDangerDark : styles.containerDanger),
            variant === 'primary' && (darkMode ? styles.containerPrimaryDark : styles.containerPrimary),
            style
        ]}>
            <View style={styles.content}>
                <View style={[
                    styles.iconContainer,
                    variant === 'success' && styles.iconContainerSuccess,
                    variant === 'warning' && styles.iconContainerWarning,
                    variant === 'danger' && styles.iconContainerDanger,
                    variant === 'primary' && styles.iconContainerPrimary,
                ]}>
                    <Icon
                        size={20}
                        color={
                            variant === 'success' ? '#10b981' :
                                variant === 'warning' ? '#f59e0b' :
                                    variant === 'danger' ? '#ef4444' :
                                        variant === 'primary' ? '#6366f1' :
                                            '#6b7280'
                        }
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.label, darkMode && styles.labelDark]}>{label.toUpperCase()}</Text>
                    <View style={styles.valueContainer}>
                        <Text style={[styles.value, darkMode && styles.valueDark]}>{value}</Text>
                        {subValue && (
                            <Text style={[styles.subValue, darkMode && styles.subValueDark]}>{subValue}</Text>
                        )}
                    </View>
                </View>
                {trend && (
                    <View style={[
                        styles.trendBadge,
                        trend === 'up' && styles.trendUp,
                        trend === 'down' && styles.trendDown,
                        trend === 'neutral' && styles.trendNeutral,
                    ]}>
                        <Text style={[
                            styles.trendText,
                            trend === 'up' && styles.trendTextUp,
                            trend === 'down' && styles.trendTextDown,
                            trend === 'neutral' && styles.trendTextNeutral,
                        ]}>
                            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

interface ScoreRingProps {
    score: number;
    size?: number;
    strokeWidth?: number;
    style?: ViewStyle;
    darkMode?: boolean;
}

export function ScoreRing({
    score,
    size = 120,
    strokeWidth = 8,
    style,
    darkMode = false
}: ScoreRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Work';
    };

    return (
        <View style={[styles.scoreRingContainer, { width: size, height: size }, style]}>
            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                />
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={getScoreColor(score)}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={offset}
                />
            </Svg>
            <View style={styles.scoreRingContent}>
                <Text style={[styles.scoreValue, darkMode && styles.scoreValueDark]}>{score}</Text>
                <Text style={[styles.scoreLabel, darkMode && styles.scoreLabelDark]}>{getScoreLabel(score)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    containerSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    containerWarning: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    containerDanger: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    containerPrimary: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    containerDark: {
        backgroundColor: '#1a1f2e',
        borderColor: '#2d3548',
    },
    containerSuccessDark: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    containerWarningDark: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    containerDangerDark: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    containerPrimaryDark: {
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    iconContainer: {
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
    },
    iconContainerSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
    },
    iconContainerWarning: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
    },
    iconContainerDanger: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    iconContainerPrimary: {
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
    },
    textContainer: {
        flex: 1,
        minWidth: 0,
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
        color: '#6b7280',
        letterSpacing: 1,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginTop: 4,
    },
    value: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    subValue: {
        fontSize: 14,
        color: '#6b7280',
    },
    labelDark: {
        color: '#9ca3af',
    },
    valueDark: {
        color: '#f9fafb',
    },
    subValueDark: {
        color: '#9ca3af',
    },
    trendBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trendUp: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    trendDown: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    trendNeutral: {
        backgroundColor: '#f3f4f6',
    },
    trendText: {
        fontSize: 12,
        fontWeight: '500',
    },
    trendTextUp: {
        color: '#10b981',
    },
    trendTextDown: {
        color: '#ef4444',
    },
    trendTextNeutral: {
        color: '#6b7280',
    },
    scoreRingContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreRingContent: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreValue: {
        fontSize: 30,
        fontWeight: '700',
        color: '#111827',
    },
    scoreLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: '#6b7280',
    },
    scoreValueDark: {
        color: '#f9fafb',
    },
    scoreLabelDark: {
        color: '#9ca3af',
    },
});
