import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PieChart, BarChart, LineChart } from 'react-native-gifted-charts';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing, Radius, Shadows } from '../theme/tokens';
import { JGCard, JGBadge } from '../components/UI';
import { useStatisticsViewModel, TimeFilter, formatCurrencyShort } from '../features/dashboard/presentation/useStatisticsViewModel';

const { width } = Dimensions.get('window');

export default function StatisticsScreen({ navigation }: any) {
  const { 
    isLoading, filter, setFilter, periodLabel, navigatePrevious, navigateNext, 
    categoryData, totalSpent, barData, lineData 
  } = useStatisticsViewModel();

  const handleFilterChange = (newFilter: TimeFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(newFilter);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.mediumBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Premium */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.darkBlue} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Estadísticas</Text>
          <Text style={styles.headerSub}>Tu salud financiera en detalle</Text>
        </View>
        <TouchableOpacity style={styles.backBtn}>
           <MaterialCommunityIcons name="share-variant" size={20} color={Colors.darkBlue} />
        </TouchableOpacity>
      </View>

      {/* Selector de Filtros Moderno */}
      <View style={styles.filterWrapper}>
        <View style={styles.filterContainer}>
          {['Día', 'Semana', 'Mes', 'Año'].map((label, idx) => {
            const values: TimeFilter[] = ['dia', 'semana', 'mes', 'año'];
            const val = values[idx];
            const isActive = filter === val;
            return (
              <TouchableOpacity 
                key={val}
                style={[styles.filterBtn, isActive && styles.filterBtnActive]}
                onPress={() => handleFilterChange(val)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navegador de Periodo */}
        <View style={styles.periodNavigator}>
          <TouchableOpacity onPress={navigatePrevious} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.mediumBlue} />
          </TouchableOpacity>
          <Text style={styles.periodText}>{periodLabel}</Text>
          <TouchableOpacity onPress={navigateNext} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.mediumBlue} />
          </TouchableOpacity>
        </View>

        {/* Resumen de Gasto */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <JGCard style={styles.chartCard}>
            <Text style={styles.cardTitle}>Gastos por Categoría</Text>
            {categoryData.length > 0 ? (
              <View style={styles.chartWrapper}>
                <PieChart
                  donut
                  radius={width * 0.25}
                  innerRadius={width * 0.16}
                  data={categoryData.map(d => ({ ...d, strokeWidth: 4, strokeColor: '#FFF' }))}
                  focusOnPress
                  centerLabelComponent={() => (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, color: Colors.light.textSecondary, fontWeight: '600' }}>TOTAL</Text>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.darkBlue }}>
                        {formatCurrencyShort(totalSpent)}
                      </Text>
                    </View>
                  )}
                />
                <View style={styles.legendGrid}>
                  {categoryData.map((item, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.legendLabel}>{item.label}</Text>
                        <Text style={styles.legendValue}>${item.value.toLocaleString('es-CO')}</Text>
                      </View>
                      <Text style={styles.legendPerc}>{((item.value / totalSpent) * 100).toFixed(0)}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="chart-donut" size={60} color={Colors.light.border} />
                <Text style={styles.emptyText}>No hay datos en este periodo</Text>
              </View>
            )}
          </JGCard>
        </Animated.View>

        {/* Evolución Balance */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <JGCard style={styles.chartCard}>
            <Text style={styles.cardTitle}>Evolución del Balance</Text>
            <View style={{ marginTop: 20, marginLeft: -20 }}>
              <LineChart
                data={lineData}
                color={Colors.mediumBlue}
                thickness={4}
                dataPointsColor={Colors.mediumBlue}
                dataPointsRadius={5}
                yAxisThickness={0}
                xAxisThickness={0}
                hideRules
                isAnimated
                curved
                initialSpacing={30}
                areaChart
                startFillColor={Colors.mediumBlue}
                endFillColor="transparent"
                startOpacity={0.2}
                endOpacity={0}
                xAxisLabelTextStyle={styles.axisLabel}
                yAxisTextStyle={styles.axisLabel}
                pointerConfig={{
                   pointerStripColor: Colors.mediumBlue,
                   pointerLabelComponent: (items: any) => (
                     <View style={styles.tooltip}>
                        <Text style={styles.tooltipText}>${items[0].value.toLocaleString('es-CO')}</Text>
                     </View>
                   )
                }}
              />
            </View>
          </JGCard>
        </Animated.View>

        {/* Ingresos vs Gastos */}
        <Animated.View entering={FadeInUp.delay(600)}>
          <JGCard style={styles.chartCard}>
             <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Flujo de Caja</Text>
                <View style={styles.legendSimple}>
                   <View style={styles.legendRow}><View style={[styles.dot, {backgroundColor: '#51CF66'}]}/><Text style={styles.dotText}>In</Text></View>
                   <View style={styles.legendRow}><View style={[styles.dot, {backgroundColor: '#4C6EF5'}]}/><Text style={styles.dotText}>Out</Text></View>
                </View>
             </View>
             <View style={{ marginTop: 20, marginLeft: -20 }}>
                <BarChart
                  data={barData}
                  barWidth={filter === 'mes' ? 10 : 20}
                  spacing={filter === 'mes' ? 15 : 25}
                  roundedTop
                  noOfSections={4}
                  yAxisThickness={0}
                  xAxisThickness={0}
                  hideRules
                  isAnimated
                  xAxisLabelTextStyle={styles.axisLabel}
                  yAxisTextStyle={styles.axisLabel}
                  formatYLabel={(label) => {
                    const val = Number(label);
                    if (val >= 1000000) return `${(val/1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${(val/1000).toFixed(0)}k`;
                    return label;
                  }}
                />
             </View>
          </JGCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: Spacing.xl, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...Shadows.subtle as any },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.darkBlue, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: Colors.light.textSecondary, fontWeight: '500' },
  filterWrapper: { paddingHorizontal: Spacing.xl, marginBottom: 10 },
  filterContainer: { flexDirection: 'row', backgroundColor: Colors.light.input, borderRadius: 14, padding: 4 },
  filterBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  filterBtnActive: { backgroundColor: '#FFF', ...Shadows.subtle as any },
  filterText: { fontSize: 13, fontWeight: '700', color: Colors.light.textSecondary },
  filterTextActive: { color: Colors.darkBlue },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: 120 },
  periodNavigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15 },
  periodText: { fontSize: 16, fontWeight: '800', color: Colors.darkBlue },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderRadius: 12, ...Shadows.subtle as any },
  chartCard: { padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadows.strong as any },
  cardTitle: { fontSize: 17, fontWeight: '800', color: Colors.darkBlue },
  chartWrapper: { alignItems: 'center', marginTop: 25 },
  legendGrid: { width: '100%', marginTop: 30, gap: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.light.input, padding: 12, borderRadius: Radius.md },
  legendDot: { width: 12, height: 12, borderRadius: 4 },
  legendLabel: { fontSize: 13, color: Colors.darkBlue, fontWeight: '700' },
  legendValue: { fontSize: 12, color: Colors.light.textSecondary, fontWeight: '500' },
  legendPerc: { fontSize: 14, fontWeight: '900', color: Colors.darkBlue },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 15, fontWeight: '600' },
  axisLabel: { color: Colors.light.textSecondary, fontSize: 10, fontWeight: '600' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendSimple: { flexDirection: 'row', gap: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotText: { fontSize: 10, fontWeight: '700', color: Colors.light.textSecondary },
  tooltip: { backgroundColor: Colors.darkBlue, padding: 10, borderRadius: 10, ...Shadows.medium as any },
  tooltipText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
});
