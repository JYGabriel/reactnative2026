import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const TransactionDetailScreen = ({ route }) => {
    const { id } = route.params;
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Transaction Detail</Text>
            <Text>Transaction ID: {id}</Text>
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});
export default TransactionDetailScreen;