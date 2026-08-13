import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../constants';
import { licenseRepository } from '../../../lib/repositories/license.repository';
import { License } from '../../../types';

export default function LicensesScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
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

  const filteredLicenses = licenses.filter(
    (l) =>
      l.complex_name.toLowerCase().includes(search.toLowerCase()) ||
      l.license_key.toLowerCase().includes(search.toLowerCase()),
  );

  const getStatusConfig = (license: License) => {
    const isExpired = license.trial_ends_at && new Date(license.trial_ends_at) < new Date();
    if (isExpired) return { label: 'Expirada', color: COLORS.warning, bg: COLORS.warningGlow };
    if (license.active) return { label: 'Activa', color: COLORS.success, bg: COLORS.successGlow };
    return { label: 'Inactiva', color: COLORS.danger, bg: COLORS.dangerGlow };
  };

  const renderLicense = ({ item }: { item: License }) => {
    const deviceCount = devices.filter((d) => d.license_id === item.id).length;
    const isExpired = item.trial_ends_at && new Date(item.trial_ends_at) < new Date();
    const isPermanent = !item.trial_ends_at;
    const status = getStatusConfig(item);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="business" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.complex_name}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.licenseKeyRow}>
          <View style={styles.licenseKeyContainer}>
            <Text style={styles.licenseKeyLabel}>LICENCIA</Text>
            <Text style={styles.cardKey}>{item.license_key}</Text>
          </View>
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => handleCopyLicense(item.license_key)}
            activeOpacity={0.7}
          >
            <Ionicons name="copy" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="phone-portrait-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.cardInfo}>
              {deviceCount}/{item.max_devices}
            </Text>
          </View>
          {isPermanent ? (
            <View style={styles.metaItem}>
              <Ionicons name="infinite" size={13} color={COLORS.primary} />
              <Text style={[styles.cardTrial, { color: COLORS.primary }]}>Permanente</Text>
            </View>
          ) : item.trial_ends_at ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={isExpired ? COLORS.danger : COLORS.textMuted} />
              <Text style={[styles.cardTrial, isExpired && { color: COLORS.danger }]}>
                {isExpired ? 'Expirado' : 'Expira'}:{' '}
                {new Date(item.trial_ends_at).toLocaleDateString('es-ES')}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnEdit]}
            onPress={() => handleOpenEditModal(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={14} color={COLORS.primary} />
            <Text style={[styles.actionText, { color: COLORS.primary }]}>Editar</Text>
          </TouchableOpacity>

          {isExpired ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnReactivate]}
              onPress={() => handleOpenExtendModal(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={14} color={COLORS.success} />
              <Text style={[styles.actionText, { color: COLORS.success }]}>Reactivar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                item.active ? styles.actionBtnWarning : styles.actionBtnSuccess,
              ]}
              onPress={() => handleToggleLicense(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.active ? 'pause' : 'play'}
                size={14}
                color={item.active ? COLORS.warning : COLORS.success}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: item.active ? COLORS.warning : COLORS.success },
                ]}
              >
                {item.active ? 'Desactivar' : 'Activar'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={() => handleDeleteLicense(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={14} color={COLORS.danger} />
            <Text style={[styles.actionText, { color: COLORS.danger }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Licencias</Text>
          <Text style={styles.subtitle}>{licenses.length} licencias registradas</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o clave..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredLicenses}
        keyExtractor={(i) => i.id}
        renderItem={renderLicense}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="key-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>
              {isLoading ? 'Cargando...' : 'Sin licencias'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isLoading ? 'Obteniendo datos...' : 'Crea tu primera licencia para comenzar'}
            </Text>
          </View>
        }
      />

      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCreateModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="add-circle" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Nueva Licencia</Text>
                <Text style={styles.modalSubtitle}>Configura los permisos del complejo</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Nombre del conjunto</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Residencial Los Pinos"
              placeholderTextColor={COLORS.textMuted}
              value={newComplexName}
              onChangeText={setNewComplexName}
              autoFocus
            />

            <View style={styles.modalRow}>
              <View style={styles.modalField}>
                <Text style={styles.inputLabel}>Max. dispositivos</Text>
                <TextInput
                  style={styles.modalInputSmall}
                  placeholderTextColor={COLORS.textMuted}
                  value={newMaxDevices}
                  onChangeText={setNewMaxDevices}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalField}>
                <Text style={styles.inputLabel}>Dias de prueba</Text>
                <TextInput
                  style={[styles.modalInputSmall, newPermanent && styles.inputDisabled]}
                  placeholderTextColor={COLORS.textMuted}
                  value={newTrialDays}
                  onChangeText={setNewTrialDays}
                  keyboardType="numeric"
                  editable={!newPermanent}
                />
              </View>
            </View>

            <View style={styles.permanentRow}>
              <View style={styles.permanentLabelRow}>
                <Ionicons name="infinite" size={16} color={COLORS.primary} />
                <Text style={styles.permanentLabel}>Suscripcion permanente</Text>
              </View>
              <Switch
                value={newPermanent}
                onValueChange={setNewPermanent}
                trackColor={{ false: COLORS.surfaceHighlight, true: COLORS.primaryDark }}
                thumbColor={newPermanent ? COLORS.primary : COLORS.textMuted}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewPermanent(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleCreateLicense} activeOpacity={0.7}>
                <Ionicons name="checkmark" size={16} color="#FFF" />
                <Text style={styles.modalConfirmText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={extendModalVisible} transparent animationType="fade" onRequestClose={() => setExtendModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setExtendModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconContainer, { backgroundColor: COLORS.successGlow }]}>
                <Ionicons name="refresh-circle" size={24} color={COLORS.success} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Reactivar Licencia</Text>
                <Text style={styles.modalSubtitle}>Extender "{extendLicenseName}"</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Dias de extension</Text>
            <TextInput
              style={styles.modalInput}
              placeholderTextColor={COLORS.textMuted}
              value={extendDays}
              onChangeText={setExtendDays}
              keyboardType="numeric"
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setExtendModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: COLORS.success }]}
                onPress={handleExtendLicense}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color="#FFF" />
                <Text style={styles.modalConfirmText}>Reactivar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconContainer, { backgroundColor: COLORS.warningGlow }]}>
                <Ionicons name="create" size={24} color={COLORS.warning} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Editar Licencia</Text>
                <Text style={styles.modalSubtitle}>{editLicense?.complex_name}</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Max. dispositivos</Text>
            <TextInput
              style={styles.modalInput}
              placeholderTextColor={COLORS.textMuted}
              value={editMaxDevices}
              onChangeText={setEditMaxDevices}
              keyboardType="numeric"
              autoFocus
            />

            <View style={styles.permanentRow}>
              <View style={styles.permanentLabelRow}>
                <Ionicons name="infinite" size={16} color={COLORS.primary} />
                <Text style={styles.permanentLabel}>Permanente (sin expiracion)</Text>
              </View>
              <Switch
                value={editPermanent}
                onValueChange={setEditPermanent}
                trackColor={{ false: COLORS.surfaceHighlight, true: COLORS.primaryDark }}
                thumbColor={editPermanent ? COLORS.primary : COLORS.textMuted}
              />
            </View>

            {!editPermanent && (
              <>
                <Text style={styles.inputLabel}>Fecha de expiracion</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholderTextColor={COLORS.textMuted}
                  value={editTrialDate}
                  onChangeText={setEditTrialDate}
                  placeholder="AAAA-MM-DD"
                />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSaveEdit} activeOpacity={0.7}>
                <Ionicons name="checkmark" size={16} color="#FFF" />
                <Text style={styles.modalConfirmText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow(COLORS.primary),
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    paddingVertical: 0,
  },

  list: {
    padding: SPACING.xl,
    paddingBottom: 100,
    gap: SPACING.md,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  licenseKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  licenseKeyContainer: {
    flex: 1,
  },
  licenseKeyLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  cardKey: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: SPACING.md,
  },

  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardInfo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  cardTrial: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: 6,
    borderWidth: 1,
  },
  actionBtnEdit: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primary + '30',
  },
  actionBtnWarning: {
    backgroundColor: COLORS.warningGlow,
    borderColor: COLORS.warning + '30',
  },
  actionBtnSuccess: {
    backgroundColor: COLORS.successGlow,
    borderColor: COLORS.success + '30',
  },
  actionBtnDanger: {
    backgroundColor: COLORS.dangerGlow,
    borderColor: COLORS.danger + '30',
  },
  actionBtnReactivate: {
    backgroundColor: COLORS.successGlow,
    borderColor: COLORS.success + '30',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  modalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    letterSpacing: 0.3,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  modalRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  modalField: {
    flex: 1,
  },
  modalInputSmall: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
  },
  inputDisabled: {
    opacity: 0.35,
  },
  permanentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  permanentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  permanentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  modalCancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    gap: 6,
    ...SHADOWS.glow(COLORS.primary),
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
