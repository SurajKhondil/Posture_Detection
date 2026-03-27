/**
 * Permissions Screen
 * Uses getTheme() from constants/theme.ts — matches dark/light mode across all app screens
 */
import { getTheme } from '@/constants/theme';
import { cameraService } from '@/services/cameraService';
import { notificationService } from '@/services/notificationService';
import { useAppStore } from '@/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Camera, ChevronRight, Shield } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert, Pressable, SafeAreaView,
  ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const permItems = [
  {
    Icon: Camera,
    title: 'Camera Access',
    desc: 'Required for real-time posture monitoring. All processing happens on your device.',
    required: true,
  },
  {
    Icon: Bell,
    title: 'Notifications',
    desc: 'Get gentle reminders when your posture needs correction.',
    required: false,
  },
];

export default function PermissionsScreen() {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  const { setCameraPermission, setNotificationPermission, darkMode } = useAppStore();
  const t = getTheme(darkMode);
  const insets = useSafeAreaInsets();

  const handleDeny = () => {
    Alert.alert(
      'Camera Required',
      'Camera permission is required to monitor your posture.',
      [{ text: 'OK', style: 'cancel' }],
    );
  };

  const handleGrantPermissions = async () => {
    setIsRequesting(true);
    try {
      const cameraGranted = await cameraService.requestPermissions();
      setCameraPermission(cameraGranted);
      if (!cameraGranted) {
        Alert.alert('Camera Permission Required', 'Please enable camera access in your device settings.', [{ text: 'OK' }]);
        setIsRequesting(false);
        return;
      }
      const notifGranted = await notificationService.requestPermissions();
      setNotificationPermission(notifGranted);
      router.push('/profile');
    } catch {
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={s.titleBlock}>
            <Text style={[s.title, { color: t.text }]}>App Permissions</Text>
            <Text style={[s.sub, { color: t.textSec }]}>
              We need a few permissions to help you maintain good posture
            </Text>
          </View>

          {/* Permission cards */}
          <View style={s.cards}>
            {permItems.map((item, i) => (
              <View key={i} style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
                <View style={[s.iconBox, { backgroundColor: t.primary + '20' }]}>
                  <item.Icon color={t.primary} size={22} />
                </View>
                <View style={s.cardText}>
                  <View style={s.cardTitleRow}>
                    <Text style={[s.cardTitle, { color: t.text }]}>{item.title}</Text>
                    {item.required && (
                      <View style={[s.badge, { backgroundColor: t.primary + '20' }]}>
                        <Text style={[s.badgeText, { color: t.primary }]}>Required</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.cardDesc, { color: t.textSec }]}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Privacy note */}
          <View style={[s.privacyCard, { backgroundColor: t.primary + '12', borderColor: t.primary + '30' }]}>
            <Shield color={t.primary} size={20} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[s.privacyTitle, { color: t.text }]}>Your Privacy is Protected</Text>
              <Text style={[s.privacyDesc, { color: t.textSec }]}>
                All posture analysis happens locally on your device. We never store or transmit your camera feed.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Buttons */}
        <View style={[s.footer, { backgroundColor: t.bg, borderTopColor: t.border, paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [s.denyBtn, { borderColor: t.border }, pressed && { opacity: 0.7 }]}
            onPress={handleDeny}
          >
            <Text style={[s.denyText, { color: t.textSec }]}>Deny</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.allowBtn, pressed && { opacity: 0.9 }, isRequesting && { opacity: 0.5 }]}
            onPress={handleGrantPermissions}
            disabled={isRequesting}
          >
            <LinearGradient
              colors={['#3B5BDB', '#2563EB']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.allowGrad}
            >
              <Text style={s.allowText}>{isRequesting ? 'Requesting...' : 'Allow'}</Text>
              <ChevronRight color="#fff" size={20} />
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
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  titleBlock: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  sub: { fontSize: 15, lineHeight: 22 },
  cards: { gap: 12, marginBottom: 20 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 16,
    borderRadius: 16, padding: 20, borderWidth: 1,
  },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 6 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  cardDesc: { fontSize: 14, lineHeight: 20 },
  privacyCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    borderRadius: 12, padding: 16, borderWidth: 1,
  },
  privacyTitle: { fontSize: 14, fontWeight: '600' },
  privacyDesc: { fontSize: 13, lineHeight: 18 },
  footer: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 20,
    paddingTop: 12, paddingBottom: 0,
    borderTopWidth: 1,
  },
  denyBtn: {
    flex: 1, height: 52, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  denyText: { fontSize: 16, fontWeight: '600' },
  allowBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  allowGrad: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  allowText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
