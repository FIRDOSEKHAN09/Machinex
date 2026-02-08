import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { machineAPI } from '@/src/services/api';
import ImagePickerComponent from '@/src/components/ImagePickerComponent';

export default function EditMachineScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [modelName, setModelName] = useState('');
  const [machineType, setMachineType] = useState('');
  const [engineCapacity, setEngineCapacity] = useState('');
  const [fuelType, setFuelType] = useState('Diesel');
  const [hourlyRate, setHourlyRate] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [gpsLatitude, setGpsLatitude] = useState('');
  const [gpsLongitude, setGpsLongitude] = useState('');
  const [operationalRadius, setOperationalRadius] = useState('50');
  const [images, setImages] = useState<string[]>([]);
  const [initialFuelLiters, setInitialFuelLiters] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const machineTypes = ['Excavator', 'Bulldozer', 'Crane', 'Loader', 'Grader', 'Other'];
  const fuelTypes = ['Diesel (HSD)', 'Petrol', 'Electric', 'Hybrid'];

  const fetchMachine = async () => {
    try {
      const res = await machineAPI.getOne(id);
      const machine = res.data;
      setModelName(machine.model_name);
      setMachineType(machine.machine_type);
      setEngineCapacity(machine.engine_capacity);
      setFuelType(machine.fuel_type);
      setHourlyRate(machine.hourly_rate.toString());
      setDescription(machine.description || '');
      setCity(machine.city || '');
      setGpsLatitude(machine.gps_latitude?.toString() || '');
      setGpsLongitude(machine.gps_longitude?.toString() || '');
      setOperationalRadius(machine.operational_radius_km?.toString() || '50');
      setImages(machine.images || []);
      setInitialFuelLiters(machine.initial_fuel_liters?.toString() || '');
    } catch (error) {
      console.error('Error fetching machine:', error);
      Alert.alert('Error', 'Failed to load machine details');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchMachine();
      }
    }, [id])
  );

  const handleSave = async () => {
    if (!modelName.trim() || !machineType || !engineCapacity.trim() || !fuelType || !hourlyRate || !city.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      await machineAPI.update(id, {
        model_name: modelName.trim(),
        machine_type: machineType,
        engine_capacity: engineCapacity.trim(),
        fuel_type: fuelType,
        hourly_rate: parseFloat(hourlyRate),
        description: description.trim(),
        city: city.trim(),
        gps_latitude: gpsLatitude ? parseFloat(gpsLatitude) : null,
        gps_longitude: gpsLongitude ? parseFloat(gpsLongitude) : null,
        operational_radius_km: operationalRadius ? parseFloat(operationalRadius) : 50,
        images: images,
        initial_fuel_liters: initialFuelLiters ? parseFloat(initialFuelLiters) : 0,
      });
      
      Alert.alert('Success', 'Machine updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error updating machine:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update machine');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Machine</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <ImagePickerComponent images={images} onImagesChange={setImages} maxImages={6} />

            <View style={styles.formGroup}>
              <Text style={styles.label}>Model Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., JCB 3DX"
                placeholderTextColor="#64748b"
                value={modelName}
                onChangeText={setModelName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Hourly Rate (\u20b9) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1500"
                placeholderTextColor="#64748b"
                value={hourlyRate}
                onChangeText={setHourlyRate}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Initial Fuel (Liters)</Text>
              <TextInput
                style={styles.input}
                placeholder="Fuel already in tank (optional)"
                placeholderTextColor="#64748b"
                value={initialFuelLiters}
                onChangeText={setInitialFuelLiters}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Engine Capacity *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 74 HP"
                placeholderTextColor="#64748b"
                value={engineCapacity}
                onChangeText={setEngineCapacity}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Bangalore"
                placeholderTextColor="#64748b"
                value={city}
                onChangeText={setCity}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional details about the machine..."
                placeholderTextColor="#64748b"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
