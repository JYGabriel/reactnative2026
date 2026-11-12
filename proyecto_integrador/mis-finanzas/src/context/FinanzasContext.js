import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parsearSms } from '../utils/smsParser';

const CLAVE = 'mis-finanzas:v1';

const INICIAL = {
  sueldo: 3000000,
  efectivo: 0,
  bancoSueldo: 'Sudameris',
  bancos: ['Sudameris', 'Continental'],
  fijos: [
    { id: '1', nombre: 'ANDE', monto: 150000 },
    { id: '2', nombre: 'ESSAP', monto: 50000 },
    { id: '3', nombre: 'Alimentación', monto: 500000 },
    { id: '4', nombre: 'Seguro', monto: 200000 },
    { id: '5', nombre: 'Telefonía', monto: 100000 },
  ],
  pct: { emergencia: 60, ocio: 20, inversion: 20 },
  tarjetas: {},
};

const Ctx = createContext(null);

export function FinanzasProvider({ children }) {
  const [datos, setDatos] = useState(INICIAL);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const crudo = await AsyncStorage.getItem(CLAVE);
        if (crudo) setDatos({ ...INICIAL, ...JSON.parse(crudo) });
      } catch (e) {
        console.warn('No se pudieron leer los datos', e);
      }
      setListo(true);
    })();
  }, []);

  useEffect(() => {
    if (listo) AsyncStorage.setItem(CLAVE, JSON.stringify(datos)).catch(console.warn);
  }, [datos, listo]);

  const actualizar = (parcial) => setDatos((d) => ({ ...d, ...parcial }));

  const registrarSms = (texto) => {
    const r = parsearSms(texto);
    if (!r) return null;
    const clave = `${r.banco} *${r.ultimos4}`;
    setDatos((d) => {
      const t = d.tarjetas[clave] || { deuda: 0, compras: [] };
      const deuda = r.deudaReportada !== null ? r.deudaReportada : t.deuda + r.monto;
      const compras = [...t.compras, { comercio: r.comercio, monto: r.monto, fecha: new Date().toISOString() }].slice(-50);
      return { ...d, tarjetas: { ...d.tarjetas, [clave]: { deuda, compras } } };
    });
    return { ...r, clave };
  };

  const registrarPago = (clave, monto) =>
    setDatos((d) => {
      const t = d.tarjetas[clave];
      if (!t) return d;
      return { ...d, tarjetas: { ...d.tarjetas, [clave]: { ...t, deuda: Math.max(0, t.deuda - monto) } } };
    });

  return (
    <Ctx.Provider value={{ datos, actualizar, registrarSms, registrarPago }}>
      {listo ? children : null}
    </Ctx.Provider>
  );
}

export const useFinanzas = () => useContext(Ctx);