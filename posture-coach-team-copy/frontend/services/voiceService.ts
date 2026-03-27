import * as Speech from 'expo-speech';

// Mapping of internal routes to professional assistant phrases
const ROUTE_MAP: Record<string, string> = {
  'index': "Welcome to Posture Coach",
  '(tabs)/home': "Home Dashboard",
  '(tabs)/reports': "Posture Reports",
  '(tabs)/live': "Live Monitoring",
  '(tabs)/settings': "Settings",
  'profile': "User Profile",
  'profile/edit': "Edit Profile",
  'calibration': "Active Calibration",
  'onboarding/welcome': "Welcome to Posture Coach",
  'onboarding/step1': "Smart Posture Alerts",
  'onboarding/step2': "Track Your Progress",
  'onboarding/step3': "Stay Mindful",
  'auth/login': "Sign In",
  'auth/signin': "Account Login",
  'permissions': "System Permissions",
  // Routes to skip global announcement because they have long local instructions
  'calibration-instructions': "SKIP",
};

let lastAnnouncement = "";
let lastTime = 0;

export const voiceService = {
  speak: (text: string, options: Speech.SpeechOptions = {}) => {
    // Always stop previous speech before starting new if it's not the same
    Speech.stop();
    
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
      ...options,
    });
  },

  stop: () => {
    Speech.stop();
  },

  announceScreen: (pathname: string) => {
    const now = Date.now();
    
    // Remove leading/trailing slashes for matching
    const cleanPath = pathname.replace(/^\/|\/$/g, '');
    
    // Use "index" if path is empty
    const matchKey = cleanPath === "" ? "index" : cleanPath;
    
    if (matchKey === lastAnnouncement && (now - lastTime < 3000)) return;
    
    lastAnnouncement = matchKey;
    lastTime = now;

    const phrase = ROUTE_MAP[matchKey] || ROUTE_MAP[`(tabs)/${matchKey}`];

    if (phrase && phrase !== "SKIP") {
        voiceService.speak(phrase);
    }
  }
};
