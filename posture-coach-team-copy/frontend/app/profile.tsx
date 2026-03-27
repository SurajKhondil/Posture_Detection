/**
 * Profile Setup Screen — "Tell us about yourself"
 * Uses getTheme() — consistent dark/light across all screens
 * Age groups, sitting hours (pill selectors), height + weight inputs
 */
import { getTheme } from '@/constants/theme';
import { apiCreateProfile } from '@/services/backendService';
import { useAppStore } from '@/store/userStore';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
    ScrollView, StatusBar, StyleSheet, Text, TextInput, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AGE_GROUPS = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'];
const SITTING_HOURS = ['1-2 hours', '3-4 hours', '5-6 hours', '7-8 hours', '9+ hours'];

export default function ProfileScreen() {
    const router = useRouter();
    const { setUserProfile, userProfile, darkMode } = useAppStore();
    const t = getTheme(darkMode);
    const insets = useSafeAreaInsets();

    const [age, setAge] = useState('');
    const [sittingHours, setSittingHours] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [loading, setLoading] = useState(false);

    const handleContinue = async () => {
        if (!age) { Alert.alert('Required', 'Please enter your age'); return; }
        if (!sittingHours) { Alert.alert('Required', 'Please select your daily sitting hours'); return; }

        setLoading(true);
        try {
            const profileData = {
                age: age ? parseInt(age) : undefined,
                sitting_hours: sittingHours,
                height_cm: height ? parseInt(height) : undefined,
                weight_kg: weight ? parseInt(weight) : undefined,
            };

            await apiCreateProfile(profileData);

            setUserProfile({
                ...userProfile,
                age,
                sittingHours,
                height: height || undefined,
                weight: weight || undefined,
            });

            router.push('/calibration-instructions');
        } catch (err: any) {
            // If already exists, we might just want to move forward or update
            if (err.message.includes('already exists')) {
                router.push('/calibration-instructions');
            } else {
                Alert.alert('Save Failed', err.message || 'Could not save your profile');
            }
        } finally {
            setLoading(false);
        }
    };

    const Pill = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.pill,
                { backgroundColor: selected ? t.primary : t.card, borderColor: selected ? t.primary : t.border },
                pressed && { opacity: 0.8 },
            ]}
        >
            <Text style={[styles.pillText, { color: selected ? '#FFFFFF' : t.textSec }]}>{label}</Text>
        </Pressable>
    );

    return (
        <View style={[styles.container, { backgroundColor: t.bg }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 30}
            >
                <View style={styles.safe}>
                    <ScrollView
                        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24 }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="always"
                    >
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: t.text }]}>Tell us about yourself</Text>
                            <Text style={[styles.sub, { color: t.textSec }]}>
                                Get analyzed to personalize your posture{'\n'}coach.
                            </Text>
                        </View>

                        {/* Age */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionLabel, { color: t.textSec }]}>Age</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: t.card, borderColor: t.border, color: t.text }]}
                                value={age}
                                onChangeText={setAge}
                                placeholder="e.g. 28"
                                placeholderTextColor={t.textMuted}
                                keyboardType="numeric"
                                maxLength={3}
                            />
                        </View>

                        {/* Daily Sitting Hours */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionLabel, { color: t.textSec }]}>Daily Sitting Hours</Text>
                            <View style={styles.pillGrid}>
                                {SITTING_HOURS.map(opt => (
                                    <Pill key={opt} label={opt} selected={sittingHours === opt} onPress={() => setSittingHours(opt)} />
                                ))}
                            </View>
                        </View>

                        {/* Height & Weight */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionLabel, { color: t.textSec }]}>
                                Body Measurements{' '}
                                <Text style={{ fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>(optional)</Text>
                            </Text>
                            <View style={styles.inputRow}>
                                <View style={styles.inputWrap}>
                                    <Text style={[styles.inputLabel, { color: t.textSec }]}>Height (cm)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: t.card, borderColor: t.border, color: t.text }]}
                                        value={height}
                                        onChangeText={setHeight}
                                        placeholder="e.g. 170"
                                        placeholderTextColor={t.textMuted}
                                        keyboardType="numeric"
                                        maxLength={3}
                                    />
                                </View>
                                <View style={styles.inputWrap}>
                                    <Text style={[styles.inputLabel, { color: t.textSec }]}>Weight (kg)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: t.card, borderColor: t.border, color: t.text }]}
                                        value={weight}
                                        onChangeText={setWeight}
                                        placeholder="e.g. 65"
                                        placeholderTextColor={t.textMuted}
                                        keyboardType="numeric"
                                        maxLength={3}
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                        <Pressable
                            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }, loading && { opacity: 0.5 }]}
                            onPress={handleContinue}
                            disabled={loading}
                        >
                            <View style={[styles.btnInner, { backgroundColor: t.surface, borderColor: t.border }]}>
                                <View style={styles.btnLeft}>
                                    <View style={styles.iconBox}>
                                        <View style={styles.iconInner}>
                                            <ChevronRight color={t.primary} size={22} />
                                        </View>
                                    </View>
                                    <Text style={[styles.btnText, { color: t.text }]}>
                                        {loading ? 'Saving Profile...' : 'Get Analyzed'}
                                    </Text>
                                </View>
                                {loading ? <ActivityIndicator size="small" color={t.textSec} /> : <ChevronRight color={t.textSec} size={20} />}
                            </View>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safe: { flex: 1 },
    scroll: { paddingHorizontal: 20, paddingBottom: 24 },
    header: { marginBottom: 40 },
    title: { fontSize: 34, fontWeight: '700', marginBottom: 12 },
    sub: { fontSize: 17, lineHeight: 26 },
    section: { marginBottom: 40 },
    sectionLabel: { fontSize: 20, fontWeight: '600', marginBottom: 20 },
    pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    pill: { width: '31%', paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    pillText: { fontSize: 15, fontWeight: '500' },
    inputRow: { flexDirection: 'row', gap: 12 },
    inputWrap: { flex: 1 },
    inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
    input: { borderRadius: 12, borderWidth: 1, height: 52, paddingHorizontal: 16, fontSize: 16 },
    footer: { paddingHorizontal: 20, paddingTop: 12 },
    btn: { borderRadius: 16, overflow: 'hidden' },
    btnInner: {
        height: 64, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingHorizontal: 16,
        borderWidth: 1, borderRadius: 16
    },
    btnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        alignItems: 'center', justifyContent: 'center'
    },
    iconInner: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        alignItems: 'center', justifyContent: 'center'
    },
    btnText: { fontSize: 18, fontWeight: '700' },
});
