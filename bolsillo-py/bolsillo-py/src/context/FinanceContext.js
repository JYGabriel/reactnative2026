import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENTIDADES_PY } from '../data/entidadesPY';
import { consultarAsesoriaCDA, sincronizarEstadoFinanciero } from '../services/api';

const STORAGE_KEYS = {
  CUENTAS: '@bolsillo_py:cuentas_v1',
  MOVIMIENTOS: '@bolsillo_py:movimientos_v1',
  CATEGORIAS_CUSTOM: '@bolsillo_py:categorias_personalizadas_v1',
};

export const TIPOS_PRODUCTO_CUENTA = [
  { key: 'caja_basica', label: 'Caja Básica' },
  { key: 'caja_ahorro', label: 'Caja de Ahorro' },
  { key: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
];

export const CATEGORIAS_BASE_GASTO = [
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

export const CATEGORIAS_BASE_INGRESO = [
  'Sueldo',
  'Freelance',
  'Ventas',
  'Regalo',
  'Inversiones',
  'Reembolso',
  'Aguinaldo',
  'Otros',
];

const CUENTA_EFECTIVO_INICIAL = {
  id: 'efectivo',
  entidadId: 'efectivo',
  nombre: 'Efectivo',
  tipo: 'Efectivo',
  productoTipo: 'efectivo',
  alias: 'Billetera',
  color: '#10B981',
  logo: null,
  saldo: 0,
  limiteCredito: null,
  diaCierre: null,
  diaVencimiento: null,
};

const CUENTAS_INICIALES = [CUENTA_EFECTIVO_INICIAL];

const CATEGORIAS_CUSTOM_INICIALES = {
  gasto: [],
  ingreso: [],
};

const normalizarNombreCategoria = (nombre) =>
  String(nombre || '')
    .trim()
    .replace(/\s+/g, ' ');

const normalizarLimiteCredito = (valor) => {
  if (valor === null || valor === undefined || valor === '') return null;
  const num = Number(String(valor).replace(/\D/g, ''));
  return Number.isFinite(num) && num > 0 ? num : null;
};

const normalizarDiaMes = (valor) => {
  if (valor === null || valor === undefined || valor === '') return null;
  const num = Number(String(valor).replace(/\D/g, ''));
  if (!Number.isFinite(num) || num < 1 || num > 31) return null;
  return Math.trunc(num);
};

const normalizarCategoriasCustom = (raw) => {
  if (!raw || typeof raw !== 'object') return CATEGORIAS_CUSTOM_INICIALES;

  const limpiarLista = (lista, reservadas) => {
    if (!Array.isArray(lista)) return [];
    const vistas = new Set(reservadas.map((r) => r.toLowerCase()));
    const resultado = [];
    for (const item of lista) {
      const limpio = normalizarNombreCategoria(item);
      if (!limpio) continue;
      const clave = limpio.toLowerCase();
      if (!vistas.has(clave)) {
        vistas.add(clave);
        resultado.push(limpio);
      }
    }
    return resultado;
  };

  return {
    gasto: limpiarLista(raw.gasto, [...CATEGORIAS_BASE_GASTO, 'Otros']),
    ingreso: limpiarLista(raw.ingreso, [...CATEGORIAS_BASE_INGRESO, 'Otros']),
  };
};

const unirCategoriasSinOtros = (base, custom) => {
  const sinOtrosBase = (Array.isArray(base) ? base : []).filter(
    (c) => String(c).toLowerCase() !== 'otros'
  );
  const sinOtrosCustom = (Array.isArray(custom) ? custom : []).filter(
    (c) => String(c).toLowerCase() !== 'otros'
  );

  const vistas = new Set();
  const combinadas = [];

  for (const cat of [...sinOtrosBase, ...sinOtrosCustom]) {
    const limpio = normalizarNombreCategoria(cat);
    if (!limpio) continue;
    const clave = limpio.toLowerCase();
    if (!vistas.has(clave)) {
      vistas.add(clave);
      combinadas.push(limpio);
    }
  }

  return [...combinadas, 'Otros'];
};

const resolverLogoEntidad = (cuenta) => {
  if (!cuenta || typeof cuenta !== 'object') return null;

  const idLimpio = String(cuenta.id || '').trim().toLowerCase();
  const nombreLimpio = String(cuenta.nombre || '').trim().toLowerCase();
  if (idLimpio === 'efectivo' || nombreLimpio === 'efectivo') {
    return null;
  }

  const listaEntidades = Array.isArray(ENTIDADES_PY) ? ENTIDADES_PY : [];
  const entidadIdBuscado = String(cuenta.entidadId || '').trim().toLowerCase();

  const encontrada = listaEntidades.find((e) => {
    if (!e) return false;
    const eId = String(e.id || '').trim().toLowerCase();
    const eNombre = String(e.nombre || '').trim().toLowerCase();
    return (
      (entidadIdBuscado && eId === entidadIdBuscado) ||
      (idLimpio && (eId === idLimpio || idLimpio.startsWith(`${eId}-`))) ||
      (nombreLimpio && eNombre === nombreLimpio)
    );
  });

  if (encontrada?.logo) {
    return encontrada.logo;
  }

  if (typeof cuenta.logo === 'number' || typeof cuenta.logo === 'string') {
    return cuenta.logo;
  }

  return null;
};

const inferirEntidadId = (cuenta) => {
  if (cuenta?.entidadId) return cuenta.entidadId;
  const idStr = String(cuenta?.id || '');
  const listaEntidades = Array.isArray(ENTIDADES_PY) ? ENTIDADES_PY : [];
  const porPrefijo = listaEntidades.find(
    (e) => e?.id && idStr.toLowerCase().startsWith(`${String(e.id).toLowerCase()}-`)
  );
  if (porPrefijo) return porPrefijo.id;
  const porNombre = listaEntidades.find(
    (e) =>
      e?.nombre &&
      String(e.nombre).trim().toLowerCase() ===
        String(cuenta?.nombre || '').trim().toLowerCase()
  );
  return porNombre?.id || null;
};

const inferirProductoTipo = (cuenta) => {
  if (cuenta?.productoTipo) return cuenta.productoTipo;
  const raw = String(cuenta?.tipo || cuenta?.alias || '').toLowerCase();
  if (raw.includes('crédito') || raw.includes('credito')) return 'tarjeta_credito';
  if (raw.includes('básica') || raw.includes('basica')) return 'caja_basica';
  if (raw.includes('ahorro')) return 'caja_ahorro';
  return 'caja_ahorro';
};

const normalizarCuentas = (rawCuentas) => {
  const base =
    Array.isArray(rawCuentas) && rawCuentas.length > 0
      ? rawCuentas
      : CUENTAS_INICIALES;

  const limpias = base
    .filter((c) => c && typeof c === 'object')
    .map((c, index) => {
      const id = String(c.id || `cuenta-${index}`);
      const esEfectivo =
        id.toLowerCase() === 'efectivo' ||
        String(c.nombre || '').trim().toLowerCase() === 'efectivo';

      const productoTipo = esEfectivo ? 'efectivo' : inferirProductoTipo(c);
      const tipoDisplay = esEfectivo
        ? 'Efectivo'
        : String(c.tipo || '').trim() ||
          (productoTipo === 'tarjeta_credito'
            ? 'Tarjeta de Crédito'
            : productoTipo === 'caja_basica'
              ? 'Caja Básica'
              : 'Caja de Ahorro');

      const aliasDefault = esEfectivo
        ? 'Billetera'
        : productoTipo === 'tarjeta_credito'
          ? 'Tarjeta'
          : productoTipo === 'caja_basica'
            ? 'Caja Básica'
            : 'Caja de Ahorro';

      const esTarjeta = productoTipo === 'tarjeta_credito';

      return {
        ...c,
        id: esEfectivo ? 'efectivo' : id,
        entidadId: esEfectivo ? 'efectivo' : inferirEntidadId(c),
        nombre: c.nombre || (esEfectivo ? 'Efectivo' : 'Cuenta'),
        tipo: tipoDisplay,
        productoTipo,
        alias: String(c.alias || '').trim() || aliasDefault,
        color: c.color || (esEfectivo ? '#10B981' : '#38BDF8'),
        logo: esEfectivo ? null : resolverLogoEntidad(c),
        saldo: Number(c.saldo) || 0,
        limiteCredito: esTarjeta ? normalizarLimiteCredito(c.limiteCredito) : null,
        diaCierre: esTarjeta ? normalizarDiaMes(c.diaCierre) : null,
        diaVencimiento: esTarjeta ? normalizarDiaMes(c.diaVencimiento) : null,
      };
    });

  const tieneEfectivo = limpias.some((c) => c.id === 'efectivo');
  return tieneEfectivo ? limpias : [CUENTA_EFECTIVO_INICIAL, ...limpias];
};

const normalizarMovimientos = (rawMovimientos) => {
  if (!Array.isArray(rawMovimientos)) return [];
  return rawMovimientos
    .filter((m) => m && typeof m === 'object')
    .map((m, index) => ({
      id: String(m.id || `mov-${Date.now()}-${index}`),
      tipo: m.tipo === 'ingreso' ? 'ingreso' : 'gasto',
      monto: Number(m.monto) || 0,
      categoria: m.categoria || 'Otros',
      descripcion: m.descripcion || m.categoria || 'Movimiento',
      cuentaId: m.cuentaId || 'efectivo',
      cuentaNombre: m.cuentaNombre || 'Efectivo',
      fecha: m.fecha || new Date().toISOString(),
    }));
};

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const [cuentas, setCuentas] = useState(CUENTAS_INICIALES);
  const [movimientos, setMovimientos] = useState([]);
  const [categoriasCustom, setCategoriasCustom] = useState(
    CATEGORIAS_CUSTOM_INICIALES
  );
  const [cargandoStorage, setCargandoStorage] = useState(true);

  const [asesoriaCDA, setAsesoriaCDA] = useState(null);
  const [cargandoAsesoria, setCargandoAsesoria] = useState(false);
  const [errorAsesoria, setErrorAsesoria] = useState(null);

  useEffect(() => {
    let activo = true;

    const cargarDatos = async () => {
      try {
        const [cuentasGuardadas, movimientosGuardados, categoriasGuardadas] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.CUENTAS),
            AsyncStorage.getItem(STORAGE_KEYS.MOVIMIENTOS),
            AsyncStorage.getItem(STORAGE_KEYS.CATEGORIAS_CUSTOM),
          ]);

        if (!activo) return;

        if (cuentasGuardadas !== null) {
          const parsedCuentas = JSON.parse(cuentasGuardadas);
          setCuentas(normalizarCuentas(parsedCuentas));
        }

        if (movimientosGuardados !== null) {
          const parsedMovimientos = JSON.parse(movimientosGuardados);
          setMovimientos(normalizarMovimientos(parsedMovimientos));
        }

        if (categoriasGuardadas !== null) {
          const parsedCategorias = JSON.parse(categoriasGuardadas);
          setCategoriasCustom(normalizarCategoriasCustom(parsedCategorias));
        }
      } catch (error) {
        console.warn('Error cargando datos de AsyncStorage:', error);
      } finally {
        if (activo) {
          setCargandoStorage(false);
        }
      }
    };

    cargarDatos();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (cargandoStorage) return;

    const guardarCuentas = async () => {
      try {
        const cuentasParaGuardar = cuentas.map(({ logo, ...resto }) => resto);
        await AsyncStorage.setItem(
          STORAGE_KEYS.CUENTAS,
          JSON.stringify(cuentasParaGuardar)
        );
      } catch (error) {
        console.warn('Error guardando cuentas en AsyncStorage:', error);
      }
    };

    guardarCuentas();
  }, [cuentas, cargandoStorage]);

  useEffect(() => {
    if (cargandoStorage) return;

    const guardarMovimientos = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.MOVIMIENTOS,
          JSON.stringify(movimientos)
        );
      } catch (error) {
        console.warn('Error guardando movimientos en AsyncStorage:', error);
      }
    };

    guardarMovimientos();
  }, [movimientos, cargandoStorage]);

  useEffect(() => {
    if (cargandoStorage) return;

    const guardarCategorias = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CATEGORIAS_CUSTOM,
          JSON.stringify(categoriasCustom)
        );
      } catch (error) {
        console.warn('Error guardando categorías en AsyncStorage:', error);
      }
    };

    guardarCategorias();
  }, [categoriasCustom, cargandoStorage]);

  const agregarCategoria = useCallback((tipo, nombreCategoria) => {
    const tipoNorm = tipo === 'ingreso' ? 'ingreso' : 'gasto';
    const limpio = normalizarNombreCategoria(nombreCategoria);
    if (!limpio) return { ok: false, motivo: 'vacio' };
    if (limpio.toLowerCase() === 'otros') {
      return { ok: false, motivo: 'reservado' };
    }

    const baseList =
      tipoNorm === 'ingreso' ? CATEGORIAS_BASE_INGRESO : CATEGORIAS_BASE_GASTO;
    const existeEnBase = baseList.some(
      (c) => String(c).toLowerCase() === limpio.toLowerCase()
    );
    if (existeEnBase) {
      return { ok: true, categoria: limpio, yaExistia: true };
    }

    setCategoriasCustom((prev) => {
      const actual = normalizarCategoriasCustom(prev);
      const listaTipo = actual[tipoNorm] || [];
      const yaExiste = listaTipo.some(
        (c) => c.toLowerCase() === limpio.toLowerCase()
      );
      if (yaExiste) return actual;
      return {
        ...actual,
        [tipoNorm]: [...listaTipo, limpio],
      };
    });

    return { ok: true, categoria: limpio };
  }, []);

  const eliminarCategoria = useCallback((tipo, nombreCategoria) => {
    const tipoNorm = tipo === 'ingreso' ? 'ingreso' : 'gasto';
    const objetivo = normalizarNombreCategoria(nombreCategoria).toLowerCase();
    if (!objetivo || objetivo === 'otros') return false;

    const baseList =
      tipoNorm === 'ingreso' ? CATEGORIAS_BASE_INGRESO : CATEGORIAS_BASE_GASTO;
    const esBase = baseList.some((c) => String(c).toLowerCase() === objetivo);
    if (esBase) return false;

    setCategoriasCustom((prev) => {
      const actual = normalizarCategoriasCustom(prev);
      const listaTipo = actual[tipoNorm] || [];
      return {
        ...actual,
        [tipoNorm]: listaTipo.filter((c) => c.toLowerCase() !== objetivo),
      };
    });

    return true;
  }, []);

  const categoriasGasto = useMemo(
    () => unirCategoriasSinOtros(CATEGORIAS_BASE_GASTO, categoriasCustom.gasto),
    [categoriasCustom.gasto]
  );

  const categoriasIngreso = useMemo(
    () =>
      unirCategoriasSinOtros(CATEGORIAS_BASE_INGRESO, categoriasCustom.ingreso),
    [categoriasCustom.ingreso]
  );

  const agregarCuenta = ({
    entidad,
    productoTipo = 'caja_ahorro',
    tipoProducto,
    alias = '',
    saldoInicial = 0,
    limiteCredito = null,
    diaCierre = null,
    diaVencimiento = null,
  }) => {
    if (!entidad || typeof entidad !== 'object') return;

    const saldoNumerico =
      Number(String(saldoInicial ?? '0').replace(/\D/g, '')) || 0;

    const prodElegido =
      productoTipo || inferirProductoTipo({ tipo: tipoProducto, alias });

    const opcionProd =
      TIPOS_PRODUCTO_CUENTA.find((t) => t.key === prodElegido) ||
      TIPOS_PRODUCTO_CUENTA[1];

    const aliasLimpio = String(alias || '').trim() || opcionProd.label;
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const esTarjeta = opcionProd.key === 'tarjeta_credito';

    const nuevaCuenta = {
      id: `${entidad.id || 'cuenta'}-${prodElegido}-${uniqueSuffix}`,
      entidadId: entidad.id || null,
      nombre: entidad.nombre || 'Cuenta',
      tipo: opcionProd.label,
      productoTipo: opcionProd.key,
      alias: aliasLimpio,
      color: entidad.color || '#38BDF8',
      logo: entidad.logo || null,
      saldo: saldoNumerico,
      limiteCredito: esTarjeta ? normalizarLimiteCredito(limiteCredito) : null,
      diaCierre: esTarjeta ? normalizarDiaMes(diaCierre) : null,
      diaVencimiento: esTarjeta ? normalizarDiaMes(diaVencimiento) : null,
    };

    setCuentas((prev) => [...normalizarCuentas(prev), nuevaCuenta]);
  };

  const eliminarCuenta = (cuentaId) => {
    if (!cuentaId || cuentaId === 'efectivo') return;
    setCuentas((prev) =>
      normalizarCuentas(prev).filter((c) => c.id !== cuentaId)
    );
  };

  const agregarMovimiento = ({
    tipo = 'gasto',
    monto = 0,
    categoria = 'Otros',
    descripcion = '',
    cuentaId = 'efectivo',
  }) => {
    const montoNumerico = Number(String(monto ?? '0').replace(/\D/g, '')) || 0;
    if (montoNumerico <= 0) return;

    const tipoNormalizado = tipo === 'ingreso' ? 'ingreso' : 'gasto';
    const cuentaDestino =
      cuentas.find((c) => c.id === cuentaId) ||
      cuentas[0] ||
      CUENTA_EFECTIVO_INICIAL;

    const nuevoMovimiento = {
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tipo: tipoNormalizado,
      monto: montoNumerico,
      categoria: normalizarNombreCategoria(categoria) || 'Otros',
      descripcion: String(descripcion || '').trim() || categoria || 'Movimiento',
      cuentaId: cuentaDestino.id,
      cuentaNombre: cuentaDestino.nombre,
      fecha: new Date().toISOString(),
    };

    setMovimientos((prev) => [nuevoMovimiento, ...normalizarMovimientos(prev)]);

    setCuentas((prev) =>
      normalizarCuentas(prev).map((c) => {
        if (c.id !== cuentaDestino.id) return c;
        const delta =
          tipoNormalizado === 'ingreso' ? montoNumerico : -montoNumerico;
        return {
          ...c,
          saldo: (Number(c.saldo) || 0) + delta,
        };
      })
    );
  };

  const eliminarMovimiento = (movimientoId) => {
    if (!movimientoId) return;

    const objetivo = movimientos.find((m) => m.id === movimientoId);
    if (!objetivo) return;

    setMovimientos((prev) =>
      normalizarMovimientos(prev).filter((m) => m.id !== movimientoId)
    );

    const montoRevertir = Number(objetivo.monto) || 0;
    const deltaReversa =
      objetivo.tipo === 'ingreso' ? -montoRevertir : montoRevertir;

    setCuentas((prev) =>
      normalizarCuentas(prev).map((c) => {
        if (c.id !== objetivo.cuentaId) return c;
        return {
          ...c,
          saldo: (Number(c.saldo) || 0) + deltaReversa,
        };
      })
    );
  };

  const limpiarTodo = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.CUENTAS),
        AsyncStorage.removeItem(STORAGE_KEYS.MOVIMIENTOS),
        AsyncStorage.removeItem(STORAGE_KEYS.CATEGORIAS_CUSTOM),
      ]);
    } catch (error) {
      console.warn('Error limpiando AsyncStorage:', error);
    }
    setCuentas(CUENTAS_INICIALES);
    setMovimientos([]);
    setCategoriasCustom(CATEGORIAS_CUSTOM_INICIALES);
    setAsesoriaCDA(null);
    setErrorAsesoria(null);
  };

  const { saldoTotal, totalIngresos, totalGastos } = useMemo(() => {
    const totalSaldo = cuentas.reduce(
      (acc, c) => acc + (Number(c?.saldo) || 0),
      0
    );

    let ingresos = 0;
    let gastos = 0;

    for (const m of movimientos) {
      if (!m) continue;
      const valor = Number(m.monto) || 0;
      if (m.tipo === 'ingreso') {
        ingresos += valor;
      } else if (m.tipo === 'gasto') {
        gastos += valor;
      }
    }

    return {
      saldoTotal: totalSaldo,
      totalIngresos: ingresos,
      totalGastos: gastos,
    };
  }, [cuentas, movimientos]);

  const solicitarAsesoriaCDA = useCallback(async () => {
    setCargandoAsesoria(true);
    setErrorAsesoria(null);

    try {
      const cuentasSinLogo = cuentas.map(({ logo, ...resto }) => resto);
      const respuesta = await consultarAsesoriaCDA({
        saldoTotal,
        totalIngresos,
        totalGastos,
        cuentas: cuentasSinLogo,
        movimientos,
      });

      setAsesoriaCDA(respuesta);
      return respuesta;
    } catch (error) {
      const msg = error?.message || 'No se pudo obtener la asesoría de CDA.';
      setErrorAsesoria(msg);
      return null;
    } finally {
      setCargandoAsesoria(false);
    }
  }, [cuentas, movimientos, saldoTotal, totalIngresos, totalGastos]);

  const sincronizarConBackend = useCallback(async () => {
    const cuentasSinLogo = cuentas.map(({ logo, ...resto }) => resto);
    return sincronizarEstadoFinanciero({
      saldoTotal,
      totalIngresos,
      totalGastos,
      cuentas: cuentasSinLogo,
      movimientos,
    });
  }, [cuentas, movimientos, saldoTotal, totalIngresos, totalGastos]);

  const value = useMemo(
    () => ({
      cuentas,
      movimientos,
      categoriasGasto,
      categoriasIngreso,
      saldoTotal,
      totalIngresos,
      totalGastos,
      cargandoStorage,
      asesoriaCDA,
      cargandoAsesoria,
      errorAsesoria,
      agregarCuenta,
      eliminarCuenta,
      agregarMovimiento,
      eliminarMovimiento,
      agregarCategoria,
      eliminarCategoria,
      solicitarAsesoriaCDA,
      sincronizarConBackend,
      limpiarTodo,
    }),
    [
      cuentas,
      movimientos,
      categoriasGasto,
      categoriasIngreso,
      saldoTotal,
      totalIngresos,
      totalGastos,
      cargandoStorage,
      asesoriaCDA,
      cargandoAsesoria,
      errorAsesoria,
      agregarCategoria,
      eliminarCategoria,
      solicitarAsesoriaCDA,
      sincronizarConBackend,
    ]
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    return {
      cuentas: CUENTAS_INICIALES,
      movimientos: [],
      categoriasGasto: CATEGORIAS_BASE_GASTO,
      categoriasIngreso: CATEGORIAS_BASE_INGRESO,
      saldoTotal: 0,
      totalIngresos: 0,
      totalGastos: 0,
      cargandoStorage: false,
      asesoriaCDA: null,
      cargandoAsesoria: false,
      errorAsesoria: null,
      agregarCuenta: () => {},
      eliminarCuenta: () => {},
      agregarMovimiento: () => {},
      eliminarMovimiento: () => {},
      agregarCategoria: () => ({ ok: false }),
      eliminarCategoria: () => false,
      solicitarAsesoriaCDA: async () => null,
      sincronizarConBackend: async () => null,
      limpiarTodo: () => {},
    };
  }
  return ctx;
}