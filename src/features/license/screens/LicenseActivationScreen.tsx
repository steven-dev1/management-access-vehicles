import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';

interface LicenseActivationScreenProps {
  onActivate: (licenseKey: string) => Promise<{ success: boolean; error?: string }>;
  onAdminBypass: () => void;
  error?: string | null;
}

export const LicenseActivationScreen: React.FC<LicenseActivationScreenProps> = ({ onActivate, onAdminBypass, error }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState(error);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setLocalError('Ingresa el código de licencia');
      return;
    }

    setIsLoading(true);
    setLocalError(null);

    const result = await onActivate(licenseKey);

    if (!result.success) {
      setLocalError(result.error);
    }

    setIsLoading(false);
  };

  const formatLicenseKey = (text: string) => {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const segments: string[] = [];
    let remaining = cleaned;

    for (const len of [4, 4, 4]) {
      if (remaining.length > 0) {
        segments.push(remaining.slice(0, len));
        remaining = remaining.slice(len);
      }
    }

    setLicenseKey(segments.join('-'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={64} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Activar Licencia</Text>
          <Text style={styles.subtitle}>
            Ingresa el código de licencia que recibiste para comenzar a usar la app
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="XXXX-XXXX-XXXX"
              placeholderTextColor={COLORS.textSecondary}
              value={licenseKey}
              onChangeText={formatLicenseKey}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={14}
              editable={!isLoading}
            />
          </View>

          {localError && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{localError}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.activateButton, isLoading && styles.activateButtonDisabled]}
            onPress={handleActivate}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <Text style={styles.activateButtonText}>Validando...</Text>
            ) : (
              <>
                <Ionicons name="key" size={20} color="#FFF" />
                <Text style={styles.activateButtonText}>Activar</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              Si no tienes un código de licencia, contacta al administrador de tu conjunto residencial
            </Text>
          </View>

          <TouchableOpacity
            style={styles.adminButton}
            onPress={onAdminBypass}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.adminButtonText}>Soy administrador</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.danger + '10',
    borderRadius: 8,
    width: '100%',
  },
  errorText: {
    fontSize: 13,
    color: COLORS.danger,
    flex: 1,
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  activateButtonDisabled: {
    opacity: 0.6,
  },
  activateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  adminButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
});
