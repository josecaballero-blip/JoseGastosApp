import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  TextInput,
  ViewStyle,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  interpolateColor
} from 'react-native-reanimated';
import { Colors, Spacing, Radius, Shadows, CategoryIcons } from '../theme/tokens';

// ═══════════════════════════════════════════════
// 🎛️ JGButton (Premium Animated)
// ═══════════════════════════════════════════════
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'primaryBlue';

interface JGButtonProps {
  title: string;
  variant?: ButtonVariant;
  icon?: string;
  isLoading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function JGButton({ title, variant = 'primary', icon, isLoading, disabled, onPress, style }: JGButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => { scale.value = withSpring(0.96); };
  const onPressOut = () => { scale.value = withSpring(1); };

  const isGhost = variant === 'ghost';
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';

  let colors = Colors.gradients.primary;
  if (isSecondary) colors = ['#FFF', '#F8FAFC'];
  if (variant === 'primaryBlue') colors = ['#3E92CC', '#2E6FA7'];
  if (isDanger) colors = Colors.gradients.danger;

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || isLoading}
        style={{ borderRadius: Radius.lg, overflow: 'hidden' }}
      >
        <LinearGradient
          colors={isGhost ? ['transparent', 'transparent'] : (colors as any)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            isGhost && { borderWidth: 1, borderColor: Colors.light.border },
            isSecondary && { borderWidth: 1, borderColor: Colors.light.border },
            disabled && { opacity: 0.6 }
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color={isSecondary || isGhost ? Colors.darkBlue : '#FFF'} />
          ) : (
            <View style={styles.buttonContent}>
              {icon && <MaterialCommunityIcons name={icon as any} size={20} color={isSecondary || isGhost ? Colors.darkBlue : '#FFF'} />}
              <Text style={[styles.buttonText, { color: isSecondary || isGhost ? Colors.darkBlue : '#FFF' }]}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════
// 💳 JGCard (Glassmorphism & Shadows)
// ═══════════════════════════════════════════════
interface JGCardProps {
  children: React.ReactNode;
  variant?: 'flat' | 'elevated' | 'glass' | 'gradient';
  style?: ViewStyle;
}

export function JGCard({ children, variant = 'elevated', style }: JGCardProps) {
  const shadow = variant === 'elevated' ? Shadows.medium : {};
  
  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={Colors.gradients.primary as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, shadow as ViewStyle, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[
      styles.card, 
      variant === 'glass' && styles.cardGlass,
      shadow as ViewStyle, 
      style
    ]}>
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════
// 📝 JGTextField (Modern minimalist)
// ═══════════════════════════════════════════════
interface JGTextFieldProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: string;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  style?: ViewStyle;
  inputStyle?: any;
}

export function JGTextField({ placeholder, value, onChangeText, icon, secureTextEntry, error, keyboardType, style, inputStyle }: JGTextFieldProps) {
  const focused = useSharedValue(0);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focused.value, [0, 1], [Colors.light.border, Colors.mediumBlue]),
    backgroundColor: interpolateColor(focused.value, [0, 1], [Colors.light.input, '#FFF']),
  }));

  return (
    <View style={style}>
      <Animated.View style={[styles.textFieldContainer, animatedContainerStyle, error ? { borderColor: Colors.red, borderWidth: 1.5 } : {}]}>
        {icon && <MaterialCommunityIcons name={icon as any} size={20} color={focused.value ? Colors.mediumBlue : Colors.light.textSecondary} style={{ marginRight: 12 }} />}
        <TextInput
          style={[styles.textFieldInput, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.textSecondary + '70'}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={() => { focused.value = 1; }}
          onBlur={() => { focused.value = 0; }}
        />
      </Animated.View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ═══════════════════════════════════════════════
// 🏷️ JGBadge
// ═══════════════════════════════════════════════
export function JGBadge({ text, color = Colors.mediumBlue, icon }: { text: string; color?: string; icon?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '15' }]}>
      {icon && <MaterialCommunityIcons name={icon as any} size={12} color={color} />}
      <Text style={[styles.badgeText, { color }]}>{text.toUpperCase()}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════
// 📊 JGProgressBar
// ═══════════════════════════════════════════════
export function JGProgressBar({ progress, height = 8 }: { progress: number; height?: number }) {
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withSpring(Math.min(Math.max(progress, 0), 1), { damping: 20 });
  }, [progress]);

  const animatedFill = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  const color = progress < 0.2 ? Colors.red : progress < 0.5 ? Colors.warning : Colors.success;

  return (
    <View style={[styles.progressTrack, { height }]}>
      <Animated.View style={[styles.progressFill, { backgroundColor: color, height }, animatedFill]} />
    </View>
  );
}

// ═══════════════════════════════════════════════
// 👤 JGAvatar
// ═══════════════════════════════════════════════
export function JGAvatar({ initials, size = 48 }: { initials: string; size?: number }) {
  return (
    <LinearGradient
      colors={['#E2E8F0', '#CBD5E1']}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{initials}</Text>
    </LinearGradient>
  );
}

// ═══════════════════════════════════════════════
const styles = StyleSheet.create({
  button: {
    height: 56,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: '#FFF',
  },
  cardGlass: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  textFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 56,
    borderWidth: 1,
  },
  textFieldInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.textPrimary,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.red,
    fontSize: 12,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressTrack: {
    backgroundColor: Colors.light.separator,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: Radius.full,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarText: {
    fontWeight: '800',
    color: Colors.darkBlue,
  },
});
