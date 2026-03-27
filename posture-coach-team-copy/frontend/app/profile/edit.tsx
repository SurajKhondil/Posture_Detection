import { getTheme } from '@/constants/theme';
import { apiUpdateProfile, validationService } from '@/services/backendService';
import { useAppStore } from '@/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Ruler, Weight } from 'lucide-react-native';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const AGE_GROUPS = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'];
const SITTING_HOURS = ['1-2', '3-4', '5-6', '7-8', '9+'];

export default function EditProfileScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { userProfile, setUserProfile, darkMode } = useAppStore();
    const t = getTheme(darkMode);

    const [age, setAge] = useState(userProfile?.age || '');
    const [sittingHours, setSittingHours] = useState(userProfile?.sittingHours || '');
    const [height, setHeight] = useState(userProfile?.height?.toString() || '');
    const [weight, setWeight] = useState(userProfile?.weight?.toString() || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        const hV = validationService.validateHeight(height);
        if (!hV.valid) { Alert.alert('Validation Error', hV.error); return; }
        const wV = validationService.validateWeight(weight);
        if (!wV.valid) { Alert.alert('Validation Error', wV.error); return; }

        setLoading(true);
        try {
            const profileData = {
                age: age ? parseInt(age) : undefined,
                sitting_hours: sittingHours,
                height_cm: height ? parseInt(height) : undefined,
                weight_kg: weight ? parseInt(weight) : undefined,
            };

            await apiUpdateProfile(profileData);

            setUserProfile({
                ...userProfile,
                age,
                sittingHours,
                height: height || undefined,
                weight: weight || undefined,
            });

            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (err: any) {
            Alert.alert('Update Failed', err.message || 'Could not update your profile');
        } finally {
            setLoading(false);
        }
    };

    const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
        <Pressable
            style={[
                styles.chip,
                { backgroundColor: selected ? t.primary + '15' : t.card, borderColor: selected ? t.primary : t.border }
            ]}
            onPress={onPress}
        >
            <Text style={{ fontSize: 14, fontWeight: selected ? '700' : '500', color: selected ? t.primary : t.textSec }}>
                {label}
            </Text>
        </Pressable>
    );

    const SectionLabel = ({ text, required }: { text: string; required?: boolean }) => (
        <Text style={{ fontSize: 13, fontWeight: '600', color: t.textSec, marginBottom: 10, letterSpacing: 0.3 }}>
            {text.toUpperCase()}{required && <Text style={{ color: t.primary }}> *</Text>}
        </Text>
    );

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 140 }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <Pressable
                        style={({ pressed }) => [styles.backBtn, { backgroundColor: t.card, borderColor: t.border }, pressed && { opacity: 0.7 }]}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft color={t.text} size={20} />
                    </Pressable>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: t.text }}>Profile Details</Text>
                </View>

                {/* Avatar */}
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <LinearGradient colors={['#3B5BDB', '#2563EB']} style={styles.avatarLarge}>
                        <Text style={{ fontSize: 40, fontWeight: '800', color: '#fff' }}>
                            {(userProfile?.name || 'U').charAt(0).toUpperCase()}
                        </Text>
                    </LinearGradient>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: t.text, marginTop: 12 }}>
                        {userProfile?.name || 'User'}
                    </Text>
                    <Text style={{ fontSize: 14, color: t.textSec, marginTop: 3 }}>
                        {userProfile?.email || 'Complete your profile'}
                    </Text>
                </View>

                {/* Age */}
                <View style={[styles.section, { backgroundColor: t.card, borderColor: t.border }]}>
                    <SectionLabel text="Age" required />
                    <View style={[styles.inputWrap, { backgroundColor: t.surface, borderColor: t.border }]}>
                        <TextInput
                            style={[styles.inputText, { color: t.text }]}
                            placeholder="28"
                            placeholderTextColor={t.textSec}
                            value={age}
                            onChangeText={setAge}
                            keyboardType="number-pad"
                            maxLength={3}
                        />
                    </View>
                </View>

                {/* Sitting Hours */}
                <View style={[styles.section, { backgroundColor: t.card, borderColor: t.border }]}>
                    <SectionLabel text="Daily Sitting Hours" required />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {SITTING_HOURS.map(h => (
                            <Chip key={h} label={`${h}h`} selected={sittingHours === h} onPress={() => setSittingHours(h)} />
                        ))}
                    </View>
                </View>

                {/* Physical Measurements */}
                <View style={[styles.section, { backgroundColor: t.card, borderColor: t.border }]}>
                    <SectionLabel text="Physical Info" />
                    <View style={{ flexDirection: 'row', gap: 14 }}>
                        {/* Height */}
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: t.textSec, marginBottom: 8 }}>HEIGHT (cm)</Text>
                            <View style={[styles.inputWrap, { backgroundColor: t.surface, borderColor: t.border }]}>
                                <Ruler color={t.textSec} size={16} />
                                <TextInput
                                    style={[styles.inputText, { color: t.text }]}
                                    placeholder="170"
                                    placeholderTextColor={t.textSec}
                                    value={height}
                                    onChangeText={setHeight}
                                    keyboardType="number-pad"
                                    maxLength={3}
                                />
                            </View>
                        </View>
                        {/* Weight */}
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: t.textSec, marginBottom: 8 }}>WEIGHT (kg)</Text>
                            <View style={[styles.inputWrap, { backgroundColor: t.surface, borderColor: t.border }]}>
                                <Weight color={t.textSec} size={16} />
                                <TextInput
                                    style={[styles.inputText, { color: t.text }]}
                                    placeholder="70"
                                    placeholderTextColor={t.textSec}
                                    value={weight}
                                    onChangeText={setWeight}
                                    keyboardType="number-pad"
                                    maxLength={3}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

                <View style={[styles.footer, { position: 'relative', backgroundColor: t.bg, borderTopColor: t.border, paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <Pressable
                    style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9 }, loading && { opacity: 0.5 }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <LinearGradient colors={['#3B5BDB', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveGradient}>
                        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Check color="#fff" size={20} />}
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Text>
                    </LinearGradient>
                </Pressable>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1,
    },
    avatarLarge: {
        width: 96, height: 96, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center',
    },
    section: {
        borderRadius: 18, padding: 20, marginBottom: 14, borderWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    chip: {
        paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
    },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        height: 52, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1,
    },
    inputText: { flex: 1, fontSize: 16 },
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 20, borderTopWidth: 1,
    },
    saveBtn: { borderRadius: 16, overflow: 'hidden' },
    saveGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 17,
    },
});
