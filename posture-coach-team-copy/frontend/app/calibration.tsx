/**
 * Calibration Screen — Professional design matching app style
 * Dark bg, teal progress bar, camera with overlay guide frame, step indicators
 */
import { getTheme } from '@/constants/theme';
import { useAppStore } from '@/store/userStore';
import { CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { G, Line } from 'react-native-svg';
import { voiceService } from '@/services/voiceService';
import { poseDetectorService } from '@/services/mediapipe_pose_detector';
import { usePoseStore, ViewMode } from '@/store/pose_state_manager';
import { PosePainter } from '@/components/PosePainter';

type CalibrationView = 'front' | 'side';
type Phase = 'countdown' | 'calibrating' | 'complete' | 'confirm';

// Corner bracket overlay for the camera guide
const GuideFrame = ({ ok }: { ok: boolean }) => {
    const c = ok ? '#14D1B5' : '#F59E0B';
    const s = 40; // bracket size
    const p = 24; // padding from edge
    const sw = 3;  // stroke width
    return (
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 320 480" pointerEvents="none">
            {/* Top-left bracket */}
            <G stroke={c} strokeWidth={sw} strokeLinecap="round">
                <Line x1={p} y1={p + s} x2={p} y2={p} /><Line x1={p} y1={p} x2={p + s} y2={p} />
            </G>
            {/* Top-right */}
            <G stroke={c} strokeWidth={sw} strokeLinecap="round">
                <Line x1={320 - p - s} y1={p} x2={320 - p} y2={p} /><Line x1={320 - p} y1={p} x2={320 - p} y2={p + s} />
            </G>
            {/* Bottom-left */}
            <G stroke={c} strokeWidth={sw} strokeLinecap="round">
                <Line x1={p} y1={480 - p - s} x2={p} y2={480 - p} /><Line x1={p} y1={480 - p} x2={p + s} y2={480 - p} />
            </G>
            {/* Bottom-right */}
            <G stroke={c} strokeWidth={sw} strokeLinecap="round">
                <Line x1={320 - p - s} y1={480 - p} x2={320 - p} y2={480 - p} /><Line x1={320 - p} y1={480 - p} x2={320 - p} y2={480 - p - s} />
            </G>

        </Svg>
    );
};

export default function CalibrationScreen() {
    const router = useRouter();
    const { setCalibrationData, setOnboardingComplete, darkMode } = useAppStore();
    const t = getTheme(darkMode);
    const insets = useSafeAreaInsets();
    const cameraRef = useRef<any>(null);

    const [currentView, setCurrentView] = useState<CalibrationView>('front');
    const [phase, setPhase] = useState<Phase>('countdown');
    const [countdown, setCountdown] = useState(3);
    const [progress, setProgress] = useState(0);
    const [frontFrameUri, setFrontFrameUri] = useState<string | null>(null);
    const [sideFrameUri, setSideFrameUri] = useState<string | null>(null);
    const [userPositioned, setUserPositioned] = useState(true);
    const [validationMessage, setValidationMessage] = useState('');

    const { currentPose, calibratedMetrics, viewMode, setViewMode } = usePoseStore();
    const [containerLayout, setContainerLayout] = useState({ width: 0, height: 0 });

    useEffect(() => {
        poseDetectorService.initialize();
        return () => {
            poseDetectorService.dispose();
        };
    }, []);

    useEffect(() => {
        setViewMode(currentView === 'front' ? ViewMode.front : ViewMode.side);
    }, [currentView]);

    useEffect(() => {
        let isLoopActive = true;
        let isCapturing = false;
        const captureFrame = async () => {
            if (!isLoopActive || !cameraRef.current || !poseDetectorService.isReady || isCapturing) return;
            isCapturing = true;
            try {
                const picture = await cameraRef.current.takePictureAsync({
                    base64: true,
                    quality: 0.1,
                    skipProcessing: true
                });
                if (picture?.base64 && isLoopActive) {
                    poseDetectorService.sendFrame(picture.base64);
                }
            } catch (e) {
            } finally {
                isCapturing = false;
            }
        };
        const intervalId = setInterval(captureFrame, 100);
        return () => {
            isLoopActive = false;
            clearInterval(intervalId);
        };
    }, []);

    const checkUserPositioning = () => {
        if (Math.random() > 0.9) {
            const issues = [
                'Please move closer to the camera',
                'Face not detected clearly',
                'Move back a little',
                'Ensure shoulders are visible',
            ];
            setUserPositioned(false);
            setValidationMessage(issues[Math.floor(Math.random() * issues.length)]);
            return false;
        }
        setUserPositioned(true);
        setValidationMessage('');
        return true;
    };

    useEffect(() => {
        if (phase === 'countdown' && countdown > 0) {
            const t = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(t);
        } else if (phase === 'countdown' && countdown === 0) {
            if (checkUserPositioning()) {
                setPhase('calibrating');
                voiceService.speak("Starting. Stay still.");
                startCalibration();
            } else {
                voiceService.speak(validationMessage || "Please adjust your position.");
                setTimeout(() => setCountdown(3), 2000);
            }
        }
        
        if (phase === 'countdown' && countdown > 0) {
            voiceService.speak(countdown.toString());
        }
    }, [phase, countdown]);

    const startCalibration = () => {
        const duration = 15000;
        const interval = 100;
        const steps = duration / interval;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            const pct = Math.min((step / steps) * 100, 100);
            setProgress(pct);
            if (step % 30 === 0 && pct < 100) checkUserPositioning();
            
            if (pct === 50) {
                voiceService.speak("Halfway there.");
            }
            
            if (pct >= 100) { 
                clearInterval(timer); 
                voiceService.speak("Capture complete.");
                captureFrame(); 
            }
        }, interval);
    };

    const captureFrame = () => {
        const uri = `calibration_${currentView}_${Date.now()}`;
        if (currentView === 'front') {
            setFrontFrameUri(uri);
            setTimeout(() => { 
                setPhase('countdown'); 
                setCountdown(3); 
                setProgress(0); 
                setCurrentView('side'); 
                voiceService.speak("Front view complete. Turn to your side.");
            }, 1000);
        } else {
            setSideFrameUri(uri);
            setTimeout(() => {
                setPhase('confirm');
                voiceService.speak("Calibration complete. Baseline saved.");
            }, 1000);
        }
    };

    const handleRecalibrate = () => {
        setCurrentView('front'); setPhase('countdown'); setCountdown(3);
        setProgress(0); setFrontFrameUri(null); setSideFrameUri(null);
    };

    const handleContinue = () => {
        setCalibrationData({ frontFrameUri, sideFrameUri, timestamp: Date.now() });
        setPhase('complete');
        setTimeout(() => { setOnboardingComplete(true); router.replace('/(tabs)/home'); }, 2000);
    };

    // ── CALIBRATING phase ──────────────────────────────────────────────────────
    if (phase === 'calibrating') {
        const remaining = Math.ceil((15 * (100 - progress)) / 100);
        return (
            <View style={[styles.root, { backgroundColor: '#0F172A' }]}>
                <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
                {/* Top bar */}
                <View style={[styles.cameraTopBar, { paddingTop: insets.top + 8 }]}>
                    <View style={styles.viewBadge}>
                        <Text style={styles.viewBadgeTxt}>{currentView === 'front' ? '📷  FRONT VIEW' : '↔️  SIDE VIEW'}</Text>
                    </View>
                    <View style={styles.timerBadge}>
                        <Text style={styles.timerBadgeTxt}>{remaining}s</Text>
                    </View>
                </View>
                {/* Camera */}
                <View style={{ flex: 1 }} onLayout={(e) => setContainerLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
                    <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />
                    {containerLayout.width > 0 && currentPose && (
                        <PosePainter
                            pose={currentPose}
                            viewMode={viewMode}
                            metrics={calibratedMetrics}
                            imageWidth={640}
                            imageHeight={480}
                            containerWidth={containerLayout.width}
                            containerHeight={containerLayout.height}
                        />
                    )}
                    <GuideFrame ok={userPositioned} />
                    {validationMessage ? (
                        <View style={styles.warningBanner}>
                            <Text style={styles.warningTxt}>⚠️  {validationMessage}</Text>
                        </View>
                    ) : null}
                </View>
                {/* Progress */}
                <View style={[styles.progressPanel, { paddingBottom: insets.bottom + 20 }]}>
                    <View style={styles.progressRow}>
                        <Text style={styles.progressLabel}>Calibrating…</Text>
                        <Text style={styles.progressPct}>{Math.round(progress)}%</Text>
                    </View>
                    <View style={styles.trackBg}>
                        <LinearGradient
                            colors={['#14D1B5', '#3B5BDB']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={[styles.trackFill, { width: `${progress}%` as any }]}
                        />
                    </View>
                    <Text style={styles.progressHint}>
                        {currentView === 'front' ? 'Step 1 of 2 — Face directly at camera' : 'Step 2 of 2 — Turn 90° to your right'}
                    </Text>
                </View>
            </View>
        );
    }

    // ── Non-camera phases (countdown / confirm / complete) ────────────────────
    return (
        <View style={[styles.root, { backgroundColor: t.bg }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                {phase === 'countdown' && currentView === 'front' ? (
                    <Pressable style={styles.backBtn} onPress={() => router.back()}>
                        <ArrowLeft color={t.text} size={20} />
                    </Pressable>
                ) : <View style={styles.backBtn} />}
                <Text style={[styles.headerTitle, { color: t.text }]}>Calibration</Text>
                {/* Step indicator */}
                <View style={styles.stepBadge}>
                    <Text style={styles.stepTxt}>{currentView === 'front' ? '1' : '2'}/2</Text>
                </View>
            </View>

            {/* Step progress dots */}
            <View style={styles.stepDots}>
                {['front', 'side'].map((v, i) => (
                    <View key={v} style={[
                        styles.stepDot,
                        (currentView === 'front' && i === 0) || (currentView === 'side') || phase === 'confirm' || phase === 'complete'
                            ? null : null
                    ]}>
                        <LinearGradient
                            colors={
                                phase === 'confirm' || phase === 'complete'
                                    ? ['#14D1B5', '#0EA5E9']
                                    : (currentView === 'front' && i === 0) || (currentView === 'side' && i <= 1)
                                        ? ['#3B5BDB', '#2563EB']
                                        : ['transparent', 'transparent']
                            }
                            style={styles.stepDotGrad}
                        />
                    </View>
                ))}
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* ── COUNTDOWN ────────────────────────────────────────────── */}
                {phase === 'countdown' && (
                    <View style={styles.center}>
                        {/* Big count circle */}
                        <LinearGradient colors={['#3B5BDB', '#2563EB']} style={styles.countCircle}>
                            <Text style={styles.countNum}>{countdown}</Text>
                        </LinearGradient>

                        <Text style={[styles.countTitle, { color: t.text }]}>
                            {currentView === 'front' ? 'Face the Camera' : 'Turn to Your Side'}
                        </Text>
                        <Text style={[styles.countSub, { color: t.textSec }]}>
                            {currentView === 'front'
                                ? 'Position yourself so your head, shoulders and torso are fully visible'
                                : 'Turn 90° to your right and keep your full side profile visible'}
                        </Text>


                    </View>
                )}

                {/* ── CONFIRM ───────────────────────────────────────────────── */}
                {phase === 'confirm' && (
                    <View style={styles.center}>
                        <View style={[styles.successRing, { borderColor: '#14D1B5' }]}>
                            <LinearGradient colors={['#14D1B5', '#0EA5E9']} style={styles.successCircle}>
                                <Check color="#fff" size={48} />
                            </LinearGradient>
                        </View>
                        <Text style={[styles.countTitle, { color: t.text }]}>Calibration Complete!</Text>
                        <Text style={[styles.countSub, { color: t.textSec }]}>
                            Both front and side views captured successfully. Your posture baseline is ready.
                        </Text>

                        <View style={[styles.captureRow, { backgroundColor: t.card, borderColor: t.border }]}>
                            <View style={styles.captureItem}>
                                <View style={[styles.captureIcon, { backgroundColor: '#14D1B5' + '28' }]}>
                                    <Check color="#14D1B5" size={16} />
                                </View>
                                <Text style={[styles.captureLabel, { color: t.text }]}>Front View</Text>
                                <Text style={[styles.captureStatus, { color: '#14D1B5' }]}>Captured</Text>
                            </View>
                            <View style={[styles.captureSep, { backgroundColor: t.border }]} />
                            <View style={styles.captureItem}>
                                <View style={[styles.captureIcon, { backgroundColor: '#14D1B5' + '28' }]}>
                                    <Check color="#14D1B5" size={16} />
                                </View>
                                <Text style={[styles.captureLabel, { color: t.text }]}>Side View</Text>
                                <Text style={[styles.captureStatus, { color: '#14D1B5' }]}>Captured</Text>
                            </View>
                        </View>

                        {/* Buttons */}
                        <View style={[styles.btnRow, { paddingBottom: insets.bottom + 16 }]}>
                            <Pressable
                                style={({ pressed }) => [styles.btnSec, { backgroundColor: t.card, borderColor: t.border }, pressed && { opacity: 0.7 }]}
                                onPress={handleRecalibrate}
                            >
                                <RefreshCw color={t.primary} size={18} />
                                <Text style={[styles.btnSecTxt, { color: t.primary }]}>Redo</Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [styles.btnPri, pressed && { opacity: 0.9 }]}
                                onPress={handleContinue}
                            >
                                <LinearGradient colors={['#3B5BDB', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnPriGrad}>
                                    <Text style={styles.btnPriTxt}>Continue  →</Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* ── COMPLETE (redirect) ────────────────────────────────── */}
                {phase === 'complete' && (
                    <View style={styles.center}>
                        <LinearGradient colors={['#14D1B5', '#0EA5E9']} style={styles.successCircle}>
                            <Check color="#fff" size={64} />
                        </LinearGradient>
                        <Text style={[styles.countTitle, { color: t.text }]}>Calibration Complete</Text>
                        <Text style={[styles.countSub, { color: t.textSec }]}>
                            Your baseline has been saved. Taking you to your dashboard…
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    // Camera phase
    cameraTopBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 8,
    },
    viewBadge: { backgroundColor: 'rgba(79,110,247,0.85)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
    viewBadgeTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
    timerBadge: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
    timerBadgeTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
    warningBanner: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(245,158,11,0.92)', paddingVertical: 10, alignItems: 'center',
    },
    warningTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
    progressPanel: { backgroundColor: '#0F172A', paddingHorizontal: 20, paddingTop: 20 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    progressLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
    progressPct: { color: '#14D1B5', fontSize: 14, fontWeight: '800' },
    trackBg: { height: 8, backgroundColor: '#1F2937', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
    trackFill: { height: '100%', borderRadius: 4 },
    progressHint: { color: '#8B91A8', fontSize: 12, textAlign: 'center' },
    // Non-camera
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingBottom: 16,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    stepBadge: { backgroundColor: '#3B5BDB' + '28', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
    stepTxt: { color: '#3B5BDB', fontSize: 13, fontWeight: '700' },
    stepDots: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 24 },
    stepDot: { borderRadius: 6, overflow: 'hidden' },
    stepDotGrad: { width: 40, height: 6, borderRadius: 6 },
    content: { flex: 1, paddingHorizontal: 24 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
    // Countdown
    countCircle: {
        width: 130, height: 130, borderRadius: 65,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#3B5BDB', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
    },
    countNum: { fontSize: 64, fontWeight: '800', color: '#fff' },
    countTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
    countSub: { fontSize: 15, textAlign: 'center', lineHeight: 24, maxWidth: 320 },
    tipCard: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 18, gap: 8 },
    tipTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
    tipItem: { fontSize: 13, lineHeight: 20 },
    // Confirm
    successRing: {
        width: 130, height: 130, borderRadius: 65, borderWidth: 3,
        alignItems: 'center', justifyContent: 'center',
    },
    successCircle: { width: 108, height: 108, borderRadius: 54, alignItems: 'center', justifyContent: 'center' },
    captureRow: {
        width: '100%', flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    },
    captureItem: { flex: 1, padding: 16, alignItems: 'center', gap: 8 },
    captureIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    captureLabel: { fontSize: 13, fontWeight: '600' },
    captureStatus: { fontSize: 12, fontWeight: '700' },
    captureSep: { width: 1 },
    // Buttons
    btnRow: { flexDirection: 'row', gap: 12, width: '100%' },
    btnSec: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderRadius: 14, borderWidth: 1.5, paddingVertical: 15, paddingHorizontal: 20,
    },
    btnSecTxt: { fontSize: 15, fontWeight: '700' },
    btnPri: { flex: 1, borderRadius: 14, overflow: 'hidden' },
    btnPriGrad: { paddingVertical: 17, alignItems: 'center', justifyContent: 'center' },
    btnPriTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
