import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView, Modal, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';
import { vehicleImageService } from '../../../lib/vehicleImage.service';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VehicleImageGalleryProps {
  vehicleId: string;
  images: string[];
  onImagesUpdate: (images: string[]) => void;
  editable?: boolean;
}

export const VehicleImageGallery: React.FC<VehicleImageGalleryProps> = ({
  vehicleId,
  images,
  onImagesUpdate,
  editable = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (viewerVisible && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: activeIndex * SCREEN_WIDTH, animated: false });
      }, 50);
    }
  }, [viewerVisible, activeIndex]);

  const handleAddImage = () => {
    if (!vehicleImageService.canAddMore(images.length)) {
      Alert.alert('Límite alcanzado', `Máximo ${vehicleImageService.getMaxImages()} fotos por vehículo`);
      return;
    }

    Alert.alert('Agregar foto', 'Selecciona una opción', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cámara', onPress: handleTakePhoto },
      { text: 'Galería', onPress: handlePickImage },
    ]);
  };

  const handlePickImage = async () => {
    const uri = await vehicleImageService.pickImage();
    if (uri) await uploadNewImage(uri);
  };

  const handleTakePhoto = async () => {
    const uri = await vehicleImageService.takePhoto();
    if (uri) await uploadNewImage(uri);
  };

  const uploadNewImage = async (uri: string) => {
    try {
      setUploading(true);
      const url = await vehicleImageService.uploadImage(vehicleId, uri);
      const newImages = [...images, url];
      await vehicleImageService.updateVehicleImages(vehicleId, newImages);
      onImagesUpdate(newImages);
    } catch (err) {
      Alert.alert('Error', 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = (index: number) => {
    Alert.alert('Eliminar foto', '¿Estás seguro de eliminar esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            setUploading(true);
            await vehicleImageService.deleteImage(images[index]);
            const newImages = images.filter((_, i) => i !== index);
            await vehicleImageService.updateVehicleImages(vehicleId, newImages);
            onImagesUpdate(newImages);
            if (activeIndex >= newImages.length) {
              setActiveIndex(Math.max(0, newImages.length - 1));
            }
          } catch (err) {
            Alert.alert('Error', 'No se pudo eliminar la imagen');
          } finally {
            setUploading(false);
          }
        },
      },
    ]);
  };

  const openViewer = (index: number) => {
    setActiveIndex(index);
    setViewerVisible(true);
  };

  if (images.length === 0 && !editable) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {images.map((uri, index) => (
          <TouchableOpacity
            key={index}
            style={styles.imageWrapper}
            onPress={() => openViewer(index)}
            activeOpacity={0.8}
          >
            <Image source={{ uri }} style={styles.image} />
            {editable && (
              <TouchableOpacity
                style={styles.deleteBadge}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleDeleteImage(index);
                }}
              >
                <Ionicons name="close" size={12} color={COLORS.text} />
              </TouchableOpacity>
            )}
            <View style={styles.imageIndex}>
              <Text style={styles.imageIndexText}>{index + 1}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {editable && vehicleImageService.canAddMore(images.length) && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddImage} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <>
                <Ionicons name="camera" size={24} color={COLORS.primary} />
                <Text style={styles.addButtonText}>Agregar</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.viewerOverlay}>
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerCounter}>
              {activeIndex + 1} / {images.length}
            </Text>
            <TouchableOpacity style={styles.viewerCloseBtn} onPress={() => setViewerVisible(false)}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.viewerScrollContent}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveIndex(index);
            }}
          >
            {images.map((uri, index) => (
              <ZoomableImage key={index} uri={uri} />
            ))}
          </ScrollView>

          {images.length > 1 && (
            <View style={styles.viewerDots}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, index === activeIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {editable && (
            <View style={styles.viewerFooter}>
              <TouchableOpacity
                style={styles.viewerDeleteBtn}
                onPress={() => {
                  handleDeleteImage(activeIndex);
                  if (images.length <= 1) setViewerVisible(false);
                }}
              >
                <Ionicons name="trash" size={20} color={COLORS.danger} />
                <Text style={styles.viewerDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const ZoomableImage: React.FC<{ uri: string }> = ({ uri }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);
  const panRef = useRef({ dx: 0, dy: 0 });
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const handleDoubleTap = () => {
    const newScale = lastScale.current === 1 ? 2.5 : 1;
    lastScale.current = newScale;

    Animated.parallel([
      Animated.spring(scale, { toValue: newScale, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateX.setOffset(panRef.current.dx);
        translateY.setOffset(panRef.current.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (lastScale.current > 1) {
          panRef.current.dx = gestureState.dx;
          panRef.current.dy = gestureState.dy;
          translateX.setValue(gestureState.dx);
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: () => {
        translateX.flattenOffset();
        translateY.flattenOffset();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.zoomContainer, { transform: [{ scale }, { translateX }, { translateY }] }]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap}>
        <Image source={{ uri }} style={styles.viewerImage} resizeMode="contain" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    gap: 10,
    paddingRight: 16,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: 160,
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
  },
  deleteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  imageIndex: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  imageIndexText: {
    fontSize: 10,
    color: COLORS.text,
    fontWeight: '600',
  },
  addButton: {
    width: 160,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '08',
  },
  addButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  viewerCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  viewerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerScrollContent: {
    alignItems: 'center',
  },
  zoomContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65,
  },
  viewerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
  viewerFooter: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  viewerDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 12,
  },
  viewerDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.danger,
  },
});
