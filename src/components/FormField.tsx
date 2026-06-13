import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {icon && <Ionicons name={icon} size={20} color={COLORS.textSecondary} style={styles.icon} />}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : null, style]}
          placeholderTextColor={COLORS.textSecondary}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

interface SelectFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  options?: { label: string; value: string }[];
  disabled?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  placeholder = 'Seleccionar...',
  error,
  icon,
  onPress,
  disabled,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.inputContainer, error ? styles.inputError : null, disabled && styles.disabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {icon && <Ionicons name={icon} size={20} color={COLORS.textSecondary} style={styles.icon} />}
        <Text style={[styles.input, styles.inputText, !value && styles.placeholderText, icon ? styles.inputWithIcon : null]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

interface FormButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
}

export const FormButton: React.FC<FormButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  fullWidth = true,
}) => {
  const bgColor = variant === 'primary' ? COLORS.primary : variant === 'danger' ? COLORS.danger : COLORS.surfaceLight;
  const textColor = variant === 'secondary' ? COLORS.textSecondary : COLORS.text;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor }, fullWidth && styles.fullWidth, (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <Ionicons name="hourglass" size={20} color={textColor} />
      ) : icon ? (
        <Ionicons name={icon} size={20} color={textColor} />
      ) : null}
      <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.text,
    fontSize: 16,
  },
  inputWithIcon: {
    marginLeft: 0,
  },
  inputText: {
    fontSize: 16,
  },
  placeholderText: {
    color: COLORS.textSecondary,
  },
  rightIcon: {
    padding: 4,
  },
  error: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  fullWidth: {
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
