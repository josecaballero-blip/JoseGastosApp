// ═══════════════════════════════════════════════
// LOCAL DATABASE (Equivalente a CoreDataStack / CoreDataManager)
// Maneja el almacenamiento offline-first usando AsyncStorage
// ═══════════════════════════════════════════════

import AsyncStorage from '@react-native-async-storage/async-storage';

export class LocalDatabase {
  private static instance: LocalDatabase;

  static shared(): LocalDatabase {
    if (!LocalDatabase.instance) LocalDatabase.instance = new LocalDatabase();
    return LocalDatabase.instance;
  }

  // ── CRUD GENÉRICO ──

  async save<T extends { id: string }>(table: string, item: T): Promise<void> {
    try {
      const existing = await this.getAll<T>(table);
      const index = existing.findIndex(e => e.id === item.id);
      
      if (index >= 0) {
        existing[index] = item;
      } else {
        existing.push(item);
      }
      
      await AsyncStorage.setItem(`@db_${table}`, JSON.stringify(existing));
    } catch (error) {
      console.error(`Error guardando en local (${table}):`, error);
      throw error;
    }
  }

  async saveAll<T extends { id: string }>(table: string, items: T[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`@db_${table}`, JSON.stringify(items));
    } catch (error) {
      console.error(`Error guardando array en local (${table}):`, error);
      throw error;
    }
  }

  async getAll<T>(table: string): Promise<T[]> {
    try {
      const data = await AsyncStorage.getItem(`@db_${table}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error leyendo local (${table}):`, error);
      return [];
    }
  }

  async getById<T extends { id: string }>(table: string, id: string): Promise<T | null> {
    try {
      const all = await this.getAll<T>(table);
      return all.find(item => item.id === id) || null;
    } catch (error) {
      console.error(`Error leyendo item local (${table}):`, error);
      return null;
    }
  }

  async delete(table: string, id: string): Promise<void> {
    try {
      const existing = await this.getAll<{ id: string }>(table);
      const filtered = existing.filter(e => e.id !== id);
      await AsyncStorage.setItem(`@db_${table}`, JSON.stringify(filtered));
    } catch (error) {
      console.error(`Error borrando local (${table}):`, error);
      throw error;
    }
  }

  async clearTable(table: string): Promise<void> {
    await AsyncStorage.removeItem(`@db_${table}`);
  }

  async clearAll(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const dbKeys = keys.filter(k => k.startsWith('@db_'));
    await AsyncStorage.multiRemove(dbKeys);
  }
}
