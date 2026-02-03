import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { dailyLogAPI, consumablesAPI, dieselPriceAPI } from '@/src/services/api';
import { useAuth } from '@/src/context/AuthContext';

export default function DailyLogScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { contractId, dayNumber, machineName } = useLocalSearchParams<{ contractId: string; dayNumber: string; machineName: string }>();
  
  const [dieselFilled, setDieselFilled] = useState('');
  const [dieselUsed, setDieselUsed] = useState('');
  const [dieselPrice, setDieselPrice] = useState(0);
  const [filledBy, setFilledBy] = useState<'owner' | 'user'>('owner');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showConsumableModal, setShowConsumableModal] = useState(false);
  const [consumableType, setConsumableType] = useState<'engine_oil' | 'hydraulic_oil' | 'grease_oil'>('engine_oil');
  const [consumableQuantity, setConsumableQuantity] = useState('');
  const [consumablePrice, setConsumablePrice] = useState('');

  useEffect(() => {
    fetchDieselPrice();
  }, []);

  const fetchDieselPrice = async () => {
    try {
      const res = await dieselPriceAPI.get();
      setDieselPrice(res.data?.price_per_liter || 95);
    } catch (error) {
      console.error('Error fetching diesel price:', error);
      setDieselPrice(95);
    }
  };

  const handleSubmit = async () => {
    if (!dieselFilled && !dieselUsed) {
      Alert.alert('Error', 'Please enter diesel filled or used');
      return;
    }

    setIsSaving(true);
    try {
      await dailyLogAPI.create({
        contract_id: contractId,
        day_number: parseInt(dayNumber),
        diesel_filled: parseFloat(dieselFilled) || 0,
        diesel_used: parseFloat(dieselUsed) || 0,
        diesel_price_snapshot: dieselPrice,
        engine_oil: 0,
        grease_oil: 0,
        hydraulic_oil: 0,
        filled_by: filledBy,
        notes: notes.trim(),
      });
      Alert.alert('Success', 'Daily log saved successfully');
      router.back();
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save daily log');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddConsumable = async () => {
    if (!consumableQuantity || !consumablePrice) {
      Alert.alert('Error', 'Please enter quantity and price');
      return;
    }

    try {
      await consumablesAPI.add({
        contract_id: contractId,
        day_number: parseInt(dayNumber),
        consumable_type: consumableType,
        quantity: parseFloat(consumableQuantity),
        price_per_unit: parseFloat(consumablePrice),
        filled_by: filledBy,
      });
      Alert.alert('Success', 'Consumable added successfully');
      setShowConsumableModal(false);
      setConsumableQuantity('');
      setConsumablePrice('');
    } catch (error: any) {
      console.error('Add consumable error:', error);
      Alert.alert('Error', 'Failed to add consumable');
    }
  };

  const dieselCost = (parseFloat(dieselFilled) || 0) * dieselPrice;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Daily Log - Day {dayNumber}</Text>
            <Text style={styles.headerSubtitle}>{machineName}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.card}>
            <View style={styles.priceHeader}>
              <Text style={styles.cardTitle}>Diesel (HSD)</Text>
              <View style={styles.priceTag}>
                <Text style={styles.priceText}>₹{dieselPrice}/L</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Diesel Filled (Liters)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="water" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="50" placeholderTextColor="#64748b" value={dieselFilled} onChangeText={setDieselFilled} keyboardType="decimal-pad" />
              </View>
              {dieselFilled && <Text style={styles.costText}>Cost: ₹{dieselCost.toFixed(2)}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Diesel Used (Liters)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="flame" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="40" placeholderTextColor="#64748b" value={dieselUsed} onChangeText={setDieselUsed} keyboardType="decimal-pad" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Filled By</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity style={styles.radioOption} onPress={() => setFilledBy('owner')}>
                  <View style={[styles.radio, filledBy === 'owner' && styles.radioSelected]}>
                    {filledBy === 'owner' && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.radioLabel}>Owner</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.radioOption} onPress={() => setFilledBy('user')}>
                  <View style={[styles.radio, filledBy === 'user' && styles.radioSelected]}>
                    {filledBy === 'user' && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.radioLabel}>Renter</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>{filledBy === 'user' ? 'Cost will be deducted from contract amount' : 'Cost included in owner expenses'}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.addConsumableButton} onPress={() => setShowConsumableModal(true)}>
            <Ionicons name="add-circle" size={24} color="#f97316" />
            <Text style={styles.addConsumableText}>Add Consumable</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Additional notes..." placeholderTextColor="#64748b" value={notes} onChangeText={setNotes} multiline numberOfLines={4} textAlignVertical="top" />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.submitButton, isSaving && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isSaving}>
            <Text style={styles.submitButtonText}>{isSaving ? 'Saving...' : 'Save Daily Log'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showConsumableModal} transparent animationType="slide" onRequestClose={() => setShowConsumableModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Consumable</Text>
              <TouchableOpacity onPress={() => setShowConsumableModal(false)}>
                <Ionicons name="close" size={24} color="#f8fafc" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Consumable Type</Text>
              <View style={styles.dropdownButtons}>
                <TouchableOpacity style={[styles.dropdownButton, consumableType === 'engine_oil' && styles.dropdownButtonActive]} onPress={() => setConsumableType('engine_oil')}>
                  <Text style={[styles.dropdownButtonText, consumableType === 'engine_oil' && styles.dropdownButtonTextActive]}>Engine Oil (L)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.dropdownButton, consumableType === 'hydraulic_oil' && styles.dropdownButtonActive]} onPress={() => setConsumableType('hydraulic_oil')}>
                  <Text style={[styles.dropdownButtonText, consumableType === 'hydraulic_oil' && styles.dropdownButtonTextActive]}>Hydraulic Oil (L)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.dropdownButton, consumableType === 'grease_oil' && styles.dropdownButtonActive]} onPress={() => setConsumableType('grease_oil')}>
                  <Text style={[styles.dropdownButtonText, consumableType === 'grease_oil' && styles.dropdownButtonTextActive]}>Grease (Kg)</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantity</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} placeholder="10" placeholderTextColor="#64748b" value={consumableQuantity} onChangeText={setConsumableQuantity} keyboardType="decimal-pad" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price per Unit (₹)</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} placeholder="150" placeholderTextColor="#64748b" value={consumablePrice} onChangeText={setConsumablePrice} keyboardType="decimal-pad" />
              </View>
            </View>

            <TouchableOpacity style={styles.modalSubmitButton} onPress={handleAddConsumable}>
              <Text style={styles.modalSubmitButtonText}>Add Consumable</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#f8fafc' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 2 },
  scrollView: { flex: 1, padding: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  priceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
  priceTag: { backgroundColor: 'rgba(249, 115, 22, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  priceText: { fontSize: 14, fontWeight: 'bold', color: '#f97316' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#94a3b8', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#334155' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#f8fafc' },
  textArea: { height: 100, paddingTop: 12 },
  costText: { fontSize: 14, color: '#22c55e', marginTop: 8, fontWeight: '600' },
  helperText: { fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' },
  radioGroup: { flexDirection: 'row', gap: 24 },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#64748b', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#f97316' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#f97316' },
  radioLabel: { fontSize: 14, color: '#f8fafc' },
  addConsumableButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249, 115, 22, 0.1)', borderRadius: 12, paddingVertical: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f97316', borderStyle: 'dashed', gap: 8 },
  addConsumableText: { fontSize: 16, fontWeight: '600', color: '#f97316' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#1e293b' },
  submitButton: { backgroundColor: '#f97316', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc' },
  dropdownButtons: { gap: 8 },
  dropdownButton: { backgroundColor: '#0f172a', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#334155' },
  dropdownButtonActive: { backgroundColor: 'rgba(249, 115, 22, 0.2)', borderColor: '#f97316' },
  dropdownButtonText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', fontWeight: '500' },
  dropdownButtonTextActive: { color: '#f97316', fontWeight: '600' },
  modalSubmitButton: { backgroundColor: '#f97316', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  modalSubmitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});