import { useAppStore } from '@/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { voiceService } from '@/services/voiceService';
import Svg, { Path } from 'react-native-svg';

export default function SplashScreen() {
    const router = useRouter();
    const { hasCompletedOnboarding } = useAppStore();

    const pulseAnim1 = useRef(new Animated.Value(0)).current;
    const pulseAnim2 = useRef(new Animated.Value(0)).current;
    const pulseAnim3 = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulse animations
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim1, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim1, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.delay(400),
                Animated.timing(pulseAnim2, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim2, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.delay(800),
                Animated.timing(pulseAnim3, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim3, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Progress bar
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: false,
        }).start();

        // Navigate after splash
        const timer = setTimeout(() => {
            if (hasCompletedOnboarding) {
                router.replace('/(tabs)/home');
            } else {
                router.replace('/onboarding/welcome');
            }
        }, 2800);

        return () => clearTimeout(timer);
    }, [hasCompletedOnboarding]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <LinearGradient
            colors={['#6366f1', '#8b5cf6', '#a855f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <View style={styles.content}>
                {/* Animated pulse rings */}
                <View style={styles.logoContainer}>
                    <Animated.View
                        style={[
                            styles.pulseRing,
                            {
                                opacity: pulseAnim1.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.5, 0],
                                }),
                                transform: [
                                    {
                                        scale: pulseAnim1.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 2],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.pulseRing,
                            {
                                opacity: pulseAnim2.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.5, 0],
                                }),
                                transform: [
                                    {
                                        scale: pulseAnim2.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 2],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.pulseRing,
                            {
                                opacity: pulseAnim3.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.5, 0],
                                }),
                                transform: [
                                    {
                                        scale: pulseAnim3.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 2],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />

                    {/* Logo */}
                    <View style={styles.logo}>
                        <Svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <Path
                                d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z"
                                fill="#fff"
                            />
                            <Path
                                d="M6 10v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10"
                                stroke="#fff"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <Path
                                d="M12 14v4"
                                stroke="#fff"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <Path
                                d="M9 18h6"
                                stroke="#fff"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </Svg>
                    </View>
                </View>

                <Text style={styles.title}>Posture Coach</Text>
                <Text style={styles.subtitle}>Your AI-powered posture assistant</Text>

                {/* Progress bar */}
                <View style={styles.progressBarContainer}>
                    <Animated.View
                        style={[
                            styles.progressBar,
                            {
                                width: progressWidth,
                            },
                        ]}
                    />
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        position: 'relative',
        marginBottom: 32,
        width: 96,
        height: 96,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseRing: {
        position: 'absolute',
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    logo: {
        width: 96,
        height: 96,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 32,
    },
    progressBarContainer: {
        width: 200,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
    },
});
