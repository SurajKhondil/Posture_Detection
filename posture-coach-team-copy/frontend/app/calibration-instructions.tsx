/**
 * Calibration Instructions Screen — "Before You Start"
 * Uses getTheme() — consistent dark/light across all screens
 * Matches reference image 2: 4 instruction cards + "Start Calibration" button
 */
import { getTheme } from '@/constants/theme';
import { apiStartTeam2Session } from '@/services/backendService';
import { useAppStore } from '@/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Eye, Lightbulb, Monitor, User } from 'lucide-react-native';
import React from 'react';
import {
    Platform, Pressable, SafeAreaView,
    ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { voiceService } from '@/services/voiceService';
import { useEffect } from 'react';

const steps = [
    {
        Icon: Monitor,
        title: 'Phone Position',
        desc: 'Place phone at chest or eye level (not looking up from a table)',
    },
    {
        Icon: User,
        title: 'Distance',
        desc: "Sit arm's length away (1–1.5 meters)",
    },
    {
        Icon: Eye,
        title: 'Visibility',
        desc: 'Ensure your head, shoulders, arms and torso are clearly visible',
    },
    {
        Icon: Lightbulb,
        title: 'Lighting',
        desc: 'Avoid sitting with a bright window behind you',
    },
];

export default function CalibrationInstructionsScreen() {
    const router = useRouter();
    const { darkMode } = useAppStore();
    const t = getTheme(darkMode);

    useEffect(() => {
        const instructions = [
            "Welcome to your posture calibration.",
            "To help our analysis engine build a perfect baseline for you, please follow these simple steps:",
            "First, ensure your phone is at eye level. This helps us measure your neck angle accurately.",
            "Next, sit about one meter away so we can see your full upper body.",
            "Make sure your head, shoulders, and torso are clearly visible in the frame.",
            "Finally, avoid sitting with bright light behind you; front lighting is best.",
            "When you're ready, tap Start Calibration, and I'll guide you through the two-step process."
        ].join(" ");
        
        voiceService.speak(instructions);
        
        return () => voiceService.stop();
    }, []);

    return (
        <View style={[s.container, { backgroundColor: t.bg }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
            <SafeAreaView style={s.safe}>
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                    <View style={s.header}>
                        <Text style={[s.title, { color: t.text }]}>Before You Start</Text>
                        <Text style={[s.sub, { color: t.textSec }]}>Follow these steps for accurate calibration</Text>
                    </View>

                    {/* 4 Step cards */}
                    <View style={s.steps}>
                        {steps.map((step, i) => (
                            <View key={i} style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
                                <View style={[s.iconBox, { backgroundColor: t.primary + '20' }]}>
                                    <step.Icon color={t.primary} size={20} />
                                </View>
                                <View style={s.cardContent}>
                                    <Text style={[s.cardTitle, { color: t.text }]}>{step.title}</Text>
                                    <Text style={[s.cardDesc, { color: t.textSec }]}>{step.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* During calibration tips */}
                    <View style={[s.tipsCard, { backgroundColor: t.card, borderColor: t.border }]}>
                        <Text style={[s.tipsTitle, { color: t.text }]}>During Calibration</Text>
                        {[
                            ['Sit Tall', 'in your best, most comfortable posture'],
                            ['Relax', "drop your shoulders, don't shrug"],
                            ['Look Straight', 'face the camera directly'],
                            ['Hold Still', 'stay frozen until the progress bar completes'],
                        ].map(([bold, rest], i) => (
                            <View key={i} style={s.tipRow}>
                                <View style={[s.tipDot, { backgroundColor: t.primary }]} />
                                <Text style={[s.tipText, { color: t.textSec }]}>
                                    <Text style={[s.tipBold, { color: t.text }]}>{bold}: </Text>{rest}
                                </Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                <View style={[s.footer, { backgroundColor: t.bg, borderTopColor: t.border }]}>
                    <Pressable
                        style={({ pressed }) => [s.btn, pressed && { opacity: 0.9 }]}
                        onPress={async () => {
                            router.push('/calibration');
                            try {
                                // is_calibration=true → upserts the calibration session (no duplicate rows)
                                await apiStartTeam2Session({ is_calibration: true });
                            } catch (e) {
                                console.error('Failed to initialize calibration session:', e);
                            }
                        }}
                    >
                        <LinearGradient
                            colors={['#3B5BDB', '#2563EB']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={s.btnGrad}
                        >
                            <Text style={s.btnText}>Start Calibration  →</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    safe: { flex: 1 },
    scroll: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 20 : 50, paddingBottom: 24 },
    header: { marginBottom: 32 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
    sub: { fontSize: 15, lineHeight: 22 },
    steps: { gap: 12, marginBottom: 20 },
    card: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, borderRadius: 16, padding: 16, borderWidth: 1 },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    cardContent: { flex: 1, gap: 4 },
    cardTitle: { fontSize: 16, fontWeight: '600' },
    cardDesc: { fontSize: 14, lineHeight: 20 },
    tipsCard: { borderRadius: 16, padding: 20, borderWidth: 1, gap: 12 },
    tipsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
    tipText: { flex: 1, fontSize: 14, lineHeight: 22 },
    tipBold: { fontWeight: '600' },
    footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 48, borderTopWidth: 1 },
    btn: { borderRadius: 16, overflow: 'hidden' },
    btnGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: 17, fontWeight: '600', color: '#fff' },
});
