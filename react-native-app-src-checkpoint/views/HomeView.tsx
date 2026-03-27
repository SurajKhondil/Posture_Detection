import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { usePoseStore } from '../state/pose_state_manager';
import { poseDetectorService } from '../services/mediapipe_pose_detector';
import { ViewMode } from './types';
import { PosePainter } from '../painters/PosePainter';
import { Activity, Camera as CameraIcon, CheckCircle2, CloudFog, Accessibility } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const HomeView = () => {
    const [containerLayout, setContainerLayout] = useState({ width: 0, height: 0 });
    const cameraRef = useRef<CameraView>(null);
    const [permission, requestPermission] = useCameraPermissions();

    const {
        viewMode,
        isCalibrated,
        isCalibrating,
        calibrationBuffer,
        currentPose,
        calibratedMetrics,
        isConnected,
        connectionMessage,
        fps,
        setViewMode,
        startCalibration,
        reset,
    } = usePoseStore();

    useEffect(() => {
        poseDetectorService.initialize();
        return () => {
            poseDetectorService.dispose();
            reset();
        };
    }, []);

    // Frame Capture Loop
    useEffect(() => {
        if (!permission?.granted || !isConnected) return;

        let isActive = true;
        const captureFrame = async () => {
            if (!isActive || !cameraRef.current || !poseDetectorService.isReady) return;

            try {
                const picture = await cameraRef.current.takePictureAsync({
                    base64: true,
                    quality: 0.1,
                    // By passing scale or skipProcessing here we can speed it up
                    skipProcessing: true // Skips HDR/Heavy filtering
                });

                if (picture?.base64) {
                    poseDetectorService.sendFrame(picture.base64);
                }
            } catch (e) {
                // Ignore transient camera errors
            }
        };

        // Capture at roughly 10 FPS (100ms) to leave room for the JS thread to process React ticks
        const intervalId = setInterval(captureFrame, 100);

        return () => {
            isActive = false;
            clearInterval(intervalId);
        };
    }, [isConnected, permission?.granted]);

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                <TouchableOpacity style={styles.calibBtn} onPress={requestPermission}>
                    <Text style={styles.calibBtnText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const getBorderColor = () => {
        if (!calibratedMetrics) return '#ffffff33';
        switch (calibratedMetrics.overallQuality) {
            case 'bad': return '#FF0000';
            case 'warning': return '#FFA500';
            case 'good': return '#00FF00';
            default: return '#ffffff33';
        }
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Accessibility color="#00D4FF" size={28} />
                    <Text style={styles.title}>Pose Engine</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
                        <CloudFog color="#ffffffb3" size={18} />
                        <Text style={styles.statusText}>MediaPipe</Text>
                    </View>

                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: currentPose ? '#4CAF50' : '#F44336' }]} />
                        <Activity color="#ffffffb3" size={18} />
                        <Text style={styles.statusText}>Pose</Text>
                    </View>

                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: isCalibrated ? '#4CAF50' : '#F44336' }]} />
                        <CheckCircle2 color="#ffffffb3" size={18} />
                        <Text style={styles.statusText}>Calibrated</Text>
                    </View>

                    <View style={styles.fpsContainer}>
                        <Text style={styles.fpsText}>{fps.toFixed(1)} FPS</Text>
                    </View>
                </View>
            </View>

            {/* CONTENT */}
            <View style={styles.content}>

                {/* CAMERA VIEW LAYER */}
                <View
                    style={[styles.cameraContainer, { borderColor: getBorderColor() }]}
                    onLayout={(e) => setContainerLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
                >
                    <CameraView
                        ref={cameraRef}
                        style={StyleSheet.absoluteFillObject}
                        facing="front"
                        pictureSize="640x480" // Tiny resolution to vastly improve real-time encoding speed!
                        animateShutter={false} // Disable visual stutter
                    />

                    {containerLayout.width > 0 && currentPose && (
                        <PosePainter
                            pose={currentPose}
                            viewMode={viewMode}
                            metrics={calibratedMetrics}
                            imageWidth={640}
                            imageHeight={480}
                            containerWidth={containerLayout.width}
                            containerHeight={containerLayout.height}
                        />
                    )}

                    {!isConnected && (
                        <View style={styles.overlay}>
                            <ActivityIndicator color="#00D4FF" size="large" />
                            <Text style={styles.overlayTitle}>Connecting to MediaPipe Server...</Text>
                            <Text style={styles.overlaySub}>{connectionMessage}</Text>
                        </View>
                    )}

                    {isConnected && !currentPose && (
                        <View style={styles.warningOverlayContainer}>
                            <View style={styles.warningBubble}>
                                <Text style={styles.warningText}>No pose detected - Position yourself in front of the camera</Text>
                            </View>
                        </View>
                    )}

                    {isCalibrating && (
                        <View style={styles.overlay}>
                            <Accessibility color="#00D4FF" size={64} />
                            <Text style={styles.overlayTitle}>CALIBRATING</Text>
                            <Text style={styles.overlaySub}>Hold still in your ideal posture</Text>
                            <Text style={{ color: '#00D4FF', fontSize: 18, marginTop: 12 }}>
                                {Math.floor((calibrationBuffer.length / 30) * 100)}%
                            </Text>
                        </View>
                    )}

                    <View style={styles.modeIndicator}>
                        <Accessibility color="#fff" size={18} />
                        <Text style={styles.modeIndicatorText}>{viewMode === ViewMode.front ? 'FRONT VIEW' : 'SIDE VIEW'}</Text>
                    </View>

                </View>

                {/* METRICS PANEL */}
                <View style={styles.metricsPanel}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={styles.metricsTitle}>
                            <Activity color="#00D4FF" size={20} /> POSTURE METRICS
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: '#fff', fontSize: 12, marginRight: 8 }}>OVERALL:</Text>
                            <Text style={{ color: getBorderColor(), fontWeight: 'bold', fontSize: 14 }}>
                                {(calibratedMetrics?.overallQuality || 'unknown').toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsRow}>
                        {viewMode === ViewMode.front ? (
                            <>
                                <MetricCard label="Neck Bend" value={calibratedMetrics?.neckBendAngle || 0} unit="°" quality={calibratedMetrics?.neckBendQuality || 'good'} />
                                <MetricCard label="Shoulder Slope" value={calibratedMetrics?.shoulderSlopeAngle || 0} unit="°" quality={calibratedMetrics?.shoulderSlopeQuality || 'good'} />
                                <MetricCard label="Torso Tilt" value={calibratedMetrics?.torsoTiltPercent || 0} unit="%" quality={calibratedMetrics?.torsoTiltQuality || 'good'} />
                            </>
                        ) : (
                            <>
                                <MetricCard label="Neck Bend" value={calibratedMetrics?.neckBendAngle || 0} unit="°" quality={calibratedMetrics?.neckBendQuality || 'good'} />
                                <MetricCard label="Head Forward" value={(calibratedMetrics?.headForwardRatio || 0) * 100} unit="%" quality={calibratedMetrics?.headForwardQuality || 'good'} />
                            </>
                        )}
                    </ScrollView>
                </View>

            </View>

            {/* CONTROLS */}
            <View style={styles.controlBar}>
                <TouchableOpacity style={[styles.controlBtn, viewMode === ViewMode.front && styles.controlBtnActive]} onPress={() => setViewMode(ViewMode.front)}>
                    <Text style={styles.controlBtnText}>[F] Front View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.controlBtn, viewMode === ViewMode.side && styles.controlBtnActive]} onPress={() => setViewMode(ViewMode.side)}>
                    <Text style={styles.controlBtnText}>[S] Side View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calibBtn} onPress={startCalibration}>
                    <Text style={styles.calibBtnText}>[C] {isCalibrated ? 'Recalibrate' : 'Calibrate'}</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
};

const MetricCard = ({ label, value, unit, quality }: { label: string, value: number, unit: string, quality: string }) => {
    let qColor = '#00FF00';
    if (quality === 'bad') qColor = '#FF0000';
    if (quality === 'warning') qColor = '#FFA500';

    return (
        <View style={styles.metricCard}>
            <Text style={styles.metricLabel} numberOfLines={1}>{label}</Text>
            <Text style={[styles.metricValue, { color: qColor, marginTop: 6 }]}>{value.toFixed(1)}{unit}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1A1A2E' },
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A2E' },
    permissionText: { color: 'white', fontSize: 18, marginBottom: 20 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#16213E'
    },
    title: { color: 'white', fontSize: 22, fontWeight: 'bold', marginLeft: 12 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
    statusText: { color: '#ffffffb3', fontSize: 12, marginLeft: 4 },
    fpsContainer: { backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    fpsText: { color: '#00D4FF', fontWeight: 'bold', fontSize: 14 },

    content: { flex: 1, flexDirection: width > 600 ? 'row' : 'column' },
    cameraContainer: {
        flex: 3,
        margin: 16,
        borderWidth: 3,
        borderRadius: 16,
        backgroundColor: '#1E2A4A',
        overflow: 'hidden',
        position: 'relative'
    },
    placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    overlayTitle: { color: 'white', fontSize: 18, marginTop: 24, fontWeight: 'bold' },
    overlaySub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8 },

    warningOverlayContainer: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
    warningBubble: { backgroundColor: 'rgba(255,179,0,0.8)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    warningText: { color: '#000', fontWeight: 'bold' },

    modeIndicator: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
    modeIndicatorText: { color: 'white', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },

    metricsPanel: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#16213E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    metricsTitle: { color: 'white', fontSize: 14, fontWeight: 'bold' },

    metricsRow: { flexDirection: 'row', alignItems: 'center' },
    metricCard: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12, marginRight: 12, alignItems: 'center', justifyContent: 'center', width: 100 },
    metricLabel: { color: '#ffffffb3', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
    metricValue: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },

    controlBar: { flexDirection: 'row', padding: 16, backgroundColor: '#16213E', justifyContent: 'center' },
    controlBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginHorizontal: 8 },
    controlBtnActive: { backgroundColor: 'rgba(0, 212, 255, 0.2)', borderColor: '#00D4FF', borderWidth: 1 },
    controlBtnText: { color: 'white', fontWeight: 'bold' },
    calibBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginHorizontal: 8 },
    calibBtnText: { color: 'white', fontWeight: 'bold' },
});
