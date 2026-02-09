import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { contractAPI } from '@/src/services/api';

export default function ContractRequestScreen() {
  const router = useRouter();
  const { machineId, machineName, hourlyRate, ownerId } = useLocalSearchParams<{
    machineId: string;
    machineName: string;
    hourlyRate: string;
    ownerId: string;
  }>();
  const { user } = useAuth();

  const [totalDays, setTotalDays] = useState('');
  const [transportCharges, setTransportCharges] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advancePaid, setAdvancePaid] = useState(false);
  const [initialFuelFilled, setInitialFuelFilled] = useState(false);
  const [initialFuelLiters, setInitialFuelLiters] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [wantsToNegotiate, setWantsToNegotiate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rate = wantsToNegotiate && proposedRate ? parseFloat(proposedRate) : parseFloat(hourlyRate || '0');
  const originalRate = parseFloat(hourlyRate || '0');
  const days = parseInt(totalDays) || 0;
  const estimatedHoursPerDay = 8;
  const totalAmount = days * estimatedHoursPerDay * rate + (parseFloat(transportCharges) || 0);
  const advance = parseFloat(advanceAmount) || 0;
  const remaining = totalAmount - advance;

  const handleSubmit = async () => {
    if (!totalDays || days <= 0) {
      Alert.alert('Error', 'Please enter valid number of days');
      return;
    }

    if (advance > totalAmount) {
      Alert.alert('Error', 'Advance amount cannot exceed total amount');
      return;
    }

    try {
      setIsSubmitting(true);
      await contractAPI.create({
        machine_id: machineId,
        renter_name: user?.name || '',
        renter_contact: user?.phone_or_email || '',
        total_days: days,
        advance_amount: advance,
        total_amount: totalAmount,
        transport_charges: parseFloat(transportCharges) || 0,
        transport_paid: advancePaid ? advance : 0,
        initial_fuel_filled: initialFuelFilled,
        initial_fuel_liters: parseFloat(initialFuelLiters) || 0,
        proposed_hourly_rate: wantsToNegotiate ? parseFloat(proposedRate) : null,
        original_hourly_rate: originalRate,
        negotiation_status: wantsToNegotiate ? 'pending' : 'none',
      });

      Alert.alert(
        'Success',
        'Contract request submitted! Waiting for owner approval.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/home'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Contract request error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit contract request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Contract</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Machine Info */}
          <View style={styles.machineCard}>
            <Ionicons name="construct" size={32} color="#f97316" />
            <View style={styles.machineInfo}>
              <Text style={styles.machineName}>{machineName}</Text>
              <Text style={styles.machineRate}>₹{rate}/hour</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Duration */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Contract Duration (Days) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter number of days"
                placeholderTextColor="#64748b"
                value={totalDays}
                onChangeText={setTotalDays}
                keyboardType="numeric"
              />
            </View>

            {/* Transport Charges */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Transport Charges (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter transport charges"
                placeholderTextColor="#64748b"
                value={transportCharges}
                onChangeText={setTransportCharges}
                keyboardType="numeric"
              />
            </View>

            {/* Initial Fuel */}
            <View style={styles.switchGroup}>
              <View style={styles.switchLabel}>
                <Ionicons name="water-outline" size={20} color="#3b82f6" />
                <Text style={styles.label}>Machine has initial fuel?</Text>
              </View>
              <Switch
                value={initialFuelFilled}
                onValueChange={setInitialFuelFilled}
                trackColor={{ false: '#334155', true: '#f97316' }}
                thumbColor={initialFuelFilled ? '#fff' : '#94a3b8'}
              />
            </View>

            {initialFuelFilled && (
              <View style={[styles.formGroup, styles.indented]}>
                <Text style={styles.label}>Fuel Quantity (Liters)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter liters"
                  placeholderTextColor="#64748b"
                  value={initialFuelLiters}
                  onChangeText={setInitialFuelLiters}
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Cost Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Cost Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimated Hours ({days} days × 8h)</Text>
                <Text style={styles.summaryValue}>{days * estimatedHoursPerDay}h</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rate</Text>
                <Text style={styles.summaryValue}>₹{rate}/h</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rental Cost</Text>
                <Text style={styles.summaryValue}>₹{(days * estimatedHoursPerDay * rate).toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Transport</Text>
                <Text style={styles.summaryValue}>₹{parseFloat(transportCharges) || 0}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{totalAmount.toLocaleString()}</Text>
              </View>
            </View>

            {/* Price Negotiation Section */}
            <View style={styles.negotiationSection}>
              <Text style={styles.sectionTitle}>💰 Price Negotiation</Text>
              
              <View style={styles.switchGroup}>
                <View style={styles.switchLabel}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#f97316" />
                  <Text style={styles.label}>Negotiate hourly rate?</Text>
                </View>
                <Switch
                  value={wantsToNegotiate}
                  onValueChange={setWantsToNegotiate}
                  trackColor={{ false: '#334155', true: '#f97316' }}
                  thumbColor={wantsToNegotiate ? '#fff' : '#94a3b8'}
                />
              </View>

              {wantsToNegotiate && (
                <View style={[styles.formGroup, styles.indented]}>
                  <Text style={styles.label}>Your Proposed Rate (\u20b9/hour)</Text>
                  <View style={styles.negotiationInputContainer}>
                    <Text style={styles.originalRate}>Original: \u20b9{originalRate}/h</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={`Propose your rate (e.g., ${Math.floor(originalRate * 0.9)})`}
                      placeholderTextColor="#64748b"
                      value={proposedRate}
                      onChangeText={setProposedRate}
                      keyboardType="numeric"
                    />
                  </View>
                  <Text style={styles.hint}>
                    {proposedRate && parseFloat(proposedRate) < originalRate 
                      ? `💚 Saving \u20b9${((originalRate - parseFloat(proposedRate)) * days * estimatedHoursPerDay).toLocaleString()}`
                      : 'Owner will review your proposed rate'}
                  </Text>
                </View>
              )}
            </View>

            {/* Advance Payment */}
            <View style={styles.advanceSection}>
              <Text style={styles.sectionTitle}>Advance Payment</Text>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Advance Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 6000"
                  placeholderTextColor="#64748b"
                  value={advanceAmount}
                  onChangeText={setAdvanceAmount}
                  keyboardType="numeric"
                />
                <Text style={styles.hint}>Remaining: ₹{remaining.toLocaleString()}</Text>
              </View>

              <View style={styles.switchGroup}>
                <View style={styles.switchLabel}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#22c55e" />
                  <Text style={styles.label}>I have paid the advance</Text>
                </View>
                <Switch
                  value={advancePaid}
                  onValueChange={setAdvancePaid}
                  trackColor={{ false: '#334155', true: '#22c55e' }}
                  thumbColor={advancePaid ? '#fff' : '#94a3b8'}
                />
              </View>
            </View>

            {/* Note */}
            <View style={styles.noteCard}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.noteText}>
                Your contract will be sent to the machine owner for approval. You'll receive a notification once approved.
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Submitting...</Text>
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Request</Text>
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
  machineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  machineInfo: {
    flex: 1,
  },
  machineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  machineRate: {
    fontSize: 14,
    color: '#f97316',
    marginTop: 2,
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
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  indented: {
    marginLeft: 32,
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  advanceSection: {
    marginBottom: 24,
  },
  negotiationSection: {
    marginBottom: 24,
  },
  negotiationInputContainer: {
    gap: 8,
  },
  originalRate: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
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
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
