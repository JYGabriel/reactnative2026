import { formatGs } from './formato';

export function calcularRecomendacion({ sueldo, fijos, pct, efectivo, deudaTarjetas, fondoRend, inflacion }) {
  const totalFijos = fijos.reduce((suma, f) => suma + f.monto, 0);
  const excedente = Math.max(0, sueldo - totalFijos);
  const parte = (p) => Math.round((excedente * p) / 100);
  const emergencia = parte(pct.emergencia);
  const ocio = parte(pct.ocio);
  const inversion = parte(pct.inversion);
  const avisos = [];

  const suma = pct.emergencia + pct.ocio + pct.inversion;
  if (suma !== 100) avisos.push(`Los porcentajes suman ${suma}%, deberían sumar 100%.`);
  if (sueldo < totalFijos) {
    avisos.push('Tus gastos fijos superan tu sueldo. Primero hay que recortar gastos o sumar ingresos.');
  }
  if (deudaTarjetas > 0) {
    avisos.push(
      `Tenés ${formatGs(deudaTarjetas)} de deuda en tarjetas. Como el interés de la tarjeta suele superar lo que rinde un fondo mutuo, conviene usar la parte de inversión (${formatGs(inversion)}) para bajarla primero.`
    );
  }
  if (totalFijos > 0) {
    const meses = efectivo / totalFijos;
    avisos.push(
      meses >= 3
        ? `Tu efectivo cubre ${meses.toFixed(1)} meses de gastos fijos. Ya superás los 3 meses de la regla general: podrías mover parte del fondo de emergencia a inversión.`
        : `Tu efectivo cubre ${meses.toFixed(1)} meses de gastos fijos. Regla general: entre 3 y 6 meses (${formatGs(totalFijos * 3)} a ${formatGs(totalFijos * 6)}).`
    );
  }
  if (typeof fondoRend === 'number' && typeof inflacion === 'number') {
    const real = fondoRend - inflacion;
    avisos.push(
      real > 0
        ? `El fondo mutuo rinde ${real.toFixed(1)} puntos por encima de la inflación: invertir tiene sentido.`
        : 'El fondo mutuo no supera la inflación con estos datos: revisá si conviene otro instrumento.'
    );
  }

  return { totalFijos, excedente, emergencia, ocio, inversion, avisos };
}