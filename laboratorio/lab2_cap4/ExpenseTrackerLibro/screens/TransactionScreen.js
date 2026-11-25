import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
const TransactionScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Transactions</Text>
            <Text>View your transactions here</Text>
            <Button
                title="View Transaction Detail"
                onPress={() =>
                    navigation.navigate('TransactionDetail', { id: 1 })
                }
            />
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
export default TransactionScreen;