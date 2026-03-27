import { getTheme } from '@/constants/theme';
import { useAppStore } from '@/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Stop, LinearGradient as SvgGrad } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

// ── Constellation mesh background ────────────────────────────────────────────
const ConstellationBg = ({ darkMode, t }: { darkMode: boolean; t: any }) => {
    const nodes: [number, number][] = [
        [30, 120], [90, 60], [180, 100], [260, 50], [330, 130],
        [370, 220], [310, 310], [200, 270], [80, 290], [20, 200],
        [140, 400], [300, 420], [60, 480], [350, 500], [180, 550],
        [40, 600], [320, 600], [100, 700], [280, 750],
    ];
    const lines: [number, number, number, number][] = [
        [30, 120, 90, 60], [90, 60, 180, 100], [180, 100, 260, 50],
        [260, 50, 330, 130], [330, 130, 370, 220], [370, 220, 310, 310],
        [310, 310, 200, 270], [200, 270, 80, 290], [80, 290, 20, 200],
        [20, 200, 30, 120], [310, 310, 300, 420], [300, 420, 350, 500],
    ];
    // Random stars
    const stars = Array.from({ length: 40 }).map((_, i) => [
        Math.random() * W,
        Math.random() * H,
        Math.random() * 1.5 + 0.5
    ]);

    return (
        <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${W} ${H}`} pointerEvents="none">
            <Defs>
                <RadialGradient id="glow" cx="50%" cy="40%" r="60%">
                    <Stop offset="0%" stopColor={t.primary} stopOpacity={darkMode ? 0.2 : 0.12} />
                    <Stop offset="100%" stopColor={t.bg} stopOpacity="0" />
                </RadialGradient>
            </Defs>
            <Circle cx={W / 2} cy={H * 0.4} r={W * 0.8} fill="url(#glow)" />
            {lines.map(([x1, y1, x2, y2], i) => (
                <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={darkMode ? "rgba(99,130,255,0.15)" : "rgba(37,99,235,0.08)"} strokeWidth={1} />
            ))}
            {nodes.map(([x, y], i) => (
                <Circle key={i} cx={x} cy={y} r={1.5} fill={darkMode ? "rgba(99,130,255,0.3)" : "rgba(37,99,235,0.15)"} />
            ))}
            {stars.map(([x, y, r], i) => (
                <Circle key={`s${i}`} cx={x} cy={y} r={r} fill={darkMode ? "rgba(255,255,255,0.4)" : "rgba(15,23,42,0.15)"} />
            ))}
        </Svg>
    );
};

// ── Sitting person illustration ───────────────────────────────────────────────
const PersonIllustration = ({ darkMode, t }: { darkMode: boolean; t: any }) => (
    <View style={il.wrap}>
        <Svg width={240} height={240} viewBox="0 0 240 240">
            <Defs>
                <RadialGradient id="sphereGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor={t.primary} stopOpacity={darkMode ? 0.4 : 0.25} />
                    <Stop offset="80%" stopColor={t.primary} stopOpacity={darkMode ? 0.1 : 0.05} />
                    <Stop offset="100%" stopColor={t.primary} stopOpacity="0" />
                </RadialGradient>
                <SvgGrad id="personGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={darkMode ? "#6366F1" : "#3B82F6"} />
                    <Stop offset="100%" stopColor={t.primary} />
                </SvgGrad>
            </Defs>
            {/* Soft sphere glow */}
            <Circle cx={120} cy={120} r={100} fill="url(#sphereGlow)" />
            {/* Glowing outer ring */}
            <Circle cx={120} cy={120} r={95} stroke={darkMode ? "rgba(99,130,255,0.3)" : "rgba(37,99,235,0.15)"} strokeWidth={1} fill="none" />
            <Circle cx={120} cy={120} r={94} stroke={darkMode ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.02)"} strokeWidth={3} fill="none" />

            {/* Chair back */}
            <Path d="M150 70 L150 148" stroke={darkMode ? "rgba(255,255,255,0.2)" : "rgba(30,41,59,0.1)"} strokeWidth={8} strokeLinecap="round" />
            {/* Chair seat */}
            <Path d="M70 148 L160 148" stroke={darkMode ? "rgba(255,255,255,0.2)" : "rgba(30,41,59,0.1)"} strokeWidth={8} strokeLinecap="round" />
            {/* Chair legs */}
            <Path d="M80 148 L80 190" stroke={darkMode ? "rgba(255,255,255,0.2)" : "rgba(30,41,59,0.1)"} strokeWidth={6} strokeLinecap="round" />
            <Path d="M150 148 L150 190" stroke={darkMode ? "rgba(255,255,255,0.2)" : "rgba(30,41,59,0.1)"} strokeWidth={6} strokeLinecap="round" />

            {/* Person head */}
            <Circle cx={115} cy={60} r={18} fill="url(#personGrad)" />
            <Circle cx={115} cy={60} r={18} fill={darkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.4)"} stroke={darkMode ? "rgba(255,255,255,0.2)" : "rgba(30,41,59,0.05)"} strokeWidth={1} />

            {/* Person torso - semi transparent body */}
            <Path d="M100 80 C100 76 130 76 130 80 L135 142 L95 142 Z" fill="url(#personGrad)" />
            <Path d="M100 80 C100 76 130 76 130 80 L135 142 L95 142 Z" fill={darkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.4)"} stroke={darkMode ? "rgba(255,255,255,0.2)" : "rgba(30,41,59,0.05)"} strokeWidth={1} />

            {/* Arms & Legs - simplified matching reference color flow */}
            <Path d="M85 142 L85 185" stroke="url(#personGrad)" strokeWidth={12} strokeLinecap="round" />
            <Path d="M145 142 L145 185" stroke="url(#personGrad)" strokeWidth={12} strokeLinecap="round" />

            {/* Success badge */}
            <Circle cx={150} cy={55} r={15} fill={t.success} />
            <Path d="M143 55 L148 60 L157 48" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    </View>
);

const il = StyleSheet.create({
    wrap: { alignItems: 'center', justifyContent: 'center' },
});

export default function OnboardingWelcome() {
    const router = useRouter();
    const { darkMode } = useAppStore();
    const t = getTheme(darkMode);

    return (
        <View style={[s.container, { backgroundColor: t.bg }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
            <ConstellationBg darkMode={darkMode} t={t} />

            {/* Back arrow */}
            <View style={s.topBar}>
                <Pressable
                    style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}
                    onPress={() => router.back()}
                >
                    <ArrowLeft color={t.text} size={22} />
                </Pressable>
            </View>

            {/* Title — centered at top matching reference exactly */}
            <View style={s.titleBlock}>
                <Text style={[s.title, { color: t.text }]}>Perfect Posture,</Text>
                <Text style={[s.title, { color: darkMode ? '#B4BCFF' : t.primary, marginTop: 4 }]}>Healthy Life</Text>
            </View>

            {/* Illustration — center of page */}
            <View style={s.illustrationBlock}>
                <PersonIllustration darkMode={darkMode} t={t} />
            </View>

            {/* Description */}
            <Text style={[s.description, { color: t.textSec }]}>
                Use AI-powered camera monitoring to{'\n'}maintain correct sitting posture and prevent back pain.
            </Text>

            {/* Bottom: button + terms */}
            <View style={s.bottom}>
                <Pressable
                    style={({ pressed }) => [s.btn, pressed && { opacity: 0.9 }]}
                    onPress={() => router.push('/onboarding/step1')}
                >
                    <LinearGradient
                        colors={[t.primary, darkMode ? '#312E81' : '#1D4ED8']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={s.btnGrad}
                    >
                        <Text style={s.btnText}>Get Started</Text>
                    </LinearGradient>
                </Pressable>
                <Text style={[s.terms, { color: t.textMuted }]}>By continuing, you agree to our{' '}
                    <Text style={{ color: darkMode ? '#B4BCFF' : t.primary }}>Terms of Service</Text>
                </Text>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    topBar: { paddingTop: 52, paddingHorizontal: 20, marginBottom: 8 },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    titleBlock: { alignItems: 'center', marginTop: 8, marginBottom: 0 },
    title: { fontSize: 32, fontWeight: '700', textAlign: 'center', lineHeight: 40 },
    illustrationBlock: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    description: {
        fontSize: 16, textAlign: 'center',
        lineHeight: 24, paddingHorizontal: 40, marginBottom: 36,
    },
    bottom: { paddingHorizontal: 20, paddingBottom: 40 },
    btn: { borderRadius: 26, overflow: 'hidden', marginBottom: 16 },
    btnGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: 17, fontWeight: '600', color: '#fff' },
    terms: { fontSize: 13, textAlign: 'center' },
});
