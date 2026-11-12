import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const StatsScreen = () => {
 return (
 <View style={styles.container}>
 <Text style={styles.title}>Stats</Text>
 <Text>View your income and expense statistics here</Text>
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
export default StatsScreen;