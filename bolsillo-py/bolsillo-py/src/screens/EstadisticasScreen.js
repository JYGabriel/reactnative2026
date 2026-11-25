import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import { useFinance } from '../context/FinanceContext';
import EntidadLogo from '../components/EntidadLogo';

const COLORES_CATEGORIA = [
  '#38BDF8',
  '#10B981',
  '#F59E0B',
  '#F87171',
  '#A78BFA',
  '#FB7185',
  '#2DD4BF',
];

const formatearGs = (monto) =>
  `Gs. ${Number(monto || 0).toLocaleString('es-PY')}`;

const esCuentaEfectivo = (cuenta) => {
  if (!cuenta || typeof cuenta !== 'object') return false;
  const id = String(cuenta.id || '').trim().toLowerCase();
  const nombre = String(cuenta.nombre || '').trim().toLowerCase();
  return id === 'efectivo' || nombre === 'efectivo';
};

const extraerPuntosAsesoria = (asesoria) => {
  if (!asesoria) return [];
  if (Array.isArray(asesoria)) {
    return asesoria
      .map((item) =>
        typeof item === 'string'
          ? item
          : item?.texto || item?.mensaje || item?.recomendacion || item?.titulo || ''
      )
      .filter(Boolean);
  }
  if (typeof asesoria === 'object') {
    const candidatos =
      asesoria.recomendaciones ||
      asesoria.consejos ||
      asesoria.puntos ||
      asesoria.items ||
      [];
    if (Array.isArray(candidatos)) {
      return candidatos
        .map((item) =>
          typeof item === 'string'
            ? item
            : item?.texto || item?.mensaje || item?.recomendacion || item?.titulo || ''
        )
        .filter(Boolean);
    }
  }
  return [];
};

const extraerResumenAsesoria = (asesoria) => {
  if (!asesoria) return '';
  if (typeof asesoria === 'string') return asesoria;
  if (typeof asesoria === 'object') {
    return (
      asesoria.resumen ||
      asesoria.diagnostico ||
      asesoria.mensaje ||
      asesoria.respuesta ||
      asesoria.analisis ||
      ''
    );
  }
  return String(asesoria);
};

function GraficoCircularCategorias({ categorias, total }) {
  const size = 164;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let acumulado = 0;

  return (
    <View style={styles.chartBox}>
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#0F172A"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {categorias.map(([categoria, monto], index) => {
              const valor = Number(monto) || 0;
              const fraccion = total > 0 ? valor / total : 0;
              const dashLength = fraccion * circumference;
              const dashOffset = -(acumulado * circumference);
              const color = COLORES_CATEGORIA[index % COLORES_CATEGORIA.length];
              acumulado += fraccion;

              if (dashLength <= 0) return null;

              return (
                <Circle
                  key={categoria}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  fill="none"
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.chartCenterLabel}>
          <Text style={styles.chartCenterSub}>Total Gastos</Text>
          <Text style={styles.chartCenterTotal}>{formatearGs(total)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function EstadisticasScreen() {
  const finance = useFinance() || {};
  const cuentas = Array.isArray(finance.cuentas) ? finance.cuentas : [];
  const movimientos = Array.isArray(finance.movimientos) ? finance.movimientos : [];
  const totalIngresos = Number(finance.totalIngresos || 0);
  const totalGastos = Number(finance.totalGastos || 0);
  const balance = totalIngresos - totalGastos;

  const asesoriaCDA = finance.asesoriaCDA || null;
  const cargandoAsesoria = Boolean(finance.cargandoAsesoria);
  const errorAsesoria = finance.errorAsesoria || null;
  const solicitarAsesoriaCDA =
    typeof finance.solicitarAsesoriaCDA === 'function'
      ? finance.solicitarAsesoriaCDA
      : async () => null;

  const resumenCDA = extraerResumenAsesoria(asesoriaCDA);
  const puntosCDA = extraerPuntosAsesoria(asesoriaCDA);
  const tituloCDA =
    (typeof asesoriaCDA === 'object' && asesoriaCDA?.titulo) || 'Asesoría CDA';

  const totalPositivoCuentas = cuentas.reduce(
    (acc, c) => acc + (c && Number(c.saldo) > 0 ? Number(c.saldo) : 0),
    0
  );

  const gastosPorCategoria = movimientos
    .filter((m) => m && m.tipo === 'gasto')
    .reduce((acc, item) => {
      const cat = item.categoria || 'Otros';
      const montoItem = Number(item.monto) || 0;
      acc[cat] = (acc[cat] || 0) + montoItem;
      return acc;
    }, {});

  const categoriasOrdenadas = Object.entries(gastosPorCategoria).sort(
    (a, b) => b[1] - a[1]
  );

  const totalCategorias = categoriasOrdenadas.reduce(
    (acc, [, monto]) => acc + (Number(monto) || 0),
    0
  );

  const renderAvatarCuenta = (cuenta) => {
    if (esCuentaEfectivo(cuenta)) {
      return (
        <View style={styles.efectivoIconBox}>
          <Ionicons name="cash-outline" size={20} color="#10B981" />
        </View>
      );
    }

    return (
      <EntidadLogo
        logo={cuenta.logo}
        nombre={cuenta.nombre || ''}
        color={cuenta.color || '#334155'}
        size={36}
      />
    );
  };

  return (
    <AppLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={styles.title}>Estadísticas</Text>

        {/* Tarjeta de Asesoría CDA */}
        <View style={styles.cdaCard}>
          <View style={styles.cdaHeader}>
            <View style={styles.cdaIconBadge}>
              <Ionicons name="sparkles" size={18} color="#38BDF8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cdaTitle}>{tituloCDA}</Text>
              <Text style={styles.cdaSubtitle}>
                Análisis financiero conectado a tu backend Node.js
              </Text>
            </View>
            <Pressable
              style={[styles.cdaBtn, cargandoAsesoria && styles.cdaBtnDisabled]}
              onPress={solicitarAsesoriaCDA}
              disabled={cargandoAsesoria}
            >
              {cargandoAsesoria ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={15} color="#0F172A" />
                  <Text style={styles.cdaBtnText}>
                    {asesoriaCDA ? 'Actualizar' : 'Consultar'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {cargandoAsesoria ? (
            <View style={styles.cdaLoadingRow}>
              <ActivityIndicator size="small" color="#38BDF8" />
              <Text style={styles.cdaHelperText}>
                Consultando motor de asesoría CDA...
              </Text>
            </View>
          ) : errorAsesoria ? (
            <View style={styles.cdaErrorBox}>
              <Ionicons name="warning-outline" size={18} color="#F87171" />
              <Text style={styles.cdaErrorText}>{errorAsesoria}</Text>
            </View>
          ) : asesoriaCDA ? (
            <View style={styles.cdaBody}>
              {resumenCDA ? (
                <Text style={styles.cdaSummary}>{resumenCDA}</Text>
              ) : null}
              {puntosCDA.length > 0 ? (
                <View style={styles.cdaBullets}>
                  {puntosCDA.map((punto, idx) => (
                    <View key={`cda-punto-${idx}`} style={styles.cdaBulletItem}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={16}
                        color="#10B981"
                        style={{ marginTop: 2 }}
                      />
                      <Text style={styles.cdaBulletText}>{punto}</Text>
                    </View>
                  ))}
                </View>
              ) : !resumenCDA ? (
                <Text style={styles.cdaHelperText}>
                  Asesoría recibida correctamente.
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.cdaHelperText}>
              Tocá "Consultar" para enviar tus saldos, ingresos y gastos al motor CDA y recibir recomendaciones.
            </Text>
          )}
        </View>

        {/* Resumen Ingresos vs Gastos */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="arrow-up-circle" size={18} color="#10B981" />
              <Text style={styles.summaryLabel}>Ingresos</Text>
            </View>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              {formatearGs(totalIngresos)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="arrow-down-circle" size={18} color="#F87171" />
              <Text style={styles.summaryLabel}>Gastos</Text>
            </View>
            <Text style={[styles.summaryValue, { color: '#F87171' }]}>
              {formatearGs(totalGastos)}
            </Text>
          </View>
        </View>

        {/* Balance Neto */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance del período (Ingresos - Gastos)</Text>
          <Text
            style={[
              styles.balanceValue,
              { color: balance >= 0 ? '#38BDF8' : '#F87171' },
            ]}
          >
            {balance >= 0 ? '+' : ''} {formatearGs(balance)}
          </Text>
        </View>

        {/* Distribución por Cuenta */}
        <Text style={styles.sectionTitle}>Distribución por Cuenta</Text>
        <View style={styles.categoriesCard}>
          {cuentas.map((cuenta, index) => {
            if (!cuenta) return null;
            const saldo = Number(cuenta.saldo) || 0;
            const porcentaje =
              totalPositivoCuentas > 0 && saldo > 0
                ? Math.round((saldo / totalPositivoCuentas) * 100)
                : 0;
            const esEfectivo = esCuentaEfectivo(cuenta);
            const colorBarra = cuenta.color || (esEfectivo ? '#10B981' : '#38BDF8');

            return (
              <View key={String(cuenta.id || `cuenta-${index}`)} style={styles.accountRow}>
                <View style={styles.accountHeader}>
                  {renderAvatarCuenta(cuenta)}
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.catName}>{cuenta.nombre || 'Cuenta'}</Text>
                    <Text style={styles.accountAlias}>
                      {cuenta.alias || (esEfectivo ? 'Billetera' : 'Cuenta principal')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.accountBalance}>{formatearGs(saldo)}</Text>
                    <Text style={styles.accountPercent}>{porcentaje}%</Text>
                  </View>
                </View>

                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${porcentaje}%`,
                        backgroundColor: colorBarra,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Gastos por Categoría (Gráfico Circular + Leyenda) */}
        <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Gastos por Categoría</Text>

        {categoriasOrdenadas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="pie-chart-outline" size={42} color="#475569" />
            <Text style={styles.emptyText}>
              Registrá algunos gastos para ver tu desglose por categoría.
            </Text>
          </View>
        ) : (
          <View style={styles.categoriesCard}>
            <GraficoCircularCategorias
              categorias={categoriasOrdenadas}
              total={totalCategorias}
            />

            <View style={styles.legendList}>
              {categoriasOrdenadas.map(([categoria, monto], index) => {
                const montoNum = Number(monto) || 0;
                const porcentaje =
                  totalCategorias > 0
                    ? Math.round((montoNum / totalCategorias) * 100)
                    : 0;
                const color = COLORES_CATEGORIA[index % COLORES_CATEGORIA.length];

                return (
                  <View key={categoria} style={styles.legendItem}>
                    <View style={styles.legendLeft}>
                      <View style={[styles.legendDot, { backgroundColor: color }]} />
                      <Text style={styles.catName}>{categoria}</Text>
                    </View>
                    <Text style={styles.catAmount}>
                      {formatearGs(montoNum)} ({porcentaje}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: '#F8FAFC', marginTop: 10, marginBottom: 16 },
  cdaCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#38BDF855',
    gap: 10,
  },
  cdaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cdaIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cdaTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
  cdaSubtitle: { color: '#94A3B8', fontSize: 11, marginTop: 1 },
  cdaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
  },
  cdaBtnDisabled: { opacity: 0.65 },
  cdaBtnText: { color: '#0F172A', fontSize: 12, fontWeight: '700' },
  cdaLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  cdaHelperText: { color: '#94A3B8', fontSize: 13, lineHeight: 18 },
  cdaErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  cdaErrorText: { color: '#FCA5A5', fontSize: 12, flex: 1, lineHeight: 17 },
  cdaBody: { gap: 8 },
  cdaSummary: { color: '#E2E8F0', fontSize: 13, lineHeight: 19 },
  cdaBullets: { gap: 6 },
  cdaBulletItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  cdaBulletText: { color: '#CBD5E1', fontSize: 13, lineHeight: 18, flex: 1 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  summaryLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  balanceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#334155',
  },
  balanceLabel: { color: '#94A3B8', fontSize: 13 },
  balanceValue: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  sectionTitle: { color: '#E2E8F0', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  emptyBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: { color: '#64748B', fontSize: 14, textAlign: 'center' },
  categoriesCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  accountRow: { gap: 8 },
  accountHeader: { flexDirection: 'row', alignItems: 'center' },
  efectivoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountAlias: { color: '#94A3B8', fontSize: 12, marginTop: 1 },
  accountBalance: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  accountPercent: { color: '#94A3B8', fontSize: 11, marginTop: 1 },
  catName: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  catAmount: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },
  barBackground: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 6,
  },
  chartBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  chartCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 96,
  },
  chartCenterSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  chartCenterTotal: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },
  legendList: {
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});