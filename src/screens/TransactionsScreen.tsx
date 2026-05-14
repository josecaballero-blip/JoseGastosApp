import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Platform,
  Dimensions,
  Modal,
  Image,
  Linking,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Colors, Spacing, Radius, Shadows, CategoryIcons } from '../theme/tokens';
import { JGCard, JGTextField, JGBadge, JGButton } from '../components/UI';
import { supabase } from '../lib/supabase';
import { useAppState } from '../core/AppState';
import { LinearGradient } from 'expo-linear-gradient';

export default function TransactionsScreen({ navigation }: any) {
  const { state } = useAppState();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedSort, setSelectedSort] = useState<'newest' | 'oldest' | 'amount'>('newest');
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [state.currentUser?.id]);

  const fetchTransactions = async () => {
    if (!state.currentUser?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', state.currentUser.id)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      if (data) setExpenses(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        const matchesSearch = (exp.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (CategoryIcons[exp.category]?.label || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || 
                            (filterType === 'income' && exp.is_income) || 
                            (filterType === 'expense' && !exp.is_income);
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (selectedSort === 'newest') return new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime();
        if (selectedSort === 'oldest') return new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime();
        if (selectedSort === 'amount') return b.amount - a.amount;
        return 0;
      });
  }, [expenses, searchQuery, filterType, selectedSort]);

  const renderTransaction = (expense: any, index: number) => (
    <Animated.View 
      key={expense.id} 
      entering={FadeInRight.delay(index * 50)}
    >
      <TouchableOpacity 
        activeOpacity={0.7} 
        style={styles.transactionItem}
        onPress={() => {
          setSelectedExpense(expense);
          Haptics.selectionAsync();
        }}
      >
        <View style={[styles.transIconBg, { backgroundColor: (CategoryIcons[expense.category]?.color || Colors.mediumBlue) + '15' }]}>
          <MaterialCommunityIcons 
            name={(CategoryIcons[expense.category]?.icon || 'cash') as any} 
            size={22} 
            color={CategoryIcons[expense.category]?.color || Colors.mediumBlue} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.transName}>{expense.description || CategoryIcons[expense.category]?.label || 'Varios'}</Text>
          <View style={styles.transMetaRow}>
            <Text style={styles.transDate}>
              {new Date(expense.expense_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
            </Text>
            <View style={styles.dot} />
            <Text style={styles.transTime}>
              {new Date(expense.expense_date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.transAmount, { color: expense.is_income ? Colors.success : Colors.light.textPrimary }]}>
            {expense.is_income ? '+' : '-'}${Number(expense.amount).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </Text>
          {expense.receipt_url && (
            <MaterialCommunityIcons name="paperclip" size={14} color={Colors.mediumBlue} style={{ marginTop: 2 }} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.light.background, '#F8FAFC']} style={StyleSheet.absoluteFill} />
      
      {/* Header Premium */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={Colors.darkBlue} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Movimientos</Text>
          <Text style={styles.subtitle}>{filteredExpenses.length} transacciones encontradas</Text>
        </View>
      </View>

      {/* Search & Filters */}
      <View style={styles.filterSection}>
        <JGTextField 
          placeholder="Buscar por nombre o categoría..." 
          value={searchQuery} 
          onChangeText={setSearchQuery}
          icon="magnify"
        />
        
        <View style={styles.typeFilters}>
          <TouchableOpacity 
            style={[styles.filterChip, filterType === 'all' && styles.activeChip]} 
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.chipText, filterType === 'all' && styles.activeChipText]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterType === 'income' && styles.activeChip]} 
            onPress={() => setFilterType('income')}
          >
            <Text style={[styles.chipText, filterType === 'income' && styles.activeChipText]}>Ingresos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterType === 'expense' && styles.activeChip]} 
            onPress={() => setFilterType('expense')}
          >
            <Text style={[styles.chipText, filterType === 'expense' && styles.activeChipText]}>Gastos</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
          <Text style={styles.sortLabel}>Ordenar por:</Text>
          <TouchableOpacity 
            style={[styles.sortBtn, selectedSort === 'newest' && styles.activeSort]}
            onPress={() => setSelectedSort('newest')}
          >
            <Text style={[styles.sortText, selectedSort === 'newest' && styles.activeSortText]}>Más recientes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortBtn, selectedSort === 'amount' && styles.activeSort]}
            onPress={() => setSelectedSort('amount')}
          >
            <Text style={[styles.sortText, selectedSort === 'amount' && styles.activeSortText]}>Mayor monto</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortBtn, selectedSort === 'oldest' && styles.activeSort]}
            onPress={() => setSelectedSort('oldest')}
          >
            <Text style={[styles.sortText, selectedSort === 'oldest' && styles.activeSortText]}>Más antiguos</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.mediumBlue} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.listContent} 
          showsVerticalScrollIndicator={false}
        >
          {filteredExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="database-search-outline" size={64} color={Colors.light.border} />
              <Text style={styles.emptyTitle}>No se encontraron resultados</Text>
              <Text style={styles.emptySub}>Prueba con otros términos o filtros</Text>
            </View>
          ) : (
            filteredExpenses.map((exp, index) => renderTransaction(exp, index))
          )}
        </ScrollView>
      )}

      {/* MODAL DE DETALLES DETALLADOS */}
      <Modal 
        visible={!!selectedExpense} 
        transparent 
        animationType="slide"
        onRequestClose={() => setSelectedExpense(null)}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailTitle}>Detalle del Movimiento</Text>
                <Text style={styles.detailSubtitle}>Comprobante digital premium</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedExpense(null)}>
                <MaterialCommunityIcons name="close-circle" size={32} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {selectedExpense?.receipt_url && (
                <View style={styles.receiptPaper}>
                  <Image 
                    source={{ uri: selectedExpense.receipt_url }} 
                    style={styles.detailImage} 
                    resizeMode="cover"
                  />
                  <View style={styles.receiptPunch} />
                </View>
              )}

              <View style={styles.detailInfoBox}>
                <View style={styles.categoryBadgeRow}>
                   <View style={[styles.miniBadge, { backgroundColor: (CategoryIcons[selectedExpense?.category]?.color || Colors.mediumBlue) + '15' }]}>
                      <MaterialCommunityIcons 
                        name={(CategoryIcons[selectedExpense?.category]?.icon || 'tag') as any} 
                        size={16} 
                        color={CategoryIcons[selectedExpense?.category]?.color || Colors.mediumBlue} 
                      />
                      <Text style={[styles.miniBadgeText, { color: CategoryIcons[selectedExpense?.category]?.color || Colors.mediumBlue }]}>
                        {CategoryIcons[selectedExpense?.category]?.label || 'Otro'}
                      </Text>
                   </View>
                </View>

                <Text style={styles.detailBus}>{selectedExpense?.description || 'Sin descripción'}</Text>
                <Text style={[styles.detailAmount, { color: selectedExpense?.is_income ? Colors.success : Colors.red }]}>
                  {selectedExpense?.is_income ? '+' : '-'}${Number(selectedExpense?.amount).toLocaleString()} <Text style={{ fontSize: 14, color: Colors.light.textSecondary }}>COP</Text>
                </Text>
                
                <View style={styles.detailDivider} />
                
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>FECHA</Text>
                    <View style={styles.infoValueRow}>
                      <MaterialCommunityIcons name="calendar" size={16} color={Colors.mediumBlue} />
                      <Text style={styles.infoValue}>{new Date(selectedExpense?.expense_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>HORA</Text>
                    <View style={styles.infoValueRow}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.mediumBlue} />
                      <Text style={styles.infoValue}>{new Date(selectedExpense?.expense_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>TIPO</Text>
                    <View style={styles.infoValueRow}>
                      <MaterialCommunityIcons 
                        name={selectedExpense?.is_income ? "trending-up" : "trending-down"} 
                        size={16} 
                        color={selectedExpense?.is_income ? Colors.success : Colors.red} 
                      />
                      <Text style={styles.infoValue}>{selectedExpense?.is_income ? 'Ingreso' : 'Gasto'}</Text>
                    </View>
                  </View>
                </View>

                {selectedExpense?.lat && (
                  <JGButton 
                    title="Ver Ubicación en Mapa"
                    onPress={() => {
                      const url = `https://www.google.com/maps/search/?api=1&query=${selectedExpense.lat},${selectedExpense.lng}`;
                      Linking.openURL(url);
                    }}
                    style={styles.mapBtnLarge}
                    icon="map-marker-radius"
                  />
                )}

                <TouchableOpacity 
                  style={styles.deleteBtn}
                  onPress={() => {
                    Alert.alert(
                      'Eliminar Movimiento',
                      '¿Estás seguro de que quieres eliminar este registro?',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { 
                          text: 'Eliminar', 
                          style: 'destructive',
                          onPress: async () => {
                            const { error } = await supabase.from('expenses').delete().eq('id', selectedExpense.id);
                            if (!error) {
                              setSelectedExpense(null);
                              fetchTransactions();
                            }
                          }
                        }
                      ]
                    );
                  }}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.red} />
                  <Text style={styles.deleteBtnText}>Eliminar registro</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.xl, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 20,
    gap: 12
  },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...Shadows.subtle as any },
  title: { fontSize: 26, fontWeight: '900', color: Colors.darkBlue, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.light.textSecondary, fontWeight: '600' },
  filterSection: { paddingHorizontal: Spacing.xl, gap: 15 },
  typeFilters: { flexDirection: 'row', gap: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: '#FFF', borderWidth: 1, borderColor: Colors.light.border },
  activeChip: { backgroundColor: Colors.mediumBlue, borderColor: Colors.mediumBlue },
  chipText: { fontSize: 13, fontWeight: '700', color: Colors.light.textSecondary },
  activeChipText: { color: '#FFF' },
  sortScroll: { flexDirection: 'row', marginTop: 5 },
  sortLabel: { fontSize: 12, fontWeight: '800', color: Colors.light.textSecondary, alignSelf: 'center', marginRight: 10, textTransform: 'uppercase' },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: Colors.light.border },
  activeSort: { backgroundColor: Colors.light.input, borderColor: Colors.mediumBlue },
  sortText: { fontSize: 12, fontWeight: '600', color: Colors.light.textSecondary },
  activeSortText: { color: Colors.mediumBlue, fontWeight: '700' },
  listContent: { paddingHorizontal: Spacing.xl, paddingTop: 20, paddingBottom: 100 },
  transactionItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: '#FFF', 
    borderRadius: Radius.xl, 
    marginBottom: 12, 
    ...Shadows.subtle as any,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)'
  },
  transIconBg: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  transName: { fontSize: 15, fontWeight: '800', color: Colors.darkBlue, marginBottom: 4 },
  transMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  transDate: { fontSize: 12, color: Colors.light.textSecondary, fontWeight: '600' },
  transTime: { fontSize: 11, color: Colors.light.textSecondary, fontWeight: '500' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.light.border },
  transAmount: { fontSize: 16, fontWeight: '900' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.darkBlue, marginTop: 20 },
  emptySub: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 8 },

  // Estilos de Detalles (Modal)
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  detailContainer: { 
    backgroundColor: Colors.light.background, 
    borderTopLeftRadius: Radius.xxl, 
    borderTopRightRadius: Radius.xxl, 
    height: '92%', 
    padding: Spacing.xl 
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  detailTitle: { fontSize: 24, fontWeight: '900', color: Colors.darkBlue },
  detailSubtitle: { fontSize: 13, color: Colors.light.textSecondary, fontWeight: '600' },
  receiptPaper: {
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    padding: 10,
    ...Shadows.medium as any,
    marginBottom: 25,
  },
  receiptPunch: {
    position: 'absolute',
    bottom: -10,
    left: '10%',
    right: '10%',
    height: 20,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    transform: [{ scaleY: 0.5 }],
  },
  detailImage: { width: '100%', height: 400, borderRadius: Radius.lg },
  detailInfoBox: { paddingHorizontal: 5 },
  categoryBadgeRow: { marginBottom: 15 },
  miniBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    alignSelf: 'flex-start',
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: Radius.full 
  },
  miniBadgeText: { fontSize: 12, fontWeight: '800', marginLeft: 6, textTransform: 'uppercase' },
  detailBus: { fontSize: 26, fontWeight: '900', color: Colors.darkBlue, letterSpacing: -0.5 },
  detailAmount: { fontSize: 32, fontWeight: '900', marginTop: 5 },
  detailDivider: { height: 1, backgroundColor: Colors.light.border, marginVertical: 25, borderStyle: 'dashed', borderRadius: 1 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 30 },
  infoItem: { width: '45%' },
  infoLabel: { fontSize: 10, fontWeight: '800', color: Colors.light.textSecondary, letterSpacing: 1, marginBottom: 8 },
  infoValueRow: { flexDirection: 'row', alignItems: 'center' },
  infoValue: { fontSize: 14, fontWeight: '700', color: Colors.darkBlue, marginLeft: 8 },
  mapBtnLarge: { height: 60, borderRadius: Radius.xl, marginBottom: 15 },
  deleteBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 15,
    marginTop: 10,
  },
  deleteBtnText: { color: Colors.red, fontWeight: '700', marginLeft: 10, fontSize: 15 },
});
