import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { COLORS } from '../../../constants';
import { licenseRepository } from '../../../lib/repositories/license.repository';
import { License, LicenseDevice } from '../../../types';

export default function LicensesScreen() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newComplexName, setNewComplexName] = useState('');
  const [newMaxDevices, setNewMaxDevices] = useState('2');
  const [newTrialDays, setNewTrialDays] = useState('30');
  const [newPermanent, setNewPermanent] = useState(false);
  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [extendLicenseId, setExtendLicenseId] = useState<string | null>(null);
  const [extendLicenseName, setExtendLicenseName] = useState('');
  const [extendDays, setExtendDays] = useState('30');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLicense, setEditLicense] = useState<License | null>(null);
  const [editMaxDevices, setEditMaxDevices] = useState('');
  const [editTrialDate, setEditTrialDate] = useState('');
  const [editPermanent, setEditPermanent] = useState(false);
  const [search, setSearch] = useState('');

  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ['admin-licenses'],
    queryFn: () => licenseRepository.getAllLicenses(),
  });

  const { data: devices = [] } = useQuery({
    queryKey: ['admin-devices'],
    queryFn: () => licenseRepository.getAllDevices(),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-licenses'] });
    queryClient.invalidateQueries({ queryKey: ['admin-devices'] });
  };

  const createMutation = useMutation({
    mutationFn: ({ name, maxDevices, trialDays }: { name: string; maxDevices: number; trialDays?: number }) =>
      licenseRepository.createLicense(name, maxDevices, trialDays),
    onSuccess: (newLicense) => {
      invalidateAll();
      setShowCreateModal(false);
      setNewComplexName('');
      setNewMaxDevices('2');
      setNewTrialDays('30');
      setNewPermanent(false);
      Alert.alert('Exito', `Licencia creada: ${newLicense.license_key}`);
    },
    onError: () => Alert.alert('Error', 'No se pudo crear la licencia'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      licenseRepository.updateLicense(id, { active }),
    onSuccess: () => invalidateAll(),
    onError: () => Alert.alert('Error', 'No se pudo actualizar'),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Pick<License, 'max_devices' | 'trial_ends_at'>> }) =>
      licenseRepository.updateLicense(id, updates),
    onSuccess: () => {
      invalidateAll();
      setEditModalVisible(false);
      setEditLicense(null);
      Alert.alert('Exito', 'Licencia actualizada');
    },
    onError: () => Alert.alert('Error', 'No se pudo actualizar la licencia'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => licenseRepository.deleteLicense(id),
    onSuccess: () => invalidateAll(),
    onError: () => Alert.alert('Error', 'No se pudo eliminar'),
  });

  const extendMutation = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      licenseRepository.extendLicense(id, days),
    onSuccess: () => {
      invalidateAll();
      setExtendModalVisible(false);
      Alert.alert('Exito', `Licencia extendida por ${parseInt(extendDays) || 30} dias`);
    },
    onError: () => Alert.alert('Error', 'No se pudo extender la licencia'),
  });

  const handleCreateLicense = () => {
    if (!newComplexName.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del conjunto');
      return;
    }
    createMutation.mutate({
      name: newComplexName.trim(),
      maxDevices: parseInt(newMaxDevices) || 2,
      trialDays: newPermanent ? undefined : (parseInt(newTrialDays) || 30),
    });
  };

  const handleToggleLicense = (license: License) => {
    toggleMutation.mutate({ id: license.id, active: !license.active });
  };

  const handleDeleteLicense = (license: License) => {
    Alert.alert('Eliminar', `Eliminar licencia de "${license.complex_name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(license.id) },
    ]);
  };

  const handleCopyLicense = (licenseKey: string) => {
    Clipboard.setString(licenseKey);
    Alert.alert('Copiado', licenseKey);
  };

  const handleOpenExtendModal = (license: License) => {
    setExtendLicenseId(license.id);
    setExtendLicenseName(license.complex_name);
    setExtendDays('30');
    setExtendModalVisible(true);
  };

  const handleExtendLicense = () => {
    if (!extendLicenseId) return;
    const days = parseInt(extendDays) || 30;
    if (days <= 0) {
      Alert.alert('Error', 'Los dias deben ser mayores a 0');
      return;
    }
    extendMutation.mutate({ id: extendLicenseId, days });
  };

  const handleOpenEditModal = (license: License) => {
    setEditLicense(license);
    setEditMaxDevices(String(license.max_devices));
    setEditPermanent(!license.trial_ends_at);
    if (license.trial_ends_at) {
      const d = new Date(license.trial_ends_at);
      setEditTrialDate(d.toISOString().split('T')[0]);
    } else {
      setEditTrialDate('');
    }
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editLicense) return;
    const updates: any = { max_devices: parseInt(editMaxDevices) || editLicense.max_devices };
    if (editPermanent) {
      updates.trial_ends_at = null;
    } else if (editTrialDate) {
      updates.trial_ends_at = new Date(editTrialDate).toISOString();
    }
    editMutation.mutate({ id: editLicense.id, updates });
  };

  const renderLicense = ({ item }: { item: License }) => {
    const deviceCount = devices.filter(d => d.license_id === item.id).length;
    const isExpired = item.trial_ends_at && new Date(item.trial_ends_at) < new Date();
    const isPermanent = !item.trial_ends_at;
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
          {isPermanent ? (
            <Text style={[styles.cardTrial, { color: COLORS.primary }]}>Permanente</Text>
          ) : item.trial_ends_at ? (
            <Text style={[styles.cardTrial, isExpired && { color: COLORS.danger }]}>
              {isExpired ? 'Expirado' : 'Expira'}: {new Date(item.trial_ends_at).toLocaleDateString('es-ES')}
            </Text>
          ) : null}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnEdit]}
            onPress={() => handleOpenEditModal(item)}
          >
            <Text style={[styles.actionText, styles.actionTextEdit]}>Editar</Text>
          </TouchableOpacity>
          {isExpired ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnReactivate]}
              onPress={() => handleOpenExtendModal(item)}
            >
              <Text style={[styles.actionText, styles.actionTextReactivate]}>Reactivar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, item.active ? styles.actionBtnWarning : styles.actionBtnSuccess]}
              onPress={() => handleToggleLicense(item)}
            >
              <Text style={[styles.actionText, item.active ? styles.actionTextWarning : styles.actionTextSuccess]}>
                {item.active ? 'Desactivar' : 'Activar'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBtnDanger} onPress={() => handleDeleteLicense(item)}>
            <Text style={styles.actionTextDanger}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filteredLicenses = licenses.filter(l =>
    l.complex_name.toLowerCase().includes(search.toLowerCase()) ||
    l.license_key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Licencias</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o clave..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={filteredLicenses}
        keyExtractor={i => i.id}
        renderItem={renderLicense}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>{isLoading ? 'Cargando...' : 'Sin licencias'}</Text>}
      />
      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Licencia</Text>
            <TextInput style={styles.modalInput} placeholder="Nombre del conjunto" placeholderTextColor={COLORS.textSecondary}
              value={newComplexName} onChangeText={setNewComplexName} autoFocus />
            <View style={styles.modalRow}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Max. dispositivos</Text>
                <TextInput style={styles.modalInputSmall} placeholderTextColor={COLORS.textSecondary}
                  value={newMaxDevices} onChangeText={setNewMaxDevices} keyboardType="numeric" />
              </View>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Dias de prueba</Text>
                <TextInput style={[styles.modalInputSmall, newPermanent && { opacity: 0.4 }]}
                  placeholderTextColor={COLORS.textSecondary}
                  value={newTrialDays} onChangeText={setNewTrialDays} keyboardType="numeric"
                  editable={!newPermanent} />
              </View>
            </View>
            <View style={styles.permanentRow}>
              <View style={styles.permanentLabelRow}>
                <Ionicons name="infinite" size={18} color={COLORS.primary} />
                <Text style={styles.permanentLabel}>Suscripcion permanente</Text>
              </View>
              <Switch
                value={newPermanent}
                onValueChange={setNewPermanent}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
                thumbColor={newPermanent ? COLORS.primary : COLORS.textSecondary}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowCreateModal(false); setNewPermanent(false); }}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleCreateLicense}>
                <Text style={styles.modalConfirmText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {extendModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reactivar Licencia</Text>
            <Text style={styles.modalSubtitle}>
              Extender licencia de "{extendLicenseName}"
            </Text>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Dias de extension</Text>
              <TextInput style={styles.modalInput} placeholderTextColor={COLORS.textSecondary}
                value={extendDays} onChangeText={setExtendDays} keyboardType="numeric" autoFocus />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setExtendModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleExtendLicense}>
                <Text style={styles.modalConfirmText}>Reactivar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {editModalVisible && editLicense && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Licencia</Text>
            <Text style={styles.modalSubtitle}>{editLicense.complex_name}</Text>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Max. dispositivos</Text>
              <TextInput style={styles.modalInput} placeholderTextColor={COLORS.textSecondary}
                value={editMaxDevices} onChangeText={setEditMaxDevices} keyboardType="numeric" autoFocus />
            </View>
            <View style={styles.permanentRow}>
              <View style={styles.permanentLabelRow}>
                <Ionicons name="infinite" size={18} color={COLORS.primary} />
                <Text style={styles.permanentLabel}>Permanente (sin expiracion)</Text>
              </View>
              <Switch
                value={editPermanent}
                onValueChange={setEditPermanent}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
                thumbColor={editPermanent ? COLORS.primary : COLORS.textSecondary}
              />
            </View>
            {!editPermanent && (
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Fecha de expiracion</Text>
                <TextInput style={styles.modalInput} placeholderTextColor={COLORS.textSecondary}
                  value={editTrialDate} onChangeText={setEditTrialDate}
                  placeholder="AAAA-MM-DD" />
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSaveEdit}>
                <Text style={styles.modalConfirmText}>Guardar</Text>
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 10, marginHorizontal: 20, marginBottom: 8, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, paddingVertical: 10 },
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
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnEdit: { backgroundColor: COLORS.primary + '15' },
  actionTextEdit: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  actionBtnWarning: { backgroundColor: COLORS.warning + '15' },
  actionBtnSuccess: { backgroundColor: '#10B98115' },
  actionBtnDanger: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.danger + '15' },
  actionBtnReactivate: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#10B98115' },
  actionText: { fontSize: 13, fontWeight: '600' },
  actionTextWarning: { color: COLORS.warning },
  actionTextSuccess: { color: '#10B981' },
  actionTextDanger: { fontSize: 13, fontWeight: '600', color: COLORS.danger },
  actionTextReactivate: { fontSize: 13, fontWeight: '600', color: '#10B981' },
  permanentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 10, padding: 12, marginBottom: 12 },
  permanentLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  permanentLabel: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', backgroundColor: COLORS.surface, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },
  modalInput: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.text, marginBottom: 12 },
  modalRow: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  modalField: { flex: 1 },
  modalLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  modalInputSmall: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.text, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.background, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  modalConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center' },
  modalConfirmText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
