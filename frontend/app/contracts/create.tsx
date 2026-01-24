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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { contractAPI } from '../../src/services/api';

export default function CreateContractScreen() {
  const router = useRouter();
  const { machineId, machineName } = useLocalSearchParams<{ machineId: string; machineName: string }>();
  
  const [renterName, setRenterName] = useState('');
  const [renterContact, setRenterContact] = useState('');
  const [totalDays, setTotalDays] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!renterName.trim() || !renterContact.trim() || !totalDays || !advanceAmount || !totalAmount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const advance = parseFloat(advanceAmount);
    const total = parseFloat(totalAmount);

    if (advance > total) {
      Alert.alert('Error', 'Advance amount cannot exceed total amount');
      return;
    }

    setIsLoading(true);
    try {
      const response = await contractAPI.create({
        machine_id: machineId,
        renter_name: renterName.trim(),
        renter_contact: renterContact.trim(),
        total_days: parseInt(totalDays),
        advance_amount: advance,
        total_amount: total,
      });
      
      Alert.alert('Success', 'Contract created successfully', [
        { text: 'OK', onPress: () => router.push(`/contracts/${response.data.id}`) },
      ]);
    } catch (error: any) {
      console.error('Error creating contract:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create contract');
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
          <Text style={styles.headerTitle}>Create Contract</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {/* Machine Info */}
          <View style={styles.machineInfo}>
            <View style={styles.machineIcon}>
              <Ionicons name="construct" size={24} color="#f97316" />
            </View>
            <View>
              <Text style={styles.machineLabel}>Machine</Text>
              <Text style={styles.machineName}>{machineName}</Text>
            </View>
          </View>

          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Renter Information</Text>
            
            {/* Renter Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Renter Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter renter name"
                  placeholderTextColor="#64748b"
                  value={renterName}
                  onChangeText={setRenterName}
                />
              </View>
            </View>

            {/* Renter Contact */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Number *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor="#64748b"
                  value={renterContact}
                  onChangeText={setRenterContact}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Contract Details</Text>

            {/* Total Days */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contract Duration (Days) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Number of days"
                  placeholderTextColor="#64748b"
                  value={totalDays}
                  onChangeText={setTotalDays}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Amounts */}
            <View style={styles.amountsRow}>
              <View style={[styles.inputGroup, styles.amountInput]}>
                <Text style={styles.label}>Total Amount (₹) *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="cash-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Total"
                    placeholderTextColor="#64748b"
                    value={totalAmount}
                    onChangeText={setTotalAmount}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, styles.amountInput]}>
                <Text style={styles.label}>Advance (₹) *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="wallet-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Advance"
                    placeholderTextColor="#64748b"
                    value={advanceAmount}
                    onChangeText={setAdvanceAmount}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Summary */}
            {totalAmount && advanceAmount && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Payment Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Amount</Text>
                  <Text style={styles.summaryValue}>₹{parseFloat(totalAmount || '0').toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Advance Paid</Text>
                  <Text style={[styles.summaryValue, styles.greenText]}>- ₹{parseFloat(advanceAmount || '0').toLocaleString()}</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Remaining</Text>
                  <Text style={styles.summaryTotalValue}>
                    ₹{(parseFloat(totalAmount || '0') - parseFloat(advanceAmount || '0')).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
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
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Creating...' : 'Create Contract'}
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
  machineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  machineIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  machineLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  machineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  form: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 8,
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
  amountsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  amountInput: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f8fafc',
  },
  greenText: {
    color: '#22c55e',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginTop: 8,
    paddingTop: 12,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f97316',
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    padding: 16,
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
