import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, DevSettings, LogBox } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows } from '../theme/tokens';
import { JGButton } from './UI';

// ═══════════════════════════════════════════════
// INICIALIZAR LOGBOX ANTES DE TODO
// Esto asegura que los errores de iOS 18+ se ignoren desde el inicio
// ═══════════════════════════════════════════════
LogBox.ignoreLogs([
  'Cannot read',
  'clipboard',
  'image input',
  'this model does not support',
]);

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorMsg = String(error?.message || error || '');
    
    // Ignorar errores de clipboard de iOS 18+
    if (errorMsg.match(/Cannot read.*clipboard/i) || errorMsg.match(/clipboard.*image/i)) {
      return { hasError: false, error: null, errorInfo: null };
    }
    
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorMsg = String(error?.message || error || '');
    
    // Ignorar errores específicos de iOS 18+ clipboard
    if (errorMsg.match(/Cannot read.*clipboard/i) || errorMsg.match(/clipboard.*image/i) || errorMsg.match(/this model does not support/i)) {
      console.log('🛡️[iOS18] Error de clipboard capturado y silenciado');
      return;
    }
    
    console.error('🔴 Error Detectado por ErrorBoundary:', error);
    console.error('ℹ️ Información adicional:', errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    if (DevSettings) {
      DevSettings.reload();
    } else {
      this.handleReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="alert-octagon" size={80} color={Colors.red} />
            </View>
            
            <Text style={styles.title}>¡Ups! Algo no salió bien</Text>
            <Text style={styles.message}>
              Hemos detectado un error inesperado en esta sección. No te preocupes, el resto de tu app sigue a salvo.
            </Text>

            <View style={styles.errorCard}>
              <ScrollView style={styles.errorScroll}>
                <Text style={styles.errorText}>
                  {this.state.error?.toString()}
                </Text>
                {__DEV__ && (
                  <Text style={styles.stackText}>
                    {this.state.errorInfo?.componentStack}
                  </Text>
                )}
              </ScrollView>
            </View>

            <View style={styles.actions}>
              <JGButton 
                title="Intentar de nuevo" 
                onPress={this.handleReset}
                style={styles.button}
              />
              <TouchableOpacity 
                onPress={this.handleReload} 
                style={styles.reloadLink}
              >
                <Text style={styles.reloadText}>Reiniciar aplicación completa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.red + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.darkBlue,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  errorCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 15,
    maxHeight: 150,
    marginBottom: 32,
    ...Shadows.subtle as any,
  },
  errorScroll: {
    flexGrow: 0,
  },
  errorText: {
    fontSize: 13,
    color: Colors.red,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  stackText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 56,
  },
  reloadLink: {
    marginTop: 20,
    padding: 10,
  },
  reloadText: {
    fontSize: 14,
    color: Colors.mediumBlue,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
