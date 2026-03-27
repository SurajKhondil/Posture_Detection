import { getTheme } from '@/constants/theme';
import { useAppStore } from '@/store/userStore';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import {
  Bell, Camera, ChevronRight, Info, LogOut, Moon, RefreshCw, Shield, Sun, Volume2
} from 'lucide-react-native';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    notificationsEnabled, setNotificationsEnabled,
    soundEnabled, setSoundEnabled,
    alertFrequency, setAlertFrequency,
    darkMode, setDarkMode,
    userProfile, resetOnboarding,
  } = useAppStore();
  const t = getTheme(darkMode);

  const handleRecalibrate = () =>
    Alert.alert('Recalibrate Posture', 'This will reset your baseline posture. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Recalibrate', onPress: () => router.push('/calibration-instructions') },
    ]);

  const handleReset = () =>
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { resetOnboarding(); router.replace('/'); } },
    ]);

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={{ fontSize: 12, fontWeight: '600', color: t.textSec, marginBottom: 8, letterSpacing: 0.5 }}>
      {title.toUpperCase()}
    </Text>
  );

  const RowItem = ({
    Icon, label, desc, right,
  }: { Icon: any; label: string; desc?: string; right?: React.ReactNode }) => (
    <View style={[styles.row, { borderBottomColor: t.border }]}>
      <View style={[styles.iconBox, { backgroundColor: t.primary + '18' }]}>
        <Icon color={t.primary} size={18} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: t.text }}>{label}</Text>
        {desc && <Text style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>{desc}</Text>}
      </View>
      {right}
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 120 }}
    >
      {/* ── Header ───────────────────────────────────────────────── */}
      <Text style={{ fontSize: 26, fontWeight: '800', color: t.text, marginBottom: 24 }}>Settings</Text>

      {/* ── Profile Card ─────────────────────────────────────────── */}
      <Pressable
        style={({ pressed }) => [styles.profileCard, { backgroundColor: t.card, borderColor: t.border }, pressed && { opacity: 0.8 }]}
        onPress={() => router.push('/profile/edit')}
      >
        <View style={[styles.profileAvatar, { backgroundColor: t.primary }]}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>
            {(userProfile?.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: t.text }}>{userProfile?.name || 'User'}</Text>
          <Text style={{ fontSize: 13, color: t.textSec, marginTop: 2 }}>
            {userProfile?.age ? `Age: ${userProfile.age}` : 'Edit profile'}
          </Text>
        </View>
        <ChevronRight color={t.textSec} size={20} />
      </Pressable>

      {/* ── Appearance ───────────────────────────────────────────── */}
      <View style={{ marginBottom: 20 }}>
        <SectionTitle title="Appearance" />
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <RowItem
            Icon={darkMode ? Moon : Sun}
            label="Dark Mode"
            desc={darkMode ? 'Dark theme enabled' : 'Light theme enabled'}
            right={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: t.border, true: t.primary }}
                thumbColor="#fff"
              />
            }
          />
        </View>
      </View>

      {/* ── Notifications ─────────────────────────────────────────── */}
      <View style={{ marginBottom: 20 }}>
        <SectionTitle title="Notifications" />
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <RowItem
            Icon={Bell}
            label="Posture Alerts"
            desc="Get notified when posture needs correction"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: t.border, true: t.primary }}
                thumbColor="#fff"
              />
            }
          />
          <RowItem
            Icon={Volume2}
            label="Sound Alert"
            desc="Play sound with posture notifications"
            right={
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: t.border, true: t.primary }}
                thumbColor="#fff"
              />
            }
          />
          <View style={[styles.row, { borderBottomColor: 'transparent' }]}>
            <View style={[styles.iconBox, { backgroundColor: t.primary + '18' }]}>
              <Volume2 color={t.primary} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: t.text }}>Alert Frequency</Text>
              <Text style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>
                Check posture every {alertFrequency}s
              </Text>
              <Slider
                style={{ width: '100%', height: 36, marginTop: 4 }}
                value={alertFrequency}
                onValueChange={setAlertFrequency}
                minimumValue={15} maximumValue={120} step={15}
                minimumTrackTintColor={t.primary}
                maximumTrackTintColor={t.border}
                thumbTintColor={t.primary}
              />
            </View>
          </View>
        </View>
      </View>

      {/* ── Calibration ───────────────────────────────────────────── */}
      <View style={{ marginBottom: 20 }}>
        <SectionTitle title="Calibration" />
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <Pressable onPress={handleRecalibrate}>
            <RowItem
              Icon={Camera}
              label="Recalibrate Posture"
              desc="Reset your baseline position"
              right={<RefreshCw color={t.primary} size={18} />}
            />
          </Pressable>
        </View>
      </View>

      {/* ── About ─────────────────────────────────────────────────── */}
      <View style={{ marginBottom: 24 }}>
        <SectionTitle title="About" />
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <Pressable>
            <RowItem Icon={Shield} label="Privacy Policy" desc="How we handle your data" right={<ChevronRight color={t.textSec} size={18} />} />
          </Pressable>
          <Pressable>
            <RowItem Icon={Info} label="About Posture Coach" desc="Version 1.0.0" right={<ChevronRight color={t.textSec} size={18} />} />
          </Pressable>
        </View>
      </View>

      {/* ── Logout ────────────────────────────────────────── */}
      <Pressable
        style={({ pressed }) => [styles.resetBtn, { backgroundColor: '#EF444420', borderColor: '#EF444440' }, pressed && { opacity: 0.7 }]}
        onPress={handleReset}
      >
        <LogOut color="#EF4444" size={18} />
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444' }}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 18, borderRadius: 18, borderWidth: 1, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  profileAvatar: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderBottomWidth: 1,
  },
  iconBox: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17, borderRadius: 16, borderWidth: 1.5,
  },
});
