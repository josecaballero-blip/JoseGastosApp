import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  FlatList,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing, Radius, Shadows } from '../theme/tokens';
import { JGButton, JGCard } from '../components/UI';
import { supabase } from '../lib/supabase';
import { useAppState } from '../core/AppState';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function InvoicesScreen({ navigation }: any) {
  const { state } = useAppState();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Cargar caché inicial
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(`invoices_cache_${state.currentUser?.id}`);
        if (cached) {
          setInvoices(JSON.parse(cached));
          setIsLoading(false);
        }
      } catch (e) {}
    };
    if (state.currentUser?.id) loadCache();
  }, [state.currentUser?.id]);

  const fetchInvoices = async () => {
    if (!state.currentUser?.id) return;
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, categories(*)')
        .eq('user_id', state.currentUser.id)
        .not('receipt_url', 'is', null)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
      
      // Guardar en caché
      await AsyncStorage.setItem(`invoices_cache_${state.currentUser?.id}`, JSON.stringify(data || []));
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchInvoices();
    });
    return unsubscribe;
  }, [navigation, state.currentUser?.id]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchInvoices();
  };

  const renderInvoiceItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100)}>
      <TouchableOpacity 
        style={styles.invoiceItem} 
        activeOpacity={0.7}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedInvoice(item);
        }}
      >
        <Image source={{ uri: item.receipt_url }} style={styles.invoiceThumb} />
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceTitle}>{item.description || 'Factura sin nombre'}</Text>
          <Text style={styles.invoiceDate}>{new Date(item.expense_date).toLocaleDateString('es-CO')}</Text>
          <Text style={styles.invoiceAmount}>${Number(item.amount).toLocaleString('es-CO')}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.light.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Facturas</Text>
        <Text style={styles.subtitle}>Historial de recibos con ubicación</Text>
      </View>

      <TouchableOpacity 
        style={styles.newInvoiceBtn} 
        activeOpacity={0.8}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.navigate('AddExpense', { isInvoice: true });
        }}
      >
        <LinearGradient
          colors={['#3A7BD5', '#00D2FF']}
          start={{x:0, y:0}}
          end={{x:1, y:0}}
          style={styles.btnGradient}
        >
          <MaterialCommunityIcons name="camera-plus" size={28} color="#FFF" />
          <Text style={styles.btnText}>Nueva Factura</Text>
        </LinearGradient>
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.mediumBlue} />
        </View>
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderInvoiceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.mediumBlue} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="file-search-outline" size={64} color={Colors.light.border} />
              <Text style={styles.emptyText}>No tienes facturas aún</Text>
            </View>
          }
        />
      )}

      {/* Modal Detalles Detallados */}
      <Modal visible={!!selectedInvoice} transparent animationType="slide" onRequestClose={() => setSelectedInvoice(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 50 }]}>
            <View style={styles.receiptLine} />
            {selectedInvoice && (
              <>
                <View style={styles.receiptHeader}>
                  <View style={[styles.receiptIcon, { backgroundColor: (selectedInvoice.categories?.color_hex || '#0A2463') + '20' }]}>
                    <MaterialCommunityIcons 
                      name={(selectedInvoice.categories?.icon || 'file-document-outline') as any} 
                      size={36} 
                      color={selectedInvoice.categories?.color_hex || '#0A2463'} 
                    />
                  </View>
                  <Text style={styles.receiptValue}>{selectedInvoice.description || 'Sin descripción'}</Text>
                  <Text style={styles.receiptAmount}>
                    ${Number(selectedInvoice.amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </Text>
                </View>

                <View style={styles.receiptDetails}>
                   <View style={styles.receiptRow}>
                     <Text style={styles.receiptLabel}>Categoría</Text>
                     <Text style={styles.receiptValueMini}>{selectedInvoice.categories?.name || 'General'}</Text>
                   </View>
                   <View style={styles.receiptRow}>
                     <Text style={styles.receiptLabel}>Fecha</Text>
                     <Text style={styles.receiptValueMini}>
                       {new Date(selectedInvoice.expense_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                     </Text>
                   </View>
                   <View style={styles.receiptRow}>
                     <Text style={styles.receiptLabel}>Estado</Text>
                     <Text style={[styles.receiptValueMini, {color: Colors.success}]}>Confirmado</Text>
                   </View>
                </View>

                {selectedInvoice.receipt_url && (
                  <View style={styles.modalReceiptContainer}>
                    <Text style={styles.sectionTitle}>Imagen del Recibo</Text>
                    <Image source={{ uri: selectedInvoice.receipt_url }} style={styles.modalReceiptImg} resizeMode="cover" />
                  </View>
                )}
                
                <View style={{ marginTop: 20 }}>
                  <JGButton title="Cerrar Detalles" variant="secondary" onPress={() => setSelectedInvoice(null)} />
                </View>
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
  header: { paddingHorizontal: Spacing.xl, paddingTop: 60, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '900', color: '#0A2463', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: Colors.light.textSecondary, marginTop: 4, fontWeight: '500' },
  newInvoiceBtn: { marginHorizontal: Spacing.xl, height: 72, borderRadius: Radius.xxl, overflow: 'hidden', ...Shadows.medium as any, marginBottom: 30 },
  btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 150 },
  invoiceItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: '#FFF', 
    borderRadius: Radius.xl, 
    marginBottom: 12, 
    ...Shadows.subtle as any,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)'
  },
  invoiceThumb: { width: 56, height: 56, borderRadius: Radius.lg, backgroundColor: Colors.light.input },
  invoiceInfo: { flex: 1, marginLeft: 15 },
  invoiceTitle: { fontSize: 16, fontWeight: '800', color: '#0A2463' },
  invoiceDate: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  invoiceAmount: { fontSize: 14, fontWeight: '700', color: Colors.mediumBlue, marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, fontSize: 16, color: Colors.light.textSecondary, fontWeight: '600' },
  
  // Estilos del Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 36, 99, 0.4)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 24,
    ...Shadows.large as any
  },
  receiptLine: { width: 40, height: 5, backgroundColor: '#E0E6ED', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  receiptHeader: { alignItems: 'center', marginBottom: 24 },
  receiptIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  receiptValue: { fontSize: 20, fontWeight: '800', color: '#0A2463', textAlign: 'center' },
  receiptAmount: { fontSize: 32, fontWeight: '900', color: Colors.mediumBlue, marginTop: 8 },
  receiptDetails: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20, marginBottom: 24 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  receiptLabel: { fontSize: 14, color: Colors.light.textSecondary, fontWeight: '600' },
  receiptValueMini: { fontSize: 14, color: '#0A2463', fontWeight: '700' },
  modalReceiptContainer: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0A2463', marginBottom: 12 },
  modalReceiptImg: { width: '100%', height: 250, borderRadius: 20, backgroundColor: '#F0F4F8' },
});
