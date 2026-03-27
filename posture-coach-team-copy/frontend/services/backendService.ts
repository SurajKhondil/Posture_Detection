/**
 * Backend API Service
 * Connects to FastAPI backend via ngrok (testing) or deployed URL (production)
 * All user data is saved to Neon PostgreSQL
 *
 * HOW TO USE WITH NGROK:
 * 1. Run backend: cd backend && uvicorn app.main:app --port 8001 --reload
 * 2. Run ngrok:   ngrok http 8001
 * 3. Copy the https://xxxx.ngrok-free.app URL
 * 4. Replace NGROK_URL below with that URL
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── API URL ───────────────────────────────────────────────────────────────────
// 🔴 REPLACE with your ngrok URL when testing with real backend
// Example: 'https://abc123.ngrok-free.app/api/v1'
// Leave as empty string '' to use MOCK mode (no backend needed)
const NGROK_URL = 'http://10.181.245.239:8000';
const API_URL = NGROK_URL ? `${NGROK_URL}/api/v1` : null;

// 🟢 TEAM 2 ANALYSIS SERVER (Unified Server - Port 8000)
const TEAM2_URL = API_URL ? `${API_URL}/team2` : 'http://10.0.2.2:8000';
const timeoutMs = 60000; // Increased to 60s for cold-booting Neon DB

// ── IMPORTANT FOR TEAM MEMBERS ────────────────────────────────────────────────
// If you get a "JSON Parse error" or "Sign Up Failed" error, the backend server
// is either not running or the ngrok URL above is expired.
// Steps to fix:
//   1. Make sure the backend is running:  cd backend && uvicorn app.main:app --port 8001 --reload
//   2. Make sure ngrok is running:        ngrok http 8001
//   3. Copy the new ngrok https URL and replace NGROK_URL above
//   4. Reload the Expo app
// If you do NOT have the backend, leave NGROK_URL as empty string '' to use MOCK MODE.
// ─────────────────────────────────────────────────────────────────────────────

// ── Fetch with timeout ────────────────────────────────────────────────────────
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 120000): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timer);
        return res;
    } catch (err: any) {
        clearTimeout(timer);
        if (err?.name === 'AbortError') throw new Error('Request timed out. Make sure the backend server is running.');
        throw new Error('Cannot reach server. Check that the backend is running and the NGROK_URL in backendService.ts is updated.');
    }
};

// ── Safe JSON parser — prevents crash when server returns HTML/text ────────────
const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        // Server returned HTML or plain text (e.g. expired ngrok page)
        if (text.includes('ngrok') || text.includes('tunnel')) {
            throw new Error('The ngrok tunnel has expired. Please restart ngrok and update NGROK_URL in backendService.ts');
        }
        throw new Error('Server returned an unexpected response. Make sure the backend is running correctly.');
    }
};

// ── Mock fallback ─────────────────────────────────────────────────────────────
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ── Token helpers ──────────────────────────────────────────────────────────────
export const saveToken = async (token: string) => {
    await AsyncStorage.setItem('auth_token', token);
};

export const getToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem('auth_token');
};

export const clearToken = async () => {
    await AsyncStorage.removeItem('auth_token');
};

// ── Auth API ───────────────────────────────────────────────────────────────────

export const apiSignUp = async (name: string, email: string, password: string,
    age?: number, height_cm?: number, weight_kg?: number,
    sitting_hours?: string) => {
    if (!API_URL) {
        // MOCK MODE — no backend needed
        await delay(800);
        return { access_token: 'mock_token_' + Date.now(), user_id: 123, name: name || 'User', email };
    }
    const res = await fetchWithTimeout(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, age, height_cm, weight_kg, sitting_hours }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.detail || 'Signup failed');
    return data;
};

export const apiSignIn = async (email: string, password: string) => {
    if (!API_URL) {
        await delay(800);
        return { access_token: 'mock_token_' + Date.now(), user_id: 123, name: 'User', email };
    }
    const res = await fetchWithTimeout(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    return data;
};

// ── Profile API ────────────────────────────────────────────────────────────────

export const apiCreateProfile = async (profileData: any) => {
    if (!API_URL) { await delay(500); return { status: 'success', ...profileData }; }
    const token = await getToken();
    const res = await fetchWithTimeout(`${API_URL}/profile/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Profile save failed');
    return data;
};

export const apiUpdateProfile = async (profileData: any) => {
    if (!API_URL) { await delay(500); return { status: 'success', ...profileData }; }
    const token = await getToken();
    const res = await fetchWithTimeout(`${API_URL}/profile/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Profile update failed');
    return data;
};

export const apiGetProfile = async () => {
    if (!API_URL) {
        await delay(500);
        return { age_group: '26-35', sitting_hours: '5-6', height_cm: 175, weight_kg: 70 };
    }
    const token = await getToken();
    const res = await fetchWithTimeout(`${API_URL}/profile/`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to get profile');
    return data;
};

// ── Pain Risk API ──────────────────────────────────────────────────────────────

export const apiGetPainRisk = async () => {
    if (!API_URL) {
        await delay(500);
        return {
            overall_risk_percent: 35.5, overall_status: 'Low Risk', risk_level: 'LOW',
            recommendation_message: 'Your posture is generally good. Keep it up!',
            priority: 'LOW', actions: ['Take a 5-min walk every hour', 'Do neck stretches']
        };
    }
    const token = await getToken();
    const res = await fetchWithTimeout(`${API_URL}/team2/pain-risk/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.status === 404) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to get pain risk');
    return data;
};

// ── Session Tracking API (Neon DB) ──────────────────────────────────────────

export const apiStartSession = async (sessionData?: {
    current_phase?: string;
    phase_start_time?: string;
    expected_end_time?: string;
}) => {
    if (!API_URL) {
        await delay(500);
        return { session_id: 'mock_session_' + Date.now(), message: 'Mock session started' };
    }
    const token = await getToken();
    const res = await fetchWithTimeout(`${API_URL}/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(sessionData || {}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to start session');
    return data;
};

export const apiEndSession = async (sessionId: string, sessionStats: {
    end_time: string;
    avg_fps?: number;
    total_frames?: number;
    status?: string;
}) => {
    if (!API_URL) {
        await delay(500);
        return { status: 'mock_success', session_id: sessionId };
    }
    const token = await getToken();
    const res = await fetchWithTimeout(`${API_URL}/sessions/${sessionId}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(sessionStats),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to end session');
    return data;
};

// ── Team 2 Analysis Specific APIs (Dynamic Integration) ─────────────────────

const TEAM2_API_TIMEOUT = 60000; // Increased to 60s for cold-booting Neon DB

/**
 * Team 2 Start Session
 * - is_calibration=true  → wipes previous calibration and creates a new session
 * - is_calibration=false → reuses the calibration session ID (no new row in DB)
 */
export const apiStartTeam2Session = async (opts?: { is_calibration?: boolean }) => {
    if (!API_URL) return { session_id: Date.now(), message: 'Mock Session Started' };
    const token = await getToken();
    const res = await fetchWithTimeout(`${TEAM2_URL}/sessions/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_calibration: opts?.is_calibration ?? false }),
    });
    return await safeJson(res);
};

/**
 * Team 2 Ingest Frames - sends actual angles to populate angle_accumulation
 */
export const apiIngestTeam2Frames = async (sessionId: number, frameData: any) => {
    if (!API_URL) return { success: true };
    const token = await getToken();
    const res = await fetchWithTimeout(`${TEAM2_URL}/frames/ingest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            session_id: sessionId,
            frame_id: frameData.frame_id || 0,
            timestamp: new Date().toISOString(),
            frame_type: 'front', // default to front for now
            is_calibrated: true,
            front: {
                neck_bend: { value: frameData.neckAngle || 0, confidence: 0.95 },
                shoulder_slope: { value: frameData.shoulderAlignment || 0, confidence: 0.95 },
                torso_tilt: { value: frameData.backCurve || 0, confidence: 0.95 }
            }
        }),
    });
    return await safeJson(res);
};

/**
 * Team 2 Stop Frames / End Session
 * Stops frame ingestion, saves alert count + good time, triggers scoring.
 */
export const apiStopTeam2Frames = async (
    sessionId: number,
    opts?: { alerts_count?: number; good_time_seconds?: number }
) => {
    if (!API_URL) return { success: true };
    const token = await getToken();

    // Trigger scoring + save session stats
    const res = await fetchWithTimeout(`${TEAM2_URL}/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            alerts_count: opts?.alerts_count ?? 0,
            good_time_seconds: opts?.good_time_seconds ?? 0,
        }),
    });

    return await safeJson(res);
};

/**
 * Team 2 Dashboard - Fetch aggregated posture score and session history
 */
export const apiGetTeam2Dashboard = async (userId: number) => {
    if (!API_URL) return { today_score: 95, sessions: [] };
    const token = await getToken();
    const res = await fetchWithTimeout(`${TEAM2_URL}/dashboard/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return await safeJson(res);
};

/**
 * Team 2 Session Results - Fetch detailed risk scores for risk intelligence cards
 */
export const apiGetTeam2Results = async (sessionId: number) => {
    if (!API_URL) return { risk_score: 10 };
    const token = await getToken();
    const res = await fetchWithTimeout(`${TEAM2_URL}/results/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return await safeJson(res);
};

/**
 * Team 2 AI Recommendation - Fetch personalized advice for a session
 */
export const apiGetTeam2Recommendation = async (sessionId: number) => {
    if (!API_URL) return { recommendation_text: 'Keep sitting up straight!' };
    const token = await getToken();
    const res = await fetchWithTimeout(`${TEAM2_URL}/recommendations/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return await safeJson(res);
};

/**
 * Team 2 Complete Session - Triggers immediate scoring and generation
 */
export const apiCompleteTeam2Session = async (sessionId: number) => {
    if (!API_URL) return { success: true };
    const token = await getToken();
    const res = await fetchWithTimeout(`${TEAM2_URL}/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    return await safeJson(res);
};

export const validationService = {
    validateEmail: (email: string): { valid: boolean; error?: string } => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return { valid: false, error: 'Email is required' };
        if (!emailRegex.test(email)) return { valid: false, error: 'Invalid email format' };
        return { valid: true };
    },

    validatePassword: (password: string): { valid: boolean; error?: string } => {
        if (!password) return { valid: false, error: 'Password is required' };
        if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
        if (!/\d/.test(password)) return { valid: false, error: 'Password must contain at least one digit' };
        if (!/[a-zA-Z]/.test(password)) return { valid: false, error: 'Password must contain at least one letter' };
        return { valid: true };
    },

    validateName: (name: string): { valid: boolean; error?: string } => {
        if (!name || !name.trim()) return { valid: false, error: 'Name is required' };
        if (name.trim().length < 2) return { valid: false, error: 'Name must be at least 2 characters' };
        if (name.trim().length > 100) return { valid: false, error: 'Name must be less than 100 characters' };
        return { valid: true };
    },

    validateAge: (age: string): { valid: boolean; error?: string } => {
        if (!age) return { valid: false, error: 'Age is required' };
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) return { valid: false, error: 'Please enter a valid age' };
        return { valid: true };
    },

    validateHeight: (height: string): { valid: boolean; error?: string } => {
        if (!height) return { valid: true }; // optional
        const h = parseFloat(height);
        if (isNaN(h) || h < 50 || h > 300) return { valid: false, error: 'Height must be between 50-300 cm' };
        return { valid: true };
    },

    validateWeight: (weight: string): { valid: boolean; error?: string } => {
        if (!weight) return { valid: true }; // optional
        const w = parseFloat(weight);
        if (isNaN(w) || w < 10 || w > 500) return { valid: false, error: 'Weight must be between 10-500 kg' };
        return { valid: true };
    },
};
