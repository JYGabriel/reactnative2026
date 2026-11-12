import React from 'react';
import { View, StyleSheet } from 'react-native';
export default function StatsScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.box1} />
            <View style={styles.box2} />
            <View style={styles.box3} />
        </View>
    );
}
const styles = StyleSheet.create({
    /*
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 10, // This will add a gap of 10 units between the boxes
    },
    */

    box1: {
        width: 80,
        height: 150,
        backgroundColor: '#FFCDD2',
    },
    box2: {
        width: 280,
        height: 80,
        backgroundColor: '#C8E6C9',
        alignSelf: 'flex-start', // This will align the box to the start of the cross axis
        //flexGrow: 1,  // This will make the box grow and shrink as needed
        //flexShrink: 1,    // This will make the box grow and shrink as needed
        // flex: 1, // This will make the box grow and shrink as needed
    },

    box3: {
        width: 80,
        height: 80,
        backgroundColor: '#BBDEFB',
    },

    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },// Eliminar flexWrap y alignContent si estaban definidos.
});
