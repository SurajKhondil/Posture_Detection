import { getTheme } from '@/constants/theme';
import { apiSignIn, saveToken } from '@/services/backendService';
import { useAppStore } from '@/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator, Alert, Platform,
    Pressable, ScrollView, StatusBar, StyleSheet,
    Text, TextInput, View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

// ── Constellation lines (dark mode background) ───────────────────────────────
const ConstellationBg = () => {
    const nodes: [number, number][] = [
        [60, 100], [150, 60], [280, 90], [350, 160], [320, 280],
        [200, 320], [80, 280], [120, 200], [240, 180], [370, 60],
        [40, 400], [300, 400], [180, 450], [90, 500], [340, 500],
    ];
    const lines: [number, number, number, number][] = [
        [60, 100, 150, 60], [150, 60, 280, 90], [280, 90, 350, 160],
        [350, 160, 320, 280], [320, 280, 200, 320], [200, 320, 80, 280],
        [80, 280, 120, 200], [120, 200, 60, 100], [280, 90, 240, 180],
        [370, 60, 280, 90], [40, 400, 180, 450], [180, 450, 300, 400],
        [300, 400, 340, 500], [90, 500, 180, 450],
    ];
    return (
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 390 844" pointerEvents="none">
            {lines.map(([x1, y1, x2, y2], i) => (
                <Line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="rgba(79,110,247,0.18)" strokeWidth={1} />
            ))}
            {nodes.map(([x, y], i) => (
                <Circle key={`n${i}`} cx={x} cy={y} r={2} fill="rgba(79,110,247,0.4)" />
            ))}
            {[[200, 50], [310, 130], [30, 170], [360, 350], [170, 380]].map(([x, y], i) => (
                <Circle key={`s${i}`} cx={x} cy={y} r={1.5} fill="rgba(255,255,255,0.55)" />
            ))}
        </Svg>
    );
};

// ── Social icons ──────────────────────────────────────────────────────────────
const GoogleIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </Svg>
);
const AppleIcon = ({ color }: { color: string }) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
        <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.39-1.32 2.76-2.54 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </Svg>
);

// ── Reusable Field (External to prevent keyboard closing) ─────────────────────
const Field = ({
    iconType, placeholder, value, onChangeText, secure, keyboard,
    inputRef, onSubmitEditing, returnKeyType, right,
    fieldBg, fieldBorder, iconColor, textColor, placeholderColor,
}: {
    iconType: 'mail' | 'lock'; placeholder: string; value: string;
    onChangeText: (v: string) => void; secure?: boolean;
    keyboard?: 'email-address'; inputRef?: React.RefObject<TextInput | null>;
    returnKeyType?: 'next' | 'done'; onSubmitEditing?: () => void;
    right?: React.ReactNode;
    fieldBg: string; fieldBorder: string; iconColor: string; textColor: string;
    placeholderColor: string;
}) => (
    <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
        <View style={styles.fieldIcon}>
            {iconType === 'mail' ? (
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M3 5h18a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2z" stroke={iconColor} strokeWidth={2} />
                    <Path d="M3 7l9 6 9-6" stroke={iconColor} strokeWidth={2} strokeLinecap="round" />
                </Svg>
            ) : (
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M7 11V7a5 5 0 0110 0v4" stroke={iconColor} strokeWidth={2} strokeLinecap="round" />
                    <Path d="M5 11h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z" stroke={iconColor} strokeWidth={2} />
                </Svg>
            )}
        </View>
        <TextInput
            ref={inputRef}
            style={[styles.fieldInput, { color: textColor }]}
            placeholder={placeholder}
            placeholderTextColor={placeholderColor}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secure}
            keyboardType={keyboard || 'default'}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            returnKeyType={returnKeyType || 'next'}
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={false}
            textContentType={iconType === 'mail' ? 'emailAddress' : 'password'}
            autoComplete={iconType === 'mail' ? 'email' : 'current-password'}
            importantForAutofill="yes"
        />
        {right && <View style={styles.fieldRight}>{right}</View>}
    </View>
);

export default function SignInScreen() {
    const router = useRouter();
    const { setUserProfile, setAuthToken, darkMode } = useAppStore();
    const t = getTheme(darkMode);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const passRef = useRef<TextInput | null>(null);

    const fieldBg = darkMode ? '#1A1E32' : '#F0F1F8';
    const fieldBorder = darkMode ? '#2D3250' : '#DDE0EF';
    const iconColor = t.textMuted;

    const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

    const handleSignIn = async () => {
        if (!validateEmail(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Invalid Password', 'Please enter your password.');
            return;
        }

        setLoading(true);
        try {
            const res = await apiSignIn(email.toLowerCase().trim(), password);
            setAuthToken(res.access_token, res.user_id);
            await saveToken(res.access_token);
            setUserProfile({ name: res.name, email: res.email });
            router.replace('/(tabs)/home');
        } catch (err: any) {
            Alert.alert('Sign In Failed', err.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: t.bg }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
            {darkMode && <ConstellationBg />}

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingTop: Platform.OS === 'ios' ? 64 : 50 }]}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Back */}
                <Pressable style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]} onPress={() => router.back()}>
                    <ArrowLeft color={t.text} size={22} />
                </Pressable>

                {/* Title */}
                <Text style={[styles.title, { color: t.text }]}>Welcome Back</Text>
                <Text style={[styles.sub, { color: t.textSec }]}>Sign in to continue your journey</Text>

                {/* Fields */}
                <View style={styles.fields}>
                    <Field
                        iconType="mail" placeholder="Email Address"
                        value={email} onChangeText={setEmail}
                        keyboard="email-address" returnKeyType="next"
                        onSubmitEditing={() => passRef.current?.focus()}
                        fieldBg={fieldBg} fieldBorder={fieldBorder}
                        iconColor={iconColor} textColor={t.text}
                        placeholderColor={t.textMuted}
                    />
                    <Field
                        inputRef={passRef} iconType="lock" placeholder="Password"
                        value={password} onChangeText={setPassword}
                        secure={!showPass} returnKeyType="done"
                        onSubmitEditing={handleSignIn}
                        fieldBg={fieldBg} fieldBorder={fieldBorder}
                        iconColor={iconColor} textColor={t.text}
                        placeholderColor={t.textMuted}
                        right={
                            <Pressable onPress={() => setShowPass((p: boolean) => !p)} hitSlop={8}>
                                {showPass
                                    ? <EyeOff color={iconColor} size={18} />
                                    : <Eye color={iconColor} size={18} />}
                            </Pressable>
                        }
                    />
                </View>

                {/* Sign In button */}
                <Pressable
                    style={({ pressed }) => [styles.mainBtn, pressed && { opacity: 0.9 }]}
                    onPress={handleSignIn} disabled={loading}
                >
                    <LinearGradient colors={['#3B5BDB', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mainBtnGrad}>
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.mainBtnText}>Sign In</Text>}
                    </LinearGradient>
                </Pressable>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={[styles.divLine, { backgroundColor: t.border }]} />
                    <Text style={[styles.divText, { color: t.textMuted }]}>or</Text>
                    <View style={[styles.divLine, { backgroundColor: t.border }]} />
                </View>

                {/* Social */}
                <Pressable
                    style={({ pressed }) => [styles.socialBtn, { backgroundColor: fieldBg, borderColor: fieldBorder }, pressed && { opacity: 0.8 }]}
                    onPress={() => Alert.alert('Coming Soon', 'Google sign-in will be available soon.')}
                >
                    <GoogleIcon />
                    <Text style={[styles.socialText, { color: t.text }]}>Continue with Google</Text>
                </Pressable>

                <Pressable
                    style={({ pressed }) => [styles.socialBtn, { backgroundColor: fieldBg, borderColor: fieldBorder }, pressed && { opacity: 0.8 }]}
                    onPress={() => Alert.alert('Coming Soon', 'Apple sign-in will be available soon.')}
                >
                    <AppleIcon color={t.text} />
                    <Text style={[styles.socialText, { color: t.text }]}>Continue with Apple</Text>
                </Pressable>

                {/* Sign up link */}
                <View style={styles.signupRow}>
                    <Text style={[styles.signupText, { color: t.textSec }]}>Don't have an account? </Text>
                    <Pressable onPress={() => router.push('/auth/login')}>
                        <Text style={[styles.signupLink, { color: t.primary }]}>Sign Up</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingHorizontal: 28, paddingBottom: 50 },
    back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    title: { fontSize: 30, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    sub: { fontSize: 15, marginBottom: 36, textAlign: 'center' },
    fields: { gap: 14, marginBottom: 24 },
    field: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: 1, height: 56,
    },
    fieldIcon: { paddingLeft: 16, paddingRight: 12 },
    fieldInput: { flex: 1, fontSize: 15, paddingRight: 16, height: '100%' },
    fieldRight: { paddingRight: 16 },
    mainBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 24 },
    mainBtnGrad: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
    mainBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
    divider: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
    divLine: { flex: 1, height: 1 },
    divText: { fontSize: 14 },
    socialBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        borderRadius: 14, borderWidth: 1,
        paddingVertical: 16, paddingHorizontal: 20, marginBottom: 12,
    },
    socialText: { fontSize: 15, fontWeight: '600' },
    signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
    signupText: { fontSize: 14 },
    signupLink: { fontSize: 14, fontWeight: '700' },
});
