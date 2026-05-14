// ═══════════════════════════════════════════════
// SYNC SERVICE (Equivalente a SyncService.swift + RealtimeService.swift)
// Bidireccional: AsyncStorage ↔ Supabase + WebSocket Realtime
// ═══════════════════════════════════════════════

import { supabase } from '../../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type SyncEvent = {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  record: any;
  oldRecord?: any;
};

type SyncListener = (event: SyncEvent) => void;

export class SyncService {
  private static instance: SyncService;
  private channel: RealtimeChannel | null = null;
  private listeners: SyncListener[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private currentUserId: string | null = null;

  static shared(): SyncService {
    if (!SyncService.instance) SyncService.instance = new SyncService();
    return SyncService.instance;
  }

  // ── LISTENERS (Observer pattern) ──
  addListener(listener: SyncListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(event: SyncEvent) {
    this.listeners.forEach(l => l(event));
  }

  // ── SUSCRIPCIÓN REALTIME ──
  async subscribe(userId: string) {
    if (this.currentUserId === userId && this.channel) return;
    
    // Desuscribir canal anterior si existe
    await this.unsubscribe();
    this.currentUserId = userId;

    this.channel = supabase.channel(`user-${userId}`);

    // Escuchar cambios en expenses
    this.channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${userId}` },
      (payload) => {
        console.log(`🔔 Realtime [expenses]: ${payload.eventType}`);
        this.notifyListeners({
          table: 'expenses',
          eventType: payload.eventType as any,
          record: payload.new,
          oldRecord: payload.old,
        });
        this.reconnectAttempts = 0;
      }
    );

    // Escuchar cambios en categories
    this.channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` },
      (payload) => {
        console.log(`🔔 Realtime [categories]: ${payload.eventType}`);
        this.notifyListeners({
          table: 'categories',
          eventType: payload.eventType as any,
          record: payload.new,
          oldRecord: payload.old,
        });
      }
    );

    // Escuchar cambios en goals
    this.channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${userId}` },
      (payload) => {
        console.log(`🔔 Realtime [goals]: ${payload.eventType}`);
        this.notifyListeners({
          table: 'goals',
          eventType: payload.eventType as any,
          record: payload.new,
          oldRecord: payload.old,
        });
      }
    );

    // Escuchar cambios en budgets
    this.channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${userId}` },
      (payload) => {
        console.log(`🔔 Realtime [budgets]: ${payload.eventType}`);
        this.notifyListeners({
          table: 'budgets',
          eventType: payload.eventType as any,
          record: payload.new,
          oldRecord: payload.old,
        });
      }
    );

    await this.channel.subscribe((status) => {
      console.log(`📡 SyncService: Estado de suscripción: ${status}`);
      if (status === 'CHANNEL_ERROR') {
        this.handleReconnect(userId);
      }
    });
  }

  // ── RECONEXIÓN AUTOMÁTICA CON BACKOFF ──
  private handleReconnect(userId: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ SyncService: Máximo de intentos de reconexión alcanzado');
      return;
    }

    const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 30000);
    this.reconnectAttempts++;
    console.log(`🔄 SyncService: Reconectando en ${delay}ms (intento ${this.reconnectAttempts})`);

    setTimeout(() => this.subscribe(userId), delay);
  }

  // ── DESUSCRIPCIÓN ──
  async unsubscribe() {
    if (this.channel) {
      await supabase.removeChannel(this.channel);
      this.channel = null;
      console.log('📡 SyncService: Desuscrito de Realtime');
    }
  }
}

// ═══════════════════════════════════════════════
// CONFLICT RESOLVER (Equivalente a ConflictResolver.swift)
// Estrategia: Last-Write-Wins
// ═══════════════════════════════════════════════

export function resolveConflict<T extends { updated_at?: string }>(local: T, remote: T): T {
  const localDate = new Date(local.updated_at || 0).getTime();
  const remoteDate = new Date(remote.updated_at || 0).getTime();
  return remoteDate >= localDate ? remote : local;
}
