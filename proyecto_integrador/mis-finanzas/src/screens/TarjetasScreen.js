import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFinanzas } from '../context/FinanzasContext';
import { formatGs, soloNumeros } from '../utils/formato';
import { colores, estilos } from '../theme';

const EJEMPLO_1 = 'Compra aprobada TC ****1234 en SUPERMERCADO Gs. 150.000 12/11/2026. Deuda acumulada: Gs. 1.250.000';
const EJEMPLO_2 = 'Itau: Compra con TC final 5678 por Gs. 85.000 en FARMACIA. Deuda TC: Gs. 450.000';

export default function TarjetasScreen() {
  const { datos, registrarSms, registrarPago } = useFinanzas();
  const [sms, setSms] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [pagos, setPagos] = useState({});

  const procesar = () => {
    const r = registrarSms(sms);
    if (r) {
      setMensaje(`Registrado: ${r.comercio}, ${formatGs(r.monto)} en ${r.clave}.`);
      setSms('');
    } else {
      setMensaje('No encontré una compra con monto en Gs. en ese texto.');
    }
  };
  const pagar = (clave) => {
    const monto = soloNumeros(pagos[clave]);
    if (monto) registrarPago(clave, monto);
    setPagos({ ...pagos, [clave]: '' });
  };

  const claves = Object.keys(datos.tarjetas);
  const total = claves.reduce((suma, k) => suma + datos.tarjetas[k].deuda, 0);

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>
        <Text style={estilos.titulo}>Deuda Cero</Text>

        <View style={estilos.tarjeta}>
          <Text style={estilos.subtitulo}>Pegá un SMS del banco</Text>
          <TextInput
            style={[estilos.input, { minHeight: 70, textAlignVertical: 'top' }]}
            multiline
            placeholder='Texto del SMS de una compra con tarjeta'
            placeholderTextColor={colores.suave}
            value={sms}
            onChangeText={setSms}
          />
          <View style={[estilos.fila, { marginTop: 8 }]}>
            <TouchableOpacity onPress={() => setSms(EJEMPLO_1)}><Text style={{ color: colores.acento }}>Ejemplo 1</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setSms(EJEMPLO_2)}><Text style={{ color: colores.acento }}>Ejemplo 2</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={estilos.boton} onPress={procesar}>
            <Text style={estilos.botonTxt}>Procesar</Text>
          </TouchableOpacity>
          {mensaje ? <Text style={{ color: colores.suave, marginTop: 8 }}>{mensaje}</Text> : null}
        </View>

        <View style={estilos.tarjeta}>
          <Text style={estilos.subtitulo}>Tus tarjetas</Text>
          {claves.length === 0 ? (
            <Text style={{ color: colores.suave }}>Todavía no hay tarjetas. Procesá un SMS para crear la primera.</Text>
          ) : (
            claves.map((k) => {
              const t = datos.tarjetas[k];
              return (
                <View key={k} style={{ marginBottom: 14 }}>
                  <Text style={estilos.texto}>{k}</Text>
                  <Text style={{ color: t.deuda ? colores.malo : colores.ok, fontWeight: 'bold' }}>
                    {t.deuda ? formatGs(t.deuda) : 'Deuda cero'}
                  </Text>
                  <Text style={{ color: colores.suave, fontSize: 12 }}>
                    {t.compras.slice(-3).reverse().map((c) => `${c.comercio} ${formatGs(c.monto)}`).join('  |  ')}
                  </Text>
                  <View style={[estilos.fila, { marginTop: 6 }]}>
                    <TextInput
                      style={[estilos.input, { flex: 1 }]}
                      keyboardType='numeric'
                      placeholder='Pago realizado'
                      placeholderTextColor={colores.suave}
                      value={pagos[k] || ''}
                      onChangeText={(texto) => setPagos({ ...pagos, [k]: texto })}
                    />
                    <TouchableOpacity style={[estilos.boton, { paddingHorizontal: 14 }]} onPress={() => pagar(k)}>
                      <Text style={estilos.botonTxt}>Pagar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
          {claves.length > 0 ? (
            <Text style={{ color: total ? colores.malo : colores.ok, fontWeight: 'bold' }}>
              Deuda total: {total ? formatGs(total) : 'cero'}
              {total && datos.sueldo ? `  (${Math.round((total * 100) / datos.sueldo)}% de tu sueldo)` : ''}
            </Text>
          ) : null}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}