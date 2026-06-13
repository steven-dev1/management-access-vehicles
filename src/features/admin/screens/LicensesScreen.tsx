import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';
import { licenseRepository } from '../../../lib/repositories/license.repository';
import { License, LicenseDevice } from '../../../types';

export default function LicensesScreen() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [devices, setDevices] = useState<LicenseDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newComplexName, setNewComplexName] = useState('');
  const [newMaxDevices, setNewMaxDevices] = useState('2');
  const [newTrialDays, setNewTrialDays] = useState('30');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [lic, dev] = await Promise.all([
        licenseRepository.getAllLicenses(),
        licenseRepository.getAllDevices(),
      ]);
      setLicenses(lic);
      setDevices(dev);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLicense = async () => {
    if (!newComplexName.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del conjunto');
      return;
    }
    try {
      const maxD = parseInt(newMaxDevices) || 2;
      const trialD = parseInt(newTrialDays) || 30;
      const newLicense = await licenseRepository.createLicense(newComplexName.trim(), maxD, trialD);
      setLicenses(prev => [newLicense, ...prev]);
      setShowCreateModal(false);
      setNewComplexName('');
      setNewMaxDevices('2');
      setNewTrialDays('30');
      Alert.alert('Éxito', `Licencia creada: ${newLicense.license_key}`);
    } catch {
      Alert.alert('Error', 'No se pudo crear la licencia');
    }
  };

  const handleToggleLicense = async (license: License) => {
    try {
      const updated = await licenseRepository.updateLicense(license.id, { active: !license.active });
      setLicenses(prev => prev.map(l => l.id === license.id ? updated : l));
    } catch {
      Alert.alert('Error', 'No se pudo actualizar');
    }
  };

  const handleDeleteLicense = async (license: License) => {
    Alert.alert('Eliminar', `¿Eliminar licencia de "${license.complex_name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await licenseRepository.deleteLicense(license.id);
            setLicenses(prev => prev.filter(l => l.id !== license.id));
          } catch {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const handleCopyLicense = (licenseKey: string) => {
    import('expo-clipboard').then(({ setStringAsync }) => {
      setStringAsync(licenseKey);
      Alert.alert('Copiado', licenseKey);
    });
  };

  const renderLicense = ({ item }: { item: License }) => {
    const deviceCount = devices.filter(d => d.license_id === item.id).length;
    const isExpired = item.trial_ends_at && new Date(item.trial_ends_at) < new Date();
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="business" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>{item.complex_name}</Text>
          </View>
          <View style={[styles.statusBadge, item.active ? (isExpired ? styles.statusExpired : styles.statusActive) : styles.statusInactive]}>
            <Text style={styles.statusText}>{isExpired ? 'Expirada' : item.active ? 'Activa' : 'Inactiva'}</Text>
          </View>
        </View>
        <View style={styles.licenseKeyRow}>
          <Text style={styles.cardKey}>{item.license_key}</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopyLicense(item.license_key)}>
            <Ionicons name="copy" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.cardInfo}>{deviceCount}/{item.max_devices} dispositivos</Text>
          {item.trial_ends_at && (
            <Text style={[styles.cardTrial, isExpired && { color: COLORS.danger }]}>
              {isExpired ? 'Expirado' : 'Expira'}: {new Date(item.trial_ends_at).toLocaleDateString('es-ES')}
            </Text>
          )}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, item.active ? styles.actionBtnWarning : styles.actionBtnSuccess]}
            onPress={() => handleToggleLicense(item)}
          >
            <Text style={[styles.actionText, item.active ? styles.actionTextWarning : styles.actionTextSuccess]}>
              {item.active ? 'Desactivar' : 'Activar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnDanger} onPress={() => handleDeleteLicense(item)}>
            <Text style={styles.actionTextDanger}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Licencias</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={licenses}
        keyExtractor={i => i.id}
        renderItem={renderLicense}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>{loading ? 'Cargando...' : 'Sin licencias'}</Text>}
      />
      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Licencia</Text>
            <TextInput style={styles.modalInput} placeholder="Nombre del conjunto" placeholderTextColor={COLORS.textSecondary}
              value={newComplexName} onChangeText={setNewComplexName} autoFocus />
            <View style={styles.modalRow}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Máx. dispositivos</Text>
                <TextInput style={styles.modalInputSmall} placeholderTextColor={COLORS.textSecondary}
                  value={newMaxDevices} onChangeText={setNewMaxDevices} keyboardType="numeric" />
              </View>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Días de prueba</Text>
                <TextInput style={styles.modalInputSmall} placeholderTextColor={COLORS.textSecondary}
                  value={newTrialDays} onChangeText={setNewTrialDays} keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleCreateLicense}>
                <Text style={styles.modalConfirmText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, gap: 12 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusActive: { backgroundColor: '#10B98120' },
  statusInactive: { backgroundColor: COLORS.danger + '20' },
  statusExpired: { backgroundColor: COLORS.warning + '20' },
  statusText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  licenseKeyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardKey: { fontSize: 16, fontWeight: '700', color: COLORS.primary, letterSpacing: 1, flex: 1 },
  copyBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardInfo: { fontSize: 12, color: COLORS.textSecondary },
  cardTrial: { fontSize: 12, color: COLORS.textSecondary },
  cardActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnWarning: { backgroundColor: COLORS.warning + '15' },
  actionBtnSuccess: { backgroundColor: '#10B98115' },
  actionBtnDanger: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.danger + '15' },
  actionText: { fontSize: 13, fontWeight: '600' },
  actionTextWarning: { color: COLORS.warning },
  actionTextSuccess: { color: '#10B981' },
  actionTextDanger: { fontSize: 13, fontWeight: '600', color: COLORS.danger },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', backgroundColor: COLORS.surface, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  modalInput: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.text, marginBottom: 12 },
  modalRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  modalField: { flex: 1 },
  modalLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  modalInputSmall: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.text, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.background, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  modalConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center' },
  modalConfirmText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
