import { getTheme } from '@/constants/theme';
import { useAppStore } from '@/store/userStore';
import { apiGetTeam2Dashboard, apiGetTeam2Results } from '@/services/backendService';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Activity, Brain, Heart, Play, User } from 'lucide-react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgGrad } from 'react-native-svg';
import { notificationService } from '@/services/notificationService';
import { calculateWeeklyStats, getCurrentISOWeek } from '@/utils/postureUtils';

// ── Score Ring — teal gradient matching reference ─────────────────────────────
function ScoreRing({ score, size = 170, textColor, trackColor, statusText }: {
  score: number; size?: number; textColor: string; trackColor: string; statusText?: string;
}) {
  const stroke = 15;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const label = "Good Posture"; // Consistently label the metric

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <SvgGrad id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#14D1B5" />
            <Stop offset="100%" stopColor="#06B6D4" />
          </SvgGrad>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r}
          stroke={trackColor} strokeWidth={stroke} fill="transparent" />
        <Circle cx={size / 2} cy={size / 2} r={r}
          stroke="url(#ringGrad)" strokeWidth={stroke}
          fill="transparent" strokeDasharray={circ}
          strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={[styles.ringScore, { color: textColor }]}>{score}</Text>
        <Text style={styles.ringLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { darkMode, userId, userProfile, lastWeeklyRecapWeek, setLastWeeklyRecapWeek } = useAppStore();
  const t = getTheme(darkMode);
  const insets = useSafeAreaInsets();

  // ── Dynamic State ──────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [latestResults, setLatestResults] = useState<any>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      if (!userId) return;
      // Single call — enriched dashboard returns all aggregated stats
      const data = await apiGetTeam2Dashboard(userId);
      setDashboardData(data);

      // Fetch per-metric results for Risk Intelligence cards
      if (data.latest_session_id) {
        try {
          const results = await apiGetTeam2Results(data.latest_session_id);
          setLatestResults(results);
        } catch { setLatestResults(null); }
      } else {
        setLatestResults(null);
      }

      // ── Automatic Weekly Recap Trigger ───────────────────────────
      const now = new Date();
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      const currentWeekId = getCurrentISOWeek();

      if (isWeekend && lastWeeklyRecapWeek !== currentWeekId && data.sessions?.length > 0) {
        const stats = calculateWeeklyStats(data.sessions);
        if (stats.avgScore > 0) {
          notificationService.sendWeeklySummary(stats.avgScore, stats.goodTimeH);
          setLastWeeklyRecapWeek(currentWeekId);
        }
      }

    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Data Mapping — all from Team 2 engine output ───────────────────────────
  // Posture score (0–100, higher = better posture)
  const score = dashboardData?.posture_score ?? 0;
  // Dashboard stat cards
  const sessionCount = dashboardData?.total_sessions ?? 0;
  const totalAlerts = dashboardData?.total_alerts ?? 0;
  const goodTimeMin = Math.round(dashboardData?.total_good_time_minutes ?? 0);
  const riskLevelStr: string = dashboardData?.risk_level ?? 'None';

  // Risk Intelligence: map per-metric status from posture_results via latest session
  const metrics = latestResults?.results || {};
  // Config key labels match scoring engine: FRONT_neck_bend, FRONT_shoulder_slope, etc.
  const RISK_METRIC_MAP: Record<string, string> = {
    Neck:     'FRONT_neck_bend',
    Head:     'SIDE_neck_bend',
    Shoulder: 'FRONT_shoulder_slope',
    Torso:    'FRONT_torso_tilt',
  };
  const riskItems = [
    { area: 'Neck',     Icon: User },
    { area: 'Head',     Icon: Brain },
    { area: 'Shoulder', Icon: Activity },
    { area: 'Torso',    Icon: Heart },
  ].map(item => {
    const key = RISK_METRIC_MAP[item.area];
    const row = metrics[key];
    let riskLevel = 'low';
    if (row?.risk_percent !== undefined) {
      const rp: number = row.risk_percent;
      riskLevel = rp > 60 ? 'high' : rp > 30 ? 'medium' : 'low';
    }
    return { area: item.area, Icon: item.Icon, risk: riskLevel };
  });

  const onRefresh = () => { setRefreshing(true); fetchDashboard(); };

  const name = userProfile?.name || dashboardData?.username || 'User';
  const firstName = name.split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase();
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  const riskColor = (r: string) => r === 'low' ? t.success : r === 'medium' ? t.warning : t.danger;

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primary} />}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: 24 }
        ]}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerSub, { color: t.textSec }]}>Posture Intelligence</Text>
            <Text style={[styles.headerGreeting, { color: t.text }]}>
              {greeting}, {firstName}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/profile')}>
            <LinearGradient colors={['#3B5BDB', '#2563EB']} style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* ── Posture Score Card ───────────────────────────────────── */}
          <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={styles.scoreCardTop}>
              <Text style={[styles.cardLabel, { color: t.textSec }]}>Posture Score</Text>
            <View style={styles.miniBarWrap}>
              {[6, 10, 14, 9, 13].map((h, i) => (
                <View key={i} style={[styles.miniBar, { height: h, backgroundColor: t.primary + '70' }]} />
              ))}
            </View>
          </View>

          <View style={styles.ringWrap}>
            <ScoreRing
              score={score}
              size={170}
              textColor={t.text}
              statusText={score === 0 ? "Needs Data" : score > 80 ? "Great" : "Needs Work"}
              trackColor={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.10)'}
            />
          </View>
          <Text style={styles.ringTrend}>+12% this week</Text>
        </View>

        {/* ── 2 × 2 Stats Cards ────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[styles.statLabel, { color: t.textSec }]}>Good Time</Text>
            <Text style={[styles.statBig, { color: t.text }]}>{goodTimeMin}m</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[styles.statLabel, { color: t.textSec }]}>Alerts</Text>
            <View style={styles.statRow}>
              <Text style={[styles.statBig, { color: t.text }]}>{totalAlerts}</Text>
              <View style={[styles.alertCircle, { backgroundColor: '#F59E0B' }]} />
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[styles.statLabel, { color: t.textSec }]}>Sessions</Text>
            <Text style={[styles.statBig, { color: t.text }]}>{sessionCount}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[styles.statLabel, { color: t.textSec }]}>Risk Level</Text>
            <View style={styles.statRow}>
              <Text style={[styles.statBig, { color: t.text, fontSize: 20 }]}>{riskLevelStr}</Text>
              <View style={[styles.riskPill, { backgroundColor: (riskLevelStr === 'HIGH' ? t.danger : riskLevelStr === 'MODERATE' ? t.warning : riskLevelStr === 'GOOD' ? t.success : t.border) + '22' }]}>
                <Text style={[styles.riskPillTxt, { color: riskLevelStr === 'HIGH' ? t.danger : riskLevelStr === 'MODERATE' ? t.warning : riskLevelStr === 'GOOD' ? t.success : t.textSec }]}>
                  {riskLevelStr}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Risk Intelligence ────────────────────────────────────── */}
        <View style={styles.riskHeader}>
          <Text style={[styles.riskTitle, { color: t.text }]}>Risk Intelligence</Text>
          <Text style={[styles.riskSub, { color: t.textSec }]}>Ai-detected posture risk areas</Text>
        </View>

        <View style={styles.riskGrid}>
          {riskItems.map(item => (
            <View key={item.area} style={[styles.riskCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={styles.riskCardRow}>
                <item.Icon color={t.textSec} size={26} strokeWidth={1.8} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.riskArea, { color: t.text }]}>{item.area}</Text>
                  <Text style={[styles.riskRisk, { color: riskColor(item.risk) }]}>
                    {item.risk.charAt(0).toUpperCase() + item.risk.slice(1)}
                  </Text>
                </View>
                {item.risk === 'low' && (
                  <View style={[styles.riskPill, { backgroundColor: t.success + '22' }]}>
                    <Text style={[styles.riskPillTxt, { color: t.success }]}>Low</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.9 }]}
          onPress={() => router.push('/(tabs)/live')}
        >
          <LinearGradient
            colors={['#3B5BDB', '#2563EB']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.startGrad}
          >
            <Play color="#fff" size={20} fill="#fff" />
            <Text style={styles.startText}>Start Session</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  headerSub: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  headerGreeting: { fontSize: 24, fontWeight: '800' },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  card: { borderRadius: 20, borderWidth: 1, marginBottom: 16, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  scoreCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardLabel: { fontSize: 13, fontWeight: '600' },
  miniBarWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  miniBar: { width: 4, borderRadius: 2 },
  ringWrap: { alignItems: 'center', marginVertical: 8 },
  ringScore: { fontSize: 52, fontWeight: '800', lineHeight: 58 },
  ringLabel: { fontSize: 15, color: '#14D1B5', fontWeight: '600' },
  ringTrend: { textAlign: 'right', fontSize: 13, color: '#14D1B5', fontWeight: '600', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '47.5%', borderRadius: 16, borderWidth: 1, padding: 18, minHeight: 96 },
  statLabel: { fontSize: 13, fontWeight: '400', marginBottom: 6, color: '#888' },
  statBig: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  alertCircle: { width: 22, height: 22, borderRadius: 11 },
  riskPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  riskPillTxt: { fontSize: 11, fontWeight: '700' },
  riskHeader: { marginBottom: 14 },
  riskTitle: { fontSize: 22, fontWeight: '800' },
  riskSub: { fontSize: 13, marginTop: 3 },
  riskGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  riskCard: { width: '47.5%', borderRadius: 16, borderWidth: 1, padding: 16, minHeight: 90 },
  riskCardRow: { flexDirection: 'row', alignItems: 'center' },
  riskArea: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  riskRisk: { fontSize: 13, fontWeight: '600' },
  startBtn: { borderRadius: 16, overflow: 'hidden' },
  startGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  startText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
