import React, { useState, useEffect, useRef } from 'react';
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
import { dailyLogAPI, fuelPricesAPI } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

export default function DailyLogScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { contractId, dayNumber, machineName } = useLocalSearchParams<{ 
    contractId: string; 
    dayNumber: string;
    machineName: string;
  }>();
  
  const [existingLog, setExistingLog] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [petrolFilled, setPetrolFilled] = useState('');
  const [petrolUsed, setPetrolUsed] = useState('');
  const [engineOil, setEngineOil] = useState('');
  const [greaseOil, setGreaseOil] = useState('');
  const [hydraulicOil, setHydraulicOil] = useState('');
  const [filledBy, setFilledBy] = useState<'owner' | 'user'>('owner');
  const [notes, setNotes] = useState('');
  const [fuelPrices, setFuelPrices] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchData();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [logsRes, pricesRes] = await Promise.all([
        dailyLogAPI.getByContract(contractId),
        fuelPricesAPI.get(),
      ]);
      
      setFuelPrices(pricesRes.data);
      
      const dayLog = logsRes.data?.find((log: any) => log.day_number === parseInt(dayNumber));
      if (dayLog) {
        setExistingLog(dayLog);
        setPetrolFilled(dayLog.petrol_filled?.toString() || '');
        setPetrolUsed(dayLog.petrol_used?.toString() || '');
        setEngineOil(dayLog.engine_oil?.toString() || '');
        setGreaseOil(dayLog.grease_oil?.toString() || '');
        setHydraulicOil(dayLog.hydraulic_oil?.toString() || '');
        setFilledBy(dayLog.filled_by || 'owner');
        setNotes(dayLog.notes || '');
        setElapsedSeconds(Math.round((dayLog.working_hours || 0) * 3600));
        
        // Check if timer is running
        if (dayLog.start_time && !dayLog.end_time) {
          setIsRunning(true);
          const startTime = new Date(dayLog.start_time).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000) + Math.round((dayLog.working_hours || 0) * 3600);
          setElapsedSeconds(elapsed);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartStop = async () => {
    try {
      const response = await dailyLogAPI.engineTimer({
        contract_id: contractId,
        day_number: parseInt(dayNumber),
        action: isRunning ? 'stop' : 'start',
      });
      
      setExistingLog(response.data);
      setIsRunning(!isRunning);
      
      if (!isRunning) {
        // Starting - reset elapsed for fresh counting
      } else {
        // Stopping - update elapsed with server value
        setElapsedSeconds(Math.round((response.data.working_hours || 0) * 3600));
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update timer');
    }
  };

  const calculateExpenses = () => {
    if (!fuelPrices) return 0;
    return (
      (parseFloat(petrolFilled) || 0) * fuelPrices.petrol_price +
      (parseFloat(engineOil) || 0) * fuelPrices.engine_oil_price +
      (parseFloat(greaseOil) || 0) * fuelPrices.grease_oil_price +
      (parseFloat(hydraulicOil) || 0) * fuelPrices.hydraulic_oil_price
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (existingLog) {
        await dailyLogAPI.update(existingLog.id, {
          petrol_filled: parseFloat(petrolFilled) || 0,
          petrol_used: parseFloat(petrolUsed) || 0,
          engine_oil: parseFloat(engineOil) || 0,
          grease_oil: parseFloat(greaseOil) || 0,
          hydraulic_oil: parseFloat(hydraulicOil) || 0,
          filled_by: filledBy,
          notes: notes,
        });
      } else {
        await dailyLogAPI.create({
          contract_id: contractId,
          day_number: parseInt(dayNumber),
          petrol_filled: parseFloat(petrolFilled) || 0,
          petrol_used: parseFloat(petrolUsed) || 0,
          engine_oil: parseFloat(engineOil) || 0,
          grease_oil: parseFloat(greaseOil) || 0,
          hydraulic_oil: parseFloat(hydraulicOil) || 0,
          filled_by: filledBy,
          notes: notes,
        });
      }
      
      Alert.alert('Success', 'Daily log saved successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save daily log');
    } finally {
      setIsSaving(false);
    }
  };

  const isOwner = user?.role === 'owner';

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
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Day {dayNumber}</Text>
            <Text style={styles.headerSubtitle}>{machineName}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {/* Engine Timer */}
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>Working Hours</Text>
            <Text style={styles.timerValue}>{formatTime(elapsedSeconds)}</Text>
            <TouchableOpacity
              style={[styles.timerButton, isRunning && styles.timerButtonStop]}
              onPress={handleStartStop}
            >
              <Ionicons name={isRunning ? 'stop' : 'play'} size={24} color="#fff" />
              <Text style={styles.timerButtonText}>
                {isRunning ? 'Stop Engine' : 'Start Engine'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fuel/Oil Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fuel & Oil Consumption</Text>
            
            {/* Filled By Toggle */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Filled By:</Text>
              <View style={styles.toggleButtons}>
                <TouchableOpacity
                  style={[styles.toggleButton, filledBy === 'owner' && styles.toggleButtonActive]}
                  onPress={() => setFilledBy('owner')}
                >
                  <Text style={[styles.toggleButtonText, filledBy === 'owner' && styles.toggleButtonTextActive]}>
                    Owner
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, filledBy === 'user' && styles.toggleButtonActive]}
                  onPress={() => setFilledBy('user')}
                >
                  <Text style={[styles.toggleButtonText, filledBy === 'user' && styles.toggleButtonTextActive]}>
                    User/Farmer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {filledBy === 'user' && (
              <View style={styles.warningBanner}>
                <Ionicons name="information-circle" size={18} color="#f97316" />
                <Text style={styles.warningText}>
                  Expenses will be deducted from the contract total
                </Text>
              </View>
            )}

            <View style={styles.inputsGrid}>
              {/* Petrol Filled */}
              <View style={styles.gridItem}>
                <Text style={styles.inputLabel}>Petrol Filled (L)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="water" size={18} color="#f97316" />
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    value={petrolFilled}
                    onChangeText={setPetrolFilled}
                    keyboardType="numeric"
                  />
                </View>
                {fuelPrices && <Text style={styles.priceHint}>₹{fuelPrices.petrol_price}/L</Text>}
              </View>

              {/* Petrol Used */}
              <View style={styles.gridItem}>
                <Text style={styles.inputLabel}>Petrol Used (L)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="flame" size={18} color="#ef4444" />
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    value={petrolUsed}
                    onChangeText={setPetrolUsed}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Engine Oil */}
              <View style={styles.gridItem}>
                <Text style={styles.inputLabel}>Engine Oil (L)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="color-fill" size={18} color="#3b82f6" />
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    value={engineOil}
                    onChangeText={setEngineOil}
                    keyboardType="numeric"
                  />
                </View>
                {fuelPrices && <Text style={styles.priceHint}>₹{fuelPrices.engine_oil_price}/L</Text>}
              </View>

              {/* Grease Oil */}
              <View style={styles.gridItem}>
                <Text style={styles.inputLabel}>Grease Oil (L)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="beaker" size={18} color="#a855f7" />
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    value={greaseOil}
                    onChangeText={setGreaseOil}
                    keyboardType="numeric"
                  />
                </View>
                {fuelPrices && <Text style={styles.priceHint}>₹{fuelPrices.grease_oil_price}/L</Text>}
              </View>

              {/* Hydraulic Oil */}
              <View style={[styles.gridItem, styles.gridItemFull]}>
                <Text style={styles.inputLabel}>Hydraulic Oil (L)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="flask" size={18} color="#22c55e" />
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    value={hydraulicOil}
                    onChangeText={setHydraulicOil}
                    keyboardType="numeric"
                  />
                </View>
                {fuelPrices && <Text style={styles.priceHint}>₹{fuelPrices.hydraulic_oil_price}/L</Text>}
              </View>
            </View>

            {/* Expenses Summary */}
            <View style={styles.expensesSummary}>
              <Text style={styles.expensesLabel}>Total Expenses</Text>
              <Text style={styles.expensesValue}>₹{calculateExpenses().toLocaleString()}</Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesContainer}>
              <TextInput
                style={styles.notesInput}
                placeholder="Add any notes for this day..."
                placeholderTextColor="#64748b"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
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
              {isSaving ? 'Saving...' : 'Save Daily Log'}
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
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  timerCard: {
    backgroundColor: '#1e293b',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#f8fafc',
    fontVariant: ['tabular-nums'],
    marginBottom: 20,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  timerButtonStop: {
    backgroundColor: '#ef4444',
  },
  timerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 16,
  },
  toggleContainer: {
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: '#f97316',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
  toggleButtonTextActive: {
    color: '#f97316',
    fontWeight: '500',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#f97316',
  },
  inputsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
  },
  gridItemFull: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  input: {
    flex: 1,
    height: 44,
    color: '#f8fafc',
    fontSize: 15,
  },
  priceHint: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  expensesSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  expensesLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  expensesValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f97316',
  },
  notesContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  notesInput: {
    color: '#f8fafc',
    fontSize: 14,
    minHeight: 80,
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
