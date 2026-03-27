# Posture Coach App

React Native mobile app for posture monitoring built with Expo.

---

## 🚀 Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Expo Go app on your phone

### Installation

1. **Clone and install**
```bash
git clone <repository-url>
cd posture-coach-app
npm install
```

2. **Run the app**
```bash
npx expo start
```

3. **Open on your device**
   - Scan QR code with Expo Go app

---

## 📦 Dependencies

### Install All Dependencies
```bash
npm install
```

### Core Packages
```bash
npm install expo expo-router react react-native
```

### UI & Icons
```bash
npm install expo-linear-gradient lucide-react-native react-native-svg @react-native-community/slider
```

### Camera & Notifications
```bash
npm install expo-camera expo-notifications expo-av
```

### State & Storage
```bash
npm install zustand @react-native-async-storage/async-storage
```

### Navigation
```bash
npm install @react-navigation/native react-native-reanimated react-native-safe-area-context react-native-screens
```

---

## 🎯 Quick Commands

```bash
# Start development server
npx expo start

# Start with clear cache
npx expo start --clear

# Build for Android (requires Android Studio)
npx expo run:android

# Build for iOS (requires Xcode, Mac only)
npx expo run:ios
```

---

## 📁 Project Structure

```
app/
├── (tabs)/          # Main screens (Home, Live, Reports, Settings)
├── auth/            # Login/Signup
├── profile/         # Profile edit
└── _layout.tsx      # Root layout

components/          # Reusable UI components
services/            # Camera & notification services
store/               # Zustand state management
```

---

## ⚠️ Important Notes

1. **Notifications**: Don't work in Expo Go. Use development build:
   ```bash
   npx expo run:android
   ```

2. **Permissions**: Camera access required for app to work

3. **Dark Mode**: Toggle in Settings → works across all screens

---

## � Troubleshooting

**Module errors:**
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

**Camera not working:**
- Check device permissions
- Restart Expo Go app

---

## � For Team Members

1. Install Node.js
2. Clone repo
3. Run `npm install`
4. Run `npx expo start`
5. Scan QR with Expo Go app

Done! 🎉
