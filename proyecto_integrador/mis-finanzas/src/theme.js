import { StyleSheet } from 'react-native';

export const colores = {
    fondo: '#0F172A',
    tarjeta: '#1E293B',
    borde: '#334155',
    texto: '#F1F5F9',
    suave: '#94A3B8',
    acento: '#2DD4BF',
    malo: '#F87171',
    ok: '#4ADE80',
    aviso: '#3A2F12',
};

export const estilos = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo, paddingHorizontal: 16 },
    titulo: { fontSize: 22, fontWeight: 'bold', color: colores.texto, marginVertical: 12 },
    tarjeta: { backgroundColor: colores.tarjeta, borderRadius: 12, padding: 14, marginBottom: 12 },
    subtitulo: { fontSize: 16, fontWeight: '600', color: colores.acento, marginBottom: 8 },
    etiqueta: { color: colores.suave, fontSize: 13, marginTop: 8, marginBottom: 3 },
    texto: { color: colores.texto },
    input: { backgroundColor: colores.borde, color: colores.texto, borderRadius: 8, padding: 10 },
    boton: { backgroundColor: colores.acento, borderRadius: 8, padding: 12, alignItems: 'center' },
    botonTxt: { color: '#04302B', fontWeight: 'bold' },
    fila: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    aviso: { backgroundColor: colores.aviso, borderRadius: 8, padding: 10, marginTop: 8 },
});