import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

interface ImagePickerComponentProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImagePickerComponent({
  images,
  onImagesChange,
  maxImages = 6,
}: ImagePickerComponentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxImages} images`);
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // Reduce quality for smaller base64 size
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        onImagesChange([...images, base64Image]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxImages} images`);
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow camera access');
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        onImagesChange([...images, base64Image]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Machine Photos ({images.length}/{maxImages})</Text>
      <Text style={styles.hint}>Add photos of your machine for better visibility</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
        {images.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}

        {images.length < maxImages && (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={pickImage}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#f97316" />
              ) : (
                <>
                  <Ionicons name="images-outline" size={32} color="#f97316" />
                  <Text style={styles.addButtonText}>Gallery</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              onPress={takePhoto}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#f97316" />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={32} color="#f97316" />
                  <Text style={styles.addButtonText}>Camera</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  imageScroll: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderWidth: 2,
    borderColor: '#f97316',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#f97316',
  },
});
