import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius, Shadows } from '../theme/tokens';
import { JGCard, JGBadge, JGButton, JGTextField } from '../components/UI';
import { supabase } from '../lib/supabase';
import { RecurringExpense } from '../core/models/types';
import { useAppState } from '../core/AppState';
import * as Notifications from 'expo-notifications';

// ── Marcas conocidas con iconos y colores oficiales ──
const BRAND_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  'netflix': { icon: 'netflix', color: '#E50914', bg: '#E5091415' },
  'spotify': { icon: 'spotify', color: '#1DB954', bg: '#1DB95415' },
  'youtube': { icon: 'youtube', color: '#FF0000', bg: '#FF000015' },
  'youtube premium': { icon: 'youtube', color: '#FF0000', bg: '#FF000015' },
  'disney': { icon: 'movie-open', color: '#113CCF', bg: '#113CCF15' },
  'disney+': { icon: 'movie-open', color: '#113CCF', bg: '#113CCF15' },
  'hbo': { icon: 'filmstrip', color: '#5822B4', bg: '#5822B415' },
  'hbo max': { icon: 'filmstrip', color: '#5822B4', bg: '#5822B415' },
  'max': { icon: 'filmstrip', color: '#002BE7', bg: '#002BE715' },
  'amazon': { icon: 'amazon', color: '#FF9900', bg: '#FF990015' },
  'amazon prime': { icon: 'amazon', color: '#00A8E1', bg: '#00A8E115' },
  'prime video': { icon: 'amazon', color: '#00A8E1', bg: '#00A8E115' },
  'apple': { icon: 'apple', color: '#000000', bg: '#00000010' },
  'apple music': { icon: 'apple', color: '#FC3C44', bg: '#FC3C4415' },
  'apple tv': { icon: 'apple', color: '#000000', bg: '#00000010' },
  'icloud': { icon: 'apple-icloud', color: '#3693F3', bg: '#3693F315' },
  'xbox': { icon: 'microsoft-xbox', color: '#107C10', bg: '#107C1015' },
  'playstation': { icon: 'sony-playstation', color: '#003087', bg: '#00308715' },
  'ps plus': { icon: 'sony-playstation', color: '#003087', bg: '#00308715' },
  'nintendo': { icon: 'nintendo-switch', color: '#E60012', bg: '#E6001215' },
  'twitch': { icon: 'twitch', color: '#9146FF', bg: '#9146FF15' },
  'google': { icon: 'google', color: '#4285F4', bg: '#4285F415' },
  'google one': { icon: 'google', color: '#4285F4', bg: '#4285F415' },
  'microsoft': { icon: 'microsoft', color: '#00A4EF', bg: '#00A4EF15' },
  'office': { icon: 'microsoft-office', color: '#D83B01', bg: '#D83B0115' },
  'microsoft 365': { icon: 'microsoft-office', color: '#D83B01', bg: '#D83B0115' },
  'github': { icon: 'github', color: '#333333', bg: '#33333315' },
  'slack': { icon: 'slack', color: '#4A154B', bg: '#4A154B15' },
  'dropbox': { icon: 'dropbox', color: '#0061FF', bg: '#0061FF15' },
  'whatsapp': { icon: 'whatsapp', color: '#25D366', bg: '#25D36615' },
  'telegram': { icon: 'telegram', color: '#0088CC', bg: '#0088CC15' },
  'linkedin': { icon: 'linkedin', color: '#0A66C2', bg: '#0A66C215' },
  'uber': { icon: 'car', color: '#000000', bg: '#00000010' },
  'rappi': { icon: 'shopping', color: '#FF441F', bg: '#FF441F15' },
  'claro': { icon: 'cellphone', color: '#DA291C', bg: '#DA291C15' },
  'movistar': { icon: 'cellphone', color: '#0B9ED9', bg: '#0B9ED915' },
  'tigo': { icon: 'cellphone', color: '#00377B', bg: '#00377B15' },
  'wom': { icon: 'cellphone', color: '#6B2D8B', bg: '#6B2D8B15' },
  'internet': { icon: 'wifi', color: '#0088CC', bg: '#0088CC15' },
  'agua': { icon: 'water', color: '#2196F3', bg: '#2196F315' },
  'luz': { icon: 'lightbulb', color: '#FFC107', bg: '#FFC10715' },
  'gas': { icon: 'fire', color: '#FF5722', bg: '#FF572215' },
  'arriendo': { icon: 'home', color: '#4CAF50', bg: '#4CAF5015' },
  'gimnasio': { icon: 'dumbbell', color: '#FF5722', bg: '#FF572215' },
  'gym': { icon: 'dumbbell', color: '#FF5722', bg: '#FF572215' },
  'smart fit': { icon: 'dumbbell', color: '#FFD600', bg: '#FFD60015' },
  'bodytech': { icon: 'dumbbell', color: '#E53935', bg: '#E5393515' },
  'seguro': { icon: 'shield-check', color: '#1565C0', bg: '#1565C015' },
  'duolingo': { icon: 'owl', color: '#58CC02', bg: '#58CC0215' },
  'zoom': { icon: 'video', color: '#2D8CFF', bg: '#2D8CFF15' },
  'canva': { icon: 'palette', color: '#00C4CC', bg: '#00C4CC15' },
  'figma': { icon: 'pencil-ruler', color: '#A259FF', bg: '#A259FF15' },
  'adobe': { icon: 'adobe', color: '#FF0000', bg: '#FF000015' },
  'crunchyroll': { icon: 'animation-play', color: '#F47521', bg: '#F4752115' },
  'paramount': { icon: 'movie', color: '#0064FF', bg: '#0064FF15' },
};

function getBrandIcon(description: string): { icon: string; color: string; bg: string } | null {
  const lower = description.toLowerCase().trim();
  if (BRAND_ICONS[lower]) return BRAND_ICONS[lower];
  for (const [brand, data] of Object.entries(BRAND_ICONS)) {
    if (lower.includes(brand)) return data;
  }
  return null;
}

export default function SubscriptionsScreen({ navigation }: any) {
  const { state } = useAppState();
  const [subscriptions, setSubscriptions] = useState<RecurringExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState<RecurringExpense | null>(null);

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    requestNotificationPermissions();
  }, []);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  };

  const handleAmountChange = (text: string) => {
    // Solo permitir dígitos (quitar puntos, comas, letras, etc.)
    const digits = text.replace(/[^0-9]/g, '');
    if (digits === '') {
      setAmount('');
      return;
    }
    // Formatear con puntos de miles estilo colombiano: 50000 -> 50.000
    const num = parseInt(digits, 10);
    setAmount(num.toLocaleString('es-CO'));
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Suscripciones
      const subsRes = await supabase
        .from('recurring_expenses')
        .select('*, categories(name, icon, color_hex)')
        .order('day_of_month', { ascending: true });

      if (subsRes.error) throw subsRes.error;
      setSubscriptions(subsRes.data || []);

      // 2. Fetch Categorías (con fallback)
      let catsQuery = supabase.from('categories').select('*');
      
      if (state.currentUser?.id) {
        catsQuery = catsQuery.or(`user_id.is.null,user_id.eq.${state.currentUser.id}`);
      } else {
        catsQuery = catsQuery.is('user_id', null);
      }

      const catsRes = await catsQuery.order('name');
      
      if (!catsRes.error && catsRes.data && catsRes.data.length > 0) {
        setCategories(catsRes.data);
      } else {
        // Si no hay categorías en la DB, usamos las por defecto (mapeadas)
        const defaults = [
          { id: '1', name: 'Comida', icon: 'food', color_hex: 'FF9800' },
          { id: '2', name: 'Transporte', icon: 'car', color_hex: '2196F3' },
          { id: '3', name: 'Hogar', icon: 'home', color_hex: '4CAF50' },
          { id: '4', name: 'Servicios', icon: 'flash', color_hex: '607D8B' },
          { id: '5', name: 'Suscripción', icon: 'calendar-sync', color_hex: '9C27B0' },
          { id: '6', name: 'Salud', icon: 'heart', color_hex: 'F44336' },
        ];
        setCategories(defaults);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'No se pudieron cargar tus suscripciones.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubscription = async () => {
    if (!description || !amount || !dayOfMonth || !selectedCategory) {
      Alert.alert('Campos incompletos', 'Por favor llena todos los datos.');
      return;
    }

    const dayNum = parseInt(dayOfMonth);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      Alert.alert('Día inválido', 'El día debe estar entre 1 y 31.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Limpiar monto: quitar puntos de miles -> número limpio
      const cleanAmount = parseFloat(amount.replace(/\./g, ''));
      
      if (isNaN(cleanAmount) || cleanAmount <= 0) {
        Alert.alert('Monto inválido', 'Por favor escribe cuánto pagas.');
        setIsSubmitting(false);
        return;
      }

      // Evitar error 22P02: Si la categoría no es un UUID válido (ej. es un fallback '1'), enviamos null
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const finalCategoryId = selectedCategory && uuidRegex.test(selectedCategory) ? selectedCategory : null;

      const { data, error } = await supabase.from('recurring_expenses').insert({
        user_id: state.currentUser?.id,
        description,
        amount: cleanAmount,
        day_of_month: dayNum,
        category_id: finalCategoryId,
        is_income: false,
        is_active: true
      }).select().single();

      if (error) throw error;

      // Programar notificación local mensual para este recibo
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💸 ¡Hoy te cobran un recibo!',
            body: `Recuerda: Hoy es día ${dayNum} y te cobran "${description}" por $${cleanAmount.toLocaleString('es-CO')}. ¡Revisa tu saldo!`,
            sound: 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
            day: dayNum,
            hour: 9,
            minute: 0,
          },
        });
        console.log(`Notificación programada para el día ${dayNum} de cada mes`);
      } catch (notifErr) {
        console.log('Error programando notificación (no crítico):', notifErr);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalVisible(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving subscription:', JSON.stringify(error));
      Alert.alert('Error', error.message || 'No se pudo guardar la suscripción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDayOfMonth('');
    setSelectedCategory(null);
  };

  const deleteSubscription = (id: string) => {
    Alert.alert(
      'Eliminar Suscripción',
      '¿Estás seguro de que quieres eliminar este cobro automático?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
            if (!error) fetchData();
          }
        }
      ]
    );
  };

  const renderSubscription = ({ item }: { item: RecurringExpense }) => {
    const today = new Date().getDate();
    const isPaid = item.day_of_month < today;
    const isSoon = item.day_of_month >= today && item.day_of_month <= today + 3;
    const statusColor = isSoon ? Colors.warning : isPaid ? Colors.lightBlue : Colors.success;
    const statusText = isPaid ? 'Pagado' : isSoon ? 'Pronto' : 'Pendiente';
    const brand = getBrandIcon(item.description);

    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedSub(item)}>
        <JGCard style={styles.subCard}>
          <View style={styles.subRow}>
            <View style={[styles.iconBg, { backgroundColor: brand?.bg || `#${item.categories?.color_hex || '0A2463'}20` }]}>
              <MaterialCommunityIcons
                name={(brand?.icon || item.categories?.icon || 'calendar-sync') as any}
                size={26}
                color={brand?.color || `#${item.categories?.color_hex || Colors.darkBlue}`}
              />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.subTitle}>{item.description}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <MaterialCommunityIcons name="calendar-clock" size={14} color={Colors.light.textSecondary} />
                <Text style={styles.subDate}> Cobro el día {item.day_of_month} de cada mes</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.subAmount}>${Number(item.amount).toLocaleString('es-CO')}</Text>
              <JGBadge text={statusText} color={statusColor} />
            </View>
          </View>
        </JGCard>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={Colors.darkBlue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recibos y Pagos Fijos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
        <Text style={styles.sectionDesc}>
          Añade aquí los recibos que pagas todos los meses (Netflix, arriendo, internet). La app te los cobrará automáticamente en la fecha que le digas para que no se te olvide.
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.mediumBlue} style={{ marginTop: 50 }} />
        ) : subscriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-heart" size={64} color={Colors.mediumBlue + '30'} />
            <Text style={styles.emptyText}>No tienes recibos ni pagos mensuales todavía</Text>
            <JGButton 
              title="Añadir Recibo" 
              onPress={() => setModalVisible(true)} 
              variant="primaryBlue"
              style={{ marginTop: Spacing.lg }}
            />
          </View>
        ) : (
          <>
            {subscriptions.map((sub) => (
              <React.Fragment key={sub.id}>
                {renderSubscription({ item: sub })}
              </React.Fragment>
            ))}
            <TouchableOpacity 
              style={styles.addOutlineBtn} 
              onPress={() => setModalVisible(true)}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={24} color={Colors.mediumBlue} />
              <Text style={styles.addOutlineText}>Añadir nuevo recibo mensual</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Modal Nueva Suscripción */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Recibo</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>¿Qué estás pagando? (Ej: Netflix, Arriendo)</Text>
              <JGTextField 
                placeholder="Escribe el nombre del recibo"
                value={description}
                onChangeText={setDescription}
                icon="tag-outline"
              />

              <Text style={[styles.inputLabel, { marginTop: Spacing.lg }]}>¿Cuánto pagas exactamente cada mes?</Text>
              <JGTextField 
                placeholder="Ej: 50.000"
                value={amount}
                onChangeText={handleAmountChange}
                icon="cash"
                keyboardType="numeric"
              />

              <Text style={[styles.inputLabel, { marginTop: Spacing.lg }]}>¿Qué día del mes te cobran esto? (Ej: 5)</Text>
              <JGTextField 
                placeholder="Escribe el día del mes"
                value={dayOfMonth}
                onChangeText={setDayOfMonth}
                icon="calendar-clock"
                keyboardType="numeric"
              />

              <Text style={[styles.inputLabel, { marginTop: Spacing.lg }]}>¿En qué categoría entra esto?</Text>
              <View style={styles.categoryGrid}>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryItem,
                        selectedCategory === cat.id && { backgroundColor: `#${cat.color_hex}20`, borderColor: `#${cat.color_hex}` }
                      ]}
                      onPress={() => {
                        setSelectedCategory(cat.id);
                        Haptics.selectionAsync();
                      }}
                    >
                      <MaterialCommunityIcons 
                        name={cat.icon as any} 
                        size={20} 
                        color={selectedCategory === cat.id ? `#${cat.color_hex}` : Colors.light.textSecondary} 
                      />
                      <Text style={[
                        styles.categoryText,
                        selectedCategory === cat.id && { color: `#${cat.color_hex}`, fontWeight: '700' }
                      ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={{ padding: Spacing.md, width: '100%', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={Colors.mediumBlue} />
                    <Text style={{ fontSize: 12, color: Colors.light.textSecondary, marginTop: 4 }}>
                      Cargando categorías...
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ marginTop: Spacing.xl, marginBottom: Spacing.xl }}>
                <JGButton 
                  title="Guardar Recibo Automático" 
                  onPress={handleAddSubscription}
                  isLoading={isSubmitting}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal Detalle de Recibo */}
      <Modal visible={!!selectedSub} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            {selectedSub && (() => {
              const brand = getBrandIcon(selectedSub.description);
              const today = new Date().getDate();
              const isPaid = selectedSub.day_of_month < today;
              const createdDate = new Date(selectedSub.created_at);
              const nextPayDate = new Date();
              if (selectedSub.day_of_month <= today) {
                nextPayDate.setMonth(nextPayDate.getMonth() + 1);
              }
              nextPayDate.setDate(selectedSub.day_of_month);

              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Header con icono */}
                  <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
                    <View style={[styles.detailIconBg, { backgroundColor: brand?.bg || '#0A246320' }]}>
                      <MaterialCommunityIcons
                        name={(brand?.icon || selectedSub.categories?.icon || 'calendar-sync') as any}
                        size={40}
                        color={brand?.color || `#${selectedSub.categories?.color_hex || Colors.darkBlue}`}
                      />
                    </View>
                    <Text style={styles.detailName}>{selectedSub.description}</Text>
                    <Text style={styles.detailAmount}>${Number(selectedSub.amount).toLocaleString('es-CO')}</Text>
                    <Text style={{ fontSize: 13, color: Colors.light.textSecondary }}>por mes</Text>
                  </View>

                  {/* Info rows */}
                  <View style={styles.detailSection}>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="calendar-month" size={20} color={Colors.mediumBlue} />
                      <Text style={styles.detailLabel}>Día de cobro</Text>
                      <Text style={styles.detailValue}>Cada día {selectedSub.day_of_month} del mes</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="calendar-arrow-right" size={20} color={Colors.mediumBlue} />
                      <Text style={styles.detailLabel}>Próximo cobro</Text>
                      <Text style={styles.detailValue}>{nextPayDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name={isPaid ? "check-circle" : "clock-outline"} size={20} color={isPaid ? Colors.success : Colors.warning} />
                      <Text style={styles.detailLabel}>Estado este mes</Text>
                      <Text style={[styles.detailValue, { color: isPaid ? Colors.success : Colors.warning, fontWeight: '700' }]}>
                        {isPaid ? 'Ya se cobró' : 'Aún no se cobra'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="tag" size={20} color={Colors.mediumBlue} />
                      <Text style={styles.detailLabel}>Categoría</Text>
                      <Text style={styles.detailValue}>{selectedSub.categories?.name || 'Sin categoría'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="calendar-plus" size={20} color={Colors.mediumBlue} />
                      <Text style={styles.detailLabel}>Creado el</Text>
                      <Text style={styles.detailValue}>{createdDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.mediumBlue} />
                      <Text style={styles.detailLabel}>Hora de registro</Text>
                      <Text style={styles.detailValue}>{createdDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="calculator" size={20} color={Colors.mediumBlue} />
                      <Text style={styles.detailLabel}>Costo al año</Text>
                      <Text style={[styles.detailValue, { fontWeight: '700' }]}>${(Number(selectedSub.amount) * 12).toLocaleString('es-CO')}</Text>
                    </View>
                  </View>

                  {/* Botones */}
                  <View style={{ marginTop: Spacing.xl, gap: Spacing.md }}>
                    <JGButton title="Cerrar" onPress={() => setSelectedSub(null)} variant="secondary" />
                    <TouchableOpacity
                      style={styles.detailDeleteBtn}
                      onPress={() => { deleteSubscription(selectedSub.id); setSelectedSub(null); }}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.red} />
                      <Text style={styles.deleteText}>Eliminar este recibo</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: '#FFF',
    ...Shadows.subtle as any,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.darkBlue,
  },
  sectionDesc: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    lineHeight: 20,
  },
  subCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    position: 'relative',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  subDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  subAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkBlue,
    marginBottom: 4,
  },
  deleteText: {
    fontSize: 13,
    color: Colors.red,
    fontWeight: '600',
  },
  detailIconBg: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  detailName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.darkBlue,
    marginBottom: 4,
  },
  detailAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.darkBlue,
  },
  detailSection: {
    backgroundColor: Colors.light.background,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: Colors.light.textPrimary,
    fontWeight: '500',
    textAlign: 'right',
  },
  detailDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
  },
  addOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.mediumBlue + '30',
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
    gap: 8,
  },
  addOutlineText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.mediumBlue,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.darkBlue,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    marginBottom: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.card,
    backgroundColor: Colors.light.card,
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
});
