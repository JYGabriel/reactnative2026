import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AppLayout({ children }) {
  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#0F172A']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
});