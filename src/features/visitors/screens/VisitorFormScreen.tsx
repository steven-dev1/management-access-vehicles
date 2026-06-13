import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, TOWERS } from '../../../constants';
import { visitorRepository } from '../../../lib/repositories/visitor.repository';
import { useHaptics } from '../../../hooks/useHaptics';

const FLOORS = [1, 2, 3, 4, 5];
const APARTMENTS = [1, 2, 3, 4];
const DURATIONS = [
  { label: 'Menos de 10 min', value: 0.17 },
  { label: '30 minutos', value: 0.5 },
  { label: '1 hora', value: 1 },
  { label: '2 horas', value: 2 },
  { label: '4 horas', value: 4 },
  { label: '8 horas', value: 8 },
  { label: '12 horas', value: 12 },
  { label: '24 horas', value: 24 },
  { label: '48 horas', value: 48 },
  { label: '72 horas', value: 72 },
];

export const VisitorFormScreen: React.FC = () => {
  const router = useRouter();

  const [plate, setPlate] = useState('');
  const [name, setName] = useState('');
  const [tower, setTower] = useState(1);
  const [floor, setFloor] = useState(1);
  const [apartment, setApartment] = useState(1);
  const [hostName, setHostName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [duration, setDuration] = useState(24);
  const [saving, setSaving] = useState(false);
  const { notificationSuccess } = useHaptics();

  const apartmentCode = `${floor}${String(apartment).padStart(2, '0')}`;

  const handleSave = async () => {
    if (!plate.trim()) {
      Alert.alert('Error', 'Ingresa la placa del visitante');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del visitante');
      return;
    }
    if (!hostName.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del residente');
      return;
    }

    setSaving(true);
    try {
      await visitorRepository.create({
        visitor_plate: plate.toUpperCase().trim(),
        visitor_name: name.trim(),
        host_tower: tower,
        host_apartment_code: apartmentCode,
        host_owner_name: hostName.trim(),
        purpose: purpose.trim(),
        expected_duration_hours: duration,
      });
      await notificationSuccess();
      Alert.alert('Éxito', 'Visitante registrado', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo registrar el visitante');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Visitante</Text>
        <View style={{ width: 30 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Visitor Info */}
          <Text style={styles.sectionTitle}>Datos del visitante</Text>

          <Text style={styles.label}>Placa *</Text>
          <TextInput
            style={styles.input}
            placeholder="ABC123"
            placeholderTextColor={COLORS.textSecondary}
            value={plate}
            onChangeText={setPlate}
            autoCapitalize="characters"
            maxLength={10}
          />

          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del visitante"
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Propósito</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Visita familiar, Entrega..."
            placeholderTextColor={COLORS.textSecondary}
            value={purpose}
            onChangeText={setPurpose}
          />
          <View style={styles.suggestionsRow}>
            {['Visita', 'Entrega', 'Fiesta', 'Mudanza', 'Mantenimiento'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.suggestionChip, purpose === s && styles.suggestionChipActive]}
                onPress={() => setPurpose(purpose === s ? '' : s)}
              >
                <Text style={[styles.suggestionText, purpose === s && styles.suggestionTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Host Info */}
          <Text style={styles.sectionTitle}>Datos del residente</Text>

          <Text style={styles.label}>Nombre del residente *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del residente"
            placeholderTextColor={COLORS.textSecondary}
            value={hostName}
            onChangeText={setHostName}
          />

          <Text style={styles.label}>Torre</Text>
          <View style={styles.pickerRow}>
            {TOWERS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.pickerItem, tower === t && styles.pickerItemActive]}
                onPress={() => setTower(t)}
              >
                <Text style={[styles.pickerText, tower === t && styles.pickerTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Piso</Text>
          <View style={styles.pickerRow}>
            {FLOORS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.pickerItem, floor === f && styles.pickerItemActive]}
                onPress={() => setFloor(f)}
              >
                <Text style={[styles.pickerText, floor === f && styles.pickerTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Apartamento</Text>
          <View style={styles.pickerRow}>
            {APARTMENTS.map((a) => {
              const code = `${floor}${String(a).padStart(2, '0')}`;
              return (
                <TouchableOpacity
                  key={a}
                  style={[styles.pickerItem, styles.pickerItemWide, apartment === a && styles.pickerItemActive]}
                  onPress={() => setApartment(a)}
                >
                  <Text style={[styles.pickerText, apartment === a && styles.pickerTextActive]}>{code}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.previewCard}>
            <Ionicons name="business-outline" size={16} color={COLORS.primary} />
            <Text style={styles.previewText}>Torre {tower} - {apartmentCode}</Text>
          </View>

          {/* Duration */}
          <Text style={styles.sectionTitle}>Duración estimada</Text>
          <View style={styles.pickerRow}>
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[styles.durationItem, duration === d.value && styles.durationItemActive]}
                onPress={() => setDuration(d.value)}
              >
                <Text style={[styles.durationText, duration === d.value && styles.durationTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
            <Text style={styles.saveButtonText}>{saving ? 'Guardando...' : 'Registrar visitante'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', color: COLORS.primary,
    marginTop: 16, marginBottom: 10,
  },
  label: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: COLORS.text, marginBottom: 12,
  },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pickerItem: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  pickerItemWide: {
    paddingHorizontal: 16,
  },
  pickerItemActive: { backgroundColor: COLORS.primary },
  pickerText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  pickerTextActive: { color: '#FFF' },
  durationItem: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  durationItemActive: { backgroundColor: COLORS.primary },
  durationText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  durationTextActive: { color: '#FFF' },
  suggestionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12,
  },
  suggestionChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  suggestionChipActive: {
    backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary,
  },
  suggestionText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  suggestionTextActive: { color: COLORS.primary },
  previewCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary + '15', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8,
  },
  previewText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, marginTop: 20,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
