import { getTheme } from '@/constants/theme';
import { apiSignUp, saveToken } from '@/services/backendService';
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ── Stars background (dark mode only — shown when darkMode) ──────────────────
const Stars = () => {
    const pts = [
        [25, 80, 1.5], [70, 30, 1], [140, 100, 2], [200, 50, 1], [280, 80, 1.5],
        [330, 150, 1], [50, 220, 2], [120, 280, 1], [300, 230, 1.5], [350, 100, 1],
        [180, 160, 1], [260, 320, 2], [80, 380, 1.5], [320, 380, 1], [150, 450, 1],
        [230, 480, 1.5], [40, 500, 1], [370, 460, 2],
    ];
    return (
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 390 844" pointerEvents="none">
            {pts.map(([x, y, r], i) => (
                <Circle key={i} cx={x} cy={y} r={r} fill="rgba(255,255,255,0.45)" />
            ))}
        </Svg>
    );
};

// ── Google icon ───────────────────────────────────────────────────────────────
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

// ── Field icon (SVG, theme-aware colour passed in) ────────────────────────────
type IconType = 'person' | 'mail' | 'lock';
const FieldIcon = ({ type, color }: { type: IconType; color: string }) => {
    if (type === 'person') return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} />
            <Path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
    if (type === 'mail') return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Rect x={3} y={5} width={18} height={14} rx={2} stroke={color} strokeWidth={2} />
            <Path d="M3 7l9 6 9-6" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Rect x={3} y={11} width={18} height={10} rx={2} stroke={color} strokeWidth={2} />
        </Svg>
    );
};

// Reusable field (Defined outside to prevent keyboard self-closing issue)
const Field = ({
    iconType, placeholder, value, onChangeText, secure, keyboard,
    autoCapitalize, inputRef, returnKeyType, onSubmitEditing, rightEl,
    fieldBg, fieldBorder, iconColor, textColor, placeholderColor,
}: {
    iconType: IconType; placeholder: string; value: string;
    onChangeText: (v: string) => void; secure?: boolean;
    keyboard?: 'default' | 'email-address'; autoCapitalize?: 'none' | 'words';
    inputRef?: React.RefObject<TextInput | null>; returnKeyType?: 'next' | 'done';
    onSubmitEditing?: () => void; rightEl?: React.ReactNode;
    fieldBg: string; fieldBorder: string; iconColor: string; textColor: string;
    placeholderColor: string;
}) => (
    <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
        <View style={styles.fieldIcon}>
            <FieldIcon type={iconType} color={iconColor} />
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
            autoCapitalize={autoCapitalize || 'none'}
            autoCorrect={false}
            spellCheck={false}
            returnKeyType={returnKeyType || 'next'}
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={false}
            textContentType={iconType === 'mail' ? 'emailAddress' : iconType === 'lock' ? 'newPassword' : 'name'}
            autoComplete={iconType === 'mail' ? 'email' : iconType === 'lock' ? 'new-password' : 'name'}
            importantForAutofill="yes"
            underlineColorAndroid="transparent"
        />
        {rightEl && <View style={styles.fieldRight}>{rightEl}</View>}
    </View>
);

export default function CreateAccountScreen() {
    const router = useRouter();
    const { setUserProfile, setAuthToken, darkMode } = useAppStore();
    const t = getTheme(darkMode);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const emailRef = useRef<TextInput | null>(null);
    const passRef = useRef<TextInput | null>(null);

    const fieldBg = darkMode ? '#1A1E32' : '#F0F1F8';
    const fieldBorder = darkMode ? '#2D3250' : '#DDE0EF';
    const iconColor = t.textMuted;

    const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const validatePassword = (val: string) => {
        return val.length >= 8 &&
            /[A-Z]/.test(val) &&
            /[a-z]/.test(val) &&
            /[0-9]/.test(val) &&
            /[!@#$%^&*(),.?":{}|<>]/.test(val);
    };

    const handleCreate = async () => {
        const trimmedName = name.trim();
        if (trimmedName.split(' ').length < 2) {
            Alert.alert('Invalid Name', 'Please enter your full name (first and last name).');
            return;
        }
        if (!validateEmail(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        if (!validatePassword(password)) {
            Alert.alert('Weak Password', 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
            return;
        }

        setLoading(true);
        try {
            const res = await apiSignUp(trimmedName, email.toLowerCase().trim(), password);
            setAuthToken(res.access_token, res.user_id);
            await saveToken(res.access_token);
            setUserProfile({ name: res.name, email: res.email });
            router.replace('/permissions');
        } catch (err: any) {
            Alert.alert('Sign Up Failed', err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: t.bg }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />
            {darkMode && <Stars />}

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingTop: Platform.OS === 'ios' ? 64 : 50 }]}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardDismissMode="none"
            >
                {/* Back */}
                <Pressable style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]} onPress={() => router.back()}>
                    <ArrowLeft color={t.text} size={22} />
                </Pressable>

                {/* Title */}
                <Text style={[styles.title, { color: t.text }]}>Create Account</Text>
                <Text style={[styles.sub, { color: t.textSec }]}>Sign up to track your posture progress</Text>

                {/* Fields */}
                <View style={styles.fields}>
                    <Field
                        iconType="person" placeholder="Full Name"
                        value={name} onChangeText={setName}
                        autoCapitalize="words" returnKeyType="next"
                        onSubmitEditing={() => emailRef.current?.focus()}
                        fieldBg={fieldBg} fieldBorder={fieldBorder}
                        iconColor={iconColor} textColor={t.text}
                        placeholderColor={t.textMuted}
                    />
                    <Field
                        inputRef={emailRef} iconType="mail" placeholder="Email Address"
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
                        onSubmitEditing={handleCreate}
                        fieldBg={fieldBg} fieldBorder={fieldBorder}
                        iconColor={iconColor} textColor={t.text}
                        placeholderColor={t.textMuted}
                        rightEl={
                            <Pressable onPress={() => setShowPass(p => !p)} hitSlop={8}>
                                {showPass
                                    ? <EyeOff color={iconColor} size={18} />
                                    : <Eye color={iconColor} size={18} />}
                            </Pressable>
                        }
                    />
                </View>

                {/* Create Account button */}
                <Pressable style={({ pressed }) => [styles.mainBtn, pressed && { opacity: 0.9 }]} onPress={handleCreate} disabled={loading}>
                    <LinearGradient colors={['#3B5BDB', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mainBtnGrad}>
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.mainBtnText}>Create Account  →</Text>}
                    </LinearGradient>
                </Pressable>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={[styles.divLine, { backgroundColor: t.border }]} />
                    <Text style={[styles.divText, { color: t.textMuted }]}>or</Text>
                    <View style={[styles.divLine, { backgroundColor: t.border }]} />
                </View>

                {/* Social buttons */}
                <Pressable style={({ pressed }) => [styles.socialBtn, { backgroundColor: fieldBg, borderColor: fieldBorder }, pressed && { opacity: 0.8 }]}
                    onPress={() => Alert.alert('Coming Soon', 'Google sign-in will be available soon.')}>
                    <GoogleIcon />
                    <Text style={[styles.socialText, { color: t.text }]}>Continue with Google</Text>
                </Pressable>

                <Pressable style={({ pressed }) => [styles.socialBtn, { backgroundColor: fieldBg, borderColor: fieldBorder }, pressed && { opacity: 0.8 }]}
                    onPress={() => Alert.alert('Coming Soon', 'Apple sign-in will be available soon.')}>
                    <AppleIcon color={t.text} />
                    <Text style={[styles.socialText, { color: t.text }]}>Continue with Apple</Text>
                </Pressable>

                {/* Sign in link */}
                <View style={styles.signinRow}>
                    <Text style={[styles.signinText, { color: t.textSec }]}>Already have an account? </Text>
                    <Pressable onPress={() => router.push('/auth/signin')}>
                        <Text style={[styles.signinLink, { color: t.primary }]}>Sign In</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingHorizontal: 28, paddingBottom: 50 },
    back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    title: { fontSize: 30, fontWeight: '800', marginBottom: 8 },
    sub: { fontSize: 15, marginBottom: 32 },
    fields: { gap: 14, marginBottom: 24 },
    field: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: 1, height: 56,
    },
    fieldIcon: { paddingLeft: 16, paddingRight: 12 },
    fieldInput: { flex: 1, fontSize: 15, height: '100%' },
    fieldRight: { paddingRight: 16 },
    mainBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 24 },
    mainBtnGrad: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
    mainBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
    divider: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    divLine: { flex: 1, height: 1 },
    divText: { fontSize: 14 },
    socialBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        borderRadius: 14, borderWidth: 1,
        paddingVertical: 16, paddingHorizontal: 20, marginBottom: 12,
    },
    socialText: { fontSize: 15, fontWeight: '600' },
    signinRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
    signinText: { fontSize: 14 },
    signinLink: { fontSize: 14, fontWeight: '700' },
});
