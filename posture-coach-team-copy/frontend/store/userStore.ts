import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface UserProfile {
    name?: string;
    email?: string;
    age?: string;
    workDuration?: string;
    sittingHours?: string;
    height?: string;
    weight?: string;
}

interface PostureSession {
    id: string;
    date: string;
    startTime: number;
    endTime: number;
    duration: number; // in seconds
    averageScore: number;
    goodPostureTime: number; // in seconds
    alerts: number;
}

type PostureStatus = 'good' | 'warning' | 'bad';

interface AppState {
    // Auth — JWT token and user ID returned from backend
    authToken: string | null;
    userId: number | null;
    setAuthToken: (token: string, userId: number) => void;
    logout: () => void;

    // User profile
    userProfile: UserProfile | null;
    setUserProfile: (profile: UserProfile) => void;

    // Onboarding
    hasCompletedOnboarding: boolean;
    setOnboardingComplete: (complete: boolean) => void;

    // Permissions
    hasCameraPermission: boolean;
    hasNotificationPermission: boolean;
    setCameraPermission: (granted: boolean) => void;
    setNotificationPermission: (granted: boolean) => void;

    // Calibration
    isCalibrated: boolean;
    calibrationData: any | null;
    setCalibrationData: (data: any) => void;

    // Current posture monitoring
    currentPostureStatus: PostureStatus;
    updatePostureStatus: (status: PostureStatus) => void;

    // Daily stats
    todayScore: number;
    todayGoodTime: number; // in minutes
    todayAlerts: number;
    updateTodayStats: (updates: { score?: number; goodTime?: number; alerts?: number }) => void;

    // Sessions
    sessions: PostureSession[];
    addSession: (session: PostureSession) => void;

    // Settings
    notificationsEnabled: boolean;
    setNotificationsEnabled: (enabled: boolean) => void;
    soundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
    alertFrequency: number; // in seconds
    setAlertFrequency: (frequency: number) => void;
    darkMode: boolean;
    setDarkMode: (enabled: boolean) => void;

    // Weekly Recap persistence
    lastWeeklyRecapWeek: string | null; // Stores "YYYY-WW"
    setLastWeeklyRecapWeek: (week: string) => void;

    // Reset
    reset: () => void;
    resetOnboarding: () => void;
}

const initialState = {
    authToken: null,
    userId: null,
    userProfile: null,
    hasCompletedOnboarding: false,
    hasCameraPermission: false,
    hasNotificationPermission: false,
    isCalibrated: false,
    calibrationData: null,
    currentPostureStatus: 'good' as PostureStatus,
    todayScore: 85,
    todayGoodTime: 180,
    todayAlerts: 3,
    sessions: [],
    notificationsEnabled: true,
    soundEnabled: true,
    alertFrequency: 30,
    darkMode: false,
    lastWeeklyRecapWeek: null,
};

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            ...initialState,

            // ── Auth ────────────────────────────────────────────────────────────
            setAuthToken: (token, userId) => set({ authToken: token, userId }),

            logout: () => set({
                authToken: null,
                userId: null,
                userProfile: null,
                hasCompletedOnboarding: false,
                isCalibrated: false,
                calibrationData: null,
                sessions: [],
            }),

            // ── Profile ─────────────────────────────────────────────────────────
            setUserProfile: (profile) => set({ userProfile: profile }),

            setOnboardingComplete: (complete) => set({ hasCompletedOnboarding: complete }),

            setCameraPermission: (granted) => set({ hasCameraPermission: granted }),

            setNotificationPermission: (granted) => set({ hasNotificationPermission: granted }),

            setCalibrationData: (data) => set({
                calibrationData: data,
                isCalibrated: true
            }),

            updatePostureStatus: (status) => set({ currentPostureStatus: status }),

            updateTodayStats: (updates) => set((state) => ({
                todayScore: updates.score ?? state.todayScore,
                todayGoodTime: updates.goodTime ?? state.todayGoodTime,
                todayAlerts: updates.alerts ?? state.todayAlerts,
            })),

            addSession: (session) => set((state) => ({
                sessions: [session, ...state.sessions].slice(0, 30), // Keep last 30 sessions
            })),

            setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

            setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

            setAlertFrequency: (frequency) => set({ alertFrequency: frequency }),

            setDarkMode: (enabled) => set({ darkMode: enabled }),

            setLastWeeklyRecapWeek: (week) => set({ lastWeeklyRecapWeek: week }),

            reset: () => set(initialState),

            resetOnboarding: () => set({
                hasCompletedOnboarding: false,
                isCalibrated: false,
                calibrationData: null,
                sessions: [],
            }),
        }),
        {
            name: 'posture-coach-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
