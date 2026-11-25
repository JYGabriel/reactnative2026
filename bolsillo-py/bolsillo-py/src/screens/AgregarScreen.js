import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import EntidadLogo from '../components/EntidadLogo';
import { useFinance } from '../context/FinanceContext';

const BASE_GASTO = [
  'Comida',
  'Transporte',
  'Supermercado',
  'Servicios',
  'Salud',
  'Ocio',
  'Vivienda',
  'Educación',
  'Ropa',
  'Mascotas',
  'Suscripciones',
  'Otros',
];

const BASE_INGRESO = [
  'Sueldo',
  'Freelance',
  'Ventas',
  'Regalo',
  'Inversiones',
  'Reembolso',
  'Aguinaldo',
  'Otros',
];

const esCuentaEfectivo = (cuenta) => {
  if (!cuenta || typeof cuenta !== 'object') return false;
  const id = String(cuenta.id || '').trim().toLowerCase();
  const nombre = String(cuenta.nombre || '').trim().toLowerCase();
  return id === 'efectivo' || nombre === 'efectivo';
};

const limpiarNombre = (texto) =>
  String(texto || '')
    .trim()
    .replace(/\s+/g, ' ');

export default function AgregarScreen({ navigation }) {
  const finance = useFinance() || {};
  const cuentas = Array.isArray(finance.cuentas) ? finance.cuentas : [];
  const agregarMovimiento =
    typeof finance.agregarMovimiento === 'function' ? finance.agregarMovimiento : () => {};
  const agregarCategoriaCtx =
    typeof finance.agregarCategoria === 'function' ? finance.agregarCategoria : null;
  const eliminarCategoriaCtx =
    typeof finance.eliminarCategoria === 'function' ? finance.eliminarCategoria : null;

  const [tipo, setTipo] = useState('gasto'); // 'gasto' | 'ingreso'
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Comida');
  const [cuentaId, setCuentaId] = useState(cuentas[0]?.id || 'efectivo');

  const [customGasto, setCustomGasto] = useState([]);
  const [customIngreso, setCustomIngreso] = useState([]);
  const [mostrarCrearCategoria, setMostrarCrearCategoria] = useState(false);
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState('');

  useEffect(() => {
    if (!cuentaId && cuentas.length > 0) {
      setCuentaId(cuentas[0].id);
    }
  }, [cuentas, cuentaId]);

  const categorias = useMemo(() => {
    const base = tipo === 'gasto' ? BASE_GASTO : BASE_INGRESO;
    const ctxList =
      tipo === 'gasto' ? finance.categoriasGasto : finance.categoriasIngreso;
    const localCustom = tipo === 'gasto' ? customGasto : customIngreso;

    const candidatos = Array.isArray(ctxList) && ctxList.length > 0
      ? [...ctxList, ...localCustom]
      : [...base.filter((c) => c !== 'Otros'), ...localCustom, 'Otros'];

    const sinOtros = [];
    const vistas = new Set();
    for (const item of candidatos) {
      const limpio = limpiarNombre(item);
      if (!limpio) continue;
      const clave = limpio.toLowerCase();
      if (clave === 'otros' || vistas.has(clave)) continue;
      vistas.add(clave);
      sinOtros.push(limpio);
    }

    return [...sinOtros, 'Otros'];
  }, [tipo, finance.categoriasGasto, finance.categoriasIngreso, customGasto, customIngreso]);

  const nombresBaseActuales = useMemo(() => {
    const base = tipo === 'gasto' ? BASE_GASTO : BASE_INGRESO;
    return new Set(base.map((c) => c.toLowerCase()));
  }, [tipo]);

  const cambiarTipo = (nuevoTipo) => {
    setTipo(nuevoTipo);
    setMostrarCrearCategoria(false);
    setNuevaCategoriaNombre('');
    const base = nuevoTipo === 'gasto' ? BASE_GASTO : BASE_INGRESO;
    setCategoria(base[0] || 'Otros');
  };

  const handleSeleccionarCategoria = (cat) => {
    if (cat === 'Otros') {
      setCategoria('Otros');
      setMostrarCrearCategoria(true);
      return;
    }
    setCategoria(cat);
    setMostrarCrearCategoria(false);
  };

  const handleCrearCategoria = () => {
    const limpio = limpiarNombre(nuevaCategoriaNombre);
    if (!limpio) {
      Alert.alert('Nombre vacío', 'Escribí un nombre para la categoría.');
      return;
    }
    if (limpio.toLowerCase() === 'otros') {
      Alert.alert('Nombre reservado', 'Ya existe la categoría "Otros".');
      return;
    }

    if (agregarCategoriaCtx) {
      agregarCategoriaCtx(tipo, limpio);
    }

    if (tipo === 'gasto') {
      setCustomGasto((prev) =>
        prev.some((c) => c.toLowerCase() === limpio.toLowerCase()) ? prev : [...prev, limpio]
      );
    } else {
      setCustomIngreso((prev) =>
        prev.some((c) => c.toLowerCase() === limpio.toLowerCase()) ? prev : [...prev, limpio]
      );
    }

    setCategoria(limpio);
    setNuevaCategoriaNombre('');
    setMostrarCrearCategoria(false);
  };

  const ejecutarEliminarCategoria = (cat) => {
    if (eliminarCategoriaCtx) {
      eliminarCategoriaCtx(tipo, cat);
    }

    if (tipo === 'gasto') {
      setCustomGasto((prev) =>
        prev.filter((c) => c.toLowerCase() !== cat.toLowerCase())
      );
    } else {
      setCustomIngreso((prev) =>
        prev.filter((c) => c.toLowerCase() !== cat.toLowerCase())
      );
    }

    if (categoria.toLowerCase() === cat.toLowerCase()) {
      setCategoria(categorias[0] || 'Otros');
    }
  };

  const confirmarEliminarCategoria = (cat) => {
    const esEliminable =
      cat &&
      cat.toLowerCase() !== 'otros' &&
      !nombresBaseActuales.has(cat.toLowerCase());

    if (!esEliminable) return;

    Alert.alert(
      'Eliminar categoría',
      `¿Querés eliminar la categoría "${cat}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => ejecutarEliminarCategoria(cat),
        },
      ]
    );
  };

  const handleGuardar = () => {
    const montoNumerico = Number(String(monto || '').replace(/\D/g, ''));

    if (!montoNumerico || montoNumerico <= 0) {
      Alert.alert('Monto inválido', 'Ingresá un monto mayor a 0.');
      return;
    }

    if (!descripcion.trim()) {
      Alert.alert('Falta descripción', 'Escribí una breve descripción del movimiento.');
      return;
    }

    agregarMovimiento({
      tipo,
      monto: montoNumerico,
      descripcion: descripcion.trim(),
      categoria: categoria || 'Otros',
      cuentaId: cuentaId || cuentas[0]?.id || 'efectivo',
    });

    setMonto('');
    setDescripcion('');
    setMostrarCrearCategoria(false);
    setNuevaCategoriaNombre('');

    Alert.alert('¡Guardado!', 'El movimiento se registró correctamente.');
    if (navigation?.navigate) {
      navigation.navigate('Inicio');
    }
  };

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
        size={40}
      />
    );
  };

  return (
    <AppLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={styles.title}>Nuevo Movimiento</Text>

        {/* Selector de Tipo (Gasto / Ingreso) */}
        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeBtn, tipo === 'gasto' && styles.typeBtnGasto]}
            onPress={() => cambiarTipo('gasto')}
          >
            <Ionicons
              name="arrow-down-circle-outline"
              size={20}
              color={tipo === 'gasto' ? '#0F172A' : '#94A3B8'}
            />
            <Text style={[styles.typeText, tipo === 'gasto' && styles.typeTextActive]}>
              Gasto
            </Text>
          </Pressable>

          <Pressable
            style={[styles.typeBtn, tipo === 'ingreso' && styles.typeBtnIngreso]}
            onPress={() => cambiarTipo('ingreso')}
          >
            <Ionicons
              name="arrow-up-circle-outline"
              size={20}
              color={tipo === 'ingreso' ? '#0F172A' : '#94A3B8'}
            />
            <Text style={[styles.typeText, tipo === 'ingreso' && styles.typeTextActive]}>
              Ingreso
            </Text>
          </Pressable>
        </View>

        {/* Monto */}
        <Text style={styles.label}>Monto (Gs.)</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="Ej: 50000"
          placeholderTextColor="#64748B"
          keyboardType="numeric"
          value={monto}
          onChangeText={setMonto}
        />

        {/* Descripción */}
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={styles.input}
          placeholder={tipo === 'gasto' ? 'Ej: Almuerzo, combustible...' : 'Ej: Pago de sueldo...'}
          placeholderTextColor="#64748B"
          value={descripcion}
          onChangeText={setDescripcion}
        />

        {/* Categorías */}
        <View style={styles.categoryHeaderRow}>
          <Text style={styles.label}>Categoría</Text>
          <Text style={styles.categoryHint}>Tocá "Otros" para crear · × para borrar</Text>
        </View>

        <View style={styles.chipsWrap}>
          {categorias.map((cat) => {
            const activa = categoria === cat;
            const esPersonalizada =
              cat.toLowerCase() !== 'otros' &&
              !nombresBaseActuales.has(cat.toLowerCase());

            return (
              <View key={cat} style={[styles.chip, activa && styles.chipActive]}>
                <Pressable
                  style={styles.chipPressArea}
                  onPress={() => handleSeleccionarCategoria(cat)}
                  onLongPress={() => confirmarEliminarCategoria(cat)}
                >
                  <Text style={[styles.chipText, activa && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </Pressable>

                {esPersonalizada && (
                  <Pressable
                    onPress={() => confirmarEliminarCategoria(cat)}
                    hitSlop={8}
                    style={styles.chipDeleteBtn}
                  >
                    <Ionicons
                      name="close"
                      size={14}
                      color={activa ? '#0F172A' : '#F87171'}
                    />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        {/* Campo para crear categoría nueva al tocar "Otros" */}
        {mostrarCrearCategoria && (
          <View style={styles.newCategoryBox}>
            <Text style={styles.newCategoryTitle}>Nueva categoría de {tipo}</Text>
            <View style={styles.newCategoryRow}>
              <TextInput
                style={styles.newCategoryInput}
                placeholder="Ej: Gimnasio, Viáticos, Alquiler..."
                placeholderTextColor="#64748B"
                value={nuevaCategoriaNombre}
                onChangeText={setNuevaCategoriaNombre}
                onSubmitEditing={handleCrearCategoria}
              />
              <Pressable style={styles.addCatBtn} onPress={handleCrearCategoria}>
                <Ionicons name="checkmark" size={18} color="#0F172A" />
                <Text style={styles.addCatBtnText}>Crear</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Selección de Cuenta */}
        <Text style={styles.label}>Cuenta</Text>
        <View style={{ gap: 8, marginBottom: 20 }}>
          {cuentas.map((c, index) => {
            if (!c) return null;
            const keyId = String(c.id || `cuenta-${index}`);
            const activa = cuentaId === c.id;
            const esEfectivo = esCuentaEfectivo(c);
            return (
              <Pressable
                key={keyId}
                style={[styles.accountOption, activa && styles.accountOptionActive]}
                onPress={() => setCuentaId(c.id)}
              >
                {renderAvatarCuenta(c)}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.accountName}>{c.nombre || 'Cuenta'}</Text>
                  <Text style={styles.accountAlias}>
                    {c.alias || (esEfectivo ? 'Billetera' : 'Cuenta principal')}
                  </Text>
                </View>
                {activa && <Ionicons name="checkmark-circle" size={20} color="#38BDF8" />}
              </Pressable>
            );
          })}
        </View>

        {/* Botón Guardar */}
        <Pressable style={styles.saveBtn} onPress={handleGuardar}>
          <Text style={styles.saveBtnText}>
            Guardar {tipo === 'gasto' ? 'Gasto' : 'Ingreso'}
          </Text>
        </Pressable>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: '#F8FAFC', marginTop: 10, marginBottom: 16 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeBtnGasto: { backgroundColor: '#F87171', borderColor: '#F87171' },
  typeBtnIngreso: { backgroundColor: '#10B981', borderColor: '#10B981' },
  typeText: { color: '#94A3B8', fontWeight: '700', fontSize: 15 },
  typeTextActive: { color: '#0F172A' },
  label: { color: '#CBD5E1', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 6 },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  categoryHint: { color: '#64748B', fontSize: 11 },
  amountInput: {
    backgroundColor: '#1E293B',
    color: '#38BDF8',
    fontSize: 24,
    fontWeight: '700',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  input: {
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  chipActive: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  chipPressArea: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#0F172A' },
  chipDeleteBtn: {
    paddingRight: 10,
    paddingLeft: 2,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newCategoryBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#38BDF866',
    gap: 8,
  },
  newCategoryTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  newCategoryRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  newCategoryInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 13,
  },
  addCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addCatBtnText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  accountOptionActive: { borderColor: '#38BDF8' },
  efectivoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountName: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  accountAlias: { color: '#94A3B8', fontSize: 12 },
  saveBtn: {
    backgroundColor: '#38BDF8',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
});