// ═══════════════════════════════════════════════
// JOSE GASTOS — DESIGN SYSTEM (React Native)
// ═══════════════════════════════════════════════

export const Colors = {
  // Brand
  darkBlue: '#0A2463', // Deep Navy
  mediumBlue: '#3E92CC', // Electric Blue
  lightBlue: '#D1E8E2',
  accent: '#FFD700', // Gold
  
  // States
  success: '#2ECC71',
  warning: '#F1C40F',
  red: '#E74C3C',
  
  // Neutral
  light: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    separator: '#F1F5F9',
    input: '#F1F5F9',
  },
  
  // Gradients
  gradients: {
    primary: ['#0A2463', '#1E40AF'],
    success: ['#059669', '#10B981'],
    danger: ['#DC2626', '#EF4444'],
    gold: ['#B45309', '#F59E0B'],
    glass: ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)'],
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  xxl: 36,
  circle: 999,
  full: 999,
};

export const Shadows = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0A2463',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  coloredBlue: {
    shadowColor: '#3E92CC',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  coloredRed: {
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  }
};

export const CategoryIcons: Record<string, { icon: string; label: string; color: string }> = {
  food: { icon: 'food-fork-drink', label: 'Comida', color: '#FF9F43' },
  transport: { icon: 'car', label: 'Transporte', color: '#54A0FF' },
  health: { icon: 'heart-pulse', label: 'Salud', color: '#FF6B6B' },
  entertainment: { icon: 'movie-open', label: 'Ocio', color: '#48DBFB' },
  clothing: { icon: 'tshirt-crew', label: 'Ropa', color: '#FECA57' },
  home: { icon: 'home', label: 'Hogar', color: '#1DD1A1' },
  education: { icon: 'book-open-variant', label: 'Estudio', color: '#5F27CD' },
  travel: { icon: 'airplane', label: 'Viajes', color: '#00D2D3' },
  pets: { icon: 'paw', label: 'Mascotas', color: '#222F3E' },
  beauty: { icon: 'shimmer', label: 'Belleza', color: '#FF9FF3' },
  sport: { icon: 'dumbbell', label: 'Deporte', color: '#EE5253' },
  tech: { icon: 'laptop', label: 'Tecno', color: '#341F97' },
  other: { icon: 'dots-horizontal', label: 'Otro', color: '#8395A7' },
};

export const DefaultCategories = Object.entries(CategoryIcons).map(([id, info]) => ({
  id,
  name: info.label,
  icon: info.icon,
  colorHex: info.color.replace('#', ''),
}));
