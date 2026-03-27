/**
 * Onboarding Slide 2 — "Smart Posture Alerts"
 * ALL content vertically centered on the page:
 *   Bell icon (centered) → Title → Description → Color indicators → Dots → Next button
 */
import { getTheme } from '@/constants/theme';
import { useAppStore } from '@/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// Stars background
const StarsBg = () => {
    const stars = [
        [40, 80, 1.5], [120, 45, 1], [220, 75, 2], [300, 50, 1.5],
        [360, 120, 1], [30, 200, 1.5], [380, 250, 2], [70, 350, 1],
        [320, 320, 2], [160, 420, 1.5], [270, 470, 1], [50, 520, 2],
        [340, 560, 1.5], [180, 600, 1], [400, 640, 1.5],
    ];
    return (
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 390 844" pointerEvents="none">
            {stars.map(([x, y, r], i) => (
                <Circle key={i} cx={x} cy={y} r={r} fill="rgba(255,255,255,0.55)" />
            ))}
        </Svg>
    );
};

// Orange → Yellow gradient bell icon
const BellIcon = () => (
    <LinearGradient
        colors={['#10B981', '#F59E0B', '#EF4444']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={bell.box}
    >
        <Svg width={64} height={64} viewBox="0 0 24 24">
            <Path
                d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
                fill="white"
            />
        </Svg>
    </LinearGradient>
);

const bell = StyleSheet.create({
    box: {
        width: 130, height: 130, borderRadius: 32,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#F97316', shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.45, shadowRadius: 24, elevation: 16,
    },
});

const Dot = ({ color, label }: { color: string; label: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
        <Text style={{ fontSize: 14, color: '#9CA3AF' }}>{label}</Text>
    </View>
);

export default function OnboardingStep1() {
    const router = useRouter();
    const { darkMode } = useAppStore();
    const t = getTheme(darkMode);

    return (
        <View style={[s.container, { backgroundColor: t.bg }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
            {darkMode && <StarsBg />}

            {/* All content CENTERED vertically on page */}
            <View style={s.centered}>
                {/* Bell icon */}
                <View style={s.bellWrap}>
                    <BellIcon />
                </View>

                {/* Title */}
                <Text style={[s.title, { color: t.text }]}>Smart Posture Alerts</Text>

                {/* Description */}
                <Text style={[s.desc, { color: t.textSec }]}>
                    Get instant feedback with color indicators:{'\n'}
                    Green (good), Yellow (warning),{'\n'}
                    Red (poor).
                </Text>

                {/* Color indicators */}
                <View style={s.indicators}>
                    <Dot color="#10B981" label="Good" />
                    <Dot color="#F59E0B" label="Warning" />
                    <Dot color="#EF4444" label="Poor" />
                </View>

                {/* Dots — CENTERED */}
                <View style={s.dots}>
                    <View style={s.dot} />
                    <View style={[s.dot, s.dotActive]} />
                    <View style={s.dot} />
                </View>

                {/* Next button */}
                <Pressable
                    style={({ pressed }) => [s.btn, pressed && { opacity: 0.9 }]}
                    onPress={() => router.push('/onboarding/step2')}
                >
                    <LinearGradient
                        colors={['#3B5BDB', '#2563EB']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={s.btnGrad}
                    >
                        <Text style={s.btnText}>Next</Text>
                    </LinearGradient>
                </Pressable>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },

    // Single centered container — everything inside is vertically centered
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },

    bellWrap: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32, fontWeight: '700', color: '#F9FAFB',
        textAlign: 'center', alignSelf: 'center',
        marginBottom: 16,
    },
    desc: {
        fontSize: 15, color: '#9CA3AF', lineHeight: 24,
        textAlign: 'center', alignSelf: 'center', marginBottom: 28,
        maxWidth: 320,
    },
    indicators: {
        flexDirection: 'row', gap: 20,
        alignSelf: 'center', marginBottom: 48,
    },
    dots: {
        flexDirection: 'row', gap: 10,
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 48,
    },
    dot: {
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    dotActive: { backgroundColor: 'rgba(255,255,255,0.45)' },
    btn: { borderRadius: 16, overflow: 'hidden', alignSelf: 'stretch', width: '100%' },
    btnGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: 17, fontWeight: '600', color: '#fff' },
});
