/**
 * Onboarding Slide 3 — "Track Your Progress"
 * Matches reference image 5 exactly:
 *   - Title + desc at TOP
 *   - Realistic 3D phone mockup in center with glowing ring (85), bar charts, floating panels
 *   - Dots CENTERED below phone
 *   - Get Started button + Skip at bottom
 */
import { getTheme } from '@/constants/theme';
import { useAppStore } from '@/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Line, Rect, Stop, LinearGradient as SvgGrad } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

// Stars + constellation  background
const StarsBg = () => {
    const stars = [
        [55, 40, 1.5], [140, 20, 1], [250, 55, 2], [340, 30, 1.5],
        [30, 160, 1], [380, 180, 2], [80, 280, 1.5], [350, 260, 1],
        [20, 520, 2], [370, 540, 1.5],
    ];
    const lines: [number, number, number, number][] = [
        [55, 40, 140, 20], [140, 20, 250, 55], [250, 55, 340, 30],
        [30, 160, 80, 280], [380, 180, 350, 260],
    ];
    return (
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 390 844" pointerEvents="none">
            {lines.map(([x1, y1, x2, y2], i) => (
                <Line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="rgba(59,91,219,0.25)" strokeWidth={1} />
            ))}
            {stars.map(([x, y, r], i) => (
                <Circle key={i} cx={x} cy={y} r={r} fill="rgba(255,255,255,0.6)" />
            ))}
        </Svg>
    );
};

// ── 3D Phone Mockup matching reference image 5 ────────────────────────────────
const PhoneMockup = () => {
    const pw = W * 0.62;
    const ph = pw * 2.05;
    const cx = pw / 2;

    // Score ring params
    const ringCy = ph * 0.36;
    const R = pw * 0.22;
    const circ = 2 * Math.PI * R;
    const dash = circ * 0.82;  // 82% = ~score 82/100

    const bars = [
        { x: pw * 0.18, height: ph * 0.11, color: '#3B5BDB' },
        { x: pw * 0.29, height: ph * 0.16, color: '#10B981' },
        { x: pw * 0.40, height: ph * 0.12, color: '#3B5BDB' },
        { x: pw * 0.51, height: ph * 0.19, color: '#10B981' },
        { x: pw * 0.62, height: ph * 0.14, color: '#3B5BDB' },
        { x: pw * 0.73, height: ph * 0.17, color: '#10B981' },
    ];
    const barW = pw * 0.08;
    const barBaseY = ph * 0.80;

    return (
        <View style={{ width: pw, height: ph }}>
            <Svg width={pw} height={ph} viewBox={`0 0 ${pw} ${ph}`}>
                <Defs>
                    <SvgGrad id="phoneBg" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.95" />
                        <Stop offset="100%" stopColor="#0F172A" stopOpacity="1" />
                    </SvgGrad>
                    <SvgGrad id="screenGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor="#1E2A4A" />
                        <Stop offset="100%" stopColor="#0F172A" />
                    </SvgGrad>
                    <SvgGrad id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0%" stopColor="#10B981" />
                        <Stop offset="100%" stopColor="#06B6D4" />
                    </SvgGrad>
                </Defs>

                {/* Glow beneath phone */}
                <Ellipse cx={cx} cy={ph * 0.92} rx={pw * 0.55} ry={ph * 0.04}
                    fill="#3B5BDB" opacity={0.35} />

                {/* Phone body — dark navy with blue tint */}
                <Rect x={pw * 0.04} y={ph * 0.01} width={pw * 0.92} height={ph * 0.96}
                    rx={pw * 0.11} fill="url(#phoneBg)" />

                {/* Thin border */}
                <Rect x={pw * 0.04} y={ph * 0.01} width={pw * 0.92} height={ph * 0.96}
                    rx={pw * 0.11} fill="none" stroke="#2D4E9E" strokeWidth={1.5} />

                {/* Phone screen */}
                <Rect x={pw * 0.08} y={ph * 0.04} width={pw * 0.84} height={ph * 0.90}
                    rx={pw * 0.08} fill="url(#screenGrad)" />

                {/* Dynamic island / notch */}
                <Rect x={cx - pw * 0.1} y={ph * 0.045}
                    width={pw * 0.2} height={ph * 0.03}
                    rx={pw * 0.05} fill="#0F172A" />

                {/* Score ring — track */}
                <Circle cx={cx} cy={ringCy} r={R}
                    stroke="#1E293B" strokeWidth={pw * 0.05}
                    fill="transparent" />

                {/* Score ring — filled (teal/cyan gradient) */}
                <Circle cx={cx} cy={ringCy} r={R}
                    stroke="url(#ringGrad)"
                    strokeWidth={pw * 0.05}
                    fill="transparent"
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${cx} ${ringCy})`}
                />

                {/* Score glow */}
                <Circle cx={cx} cy={ringCy} r={R * 0.6}
                    fill="#10B981" opacity={0.05} />

                {/* Bar charts */}
                {bars.map((b, i) => (
                    <Rect key={i}
                        x={b.x} y={barBaseY - b.height}
                        width={barW} height={b.height}
                        rx={3} fill={b.color} opacity={0.9} />
                ))}

                {/* Tab bar area at bottom of phone */}
                <Rect x={pw * 0.08} y={ph * 0.865} width={pw * 0.84} height={ph * 0.06}
                    rx={0} fill="#111827" opacity={0.8} />
                {[0.3, 0.5, 0.7].map((xRatio, i) => (
                    <Circle key={i} cx={pw * xRatio} cy={ph * 0.895} r={pw * 0.025}
                        fill={i === 1 ? '#3B5BDB' : '#334155'} />
                ))}
            </Svg>

            {/* Score text overlaid */}
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-start', paddingTop: ph * 0.28 }]}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: '#F9FAFB', lineHeight: 28 }}>85</Text>
                <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '600', marginTop: -2 }}>Score</Text>
            </View>
        </View>
    );
};

// ── Side floating chart panels (reference image 5 has them floating at sides) ─
const SidePanel = ({ side }: { side: 'left' | 'right' }) => {
    const bars = side === 'left'
        ? [0.5, 0.8, 0.6, 0.9]
        : [0.7, 0.5, 0.85, 0.65];
    return (
        <View style={[sp.wrap, side === 'left' ? sp.left : sp.right]}>
            {bars.map((h, i) => (
                <View key={i} style={[sp.bar, { height: 32 * h, backgroundColor: i % 2 === 0 ? '#3B5BDB' : '#10B981' }]} />
            ))}
        </View>
    );
};

const sp = StyleSheet.create({
    wrap: {
        position: 'absolute',
        flexDirection: 'row', alignItems: 'flex-end', gap: 4,
        backgroundColor: 'rgba(17,24,39,0.85)',
        borderRadius: 10, padding: 10,
        borderWidth: 1, borderColor: 'rgba(59,91,219,0.3)',
    },
    left: { left: -8, top: '35%' },
    right: { right: -8, top: '45%' },
    bar: { width: 10, borderRadius: 3 },
});

export default function OnboardingStep2() {
    const router = useRouter();
    const { darkMode } = useAppStore();
    const t = getTheme(darkMode);

    return (
        <View style={[s.container, { backgroundColor: t.bg }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
            {darkMode && <StarsBg />}

            {/* Title at TOP — above phone (exact match to reference image 5) */}
            <View style={s.titleBlock}>
                <Text style={[s.title, { color: t.text }]}>Track Your{'\n'}Progress</Text>
                <Text style={[s.desc, { color: t.textSec }]}>
                    Stay on top of your posture improvement{'\n'}and reduce long-term discomfort.
                </Text>
            </View>

            {/* Phone mockup with floating side panels */}
            <View style={s.phoneArea}>
                <SidePanel side="left" />
                <PhoneMockup />
                <SidePanel side="right" />
            </View>

            {/* Bottom */}
            <View style={s.bottom}>
                {/* Dots — CENTERED */}
                <View style={s.dots}>
                    <View style={s.dot} />
                    <View style={s.dot} />
                    <View style={[s.dot, s.dotActive]} />
                </View>

                {/* Get Started */}
                <Pressable
                    style={({ pressed }) => [s.btn, pressed && { opacity: 0.9 }]}
                    onPress={() => router.replace('/auth/login')}
                >
                    <LinearGradient
                        colors={['#3B5BDB', '#2563EB']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={s.btnGrad}
                    >
                        <Text style={s.btnText}>Get Started</Text>
                    </LinearGradient>
                </Pressable>

                {/* Skip */}
                <Pressable
                    style={({ pressed }) => [s.skipBtn, pressed && { opacity: 0.5 }]}
                    onPress={() => router.replace('/auth/login')}
                >
                    <Text style={[s.skipText, { color: t.textSec }]}>Skip</Text>
                </Pressable>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },

    // Title block at top
    titleBlock: {
        paddingTop: 52,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 34, fontWeight: '700', color: '#F9FAFB',
        textAlign: 'center', lineHeight: 44, marginBottom: 12,
    },
    desc: {
        fontSize: 15, color: '#9CA3AF',
        textAlign: 'center', lineHeight: 24,
    },

    // Phone area — centered, fills available space
    phoneArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },

    // Bottom section
    bottom: {
        paddingHorizontal: 20,
        paddingBottom: 36,
    },
    dots: {
        flexDirection: 'row', gap: 8,
        justifyContent: 'center',
        marginBottom: 20,
    },
    dot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dotActive: { width: 24, backgroundColor: '#3B5BDB' },
    btn: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
    btnGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: 17, fontWeight: '600', color: '#fff' },
    skipBtn: { alignItems: 'center', paddingVertical: 8 },
    skipText: { fontSize: 15, color: '#9CA3AF' },
});
