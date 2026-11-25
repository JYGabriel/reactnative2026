import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import { useFinance } from '../context/FinanceContext';
import EntidadLogo from '../components/EntidadLogo';

const formatearGs = (monto) =>
  `Gs. ${Number(monto || 0).toLocaleString('es-PY')}`;

const formatearFecha = (iso) => {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const esCuentaEfectivo = (cuenta) => {
  if (!cuenta || typeof cuenta !== 'object') return false;
  const id = String(cuenta.id || '').trim().toLowerCase();
  const nombre = String(cuenta.nombre || '').trim().toLowerCase();
  return id === 'efectivo' || nombre === 'efectivo';
};

export default function MovimientosScreen() {
  const finance = useFinance() || {};
  const movimientos = Array.isArray(finance.movimientos) ? finance.movimientos : [];
  const cuentas = Array.isArray(finance.cuentas) ? finance.cuentas : [];
  const eliminarMovimiento =
    typeof finance.eliminarMovimiento === 'function'
      ? finance.eliminarMovimiento
      : () => {};

  const [filtro, setFiltro] = useState('todos'); // 'todos' | 'gasto' | 'ingreso'

  const obtenerCuenta = (movimiento) => {
    const mov = movimiento && typeof movimiento === 'object' ? movimiento : {};
    const encontrada = cuentas.find(
      (c) =>
        c &&
        ((mov.cuentaId && c.id === mov.cuentaId) ||
          (mov.cuentaNombre && c.nombre === mov.cuentaNombre))
    );

    if (encontrada) {
      return encontrada;
    }

    const nombreFallback = mov.cuentaNombre || 'Efectivo';
    const esEfectivoFallback = String(nombreFallback).trim().toLowerCase() === 'efectivo';

    return {
      id: esEfectivoFallback ? 'efectivo' : mov.cuentaId || null,
      nombre: nombreFallback,
      color: esEfectivoFallback ? '#10B981' : '#334155',
      logo: null,
    };
  };

  const confirmarEliminarMovimiento = (movimiento) => {
    if (!movimiento || !movimiento.id) return;

    const esIngreso = movimiento.tipo === 'ingreso';
    const signo = esIngreso ? '+' : '-';

    Alert.alert(
      'Eliminar movimiento',
      `¿Seguro que querés eliminar "${movimiento.descripcion || 'este movimiento'}" (${signo} ${formatearGs(movimiento.monto)})? Se revertirá el saldo en la cuenta.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => eliminarMovimiento(movimiento.id),
        },
      ]
    );
  };

  const listaFiltrada = movimientos.filter((m) => {
    if (!m || typeof m !== 'object') return false;
    if (filtro === 'todos') return true;
    return m.tipo === filtro;
  });

  const renderAvatarCuenta = (cuenta) => {
    if (esCuentaEfectivo(cuenta)) {
      return (
        <View style={styles.efectivoIconBox}>
          <Ionicons name="cash-outline" size={22} color="#10B981" />
        </View>
      );
    }

    return (
      <EntidadLogo
        logo={cuenta.logo}
        nombre={cuenta.nombre || ''}
        color={cuenta.color || '#334155'}
        size={42}
      />
    );
  };

  return (
    <AppLayout>
      <Text style={styles.title}>Movimientos</Text>

      {/* Filtros */}
      <View style={styles.filterRow}>
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'gasto', label: 'Gastos' },
          { key: 'ingreso', label: 'Ingresos' },
        ].map((item) => {
          const activo = filtro === item.key;
          return (
            <Pressable
              key={item.key}
              style={[styles.filterBtn, activo && styles.filterBtnActive]}
              onPress={() => setFiltro(item.key)}
            >
              <Text style={[styles.filterText, activo && styles.filterTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Lista o Estado Vacío */}
      <FlatList
        data={listaFiltrada}
        keyExtractor={(item, index) => String(item?.id || `mov-${index}`)}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={44} color="#475569" />
            <Text style={styles.emptyText}>Todavía no hay movimientos registrados.</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (!item) return null;
          const esIngreso = item.tipo === 'ingreso';
          const cuenta = obtenerCuenta(item);
          const fechaTexto = formatearFecha(item.fecha);

          return (
            <View style={styles.card}>
              <View style={styles.logoWrapper}>
                {renderAvatarCuenta(cuenta)}
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: esIngreso ? '#10B981' : '#F87171' },
                  ]}
                >
                  <Ionicons
                    name={esIngreso ? 'arrow-up' : 'arrow-down'}
                    size={10}
                    color="#0F172A"
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.desc}>{item.descripcion || 'Movimiento'}</Text>
                <Text style={styles.meta}>
                  {item.categoria || 'General'} • {cuenta.nombre}
                </Text>
                {fechaTexto ? <Text style={styles.date}>{fechaTexto}</Text> : null}
              </View>

              <View style={styles.rightColumn}>
                <Text style={[styles.amount, { color: esIngreso ? '#10B981' : '#F87171' }]}>
                  {esIngreso ? '+' : '-'} {formatearGs(item.monto)}
                </Text>
                <Pressable
                  onPress={() => confirmarEliminarMovimiento(item)}
                  style={styles.deleteBtn}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={17} color="#F87171" />
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: '#F8FAFC', marginTop: 10, marginBottom: 14 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterBtnActive: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  filterText: { color: '#94A3B8', fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: '#0F172A' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 60 },
  emptyText: { color: '#64748B', fontSize: 15 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  logoWrapper: {
    position: 'relative',
  },
  efectivoIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10.5,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  desc: { color: '#F8FAFC', fontSize: 15, fontWeight: '600' },
  meta: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  date: { color: '#64748B', fontSize: 11, marginTop: 2 },
  rightColumn: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 14, fontWeight: '700' },
  deleteBtn: { padding: 4 },
});