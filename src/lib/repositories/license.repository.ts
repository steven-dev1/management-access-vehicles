import { supabase } from '../supabase';
import { License, LicenseDevice, LicenseValidation } from '../../types';
import * as Device from 'expo-device';

class LicenseRepository {
  private async getDeviceId(): Promise<string> {
    const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown-device';
    return deviceId;
  }

  private async getDeviceName(): Promise<string> {
    const deviceName = Device.deviceName || `${Device.modelName || 'Unknown Device'}`;
    return deviceName;
  }

  async validateLicense(licenseKey: string): Promise<LicenseValidation> {
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey.toUpperCase().trim())
      .single();

    if (licenseError || !license) {
      return { valid: false, license: null, deviceRegistered: false, devicesUsed: 0, maxDevices: 0, error: 'Licencia inválida' };
    }

    if (!license.active) {
      return { valid: false, license, deviceRegistered: false, devicesUsed: 0, maxDevices: license.max_devices, error: 'Licencia desactivada' };
    }

    if (license.trial_ends_at && new Date(license.trial_ends_at) < new Date()) {
      return { valid: false, license, deviceRegistered: false, devicesUsed: 0, maxDevices: license.max_devices, error: 'Periodo de prueba expirado' };
    }

    const deviceId = await this.getDeviceId();

    const { data: existingDevice } = await supabase
      .from('license_devices')
      .select('*')
      .eq('license_id', license.id)
      .eq('device_id', deviceId)
      .eq('active', true)
      .single();

    const { count: devicesUsed } = await supabase
      .from('license_devices')
      .select('*', { count: 'exact', head: true })
      .eq('license_id', license.id)
      .eq('active', true);

    return {
      valid: true,
      license,
      deviceRegistered: !!existingDevice,
      devicesUsed: devicesUsed || 0,
      maxDevices: license.max_devices,
    };
  }

  async registerDevice(licenseId: string, deviceName?: string): Promise<boolean> {
    const deviceId = await this.getDeviceId();
    const name = deviceName || await this.getDeviceName();

    const { error } = await supabase
      .from('license_devices')
      .insert({
        license_id: licenseId,
        device_id: deviceId,
        device_name: name,
        active: true,
      });

    return !error;
  }

  async unregisterDevice(deviceId: string): Promise<boolean> {
    const { error } = await supabase
      .from('license_devices')
      .update({ active: false })
      .eq('id', deviceId);

    return !error;
  }

  async getDevicesByLicense(licenseId: string): Promise<LicenseDevice[]> {
    const { data, error } = await supabase
      .from('license_devices')
      .select('*')
      .eq('license_id', licenseId)
      .eq('active', true)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getAllLicenses(): Promise<License[]> {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createLicense(complexName: string, maxDevices: number = 2, trialDays?: number): Promise<License> {
    const licenseKey = this.generateLicenseKey();
    const trialEndsAt = trialDays ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString() : null;

    const { data, error } = await supabase
      .from('licenses')
      .insert({
        license_key: licenseKey,
        complex_name: complexName,
        max_devices: maxDevices,
        active: true,
        trial_ends_at: trialEndsAt,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateLicense(id: string, updates: Partial<Pick<License, 'complex_name' | 'max_devices' | 'active' | 'trial_ends_at'>>): Promise<License> {
    const { data, error } = await supabase
      .from('licenses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteLicense(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', id);

    return !error;
  }

  async extendLicense(id: string, trialDays: number): Promise<License> {
    const newTrialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('licenses')
      .update({ trial_ends_at: newTrialEndsAt, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAllDevices(): Promise<(LicenseDevice & { license_key?: string; complex_name?: string })[]> {
    const { data, error } = await supabase
      .from('license_devices')
      .select('*, licenses(license_key, complex_name)')
      .eq('active', true)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(d => ({
      ...d,
      license_key: d.licenses?.license_key,
      complex_name: d.licenses?.complex_name,
    }));
  }

  async removeDevice(deviceId: string): Promise<boolean> {
    const { error } = await supabase
      .from('license_devices')
      .update({ active: false })
      .eq('id', deviceId);

    return !error;
  }

  private generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [4, 4, 4];
    return segments
      .map(len => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join(''))
      .join('-');
  }
}

export const licenseRepository = new LicenseRepository();
