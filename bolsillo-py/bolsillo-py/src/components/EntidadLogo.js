import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function EntidadLogo({ logo, nombre = '', color = '#334155', size = 40 }) {
  // Si hay imagen local (require) o URL
  if (logo) {
    const source = typeof logo === 'string' ? { uri: logo } : logo;

    return (
      <View
        style={[
          styles.logoContainer,
          { width: size, height: size, borderRadius: size * 0.25 },
        ]}
      >
        <Image
          source={source}
          style={{ width: size - 6, height: size - 6 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Fallback: iniciales (ej. Efectivo -> "E")
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size * 0.25,
          backgroundColor: color,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
        {iniciales || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});