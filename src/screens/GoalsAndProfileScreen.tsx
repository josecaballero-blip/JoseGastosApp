import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Shadows, Radius } from '../theme/tokens';
import { JGCard, JGProgressBar, JGButton, JGAvatar } from '../components/UI';
import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════
// 🎯 GOALS SCREEN
// ═══════════════════════════════════════════════
export function GoalsScreen() {
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('goals').select('*').eq('user_id', user.id);
    if (data) setGoals(data);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.screenTitle}>Mis Metas (Ahorros)</Text>
      {goals.length === 0 ? (
        <JGCard>
          <View style={{ alignItems: 'center', padding: Spacing.xl }}>
            <MaterialCommunityIcons name="target" size={48} color={Colors.light.textSecondary} />
            <Text style={styles.emptyTitle}>No tienes ninguna meta guardada</Text>
            <Text style={styles.emptySubtext}>Empieza a ahorrar para comprarte algo o para un viaje.</Text>
          </View>
        </JGCard>
      ) : (
        goals.map((goal) => {
          const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
          return (
            <JGCard key={goal.id} style={{ marginBottom: Spacing.md }}>
              <View style={{ gap: Spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={styles.goalIcon}>
                    <MaterialCommunityIcons name="flag-checkered" size={24} color={Colors.mediumBlue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalAmount}>
                      ${Number(goal.current_amount).toLocaleString()} / ${Number(goal.target_amount).toLocaleString()}
                    </Text>
                  </View>
                  {goal.is_completed && (
                    <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />
                  )}
                </View>
                <JGProgressBar progress={progress} />
              </View>
            </JGCard>
          );
        })
      )}
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════
// 👤 PROFILE SCREEN
// ═══════════════════════════════════════════════
export function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
        onLogout();
      }},
    ]);
  };

  const menuItems = [
    { icon: 'account-circle', label: 'Editar Perfil', color: Colors.mediumBlue },
    { icon: 'bell', label: 'Notificaciones', color: Colors.warning },
    { icon: 'currency-usd', label: 'Moneda Principal', color: Colors.success },
    { icon: 'account-group', label: 'Modo Familiar', color: Colors.lightBlue },
    { icon: 'file-pdf-box', label: 'Exportar PDF', color: Colors.red },
    { icon: 'microsoft-excel', label: 'Exportar Excel', color: '#217346' },
    { icon: 'shield-lock', label: 'Seguridad', color: Colors.darkBlue },
    { icon: 'information', label: 'Acerca de', color: Colors.light.textSecondary },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <JGAvatar initials={user?.user_metadata?.name?.[0] || 'J'} size={80} />
        <Text style={styles.profileName}>{user?.user_metadata?.name || 'Jose'}</Text>
        <Text style={styles.profileEmail}>{user?.email || 'correo@email.com'}</Text>
      </View>

      {/* Menu */}
      {menuItems.map((item, i) => (
        <TouchableOpacity key={i} style={styles.menuItem} onPress={() => Haptics.selectionAsync()} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
            <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
          </View>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.light.textSecondary} />
        </TouchableOpacity>
      ))}

      <View style={{ marginTop: Spacing.xl }}>
        <JGButton title="Cerrar Sesión" variant="ghost" icon="logout" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background, paddingHorizontal: Spacing.xl, paddingTop: 60 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: Colors.light.textPrimary, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.light.textPrimary, marginTop: Spacing.md },
  emptySubtext: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 4 },
  goalIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.mediumBlue + '15', alignItems: 'center', justifyContent: 'center' },
  goalName: { fontSize: 16, fontWeight: '700', color: Colors.light.textPrimary },
  goalAmount: { fontSize: 13, color: Colors.light.textSecondary },
  profileHeader: { alignItems: 'center', paddingVertical: Spacing.xl },
  profileName: { fontSize: 24, fontWeight: '800', color: Colors.light.textPrimary, marginTop: Spacing.md },
  profileEmail: { fontSize: 14, color: Colors.light.textSecondary },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.light.separator + '40' },
  menuIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: Colors.light.textPrimary },
});
