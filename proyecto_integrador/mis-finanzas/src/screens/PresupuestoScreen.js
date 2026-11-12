import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFinanzas } from '../context/FinanzasContext';
import { calcularRecomendacion } from '../utils/recomendador';
import { formatGs, soloNumeros } from '../utils/formato';
import { colores, estilos } from '../theme';

export default function PresupuestoScreen() {
  const { datos, actualizar } = useFinanzas();
  const [nuevoBanco, setNuevoBanco] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState('');

  const deudaTarjetas = Object.values(datos.tarjetas).reduce((suma, t) => suma + t.deuda, 0);
  const r = calcularRecomendacion({ ...datos, deudaTarjetas });
  const otroBanco = datos.bancos.find((b) => b !== datos.bancoSueldo) || 'otra cuenta';

  const agregarBanco = () => {
    const nombre = nuevoBanco.trim();
    if (nombre && !datos.bancos.includes(nombre)) actualizar({ bancos: [...datos.bancos, nombre] });
    setNuevoBanco('');
  };
  const agregarFijo = () => {
    const monto = soloNumeros(nuevoMonto);
    if (!nuevoNombre.trim() || !monto) return;
    actualizar({ fijos: [...datos.fijos, { id: String(Date.now()), nombre: nuevoNombre.trim(), monto }] });
    setNuevoNombre('');
    setNuevoMonto('');
  };
  const cambiarFijo = (id, texto) =>
    actualizar({ fijos: datos.fijos.map((f) => (f.id === id ? { ...f, monto: soloNumeros(texto) } : f)) });
  const quitarFijo = (id) => actualizar({ fijos: datos.fijos.filter((f) => f.id !== id) });
  const cambiarPct = (clave, texto) => actualizar({ pct: { ...datos.pct, [clave]: soloNumeros(texto) } });

  const filas = [
    ['Gastos fijos', r.totalFijos, `${datos.bancoSueldo} (cuenta sueldo)`],
    [`Fondo de emergencia ${datos.pct.emergencia}%`, r.emergencia, 'Efectivo o caja de ahorro'],
    [`Ocio ${datos.pct.ocio}%`, r.ocio, `${otroBanco}, con tope`],
    [`Inversión ${datos.pct.inversion}%`, r.inversion, 'Fondo mutuo'],
  ];

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>
        <Text style={estilos.titulo}>Presupuesto</Text>

        <View style={estilos.tarjeta}>
          <Text style={estilos.subtitulo}>Tus datos</Text>
          <Text style={estilos.etiqueta}>Sueldo neto mensual (Gs.)</Text>
          <TextInput
            style={estilos.input}
            keyboardType='numeric'
            value={String(datos.sueldo)}
            onChangeText={(t) => actualizar({ sueldo: soloNumeros(t) })}
          />
          <Text style={estilos.etiqueta}>Efectivo o ahorro que ya tenés (Gs.)</Text>
          <TextInput
            style={estilos.input}
            keyboardType='numeric'
            value={String(datos.efectivo)}
            onChangeText={(t) => actualizar({ efectivo: soloNumeros(t) })}
          />
          <Text style={estilos.etiqueta}>Banco donde cobrás el sueldo (tocá para elegir)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {datos.bancos.map((b) => {
              const activo = b === datos.bancoSueldo;
              return (
                <TouchableOpacity
                  key={b}
                  onPress={() => actualizar({ bancoSueldo: b })}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 99,
                    borderWidth: 1,
                    borderColor: activo ? colores.acento : colores.borde,
                    backgroundColor: activo ? colores.acento : 'transparent',
                  }}
                >
                  <Text style={{ color: activo ? '#04302B' : colores.texto }}>{b}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[estilos.fila, { marginTop: 8 }]}>
            <TextInput
              style={[estilos.input, { flex: 1 }]}
              placeholder='Agregar banco (Itaú, Ueno...)'
              placeholderTextColor={colores.suave}
              value={nuevoBanco}
              onChangeText={setNuevoBanco}
            />
            <TouchableOpacity style={[estilos.boton, { paddingHorizontal: 16 }]} onPress={agregarBanco}>
              <Text style={estilos.botonTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={estilos.tarjeta}>
          <Text style={estilos.subtitulo}>Gastos fijos: {formatGs(r.totalFijos)}</Text>
          {datos.fijos.map((f) => (
            <View key={f.id} style={estilos.fila}>
              <Text style={[estilos.texto, { flex: 1 }]}>{f.nombre}</Text>
              <TextInput
                style={[estilos.input, { width: 130 }]}
                keyboardType='numeric'
                value={String(f.monto)}
                onChangeText={(t) => cambiarFijo(f.id, t)}
              />
              <TouchableOpacity onPress={() => quitarFijo(f.id)}>
                <Text style={{ color: colores.malo, fontSize: 20, paddingHorizontal: 6 }}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={estilos.fila}>
            <TextInput
              style={[estilos.input, { flex: 1 }]}
              placeholder='Concepto'
              placeholderTextColor={colores.suave}
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
            />
            <TextInput
              style={[estilos.input, { width: 110 }]}
              placeholder='Monto'
              placeholderTextColor={colores.suave}
              keyboardType='numeric'
              value={nuevoMonto}
              onChangeText={setNuevoMonto}
            />
            <TouchableOpacity style={[estilos.boton, { paddingHorizontal: 16 }]} onPress={agregarFijo}>
              <Text style={estilos.botonTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={estilos.tarjeta}>
          <Text style={estilos.subtitulo}>Reparto del excedente (%)</Text>
          <View style={estilos.fila}>
            {[['emergencia', 'Emergencia'], ['ocio', 'Ocio'], ['inversion', 'Inversión']].map(([clave, nombre]) => (
              <View key={clave} style={{ flex: 1 }}>
                <Text style={estilos.etiqueta}>{nombre}</Text>
                <TextInput
                  style={estilos.input}
                  keyboardType='numeric'
                  value={String(datos.pct[clave])}
                  onChangeText={(t) => cambiarPct(clave, t)}
                />
              </View>
            ))}
          </View>
        </View>

        <View style={estilos.tarjeta}>
          <Text style={estilos.subtitulo}>Recomendación</Text>
          <Text style={{ color: colores.suave, marginBottom: 6 }}>Excedente después de gastos fijos: {formatGs(r.excedente)}</Text>
          {filas.map(([destino, monto, donde]) => (
            <View key={destino} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colores.borde }}>
              <Text style={estilos.texto}>{destino}: {formatGs(monto)}</Text>
              <Text style={{ color: colores.suave, fontSize: 12 }}>{donde}</Text>
            </View>
          ))}
          {r.avisos.map((a) => (
            <View key={a} style={estilos.aviso}>
              <Text style={estilos.texto}>{a}</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}