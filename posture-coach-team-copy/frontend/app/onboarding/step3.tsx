/**
 * Onboarding Step 3 — "Track Your Progress"
 * Themed via getTheme() — works in both dark and light mode
 */
import { getTheme } from '@/constants/theme';
import { useAppStore } from '@/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, Rect, Stop, LinearGradient as SvgGrad, Text as SvgText } from 'react-native-svg';

const { width: W } = Dimensions.get('window');

const ConnectedMesh = ({ darkMode }: { darkMode: boolean }) => {
    const points = React.useMemo(() => {
        const p = [];
        for (let i = 0; i < 20; i++) {
            p.push({ x: Math.random() * W, y: Math.random() * 450 });
        }
        return p;
    }, []);

    const lines = React.useMemo(() => {
        const l = [];
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const dist = Math.sqrt(Math.pow(points[i].x - points[j].x, 2) + Math.pow(points[i].y - points[j].y, 2));
                if (dist < 120) {
                    l.push({ x1: points[i].x, y1: points[i].y, x2: points[j].x, y2: points[j].y, op: 1 - dist / 120 });
                }
            }
        }
        return l;
    }, [points]);

    const color = darkMode ? "#6366F1" : "#A5B4FC";

    return (
        <View style={StyleSheet.absoluteFill}>
            <Svg height="450" width={W}>
                {lines.map((l, i) => (
                    <Line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                        stroke={color} strokeWidth={0.6} strokeOpacity={l.op * 0.2}
                    />
                ))}
                {points.map((p, i) => (
                    <Circle key={i} cx={p.x} cy={p.y} r={1.5} fill={color} fillOpacity={0.15} />
                ))}
            </Svg>
        </View>
    );
};

const PhoneMockup = ({ darkMode, t }: { darkMode: boolean; t: any }) => (
    <View style={styles.mockupContainer}>
        <Svg width={300} height={400} viewBox="0 0 300 400">
            <Defs>
                <SvgGrad id="phoneGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={darkMode ? "#1E293B" : "#F8FAFC"} />
                    <Stop offset="100%" stopColor={darkMode ? "#0F172A" : "#CBD5E1"} />
                </SvgGrad>
                <SvgGrad id="ring" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#22D3EE" />
                    <Stop offset="100%" stopColor="#6366F1" />
                </SvgGrad>
                <SvgGrad id="glass" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                    <Stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                </SvgGrad>
            </Defs>

            {/* Floating Glass Panels */}
            <G transform="translate(15, 180) skewY(-5)">
                <Rect width={55} height={80} rx={12} fill="url(#glass)" stroke="rgba(255,255,255,0.1)" />
                <G transform="translate(10, 50)">
                    <Rect width={8} height={20} fill="#6366F1" rx={2} />
                    <Rect x={12} width={8} height={35} fill="#22D3EE" rx={2} y={-15} />
                    <Rect x={24} width={8} height={25} fill="#6366F1" rx={2} y={-5} />
                </G>
            </G>
            <G transform="translate(230, 210) skewY(5)">
                <Rect width={55} height={80} rx={12} fill="url(#glass)" stroke="rgba(255,255,255,0.1)" />
                <G transform="translate(10, 50)">
                    <Rect width={8} height={25} fill="#6366F1" rx={2} y={-5} />
                    <Rect x={12} width={8} height={40} fill="#22D3EE" rx={2} y={-20} />
                    <Rect x={24} width={8} height={15} fill="#6366F1" rx={2} y={5} />
                </G>
            </G>

            {/* 3D Phone Chassis */}
            <G transform="translate(75, 40) skewY(-6)">
                {/* Body & depth */}
                <Path d="M150,0 L160,8 L160,288 L150,280 Z" fill={darkMode ? "#0F172A" : "#94A3B8"} />
                <Rect width={150} height={280} rx={28} fill="url(#phoneGrad)" />
                <Rect x={8} y={8} width={134} height={264} rx={22} fill={darkMode ? "#111827" : "#FFFFFF"} />

                {/* Notch */}
                <Rect x={55} y={8} width={40} height={14} rx={7} fill={darkMode ? "#1F2937" : "#E5E7EB"} />

                {/* Internal UI: Score Ring */}
                <G transform="translate(67, 95)">
                    <Circle r={44} stroke={darkMode ? "#1F2937" : "#F3F4F6"} strokeWidth={8} fill="none" />
                    <Circle r={44} stroke="url(#ring)" strokeWidth={8} fill="none" strokeDasharray="180 280" strokeLinecap="round" transform="rotate(-90)" />
                    <SvgText fontSize="24" fontWeight="bold" fill={t.text} textAnchor="middle" dy={8}>85</SvgText>
                    <SvgText fontSize="9" fill={t.textSec} textAnchor="middle" dy={22}>Score</SvgText>
                </G>

                {/* Internal UI: Bottom Bars */}
                <G transform="translate(20, 190)">
                    {[20, 45, 65, 35, 50].map((h, i) => (
                        <Rect key={i} x={i * 22} y={65 - h} width={14} height={h} rx={4}
                            fill={i === 2 ? "#22D3EE" : "#6366F1"}
                        />
                    ))}
                </G>

                {/* Internal UI: Bottom Navbar Icon simulation */}
                <G transform="translate(15, 240)">
                    <Rect x={5} width={30} height={18} rx={6} fill={darkMode ? "#1F2937" : "#F3F4F6"} />
                    <Rect x={45} width={30} height={18} rx={6} fill={darkMode ? "#1F2937" : "#F3F4F6"} />
                    <Rect x={85} width={30} height={18} rx={6} fill={darkMode ? "#1F2937" : "#F3F4F6"} />
                </G>
            </G>
        </Svg>
    </View>
);

export default function OnboardingStep3() {
    const router = useRouter();
    const { darkMode } = useAppStore();
    const t = getTheme(darkMode);

    const handleNext = () => router.replace('/auth/login');
    const handleBack = () => router.back();

    return (
        <View style={[styles.container, { backgroundColor: t.bg }]}>
            <StatusBar
                barStyle={darkMode ? 'light-content' : 'dark-content'}
                backgroundColor={t.bg}
            />

            <ConnectedMesh darkMode={darkMode} />

            {/* Header — back + progress dots */}
            <View style={styles.header}>
                <Pressable
                    style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
                    onPress={handleBack}
                >
                    <ArrowLeft color={t.text} size={20} />
                </Pressable>

                {/* Progress: 3 of 3 all active */}
                <View style={styles.progressContainer}>
                    {[0, 1, 2].map(i => (
                        <View
                            key={i}
                            style={[styles.progressDot, { backgroundColor: t.primary }]}
                        />
                    ))}
                </View>

                {/* Spacer to balance header */}
                <View style={styles.iconButton} />
            </View>

            {/* Illustration Section */}
            <View style={styles.illustrationContainer}>
                <PhoneMockup darkMode={darkMode} t={t} />
            </View>

            {/* Content Section */}
            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: t.text }]}>Track Your Progress</Text>
                    <Text style={[styles.description, { color: t.textSec }]}>
                        Stay on top of your posture improvement and reduce long-term discomfort.
                    </Text>
                </View>

                {/* Paging Dots */}
                <View style={styles.dotsRow}>
                    {[0, 1, 2].map(i => (
                        <View key={i} style={[styles.dot, i === 2 ? styles.dotActive : null, { backgroundColor: i === 2 ? t.primary : t.border }]} />
                    ))}
                </View>

                <Pressable
                    style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]}
                    onPress={handleNext}
                >
                    <LinearGradient
                        colors={['#2563EB', '#6366F1']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                    >
                        <Text style={styles.buttonText}>Get Started</Text>
                        <ChevronRight color="#fff" size={20} />
                    </LinearGradient>
                </Pressable>

                <Pressable onPress={() => router.replace('/auth/signin')}>
                    <Text style={[styles.skip, { color: t.textMuted }]}>Skip</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24, paddingTop: 52, paddingBottom: 24 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 20,
    },
    iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    progressContainer: { flexDirection: 'row', gap: 8 },
    progressDot: { width: 32, height: 6, borderRadius: 3 },
    illustrationContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    mockupContainer: { width: 300, height: 380, alignItems: 'center', justifyContent: 'center' },
    content: { gap: 24 },
    textContainer: { alignItems: 'center', gap: 12 },
    title: { fontSize: 36, fontWeight: '700', textAlign: 'center' },
    description: { fontSize: 17, textAlign: 'center', lineHeight: 26, maxWidth: 320, paddingHorizontal: 10 },
    dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 4 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    dotActive: { width: 24 },
    button: { borderRadius: 28, overflow: 'hidden' },
    buttonGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 18, paddingHorizontal: 28,
    },
    buttonText: { fontSize: 18, fontWeight: '700', color: '#fff' },
    skip: { textAlign: 'center', fontSize: 16, fontWeight: '500' },
});
