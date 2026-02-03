import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { machineAPI } from '@/src/services/api';

const MACHINE_TYPES = [
  'Excavator',
  'Bulldozer',
  'Crane',
  'Loader',
  'Backhoe',
  'Tractor',
  'Other',
];

const FUEL_TYPES = ['Diesel', 'Petrol', 'Electric', 'Hybrid'];

export default function AddMachineScreen() {
  const router = useRouter();
  const [modelName, setModelName] = useState('');
  const [machineType, setMachineType] = useState('');
  const [engineCapacity, setEngineCapacity] = useState('');
  const [fuelType, setFuelType] = useState('Diesel'); // Default to Diesel
  const [hourlyRate, setHourlyRate] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [gpsLatitude, setGpsLatitude] = useState('');
  const [gpsLongitude, setGpsLongitude] = useState('');
  const [operationalRadius, setOperationalRadius] = useState('50'); // Default 50km
  const [isLoading, setIsLoading] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showFuelDropdown, setShowFuelDropdown] = useState(false);

  const handleSubmit = async () => {
    if (!modelName.trim() || !machineType || !engineCapacity.trim() || !fuelType || !hourlyRate || !city.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (including city)');
      return;
    }

    setIsLoading(true);
    try {
      await machineAPI.create({
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
      });
      
      Alert.alert('Success', 'Machine added successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error adding machine:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add machine');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Machine</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            {/* Model Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Model Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="construct-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., JCB 3DX"
                  placeholderTextColor="#64748b"
                  value={modelName}
                  onChangeText={setModelName}
                />
              </View>
            </View>

            {/* Machine Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Machine Type *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setShowTypeDropdown(!showTypeDropdown);
                  setShowFuelDropdown(false);
                }}
              >
                <Ionicons name="options-outline" size={20} color="#94a3b8" />
                <Text style={[styles.dropdownText, !machineType && styles.placeholderText]}>
                  {machineType || 'Select machine type'}
                </Text>
                <Ionicons name={showTypeDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#94a3b8" />
              </TouchableOpacity>
              {showTypeDropdown && (
                <View style={styles.dropdown}>
                  {MACHINE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.dropdownItem, machineType === type && styles.dropdownItemSelected]}
                      onPress={() => {
                        setMachineType(type);
                        setShowTypeDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, machineType === type && styles.dropdownItemTextSelected]}>
                        {type}
                      </Text>
                      {machineType === type && (
                        <Ionicons name="checkmark" size={18} color="#f97316" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Engine Capacity */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Engine Capacity *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="speedometer-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 92 HP"
                  placeholderTextColor="#64748b"
                  value={engineCapacity}
                  onChangeText={setEngineCapacity}
                />
              </View>
            </View>

            {/* Fuel Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fuel Type *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setShowFuelDropdown(!showFuelDropdown);
                  setShowTypeDropdown(false);
                }}
              >
                <Ionicons name="water-outline" size={20} color="#94a3b8" />
                <Text style={[styles.dropdownText, !fuelType && styles.placeholderText]}>
                  {fuelType || 'Select fuel type'}
                </Text>
                <Ionicons name={showFuelDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#94a3b8" />
              </TouchableOpacity>
              {showFuelDropdown && (
                <View style={styles.dropdown}>
                  {FUEL_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.dropdownItem, fuelType === type && styles.dropdownItemSelected]}
                      onPress={() => {
                        setFuelType(type);
                        setShowFuelDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, fuelType === type && styles.dropdownItemTextSelected]}>
                        {type}
                      </Text>
                      {fuelType === type && (
                        <Ionicons name="checkmark" size={18} color="#f97316" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Rates */}
            <View style={styles.ratesRow}>
              <View style={[styles.inputGroup, styles.rateInput]}>
                <Text style={styles.label}>Hourly Rate (₹) *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="time-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="500"
                    placeholderTextColor="#64748b"
                    value={hourlyRate}
                    onChangeText={setHourlyRate}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Location Section */}
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color="#f97316" />
              <Text style={styles.sectionTitle}>Location Details</Text>
            </View>

            {/* City */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>City *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mumbai"
                  placeholderTextColor="#64748b"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>

            {/* GPS Coordinates (Optional) */}
            <View style={styles.ratesRow}>
              <View style={[styles.inputGroup, styles.rateInput]}>
                <Text style={styles.label}>GPS Latitude (Optional)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="navigate-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="19.0760"
                    placeholderTextColor="#64748b"
                    value={gpsLatitude}
                    onChangeText={setGpsLatitude}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, styles.rateInput]}>
                <Text style={styles.label}>GPS Longitude (Optional)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="navigate-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="72.8777"
                    placeholderTextColor="#64748b"
                    value={gpsLongitude}
                    onChangeText={setGpsLongitude}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            {/* Operational Radius */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Operational Radius (KM)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="radio-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="50"
                  placeholderTextColor="#64748b"
                  value={operationalRadius}
                  onChangeText={setOperationalRadius}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.helperText}>How far can this machine operate from its base location?</Text>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add details about the machine..."
                  placeholderTextColor="#64748b"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Adding...' : 'Add Machine'}
            </Text>
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
  keyboardView: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    color: '#f8fafc',
    fontSize: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#f8fafc',
  },
  placeholderText: {
    color: '#64748b',
  },
  dropdown: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#f8fafc',
  },
  dropdownItemTextSelected: {
    color: '#f97316',
    fontWeight: '500',
  },
  ratesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rateInput: {
    flex: 1,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: '#0f172a',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
