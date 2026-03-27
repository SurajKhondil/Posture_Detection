import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SignupScreen() {
    const router = useRouter();

    // Redirect to login (which handles both login and signup)
    React.useEffect(() => {
        router.replace('/auth/login');
    }, []);

    return (
        <View style={styles.container}>
            <Text>Redirecting...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
});
