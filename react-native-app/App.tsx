import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { HomeView } from './src/views/HomeView';
import { usePoseStore } from './src/state/pose_state_manager';
import { ViewMode } from './src/views/types';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const { setViewMode, startCalibration, cancelCalibration, isCalibrating } = usePoseStore();

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'f' || e.key === 'F') {
          setViewMode(ViewMode.front);
        } else if (e.key === 's' || e.key === 'S') {
          setViewMode(ViewMode.side);
        } else if (e.key === 'c' || e.key === 'C') {
          if (isCalibrating) cancelCalibration();
          else startCalibration();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isCalibrating, setViewMode, startCalibration, cancelCalibration]);

  return (
    <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
      <StatusBar style="light" />
      <HomeView />
    </View>
  );
}
