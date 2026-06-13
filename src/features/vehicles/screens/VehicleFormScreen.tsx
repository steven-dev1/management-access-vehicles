import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, TOWERS, FLOORS, APARTMENTS_PER_FLOOR } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createVehicle, updateVehicle, fetchVehicleById } from '../../../store/vehicleSlice';
import { vehicleRepository } from '../../../lib/repositories/vehicle.repository';
import { useHaptics } from '../../../hooks/useHaptics';
import { VehicleFormData, Vehicle, VehicleType } from '../../../types';
import { formatLicensePlate } from '../../../utils';

export const VehicleFormScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditing = !!id;
  const { notificationSuccess } = useHaptics();

  const dispatch = useAppDispatch();
  const { selectedVehicle, loading, error } = useAppSelector((state) => state.vehicles);

  const [formData, setFormData] = useState<VehicleFormData>({
    license_plate: '',
    vehicle_type: 'car',
    tower: 1,
    floor: 1,
    apartment: 1,
    owner_name: '',
    is_restricted: false,
    restriction_reason: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({});
  const [existingVehicles, setExistingVehicles] = useState<Vehicle[]>([]);
  const [checkingApartment, setCheckingApartment] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchVehicleById(id));
    }
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && selectedVehicle) {
      setFormData({
        license_plate: selectedVehicle.license_plate,
        vehicle_type: selectedVehicle.vehicle_type,
        tower: selectedVehicle.tower,
        floor: selectedVehicle.floor,
        apartment: selectedVehicle.apartment,
        owner_name: selectedVehicle.owner_name,
        is_restricted: selectedVehicle.is_restricted,
        restriction_reason: selectedVehicle.restriction_reason ?? '',
      });
    }
  }, [isEditing, selectedVehicle]);

  const apartmentCode = `${formData.floor * 100 + formData.apartment}`;

  useEffect(() => {
    let cancelled = false;
    const checkApartment = async () => {
      setCheckingApartment(true);
      try {
        const result = await vehicleRepository.getAll({
          tower: formData.tower,
          apartment: apartmentCode,
        });
        if (!cancelled) {
          setExistingVehicles(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          setExistingVehicles([]);
        }
      } finally {
        if (!cancelled) {
          setCheckingApartment(false);
        }
      }
    };
    checkApartment();
    return () => { cancelled = true; };
  }, [formData.tower, formData.floor, formData.apartment, apartmentCode]);

  const carsInApartment = existingVehicles.filter(v => v.vehicle_type === 'car').length;
  const motorcyclesInApartment = existingVehicles.filter(v => v.vehicle_type === 'motorcycle').length;
  const hasCarLimit = carsInApartment >= 1;
  const hasMotorcycleLimit = motorcyclesInApartment >= 1;
  const wouldExceedCar = formData.vehicle_type === 'car' && hasCarLimit;
  const wouldExceedMotorcycle = formData.vehicle_type === 'motorcycle' && hasMotorcycleLimit;
  const showWarning = wouldExceedCar || wouldExceedMotorcycle;

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VehicleFormData, string>> = {};

    if (!formData.license_plate.trim()) {
      newErrors.license_plate = 'El número de placa es obligatorio';
    } else if (formData.license_plate.length < 7) {
      newErrors.license_plate = 'La placa debe tener al menos 7 caracteres';
    }

    if (!formData.owner_name.trim()) {
      newErrors.owner_name = 'El nombre del propietario es obligatorio';
    } else if (formData.owner_name.length < 2) {
      newErrors.owner_name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (formData.is_restricted && !formData.restriction_reason.trim()) {
      newErrors.restriction_reason = 'El motivo de restricción es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const doSave = async () => {
      try {
        if (isEditing && id) {
          await dispatch(updateVehicle({ id, vehicle: formData })).unwrap();
          await notificationSuccess();
          Alert.alert('Éxito', 'Vehículo actualizado correctamente', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        } else {
          await dispatch(createVehicle(formData)).unwrap();
          await notificationSuccess();
          Alert.alert('Éxito', 'Vehículo creado correctamente', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Error al guardar el vehículo');
      }
    };

    if (showWarning) {
      const typeLabel = formData.vehicle_type === 'car' ? 'carro' : 'moto';
      Alert.alert(
        'Advertencia',
        `Este apartamento ya tiene ${carsInApartment} carro${carsInApartment !== 1 ? 's' : ''} y ${motorcyclesInApartment} moto${motorcyclesInApartment !== 1 ? 's' : ''}. ¿Deseas agregar otro ${typeLabel}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Agregar de todos modos', onPress: doSave },
        ]
      );
    } else {
      await doSave();
    }
  };

  const updateField = (field: keyof VehicleFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Editar vehículo' : 'Añadir vehículo'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {showWarning && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={20} color={COLORS.warning} />
            <Text style={styles.warningText}>
              {wouldExceedCar
                ? `Este apartamento ya tiene ${carsInApartment} carro registrado. Máximo permitido: 1 carro y 1 moto.`
                : `Este apartamento ya tiene ${motorcyclesInApartment} moto registrada. Máximo permitido: 1 carro y 1 moto.`}
            </Text>
          </View>
        )}

        {existingVehicles.length > 0 && !showWarning && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Apartamento con {carsInApartment} carro{carsInApartment !== 1 ? 's' : ''} y {motorcyclesInApartment} moto{motorcyclesInApartment !== 1 ? 's' : ''} registrado{existingVehicles.length !== 1 ? 's' : ''}.
            </Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Placa del vehículo</Text>
          <TextInput
            style={[styles.input, errors.license_plate && styles.inputError]}
            placeholder="ABC-1234"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.license_plate}
            onChangeText={(text) => updateField('license_plate', formatLicensePlate(text))}
            autoCapitalize="characters"
            maxLength={8}
          />
          {errors.license_plate && <Text style={styles.errorText}>{errors.license_plate}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo de vehículo</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeOption, formData.vehicle_type === 'car' && styles.typeOptionActive]}
              onPress={() => updateField('vehicle_type', 'car')}
            >
              <Ionicons
                name="car"
                size={24}
                color={formData.vehicle_type === 'car' ? COLORS.text : COLORS.textSecondary}
              />
              <Text style={[styles.typeText, formData.vehicle_type === 'car' && styles.typeTextActive]}>
                Carro
              </Text>
              {hasCarLimit && (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{carsInApartment}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeOption, formData.vehicle_type === 'motorcycle' && styles.typeOptionActive]}
              onPress={() => updateField('vehicle_type', 'motorcycle')}
            >
              <Ionicons
                name="bicycle"
                size={24}
                color={formData.vehicle_type === 'motorcycle' ? COLORS.text : COLORS.textSecondary}
              />
              <Text style={[styles.typeText, formData.vehicle_type === 'motorcycle' && styles.typeTextActive]}>
                Moto
              </Text>
              {hasMotorcycleLimit && (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{motorcyclesInApartment}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Torre</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            <View style={styles.optionsRow}>
              {TOWERS.map((tower) => (
                <TouchableOpacity
                  key={tower}
                  style={[styles.optionButton, formData.tower === tower && styles.optionButtonActive]}
                  onPress={() => updateField('tower', tower)}
                >
                  <Text style={[styles.optionText, formData.tower === tower && styles.optionTextActive]}>
                    T{tower}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Piso</Text>
          <View style={styles.optionsRow}>
            {FLOORS.map((floor) => (
              <TouchableOpacity
                key={floor}
                style={[styles.optionButton, formData.floor === floor && styles.optionButtonActive]}
                onPress={() => updateField('floor', floor)}
              >
                <Text style={[styles.optionText, formData.floor === floor && styles.optionTextActive]}>
                  Piso {floor}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Apartamento</Text>
          <View style={styles.optionsRow}>
            {APARTMENTS_PER_FLOOR.map((apt) => (
              <TouchableOpacity
                key={apt}
                style={[styles.optionButton, formData.apartment === apt && styles.optionButtonActive]}
                onPress={() => updateField('apartment', apt)}
              >
                <Text style={[styles.optionText, formData.apartment === apt && styles.optionTextActive]}>
                  {formData.floor * 100 + apt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Propietario</Text>
          <TextInput
            style={[styles.input, errors.owner_name && styles.inputError]}
            placeholder="Ingresar nombre"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.owner_name}
            onChangeText={(text) => updateField('owner_name', text)}
          />
          {errors.owner_name && <Text style={styles.errorText}>{errors.owner_name}</Text>}
        </View>

        <View style={[styles.restrictionContainer, formData.is_restricted && styles.restrictionContainerActive]}>
          <View style={styles.restrictionRow}>
            <View style={styles.restrictionLabelRow}>
              <Ionicons
                name="shield-outline"
                size={20}
                color={formData.is_restricted ? COLORS.danger : COLORS.textSecondary}
              />
              <Text style={[styles.label, formData.is_restricted && styles.restrictionLabelActive]}>
                Restringido
              </Text>
            </View>
            <Switch
              value={formData.is_restricted}
              onValueChange={(value) => {
                updateField('is_restricted', value);
                if (!value) {
                  updateField('restriction_reason', '');
                }
              }}
              trackColor={{ false: COLORS.surfaceLight, true: COLORS.danger + '80' }}
              thumbColor={formData.is_restricted ? COLORS.danger : COLORS.textSecondary}
            />
          </View>

          {formData.is_restricted && (
            <View style={styles.restrictionInputContainer}>
              <TextInput
                style={[styles.input, errors.restriction_reason && styles.inputError]}
                placeholder="Motivo de restricción (ej: Moroso, Multas pendientes)"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.restriction_reason}
                onChangeText={(text) => updateField('restriction_reason', text)}
              />
              {errors.restriction_reason && <Text style={styles.errorText}>{errors.restriction_reason}</Text>}
            </View>
          )}
        </View>

        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Vista previa</Text>
          <View style={[styles.previewCard, formData.is_restricted && styles.previewCardRestricted]}>
            <View style={styles.previewHeader}>
              <View style={[styles.previewType, { backgroundColor: formData.vehicle_type === 'car' ? COLORS.car : '#8B5CF6' }]}>
                <Ionicons
                  name={formData.vehicle_type === 'car' ? 'car' : 'bicycle'}
                  size={16}
                  color={COLORS.text}
                />
              </View>
              <Text style={styles.previewTypeText}>
                {formData.vehicle_type === 'car' ? 'Carro' : 'Moto'}
              </Text>
              {formData.is_restricted && (
                <View style={styles.previewRestrictedBadge}>
                  <Ionicons name="shield" size={12} color={COLORS.danger} />
                  <Text style={styles.previewRestrictedText}>RESTRINGIDO</Text>
                </View>
              )}
            </View>
            <Text style={styles.previewPlate}>{formData.license_plate || 'ABC-1234'}</Text>
            <Text style={styles.previewLocation}>
              Torre {formData.tower} - {formData.floor * 100 + formData.apartment}
            </Text>
            <Text style={styles.previewOwner}>{formData.owner_name || 'Propietario'}</Text>
            {formData.is_restricted && formData.restriction_reason && (
              <Text style={styles.previewRestrictionReason}>{formData.restriction_reason}</Text>
            )}
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditing ? 'Actualizar' : 'Guardar'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  form: {
    padding: 16,
    paddingBottom: 100,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.warning + '15',
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.warning,
    lineHeight: 18,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  typeOptionActive: {
    backgroundColor: COLORS.primary,
  },
  typeText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  typeTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  typeBadge: {
    backgroundColor: COLORS.warning,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
  horizontalScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  optionTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  restrictionContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  restrictionContainerActive: {
    borderColor: COLORS.danger + '40',
    backgroundColor: COLORS.danger + '08',
  },
  restrictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restrictionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  restrictionLabelActive: {
    color: COLORS.danger,
  },
  restrictionInputContainer: {
    marginTop: 12,
  },
  preview: {
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  previewCardRestricted: {
    borderLeftColor: COLORS.danger,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  previewType: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTypeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  previewRestrictedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.danger + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  previewRestrictedText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.danger,
    letterSpacing: 0.5,
  },
  previewPlate: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: 1,
  },
  previewLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  previewOwner: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  previewRestrictionReason: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 8,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    gap: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
});
