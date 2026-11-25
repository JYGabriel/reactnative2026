import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const HomeScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Home</Text>
            <Text>Welcome to Expense Tracker</Text>
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});
export default HomeScreen;