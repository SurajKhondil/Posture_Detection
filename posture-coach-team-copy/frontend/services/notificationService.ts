import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

class NotificationService {
    private hasPermission: boolean = false;

    async requestPermissions(): Promise<boolean> {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            this.hasPermission = finalStatus === 'granted';

            if (this.hasPermission && Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('posture-alerts', {
                    name: 'Posture Alerts',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#6366f1',
                });
            }

            return this.hasPermission;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    async checkPermissions(): Promise<boolean> {
        try {
            const { status } = await Notifications.getPermissionsAsync();
            this.hasPermission = status === 'granted';
            return this.hasPermission;
        } catch (error) {
            console.error('Error checking notification permission:', error);
            return false;
        }
    }

    async sendPostureAlert(severity: 'warning' | 'bad') {
        if (!this.hasPermission) {
            console.warn('Notification permission not granted');
            return;
        }

        const title = severity === 'bad' ? '⚠️ Posture Alert!' : '⚡ Posture Warning';
        const body =
            severity === 'bad'
                ? 'Your posture needs immediate correction. Sit up straight!'
                : 'Time to adjust your sitting position.';

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // Send immediately
        });
    }

    async sendReminder(message: string, delaySeconds: number = 0) {
        if (!this.hasPermission) {
            console.warn('Notification permission not granted');
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '💪 Posture Coach',
                body: message,
                sound: true,
            },
            trigger: delaySeconds > 0 ? { seconds: delaySeconds, repeats: false } as any : null,
        });
    }

    async sendWeeklySummary(avgScore: number, goodTimeH: number) {
        if (!this.hasPermission) return;

        const performanceText = avgScore >= 80 ? 'Excellent' : avgScore >= 60 ? 'Good' : 'Needs Work';
        
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '📊 Weekly Posture Recap',
                body: `Your average score was ${avgScore}% (${performanceText}). You maintained good posture for ${goodTimeH}h this week. Keep it up!`,
                sound: true,
            },
            trigger: null,
        });
    }

    async cancelAllNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }
}

export const notificationService = new NotificationService();
