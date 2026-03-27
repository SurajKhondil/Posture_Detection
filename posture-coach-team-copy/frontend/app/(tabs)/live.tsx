/**
 * Live Session Screen — reference image match
 * Header with insets.top so it never overlaps status bar/notch
 */
import { getTheme } from '@/constants/theme';
import { cameraService, PostureData } from '@/services/cameraService';
import { apiStartTeam2Session, apiIngestTeam2Frames, apiStopTeam2Frames } from '@/services/backendService';
import { notificationService } from '@/services/notificationService';
import { useAppStore } from '@/store/userStore';
import { Audio } from 'expo-av';
import { CameraType, CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { FlipHorizontal, Pause, Play, StopCircle } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { voiceService } from '@/services/voiceService';
import { poseDetectorService } from '@/services/mediapipe_pose_detector';
import { usePoseStore } from '@/store/pose_state_manager';
import { PosePainter } from '@/components/PosePainter';

const STATUS_COLORS: Record<string, string> = { good: '#14D1B5', warning: '#F59E0B', bad: '#EF4444' };
const STATUS_LABELS: Record<string, string> = { good: 'GOOD', warning: 'WARNING', bad: 'BAD' };

export default function LiveSessionScreen() {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [totalFrames, setTotalFrames] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [facing, setFacing] = useState<CameraType>('front');
  const [sound, setSound] = useState<Audio.Sound | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const goodPostureTimeRef = useRef(0);
  const sessionAlertsRef = useRef(0); // Track alerts for this session only

  const {
    currentPostureStatus,
    updatePostureStatus,
    updateTodayStats,
    todayGoodTime,
    todayAlerts,
    soundEnabled,
    notificationsEnabled,
    alertFrequency,
    addSession,
    darkMode,
  } = useAppStore();

  const t = getTheme(darkMode);
  const insets = useSafeAreaInsets();
  const sessionIdRef = useRef<number | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const { currentPose, calibratedMetrics, viewMode } = usePoseStore();
  const [containerLayout, setContainerLayout] = useState({ width: 0, height: 0 });

  useEffect(() => {
      poseDetectorService.initialize();
      return () => {
          poseDetectorService.dispose();
      };
  }, []);

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

  // ── Sync Settings to Refs for staleness-free callbacks ────────────────────
  const settingsRef = useRef({ notificationsEnabled, soundEnabled, todayAlerts, todayGoodTime });
  useEffect(() => {
    settingsRef.current = { notificationsEnabled, soundEnabled, todayAlerts, todayGoodTime };
  }, [notificationsEnabled, soundEnabled, todayAlerts, todayGoodTime]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    (async () => {
      const granted = await cameraService.checkPermissions();
      setHasPermission(granted);
    })();
    return () => { if (sound) sound.unloadAsync(); };
  }, []);

  const playAlertSound = async () => {
    if (!soundEnabled) return;
    try {
      const { sound: s } = await Audio.Sound.createAsync(
        { uri: 'data:audio/wav;base64,UklGRnoGAABXQVZF' },
        { shouldPlay: true, volume: 0.5 }
      );
      setSound(s);
      setTimeout(() => s.unloadAsync(), 1000);
    } catch { }
  };

  const handlePostureData = (data: PostureData) => {
    const { notificationsEnabled: notify, soundEnabled: soundOn, todayAlerts: alertsNow, todayGoodTime: goodMinNow } = settingsRef.current;
    
    updatePostureStatus(data.status);
    setTotalFrames(prev => prev + 1);

    if (data.status === 'good') {
      goodPostureTimeRef.current += Math.max(1, alertFrequency); // Increment by frequency seconds
      updateTodayStats({ goodTime: Math.floor(goodMinNow + (goodPostureTimeRef.current / 60)) });
    }

    if (data.status === 'bad') {
      if (notify) try { notificationService.sendPostureAlert('bad'); } catch { }
      if (soundOn) {
        playAlertSound();
        voiceService.speak("Straighten up.");
      }
      sessionAlertsRef.current += 1; // Increment session-only counter
      updateTodayStats({ alerts: alertsNow + 1 });
    } else if (data.status === 'warning' && notify) {
      try { notificationService.sendPostureAlert('warning'); } catch { }
      if (soundOn) {
        voiceService.speak("Posture warning.");
      }
    }

    // ── DATA BRIDGE: Send landmark angles to Team 2 Backend ──────────────────
    if (sessionIdRef.current) {
      apiIngestTeam2Frames(sessionIdRef.current, {
        ...data,
        frame_id: totalFrames
      }).catch(err => console.log('Backend sync failed:', err));
    }
  };

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => setSessionTime(p => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, isPaused]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleStart = async () => {
    if (!hasPermission) { Alert.alert('Camera Required', 'Please enable camera access in settings.'); return; }

    try {
      // Reuse calibration session ID (is_calibration=false → no new DB row)
      const res = await apiStartTeam2Session({ is_calibration: false });
      const sId = res.session_id;
      setSessionId(sId);
      sessionIdRef.current = sId;
    } catch (e) {
      console.error('Failed to start session:', e);
      setSessionId(null);
      sessionIdRef.current = null;
    }

    setTotalFrames(0);
    cameraService.startMonitoring(handlePostureData, alertFrequency * 1000);
    goodPostureTimeRef.current = 0;
    sessionAlertsRef.current = 0; // Reset for new session
    setIsActive(true);
    setIsPaused(false);
    voiceService.speak("Monitoring started.");
  };

  const handlePause = () => {
    if (isPaused) { cameraService.startMonitoring(handlePostureData, alertFrequency * 1000); setIsPaused(false); }
    else { cameraService.stopMonitoring(); setIsPaused(true); }
  };

  const handleEnd = async () => {
    const avgFps = sessionTime > 0 ? totalFrames / sessionTime : 0;

    if (sessionId) {
      try {
        // End session and save ONLY this session's alerts + good posture time to DB
        await apiStopTeam2Frames(sessionId, {
          alerts_count: sessionAlertsRef.current,
          good_time_seconds: goodPostureTimeRef.current,
        });
      } catch (e) {
        console.error('Failed to end analysis session:', e);
      }
    }

    if (sessionTime > 0) {
      addSession({
        id: sessionId?.toString() || Date.now().toString(),
        date: new Date().toLocaleDateString(),
        startTime: Date.now() - sessionTime * 1000,
        endTime: Date.now(),
        duration: sessionTime,
        averageScore: sessionTime > 0 ? Math.round((goodPostureTimeRef.current / sessionTime) * 100) : 0,
        goodPostureTime: goodPostureTimeRef.current,
        alerts: sessionAlertsRef.current,
      });
    }

    cameraService.stopMonitoring();
    setIsActive(false); setIsPaused(false); setSessionTime(0);
    setSessionId(null); setTotalFrames(0);
    goodPostureTimeRef.current = 0;
    updatePostureStatus('good');
    voiceService.speak("Monitoring ended.");
  };

  const goodPct = sessionTime > 0
    ? Math.round((goodPostureTimeRef.current / sessionTime) * 100)
    : 0;

  const statusColor = STATUS_COLORS[currentPostureStatus];

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={t.bg} />

      {/* ── Header — padded below status bar/notch via insets.top ──── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: t.text }]}>Live Session</Text>
        <View style={styles.headerRight}>
          {isActive && (
            <Text style={[styles.timerLabel, { color: t.text }]}>{formatTime(sessionTime)}</Text>
          )}
          <Pressable
            style={[styles.iconBtn, { backgroundColor: darkMode ? '#1F2937' : '#F1F5F9' }]}
            onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))}
          >
            <FlipHorizontal color={t.textSec} size={18} />
          </Pressable>
        </View>
      </View>

      {/* ── Camera — fullscreen rounded box ────────────────────────── */}
      <View style={[styles.cameraBox, { backgroundColor: darkMode ? '#1a1a2e' : '#D0D2DA' }]} onLayout={(e) => setContainerLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
        {hasPermission ? (
          <>
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
            {/* Status badge at top centre */}
            {isActive && (
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{STATUS_LABELS[currentPostureStatus]}</Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.noCamera}>
            <Text style={[styles.noCameraText, { color: t.textSec }]}>Camera not available</Text>
            <Text style={[styles.noCameraSmall, { color: t.textMuted }]}>Enable camera permissions to start</Text>
          </View>
        )}

        {hasPermission && containerLayout.width > 0 && currentPose && (
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
      </View>

      {/* ── Stats bar — BELOW camera, not overlaid ─────────────────── */}
      {isActive && (
        <View style={[styles.statsBar, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statBig, { color: t.text }]}>{formatTime(sessionTime)}</Text>
            <Text style={[styles.statSmall, { color: t.textSec }]}>Session Time</Text>
          </View>
          <View style={[styles.statSep, { backgroundColor: t.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statBig, { color: t.text }]}>{goodPct}%</Text>
            <Text style={[styles.statSmall, { color: t.textSec }]}>Posture</Text>
          </View>
        </View>
      )}

      {/* ── Controls ────────────────────────────────────────────────── */}
      <View style={[styles.controls, { paddingBottom: 16 }]}>
        {!isActive ? (
          <Pressable
            style={({ pressed }) => [styles.btnFull, pressed && { opacity: 0.9 }]}
            onPress={handleStart}
          >
            <LinearGradient colors={['#3B5BDB', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
              <Play color="#fff" size={20} fill="#fff" />
              <Text style={styles.btnText}>Start Session</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <View style={styles.activeControls}>
            <Pressable
              style={({ pressed }) => [styles.btnFlex, pressed && { opacity: 0.9 }]}
              onPress={handlePause}
            >
              <LinearGradient colors={['#3B5BDB', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
                {isPaused ? <Play color="#fff" size={20} fill="#fff" /> : <Pause color="#fff" size={20} />}
                <Text style={styles.btnText}>{isPaused ? 'Resume' : 'Pause'}</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btnEnd, { borderColor: t.border, backgroundColor: t.card }, pressed && { opacity: 0.8 }]}
              onPress={handleEnd}
            >
              <StopCircle color="#EF4444" size={20} />
              <Text style={styles.btnEndText}>End</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timerLabel: { fontSize: 16, fontWeight: '700' },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  // Camera — no horizontal margin so it fills edge to edge with no black gap
  cameraBox: {
    flex: 1, borderRadius: 0, overflow: 'hidden', position: 'relative',
  },
  statusRow: { position: 'absolute', top: 16, left: 0, right: 0, alignItems: 'center' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  statusText: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 1.5 },
  noCamera: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  noCameraText: { fontSize: 14, fontWeight: '500' },
  noCameraSmall: { fontSize: 12 },
  statsOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statBig: { fontSize: 28, fontWeight: '800' },
  statSmall: { fontSize: 12, marginTop: 2 },
  statSep: { width: 1, height: 40, marginHorizontal: 16 },
  // Stats bar row — sits below camera, not overlaid
  statsBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 16,
    borderTopWidth: 1,
  },
  // Controls
  controls: { paddingHorizontal: 16, paddingTop: 14 },
  btnFull: { borderRadius: 16, overflow: 'hidden' },
  btnFlex: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  btnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  activeControls: { flexDirection: 'row', gap: 12 },
  btnEnd: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingHorizontal: 20, borderRadius: 16, borderWidth: 1.5,
  },
  btnEndText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});
