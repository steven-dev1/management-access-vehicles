import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../lib/supabase';

const BUCKET = 'vehicle-images';
const MAX_IMAGES = 3;

export const vehicleImageService = {
  async pickImage(): Promise<string | null> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  },

  async takePhoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  },

  async uploadImage(vehicleId: string, imageUri: string): Promise<string> {
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    const fileName = `${vehicleId}/${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append('file', {
      uri: manipulated.uri,
      type: 'image/jpeg',
      name: fileName,
    } as any);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, formData, { contentType: 'image/jpeg' });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  },

  async deleteImage(imageUrl: string): Promise<void> {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf(BUCKET);
    if (bucketIndex === -1) return;
    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (error) throw error;
  },

  async updateVehicleImages(vehicleId: string, images: string[]): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .update({ images })
      .eq('id', vehicleId);

    if (error) throw error;
  },

  canAddMore(currentCount: number): boolean {
    return currentCount < MAX_IMAGES;
  },

  getMaxImages(): number {
    return MAX_IMAGES;
  },
};
