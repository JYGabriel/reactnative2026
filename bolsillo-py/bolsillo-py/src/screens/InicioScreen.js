import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import { useFinance, TIPOS_PRODUCTO_CUENTA } from '../context/FinanceContext';
import { ENTIDADES_PY } from '../data/entidadesPY';
import EntidadLogo from '../components/EntidadLogo';

const formatearGs = (monto) =>
  `Gs. ${Number(monto || 0).toLocaleString('es-PY')}`;

const esCuentaEfectivo = (cuenta) => {
  if (!cuenta || typeof cuenta !== 'object') return false;
  const id = String(cuenta.id || '').trim().toLowerCase();
  const nombre = String(cuenta.nombre || '').trim().toLowerCase();
  return id === 'efectivo' || nombre === 'efectivo';
};

const construirDetalleTarjeta = (cuenta) => {
  if (!cuenta || cuenta.productoTipo !== 'tarjeta_credito') return '';
  const partes = [];
  if (cuenta.diaCierre) {
    partes.push(`Cierre día ${cuenta.diaCierre}`);
  }
  if (cuenta.diaVencimiento) {
    partes.push(`Vence día ${cuenta.diaVencimiento}`);
  }
  if (cuenta.limiteCredito) {
    partes.push(`Límite ${formatearGs(cuenta.limiteCredito)}`);
  }
  return partes.join(' • ');
};

export default function InicioScreen() {
  const finance = useFinance() || {};
  const cuentas = Array.isArray(finance.cuentas) ? finance.cuentas : [];
  const saldoTotal = Number(finance.saldoTotal || 0);
  const agregarCuenta =
    typeof finance.agregarCuenta === 'function' ? finance.agregarCuenta : () => {};
  const eliminarCuenta =
    typeof finance.eliminarCuenta === 'function' ? finance.eliminarCuenta : () => {};

  const [modalVisible, setModalVisible] = useState(false);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState(null);
  const [productoTipo, setProductoTipo] = useState('caja_ahorro');
  const [alias, setAlias] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [limiteCredito, setLimiteCredito] = useState('');
  const [diaCierre, setDiaCierre] = useState('');
  const [diaVencimiento, setDiaVencimiento] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const listaEntidades = Array.isArray(ENTIDADES_PY) ? ENTIDADES_PY : [];
  const textoBusqueda = (busqueda || '').trim().toLowerCase();

  const entidadesFiltradas = listaEntidades.filter((e) => {
    if (!e || typeof e !== 'object') return false;
    const nombre = typeof e.nombre === 'string' ? e.nombre.toLowerCase() : '';
    const tipo = typeof e.tipo === 'string' ? e.tipo.toLowerCase() : '';
    if (!textoBusqueda) return true;
    return nombre.includes(textoBusqueda) || tipo.includes(textoBusqueda);
  });

  const handleSeleccionarProducto = (key) => {
    setProductoTipo(key);
    if (key !== 'tarjeta_credito') {
      setLimiteCredito('');
      setDiaCierre('');
      setDiaVencimiento('');
    }
  };

  const handleGuardarCuenta = () => {
    if (!entidadSeleccionada) {
      Alert.alert('Falta entidad', 'Seleccioná un banco o financiera de la lista.');
      return;
    }

    const esTarjeta = productoTipo === 'tarjeta_credito';
    let diaCierreNormalizado = null;
    let diaVencimientoNormalizado = null;

    if (esTarjeta && String(diaCierre || '').trim() !== '') {
      const diaNum = Number(String(diaCierre).replace(/\D/g, ''));
      if (!diaNum || diaNum < 1 || diaNum > 31) {
        Alert.alert(
          'Día de cierre inválido',
          'Ingresá un día de cierre entre 1 y 31, o dejalo vacío.'
        );
        return;
      }
      diaCierreNormalizado = diaNum;
    }

    if (esTarjeta && String(diaVencimiento || '').trim() !== '') {
      const vencNum = Number(String(diaVencimiento).replace(/\D/g, ''));
      if (!vencNum || vencNum < 1 || vencNum > 31) {
        Alert.alert(
          'Día de vencimiento inválido',
          'Ingresá un día de vencimiento entre 1 y 31, o dejalo vacío.'
        );
        return;
      }
      diaVencimientoNormalizado = vencNum;
    }

    const limiteNormalizado =
      esTarjeta && String(limiteCredito || '').trim() !== ''
        ? Number(String(limiteCredito).replace(/\D/g, '')) || null
        : null;

    const saldoLimpio = Number(String(saldoInicial || '0').replace(/\D/g, '')) || 0;

    agregarCuenta({
      entidad: entidadSeleccionada,
      productoTipo,
      alias: (alias || '').trim(),
      saldoInicial: saldoLimpio,
      limiteCredito: limiteNormalizado,
      diaCierre: diaCierreNormalizado,
      diaVencimiento: diaVencimientoNormalizado,
    });

    setEntidadSeleccionada(null);
    setProductoTipo('caja_ahorro');
    setAlias('');
    setSaldoInicial('');
    setLimiteCredito('');
    setDiaCierre('');
    setDiaVencimiento('');
    setBusqueda('');
    setModalVisible(false);
  };

  const confirmarEliminar = (cuenta) => {
    if (!cuenta || esCuentaEfectivo(cuenta)) return;
    Alert.alert(
      'Eliminar producto',
      `¿Seguro que querés eliminar ${cuenta.nombre || 'esta cuenta'} (${cuenta.tipo || 'Producto'} · ${cuenta.alias || 'Principal'})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => eliminarCuenta(cuenta.id),
        },
      ]
    );
  };

  const renderAvatarCuenta = (item) => {
    if (esCuentaEfectivo(item)) {
      return (
        <View style={styles.efectivoIconBox}>
          <Ionicons name="cash-outline" size={24} color="#10B981" />
        </View>
      );
    }

    return (
      <EntidadLogo
        logo={item.logo}
        nombre={item.nombre || ''}
        color={item.color || '#334155'}
        size={42}
      />
    );
  };

  return (
    <AppLayout>
      {/* Encabezado y Saldo Total */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Bolsillo PY</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo Total</Text>
          <Text style={styles.balanceValue}>{formatearGs(saldoTotal)}</Text>
        </View>
      </View>

      {/* Título de sección + Botón Agregar */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mis Cuentas ({cuentas.length})</Text>
        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={18} color="#0F172A" />
          <Text style={styles.addButtonText}>Agregar producto</Text>
        </Pressable>
      </View>

      {/* Lista de Cuentas */}
      <FlatList
        data={cuentas}
        keyExtractor={(item, index) => String(item?.id || `cuenta-${index}`)}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          if (!item) return null;
          const esEfectivo = esCuentaEfectivo(item);
          const detalleTarjeta = construirDetalleTarjeta(item);

          return (
            <View
              style={[
                styles.accountCard,
                { borderLeftColor: item.color || (esEfectivo ? '#10B981' : '#38BDF8') },
              ]}
            >
              {renderAvatarCuenta(item)}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.accountName}>{item.nombre || 'Cuenta'}</Text>
                <Text style={styles.accountMeta}>
                  {item.tipo || (esEfectivo ? 'Efectivo' : 'Caja de Ahorro')} •{' '}
                  {item.alias || (esEfectivo ? 'Billetera' : 'Principal')}
                </Text>
                {detalleTarjeta ? (
                  <Text style={styles.cardExtraMeta}>{detalleTarjeta}</Text>
                ) : null}
              </View>
              <View style={styles.accountRight}>
                <Text style={styles.accountBalance}>{formatearGs(item.saldo)}</Text>
                {!esEfectivo && (
                  <Pressable onPress={() => confirmarEliminar(item)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color="#F87171" />
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Modal para registrar Caja Básica, Caja de Ahorro o Tarjeta de Crédito */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.modalScrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nuevo Producto en Entidad</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </Pressable>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Buscar banco o financiera..."
                placeholderTextColor="#64748B"
                value={busqueda}
                onChangeText={setBusqueda}
              />

              <ScrollView style={styles.entidadesList} nestedScrollEnabled>
                {entidadesFiltradas.map((entidad, index) => {
                  if (!entidad) return null;
                  const keyId = entidad.id || `entidad-${index}`;
                  const activa = entidadSeleccionada?.id === entidad.id;
                  return (
                    <Pressable
                      key={keyId}
                      style={[styles.entidadItem, activa && styles.entidadItemActive]}
                      onPress={() => setEntidadSeleccionada(entidad)}
                    >
                      <EntidadLogo
                        logo={entidad.logo}
                        nombre={entidad.nombre || ''}
                        color={entidad.color || '#334155'}
                        size={36}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.entidadName}>{entidad.nombre || 'Entidad'}</Text>
                        <Text style={styles.entidadTipo}>{entidad.tipo || ''}</Text>
                      </View>
                      {activa && <Ionicons name="checkmark-circle" size={20} color="#38BDF8" />}
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Selector de Tipo de Producto */}
              <Text style={styles.fieldLabel}>Tipo de producto</Text>
              <View style={styles.productChipsRow}>
                {TIPOS_PRODUCTO_CUENTA.map((prod) => {
                  const seleccionado = productoTipo === prod.key;
                  return (
                    <Pressable
                      key={prod.key}
                      style={[
                        styles.productChip,
                        seleccionado && styles.productChipActive,
                      ]}
                      onPress={() => handleSeleccionarProducto(prod.key)}
                    >
                      <Text
                        style={[
                          styles.productChipText,
                          seleccionado && styles.productChipTextActive,
                        ]}
                      >
                        {prod.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Alias (ej: Ahorro viaje, Sueldo, Visa Gold)"
                placeholderTextColor="#64748B"
                value={alias}
                onChangeText={setAlias}
              />

              <TextInput
                style={styles.input}
                placeholder="Saldo inicial en Gs. (ej: 500000)"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={saldoInicial}
                onChangeText={setSaldoInicial}
              />

              {productoTipo === 'tarjeta_credito' && (
                <View style={styles.creditFieldsBox}>
                  <Text style={styles.creditFieldsTitle}>
                    Datos opcionales de Tarjeta de Crédito
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Límite de crédito en Gs. (opcional, ej: 10000000)"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={limiteCredito}
                    onChangeText={setLimiteCredito}
                  />
                  <View style={styles.datesRow}>
                    <TextInput
                      style={[styles.input, styles.halfInput, { marginBottom: 0 }]}
                      placeholder="Día cierre (1-31)"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      maxLength={2}
                      value={diaCierre}
                      onChangeText={setDiaCierre}
                    />
                    <TextInput
                      style={[styles.input, styles.halfInput, { marginBottom: 0 }]}
                      placeholder="Día venc. (1-31)"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      maxLength={2}
                      value={diaVencimiento}
                      onChangeText={setDiaVencimiento}
                    />
                  </View>
                </View>
              )}

              <Pressable style={styles.saveButton} onPress={handleGuardarCuenta}>
                <Text style={styles.saveButtonText}>Guardar Producto</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 10, marginBottom: 20 },
  appTitle: { fontSize: 22, fontWeight: '700', color: '#F8FAFC', marginBottom: 12 },
  balanceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  balanceLabel: { color: '#94A3B8', fontSize: 14 },
  balanceValue: { color: '#38BDF8', fontSize: 30, fontWeight: '800', marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: '#E2E8F0', fontSize: 16, fontWeight: '600' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addButtonText: { color: '#0F172A', fontWeight: '700', fontSize: 13 },
  accountCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 5,
    flexDirection: 'row',
    alignItems: 'center',
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
  accountName: { color: '#F8FAFC', fontSize: 15, fontWeight: '600' },
  accountMeta: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  cardExtraMeta: { color: '#38BDF8', fontSize: 11, fontWeight: '600', marginTop: 3 },
  accountRight: { alignItems: 'flex-end', gap: 6 },
  accountBalance: { color: '#10B981', fontSize: 15, fontWeight: '700' },
  deleteBtn: { padding: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  fieldLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  productChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  productChip: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  productChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  productChipText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  productChipTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  creditFieldsBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  creditFieldsTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  entidadesList: { maxHeight: 165, marginBottom: 12 },
  entidadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#1E293B',
  },
  entidadItemActive: { borderWidth: 1, borderColor: '#38BDF8' },
  entidadName: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  entidadTipo: { color: '#94A3B8', fontSize: 12 },
  saveButton: {
    backgroundColor: '#38BDF8',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: { color: '#0F172A', fontWeight: '700', fontSize: 16 },
});