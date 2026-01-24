import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fuelPricesAPI } from '../../src/services/api';

export default function FuelPricesScreen() {
  const router = useRouter();
  const [petrolPrice, setPetrolPrice] = useState('');
  const [engineOilPrice, setEngineOilPrice] = useState('');
  const [greaseOilPrice, setGreaseOilPrice] = useState('');
  const [hydraulicOilPrice, setHydraulicOilPrice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await fuelPricesAPI.get();
      const prices = response.data;
      setPetrolPrice(prices.petrol_price?.toString() || '');
      setEngineOilPrice(prices.engine_oil_price?.toString() || '');
      setGreaseOilPrice(prices.grease_oil_price?.toString() || '');
      setHydraulicOilPrice(prices.hydraulic_oil_price?.toString() || '');
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!petrolPrice || !engineOilPrice || !greaseOilPrice || !hydraulicOilPrice) {
      Alert.alert('Error', 'Please fill in all prices');
      return;
    }

    setIsSaving(true);
    try {
      await fuelPricesAPI.update({
        petrol_price: parseFloat(petrolPrice),
        engine_oil_price: parseFloat(engineOilPrice),
        grease_oil_price: parseFloat(greaseOilPrice),
        hydraulic_oil_price: parseFloat(hydraulicOilPrice),
      });
      
      Alert.alert('Success', 'Fuel prices updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update prices');
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fuel Prices</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#f97316" />
            <Text style={styles.infoText}>
              Set the prices for fuel and oils. These will be used to calculate expenses when filling is done by users.
            </Text>
          </View>

          <View style={styles.form}>
            {/* Petrol Price */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="water" size={20} color="#f97316" />
                <Text style={styles.label}>Petrol Price (per liter)</Text>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="100"
                  placeholderTextColor="#64748b"
                  value={petrolPrice}
                  onChangeText={setPetrolPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Engine Oil Price */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="color-fill" size={20} color="#3b82f6" />
                <Text style={styles.label}>Engine Oil Price (per liter)</Text>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="500"
                  placeholderTextColor="#64748b"
                  value={engineOilPrice}
                  onChangeText={setEngineOilPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Grease Oil Price */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="beaker" size={20} color="#a855f7" />
                <Text style={styles.label}>Grease Oil Price (per liter)</Text>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="300"
                  placeholderTextColor="#64748b"
                  value={greaseOilPrice}
                  onChangeText={setGreaseOilPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Hydraulic Oil Price */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="flask" size={20} color="#22c55e" />
                <Text style={styles.label}>Hydraulic Oil Price (per liter)</Text>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="400"
                  placeholderTextColor="#64748b"
                  value={hydraulicOilPrice}
                  onChangeText={setHydraulicOilPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Prices'}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#f97316',
    lineHeight: 20,
  },
  form: {
    padding: 16,
    gap: 20,
  },
  inputGroup: {
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f8fafc',
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
  currencySymbol: {
    fontSize: 18,
    color: '#f97316',
    fontWeight: '600',
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 52,
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#0f172a',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
