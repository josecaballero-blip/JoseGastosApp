import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator, 
  Modal, 
  KeyboardAvoidingView, 
  Platform, 
  Image, 
  TextInput, 
  Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors, Spacing, Radius, Shadows, CategoryIcons } from '../theme/tokens';
import { JGCard, JGBadge, JGAvatar, JGProgressBar, JGButton, JGTextField } from '../components/UI';
import { useDashboardViewModel } from '../features/dashboard/presentation/useDashboardViewModel';
import { supabase } from '../lib/supabase';
import { ReportService } from '../services/ReportService';

export default function HomeScreen({ navigation }: any) {
  const {
    user,
    isLoading,
    isRefreshing,
    balance,
    income,
    expenses,
    recentExpenses,
    refreshData,
  } = useDashboardViewModel();

  const [isAddMoneyVisible, setAddMoneyVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<'income'|'expense'>('income');
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [displayName, setDisplayName] = useState('Usuario');

  useEffect(() => {
    if (user?.name) {
      const formatted = user.name.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
      setDisplayName(formatted);
    }
  }, [user?.name]);

  const handleAmountChange = (text: string) => {
    const cleanText = text.replace(/[^0-9,]/g, '');
    if (cleanText === '') { setAddMoneyAmount(''); return; }
    if (cleanText.includes(',')) {
      const parts = cleanText.split(',');
      const integerPart = parts[0] ? Number(parts[0]).toLocaleString('es-CO') : '0';
      const decimalPart = parts[1].substring(0, 2);
      setAddMoneyAmount(`${integerPart},${decimalPart}`);
    } else {
      setAddMoneyAmount(Number(cleanText).toLocaleString('es-CO'));
    }
  };

  const handleAddMoney = async () => {
    const cleanAmount = addMoneyAmount.replace(/\./g, '').replace(',', '.');
    const amount = Number(cleanAmount);
    if (!amount || isNaN(amount) || amount <= 0) return;
    if (transactionType === 'expense' && amount > balance) {
      Alert.alert('Fondos Insuficientes', 'No puedes retirar más dinero del que tienes.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('expenses').insert({
        user_id: user?.id,
        amount: amount,
        amount_base: amount,
        is_income: transactionType === 'income',
        description: transactionType === 'income' ? 'Ingreso Manual' : 'Retiro Manual',
        currency: 'COP'
      });
      if (error) throw error;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAddMoneyVisible(false);
      setAddMoneyAmount('');
      refreshData();
    } catch (err: any) {
      console.error(err);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && recentExpenses.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 150, height: 20, backgroundColor: '#E1E9EE', borderRadius: 4, marginBottom: 10 }} />
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#E1E9EE' }} />
        </View>
        <View style={[styles.balanceCard, { backgroundColor: '#E1E9EE', opacity: 0.6 }]} />
        <View style={{ padding: 20 }}>
          <View style={{ width: 100, height: 20, backgroundColor: '#E1E9EE', borderRadius: 4, marginBottom: 20 }} />
          {[1, 2, 3].map(i => (
            <View key={i} style={{ height: 70, backgroundColor: '#F0F4F8', borderRadius: 16, marginBottom: 12 }} />
          ))}
        </View>
      </View>
    );
  }

  const availablePercentage = income > 0 ? Math.max((balance / income), 0) : 0;
  const healthColor = income === 0 && balance === 0 ? Colors.light.textSecondary : availablePercentage < 0.2 ? Colors.red : availablePercentage < 0.5 ? Colors.warning : Colors.success;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshData} tintColor={Colors.mediumBlue} />}
      >
        {/* Header Premium */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola de nuevo,</Text>
            <Text style={styles.headerTitle}>{displayName} 👋</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Perfil')}>
             <JGAvatar initials={displayName.substring(0,2).toUpperCase()} size={52} />
          </TouchableOpacity>
        </View>

        {/* Balance Card "Fintech Style" - Compact & Premium */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <JGCard variant="gradient" style={styles.balanceCard}>
            <View style={styles.cardHighlight} />
            
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.balanceLabel}>BALANCE DISPONIBLE</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 }}>
                  <Text style={styles.balanceAmount}>${balance.toLocaleString('es-CO')}</Text>
                  <Text style={styles.balanceDecimals}>.00</Text>
                </View>
              </View>
              <View style={styles.cardIconWrap}>
                <MaterialCommunityIcons name="credit-card-chip" size={32} color="#FFF" />
              </View>
            </View>
            
            <View style={styles.cardStatsRow}>
              <View style={styles.statContainer}>
                <View style={[styles.statIconBg, { backgroundColor: 'rgba(52,211,153,0.15)' }]}>
                  <MaterialCommunityIcons name="arrow-up-right" size={18} color="#10B981" />
                </View>
                <View>
                  <Text style={styles.statLabel}>Ingresos</Text>
                  <Text style={styles.statValue}>+${income.toLocaleString('es-CO')}</Text>
                </View>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statContainer}>
                <View style={[styles.statIconBg, { backgroundColor: 'rgba(248,113,113,0.15)' }]}>
                  <MaterialCommunityIcons name="arrow-down-left" size={18} color="#EF4444" />
                </View>
                <View>
                  <Text style={styles.statLabel}>Gastos</Text>
                  <Text style={styles.statValue}>-${expenses.toLocaleString('es-CO')}</Text>
                </View>
              </View>
            </View>
          </JGCard>
        </Animated.View>

        {/* Quick Actions Modernas */}
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => { setTransactionType('income'); setAddMoneyVisible(true); }}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="plus" size={26} color="#4CAF50" />
            </View>
            <Text style={styles.actionText}>Meter</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => { setTransactionType('expense'); setAddMoneyVisible(true); }}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#FFEBEE' }]}>
              <MaterialCommunityIcons name="minus" size={26} color="#F44336" />
            </View>
            <Text style={styles.actionText}>Sacar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Statistics')}>
            <View style={[styles.actionIconBg, { backgroundColor: '#E3F2FD' }]}>
              <MaterialCommunityIcons name="chart-arc" size={26} color="#2196F3" />
            </View>
            <Text style={styles.actionText}>Análisis</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Subscriptions')}>
            <View style={[styles.actionIconBg, { backgroundColor: '#FFFDE7' }]}>
              <MaterialCommunityIcons name="history" size={26} color="#FBC02D" />
            </View>
            <Text style={styles.actionText}>Fijos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert('Generar Reporte', '¿Deseas descargar tu reporte mensual en PDF?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Generar PDF', onPress: () => ReportService.generateAndSharePDF(displayName, balance, income, expenses, recentExpenses) }
            ]);
          }}>
            <View style={[styles.actionIconBg, { backgroundColor: '#F5F5F5' }]}>
              <MaterialCommunityIcons name="file-pdf-box" size={26} color="#0A2463" />
            </View>
            <Text style={styles.actionText}>PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Salud Financiera */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <JGCard style={styles.healthCard}>
            <View style={styles.healthHeader}>
              <Text style={styles.sectionTitle}>Salud de tu Billetera</Text>
              <JGBadge text={income > 0 ? `${(availablePercentage * 100).toFixed(0)}%` : 'N/A'} color={healthColor} />
            </View>
            <JGProgressBar progress={availablePercentage} height={10} />
            <Text style={styles.healthTips}>
              {balance <= 0 ? '¡Cuidado! Estás en números rojos.' : availablePercentage > 0.5 ? '¡Muy bien! Tienes buen margen de ahorro.' : 'Tus gastos están cerca de tus ingresos.'}
            </Text>
          </JGCard>
        </Animated.View>

        {/* Transacciones Recientes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Movimientos Recientes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAll}>Ver todo</Text>
          </TouchableOpacity>
        </View>

        {recentExpenses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="text-box-search-outline" size={48} color={Colors.light.textSecondary + '40'} />
            <Text style={styles.emptyText}>Sin movimientos aún</Text>
          </View>
        ) : (
          recentExpenses.map((expense, index) => (
            <Animated.View key={expense.id} entering={FadeInRight.delay(index * 100)}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => setSelectedExpense(expense)}
                style={styles.transactionItem}
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
                  <Text style={styles.transDate}>{new Date(expense.expense_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</Text>
                </View>
                <Text style={[styles.transAmount, { color: expense.is_income ? Colors.success : Colors.light.textPrimary }]}>
                  {expense.is_income ? '+' : '-'}${Number(expense.amount).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Modales rediseñados */}
      <Modal visible={isAddMoneyVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={styles.modalContent}>
            <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>{transactionType === 'income' ? 'Ingresar Dinero' : 'Registrar Retiro'}</Text>
               <TouchableOpacity onPress={() => setAddMoneyVisible(false)} style={styles.closeBtn}>
                 <MaterialCommunityIcons name="close" size={20} color={Colors.light.textSecondary} />
               </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Digita el monto que deseas {transactionType === 'income' ? 'sumar a' : 'restar de'} tu balance.</Text>
            
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput 
                style={styles.amountInput}
                placeholder="0"
                value={addMoneyAmount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <JGButton 
              title={transactionType === 'income' ? 'Confirmar Depósito' : 'Confirmar Retiro'} 
              onPress={handleAddMoney} 
              isLoading={isSubmitting}
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal Detalles Detallados */}
      <Modal visible={!!selectedExpense} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 50 }]}>
            <View style={styles.receiptLine} />
            {selectedExpense && (
              <>
                <View style={styles.receiptHeader}>
                  <View style={[styles.receiptIcon, { backgroundColor: (CategoryIcons[selectedExpense.category]?.color || Colors.mediumBlue) + '20' }]}>
                    <MaterialCommunityIcons 
                      name={(CategoryIcons[selectedExpense.category]?.icon || 'cash') as any} 
                      size={36} 
                      color={CategoryIcons[selectedExpense.category]?.color || Colors.mediumBlue} 
                    />
                  </View>
                  <Text style={styles.receiptValue}>{selectedExpense.description || 'Sin descripción'}</Text>
                  <Text style={[styles.receiptAmount, { color: selectedExpense.is_income ? Colors.success : Colors.red }]}>
                    {selectedExpense.is_income ? '+' : '-'}${Number(selectedExpense.amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.receiptDetails}>
                   <View style={styles.receiptRow}>
                     <Text style={styles.receiptLabel}>Categoría</Text>
                     <Text style={styles.receiptValueMini}>{selectedExpense.categories?.name || 'General'}</Text>
                   </View>
                   <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Fecha</Text><Text style={styles.receiptValueMini}>{new Date(selectedExpense.expense_date).toLocaleDateString()}</Text></View>
                   <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Estado</Text><Text style={[styles.receiptValueMini, {color: Colors.success}]}>Confirmado</Text></View>
                </View>

                {selectedExpense.receipt_url && (
                  <View style={styles.modalReceiptContainer}>
                    <Text style={styles.sectionTitle}>Soporte de Pago</Text>
                    <Image source={{ uri: selectedExpense.receipt_url }} style={styles.modalReceiptImg} resizeMode="cover" />
                  </View>
                )}
                <JGButton title="Cerrar" variant="secondary" onPress={() => setSelectedExpense(null)} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: 60, marginBottom: Spacing.xl },
  greeting: { fontSize: 15, color: Colors.light.textSecondary, fontWeight: '500' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: Colors.light.textPrimary, letterSpacing: -0.5 },
  balanceCard: {
    marginHorizontal: Spacing.lg,
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#0A1A3F',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 15 },
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
  },
  cardHighlight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(58, 123, 213, 0.15)',
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700', letterSpacing: 1.2 },
  balanceAmount: { color: '#FFF', fontSize: 40, fontWeight: '900', lineHeight: 44 },
  balanceDecimals: { color: 'rgba(255,255,255,0.5)', fontSize: 22, fontWeight: '800', marginBottom: 6, marginLeft: 2 },
  cardIconWrap: { width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardStatsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  statContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  statIconBg: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 12 },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', marginBottom: 1 },
  statValue: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, marginVertical: Spacing.xl },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIconBg: { width: 52, height: 52, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8, ...Shadows.subtle as any },
  actionText: { fontSize: 12, fontWeight: '700', color: Colors.light.textSecondary },
  healthCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.xl, padding: Spacing.lg },
  healthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.light.textPrimary },
  healthTips: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 10, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  seeAll: { color: Colors.mediumBlue, fontSize: 13, fontWeight: '700' },
  transactionItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: '#FFF', marginHorizontal: Spacing.xl, borderRadius: Radius.lg, marginBottom: 10, ...Shadows.subtle as any },
  transIconBg: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  transName: { fontSize: 15, fontWeight: '700', color: Colors.light.textPrimary, marginBottom: 2 },
  transDate: { fontSize: 12, color: Colors.light.textSecondary, fontWeight: '500' },
  transAmount: { fontSize: 16, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', padding: Spacing.xxl },
  emptyText: { marginTop: 10, color: Colors.light.textSecondary, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,36,99,0.3)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, ...Shadows.strong as any },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: 22, fontWeight: '900', color: Colors.darkBlue, letterSpacing: -0.5 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.light.input, alignItems: 'center', justifyContent: 'center' },
  modalSub: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: Spacing.xl, lineHeight: 20 },
  amountInputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xxl },
  currencySymbol: { fontSize: 32, fontWeight: '800', color: Colors.darkBlue, marginRight: 8 },
  amountInput: { fontSize: 48, fontWeight: '900', color: Colors.darkBlue, textAlign: 'center' },
  receiptLine: { width: 40, height: 4, backgroundColor: Colors.light.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  receiptHeader: { alignItems: 'center', marginBottom: Spacing.xl },
  receiptIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  receiptAmount: { fontSize: 36, fontWeight: '900', marginTop: 5 },
  receiptDetails: { backgroundColor: Colors.light.input, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  receiptLabel: { fontSize: 13, color: Colors.light.textSecondary, fontWeight: '600' },
  receiptValueMini: { fontSize: 13, color: Colors.light.textPrimary, fontWeight: '700' },
  receiptValue: { fontSize: 18, color: Colors.light.textPrimary, fontWeight: '800' },
  modalReceiptContainer: { marginBottom: 25 },
  modalReceiptImg: { width: '100%', height: 200, borderRadius: Radius.lg, marginTop: 10 },
});
