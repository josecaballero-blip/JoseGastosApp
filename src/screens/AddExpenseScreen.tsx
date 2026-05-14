import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  Image, 
  TextInput 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolateColor } from 'react-native-reanimated';
import { Colors, Spacing, Radius, Shadows, DefaultCategories, CategoryIcons } from '../theme/tokens';
import { JGButton, JGTextField, JGCard } from '../components/UI';
import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';

export default function AddExpenseScreen({ navigation, route }: any) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isIncome, setIsIncome] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);

  const headerProgress = useSharedValue(isIncome ? 1 : 0);
  const isInvoiceInitialTriggered = React.useRef(false);

  useEffect(() => {
    headerProgress.value = withTiming(isIncome ? 1 : 0, { duration: 300 });
  }, [isIncome]);

  const animatedHeader = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(headerProgress.value, [0, 1], [Colors.red, Colors.success]),
  }));

  const handlePickImage = async (source?: 'camera' | 'gallery') => {
    if (!source) {
      Alert.alert('Evidencia del Gasto', 'Sube una foto del recibo para mayor control.', [
        { text: 'Cámara', onPress: () => handlePickImage('camera') },
        { text: 'Galería', onPress: () => handlePickImage('gallery') },
        { text: 'Cancelar', style: 'cancel' }
      ]);
      return;
    }

    try {
      const { status } = source === 'camera' 
        ? await ImagePicker.requestCameraPermissionsAsync() 
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', `Necesitamos acceso a tu ${source === 'camera' ? 'cámara' : 'galería'} para continuar.`);
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.4, base64: true })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.4, base64: true });

      if (!result.canceled) {
        setReceiptImage(result.assets[0].uri);
        setReceiptBase64(result.assets[0].base64 || null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo cargar la imagen.');
    }
  };

  const handleSave = async () => {
    const cleanAmount = amount.replace(/[^0-9]/g, '');
    if (!cleanAmount || parseInt(cleanAmount) === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return Alert.alert('Error', 'Ingresa un monto válido');
    }

    if (route.params?.isInvoice && !receiptImage) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return Alert.alert('Error', 'Debes subir una foto de la factura.');
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Mapear categoría a ID de la base de datos
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', user.id);
      
      let finalCategoryId = null;
      if (catData && catData.length > 0) {
        const catName = CategoryIcons[selectedCategory || 'other']?.label;
        const dbCat = catData.find(c => c.name === catName);
        if (dbCat) finalCategoryId = dbCat.id;
      }

      let receiptUrl = null;
      if (receiptBase64) {
        const filePath = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, decode(receiptBase64), { contentType: 'image/jpeg' });
        
        if (uploadError) {
          console.error('Error subiendo imagen:', uploadError);
          throw new Error('No se pudo subir la imagen de la factura.');
        }

        const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
        receiptUrl = data.publicUrl;
      }

      const { error } = await supabase.from('expenses').insert({
        user_id: user.id,
        amount: parseInt(cleanAmount),
        amount_base: parseInt(cleanAmount),
        description: description || (route.params?.isInvoice ? 'Nueva Factura' : ''),
        is_income: route.params?.isInvoice ? false : isIncome,
        category_id: finalCategoryId,
        receipt_url: receiptUrl,
        currency: 'COP',
        expense_date: new Date().toISOString()
      });

      if (error) throw error;
      
      console.log('✅ Gasto/Factura guardada correctamente');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsSuccess(true);
      setTimeout(() => navigation.goBack(), 1200);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.successBox}>
          <View style={styles.successBadge}>
            <MaterialCommunityIcons name="check-circle" size={70} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Movimiento guardado</Text>
          <Text style={styles.successSub}>Tu registro se ha guardado correctamente.</Text>
        </Animated.View>
      </View>
    );
  }

  if (route.params?.isInvoice && !receiptImage) {
    return (
      <View style={styles.invoiceSelectContainer}>
        <View style={styles.invoiceHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.invoiceBackBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color={Colors.darkBlue} />
          </TouchableOpacity>
          <Text style={styles.invoiceHeaderTitle}>Nueva Factura</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.invoiceSelectContent}>
          <Animated.View entering={FadeInDown.delay(200)}>
            <MaterialCommunityIcons name="camera-enhance-outline" size={80} color={Colors.mediumBlue} style={{ alignSelf: 'center', marginBottom: 20 }} />
            <Text style={styles.invoiceSelectTitle}>Captura tu Factura</Text>
            <Text style={styles.invoiceSelectSub}>Elige cómo deseas subir el soporte de tu gasto.</Text>
          </Animated.View>

          <View style={styles.invoiceSelectActions}>
            <TouchableOpacity style={styles.selectOptionBtn} onPress={() => handlePickImage('camera')}>
              <LinearGradient colors={['#3A7BD5', '#00D2FF']} style={styles.selectOptionGradient}>
                <MaterialCommunityIcons name="camera" size={32} color="#FFF" />
                <Text style={styles.selectOptionText}>Usar Cámara</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.selectOptionBtn} onPress={() => handlePickImage('gallery')}>
              <View style={[styles.selectOptionGradient, { backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.mediumBlue }]}>
                <MaterialCommunityIcons name="image-multiple" size={32} color={Colors.mediumBlue} />
                <Text style={[styles.selectOptionText, { color: Colors.mediumBlue }]}>Subir de Galería</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {route.params?.isInvoice ? (
          <View style={styles.invoiceHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.invoiceBackBtn}>
              <MaterialCommunityIcons name="chevron-left" size={32} color={Colors.darkBlue} />
            </TouchableOpacity>
            <Text style={styles.invoiceHeaderTitle}>Detalles de Factura</Text>
            <View style={{ width: 32 }} />
          </View>
        ) : (
          <Animated.View style={[styles.header, animatedHeader]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <MaterialCommunityIcons name="chevron-down" size={28} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.screenTitle}>Nuevo movimiento</Text>
            <Text style={styles.amountLabel}>¿Cuánto fue?</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput 
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={amount}
                onChangeText={(val) => setAmount(val.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, "."))}
                keyboardType="numeric"
              />
            </View>
          </Animated.View>
        )}

        <View style={styles.form}>
           {route.params?.isInvoice && (
             <>
               {receiptImage && (
                 <Animated.View entering={FadeIn} style={styles.formReceiptPreview}>
                    <Image source={{ uri: receiptImage }} style={styles.formPreviewImg} />
                    <TouchableOpacity style={styles.changeImgBtn} onPress={() => setReceiptImage(null)}>
                      <Text style={styles.changeImgText}>Cambiar Foto</Text>
                    </TouchableOpacity>
                 </Animated.View>
               )}
               <Text style={styles.sectionTitle}>Monto Total</Text>
               <JGTextField 
                 placeholder="0" 
                 value={amount} 
                 onChangeText={(val) => setAmount(val.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, "."))} 
                 icon="cash-multiple" 
                 keyboardType="numeric"
               />
             </>
           )}

           <Text style={styles.sectionTitle}>{route.params?.isInvoice ? 'Nombre del Establecimiento' : 'Detalles del movimiento'}</Text>
           <JGTextField 
             placeholder={route.params?.isInvoice ? "Ej: Éxito, Carulla, etc." : "¿De qué fue?"} 
             value={description} 
             onChangeText={setDescription} 
             icon={route.params?.isInvoice ? "store-outline" : "pencil-outline"} 
           />

           <Text style={styles.sectionTitle}>Elige la categoría</Text>
           <View style={styles.categoryGrid}>
              {DefaultCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory === cat.id && { borderColor: isIncome ? Colors.success : Colors.red, backgroundColor: (isIncome ? Colors.success : Colors.red) + '10' }
                  ]}
                  onPress={() => { setSelectedCategory(cat.id); Haptics.selectionAsync(); }}
                >
                  <MaterialCommunityIcons 
                    name={(cat.id === 'other' && route.params?.isInvoice ? 'plus-circle-outline' : (CategoryIcons[cat.id]?.icon || 'cash')) as any} 
                    size={26} 
                    color={selectedCategory === cat.id ? (isIncome ? Colors.success : Colors.red) : Colors.light.textSecondary} 
                  />
                  <Text style={[styles.categoryLabel, selectedCategory === cat.id && { color: isIncome ? Colors.success : Colors.red, fontWeight: '700' }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
           </View>

           {!route.params?.isInvoice && (
             <>
               <Text style={styles.sectionTitle}>Soporte (Opcional)</Text>
               {receiptImage ? (
                 <View style={styles.receiptPreview}>
                   <Image source={{ uri: receiptImage }} style={styles.previewImg} />
                   <TouchableOpacity style={styles.removeImg} onPress={() => setReceiptImage(null)}>
                     <MaterialCommunityIcons name="close" size={16} color="#FFF" />
                   </TouchableOpacity>
                 </View>
               ) : (
                 <TouchableOpacity style={styles.addPhoto} onPress={() => handlePickImage()}>
                   <MaterialCommunityIcons name="camera-plus-outline" size={32} color={Colors.mediumBlue} />
                   <Text style={styles.addPhotoText}>Anexar Recibo</Text>
                 </TouchableOpacity>
               )}
             </>
           )}

           <JGButton 
             title={route.params?.isInvoice ? 'Guardar Factura' : (isIncome ? 'Registrar Ingreso' : 'Registrar movimiento')} 
             variant={isIncome ? 'primary' : (route.params?.isInvoice ? 'primaryBlue' : 'danger')}
             onPress={handleSave} 
             isLoading={isLoading}
             style={{ marginTop: 20 }}
           />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { paddingHorizontal: Spacing.xl, paddingTop: 52, paddingBottom: 28, borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl, ...Shadows.medium as any },
  closeBtn: { alignSelf: 'flex-end', marginBottom: 14 },
  screenTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  amountLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  amountInputRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginTop: 0 },
  currencySymbol: { fontSize: 30, fontWeight: '800', color: '#FFF', marginRight: 6, marginBottom: 6 },
  amountInput: { fontSize: 48, fontWeight: '900', color: '#FFF', textAlign: 'center', minWidth: 120, lineHeight: 56 },
  form: { padding: Spacing.xl },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.darkBlue, marginTop: 18, marginBottom: 10 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryItem: { width: '23%', aspectRatio: 1, backgroundColor: '#FFF', borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.light.border, alignItems: 'center', justifyContent: 'center', padding: 6, marginBottom: 10, ...Shadows.subtle as any },
  categoryLabel: { fontSize: 9, color: Colors.light.textSecondary, marginTop: 6, textAlign: 'center' },
  addPhoto: { height: 100, borderStyle: 'dashed', borderWidth: 2, borderColor: Colors.light.border, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.input },
  addPhotoText: { color: Colors.mediumBlue, fontWeight: '700', marginTop: 8 },
  receiptPreview: { width: '100%', height: 200, borderRadius: Radius.lg, overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%' },
  removeImg: { position: 'absolute', top: 10, right: 10, backgroundColor: Colors.red, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  successContainer: { flex: 1, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  successBox: { alignItems: 'center', padding: 40, backgroundColor: '#F6FBFF', borderRadius: Radius.xl, shadowColor: Colors.darkBlue, shadowOpacity: 0.12, shadowOffset: { width: 0, height: 12 }, shadowRadius: 30, elevation: 10 },
  successBadge: { width: 104, height: 104, borderRadius: 52, backgroundColor: 'rgba(46,204,113,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  successTitle: { fontSize: 26, fontWeight: '900', color: Colors.darkBlue, marginTop: 10 },
  successSub: { fontSize: 16, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  invoiceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: 20 },
  invoiceHeaderTitle: { fontSize: 20, fontWeight: '800', color: Colors.darkBlue },
  invoiceBackBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  invoiceSelectContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  invoiceSelectContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  invoiceSelectTitle: { fontSize: 28, fontWeight: '900', color: Colors.darkBlue, textAlign: 'center' },
  invoiceSelectSub: { fontSize: 16, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 10, marginBottom: 40 },
  invoiceSelectActions: { gap: 20 },
  selectOptionBtn: { height: 70, borderRadius: Radius.xl, overflow: 'hidden', ...Shadows.medium as any },
  selectOptionGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
  selectOptionText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  formReceiptPreview: { width: '100%', height: 180, borderRadius: Radius.xl, overflow: 'hidden', marginBottom: 20, backgroundColor: Colors.light.input },
  formPreviewImg: { width: '100%', height: '100%' },
  changeImgBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm },
  changeImgText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
});
