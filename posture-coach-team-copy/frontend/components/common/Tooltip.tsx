import { HelpCircle, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface TooltipProps {
    title: string;
    description: string;
    darkMode?: boolean;
}

export function Tooltip({ title, description, darkMode }: TooltipProps) {
    const [visible, setVisible] = useState(false);

    return (
        <>
            <Pressable onPress={() => setVisible(true)} style={styles.iconButton}>
                <HelpCircle color={darkMode ? "#8b5cf6" : "#6366f1"} size={18} />
            </Pressable>

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <Pressable
                    style={styles.overlay}
                    onPress={() => setVisible(false)}
                >
                    <View style={[styles.tooltipCard, darkMode && styles.tooltipCardDark]}>
                        <View style={styles.tooltipHeader}>
                            <Text style={[styles.tooltipTitle, darkMode && styles.tooltipTitleDark]}>
                                {title}
                            </Text>
                            <Pressable onPress={() => setVisible(false)}>
                                <X color={darkMode ? "#9ca3af" : "#6b7280"} size={20} />
                            </Pressable>
                        </View>
                        <Text style={[styles.tooltipText, darkMode && styles.tooltipTextDark]}>
                            {description}
                        </Text>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    iconButton: {
        padding: 4,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    tooltipCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    tooltipCardDark: {
        backgroundColor: '#1f2937',
    },
    tooltipHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tooltipTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    tooltipTitleDark: {
        color: '#f9fafb',
    },
    tooltipText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#6b7280',
    },
    tooltipTextDark: {
        color: '#9ca3af',
    },
});
