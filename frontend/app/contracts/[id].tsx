import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { contractAPI, dailyLogAPI } from '@/src/services/api';

export default function ContractDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [contract, setContract] = useState<any>(null);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [engineRunning, setEngineRunning] = useState(false);
  const [currentDayNumber, setCurrentDayNumber] = useState(1);

  const fetchData = async () => {
    try {
      const [contractRes, logsRes] = await Promise.all([
        contractAPI.getOne(id),
        dailyLogAPI.getByContract(id),
      ]);
      setContract(contractRes.data);
      setDailyLogs(logsRes.data || []);
      
      // Calculate current day number
      const startDate = new Date(contractRes.data.start_date);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setCurrentDayNumber(diffDays);
      
      // Check if engine is currently running
      const todayLog = logsRes.data?.find((log: any) => log.day_number === diffDays);
      setEngineRunning(todayLog?.start_time && !todayLog?.end_time);
    } catch (error) {
      console.error('Error fetching contract:', error);
      Alert.alert('Error', 'Failed to load contract details');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchData();
      }
    }, [id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCompleteContract = () => {
    Alert.alert(
      'Complete Contract',
      'Are you sure you want to mark this contract as complete?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await contractAPI.complete(id);
              fetchData();
              Alert.alert('Success', 'Contract completed successfully');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to complete contract');
            }
          },
        },
      ]
    );
  };

  const handleEngineToggle = async () => {
    const action = engineRunning ? 'stop' : 'start';
    const actionText = engineRunning ? 'Stop' : 'Start';
    
    Alert.alert(
      `${actionText} Engine`,
      `Are you sure you want to ${action} the engine?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText,
          onPress: async () => {
            try:
              await dailyLogAPI.engineTimer({
                contract_id: id,
                day_number: currentDayNumber,
                action: action,
              });
              
              setEngineRunning(!engineRunning);
              Alert.alert('Success', `Engine ${action}ed successfully`);
              fetchData(); // Refresh data
            } catch (error: any) {
              console.error('Engine toggle error:', error);
              Alert.alert('Error', error.response?.data?.detail || `Failed to ${action} engine`);
            }
          },
        },
      ]
    );
  };

  const handleDeleteContract = () => {
    Alert.alert(
      '⚠️ Delete Contract',
      'Are you absolutely sure you want to delete this contract? This action cannot be undone and will delete all associated daily logs.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I Understand',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              '🗑️ Final Confirmation',
              'This is your final warning. Delete this contract permanently?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Permanently',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await contractAPI.delete(id);
                      Alert.alert('Success', 'Contract deleted successfully', [
                        {
                          text: 'OK',
                          onPress: () => router.back(),
                        },
                      ]);
                    } catch (error: any) {
                      console.error('Delete error:', error);
                      Alert.alert('Error', error.response?.data?.detail || 'Failed to delete contract');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const getDayStatus = (dayNumber: number) => {
    return dailyLogs.find(log => log.day_number === dayNumber);
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

  if (!contract) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Contract not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = user?.role === 'owner';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contract Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />
        }
      >
        {/* Contract Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.machineIcon}>
              <Ionicons name="construct" size={28} color="#f97316" />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.machineName}>{contract.machine_name}</Text>
              <Text style={styles.renterName}>{contract.renter_name}</Text>
              <Text style={styles.renterContact}>{contract.renter_contact}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              contract.status === 'active' ? styles.statusActive : styles.statusCompleted,
            ]}>
              <Text style={[
                styles.statusText,
                contract.status === 'active' ? styles.statusTextActive : styles.statusTextCompleted,
              ]}>
                {contract.status === 'active' ? 'Active' : 'Completed'}
              </Text>
            </View>
          </View>

          <View style={styles.financialSummary}>
            <View style={styles.financeRow}>
              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>Total Amount</Text>
                <Text style={styles.financeValue}>₹{contract.total_amount?.toLocaleString()}</Text>
              </View>
              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>Advance Paid</Text>
                <Text style={[styles.financeValue, styles.greenText]}>₹{contract.advance_amount?.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.financeRow}>
              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>Deductions</Text>
                <Text style={[styles.financeValue, styles.redText]}>₹{contract.deductions?.toLocaleString()}</Text>
              </View>
              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>Remaining</Text>
                <Text style={[styles.financeValue, styles.orangeText]}>₹{contract.remaining_amount?.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Engine Control - Only for active contracts */}
        {contract.status === 'active' && (
          <TouchableOpacity
            style={[
              styles.engineButton,
              engineRunning ? styles.engineButtonStop : styles.engineButtonStart,
            ]}
            onPress={handleEngineToggle}
          >
            <View style={styles.engineButtonContent}>
              <Ionicons
                name={engineRunning ? 'stop-circle' : 'play-circle'}
                size={32}
                color="#fff"
              />
              <View style={styles.engineButtonText}>
                <Text style={styles.engineButtonTitle}>
                  {engineRunning ? 'STOP ENGINE' : 'START ENGINE'}
                </Text>
                <Text style={styles.engineButtonSubtitle}>
                  {engineRunning
                    ? 'Engine is currently running'
                    : `Day ${currentDayNumber} • Tap to start`}
                </Text>
              </View>
              {engineRunning && (
                <View style={styles.pulsingDot}>
                  <View style={styles.pulsingDotInner} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Days Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Logs ({contract.total_days} Days)</Text>
          <View style={styles.daysGrid}>
            {Array.from({ length: contract.total_days }, (_, i) => i + 1).map((dayNum) => {
              const dayLog = getDayStatus(dayNum);
              const hasLog = !!dayLog;
              const hasHours = dayLog?.working_hours > 0;
              
              return (
                <TouchableOpacity
                  key={dayNum}
                  style={[
                    styles.dayCard,
                    hasLog && styles.dayCardLogged,
                    hasHours && styles.dayCardWorked,
                  ]}
                  onPress={() => router.push({
                    pathname: '/contracts/daily-log',
                    params: { 
                      contractId: id, 
                      dayNumber: dayNum.toString(),
                      machineName: contract.machine_name,
                    },
                  })}
                >
                  <Text style={[
                    styles.dayNumber,
                    (hasLog || hasHours) && styles.dayNumberActive,
                  ]}>
                    Day {dayNum}
                  </Text>
                  {hasHours && (
                    <Text style={styles.dayHours}>{dayLog.working_hours.toFixed(1)}h</Text>
                  )}
                  {hasLog && !hasHours && (
                    <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Recent Logs */}
        {dailyLogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {dailyLogs.slice(-5).reverse().map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <Text style={styles.logDay}>Day {log.day_number}</Text>
                  <View style={[
                    styles.filledByBadge,
                    log.filled_by === 'user' ? styles.filledByUser : styles.filledByOwner,
                  ]}>
                    <Text style={styles.filledByText}>
                      {log.filled_by === 'user' ? 'User Filled' : 'Owner Filled'}
                    </Text>
                  </View>
                </View>
                <View style={styles.logDetails}>
                  {log.working_hours > 0 && (
                    <View style={styles.logItem}>
                      <Ionicons name="time" size={14} color="#64748b" />
                      <Text style={styles.logItemText}>{log.working_hours.toFixed(1)} hours</Text>
                    </View>
                  )}
                  {log.petrol_filled > 0 && (
                    <View style={styles.logItem}>
                      <Ionicons name="water" size={14} color="#f97316" />
                      <Text style={styles.logItemText}>Petrol: {log.petrol_filled}L</Text>
                    </View>
                  )}
                  {log.expenses > 0 && (
                    <View style={styles.logItem}>
                      <Ionicons name="cash" size={14} color="#22c55e" />
                      <Text style={styles.logItemText}>Expense: ₹{log.expenses.toLocaleString()}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Button */}
      {contract.status === 'active' && isOwner && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteContract}>
            <Ionicons name="checkmark-done" size={20} color="#fff" />
            <Text style={styles.completeButtonText}>Complete Contract</Text>
          </TouchableOpacity>
        </View>
      )}
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#f8fafc',
    marginTop: 16,
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
  summaryCard: {
    backgroundColor: '#1e293b',
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  machineIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  machineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  renterName: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  renterContact: {
    fontSize: 13,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#22c55e',
  },
  statusTextCompleted: {
    color: '#64748b',
  },
  financialSummary: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  financeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  financeItem: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
  },
  financeLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  financeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 4,
  },
  greenText: {
    color: '#22c55e',
  },
  redText: {
    color: '#ef4444',
  },
  orangeText: {
    color: '#f97316',
  },
  engineButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  engineButtonStart: {
    backgroundColor: '#22c55e',
  },
  engineButtonStop: {
    backgroundColor: '#ef4444',
  },
  engineButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  engineButtonText: {
    flex: 1,
  },
  engineButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  engineButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  pulsingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsingDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
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
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dayCardLogged: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  dayCardWorked: {
    borderColor: '#f97316',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  dayNumberActive: {
    color: '#f8fafc',
  },
  dayHours: {
    fontSize: 11,
    color: '#f97316',
    fontWeight: '600',
    marginTop: 2,
  },
  logCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  filledByBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  filledByUser: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  filledByOwner: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  filledByText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94a3b8',
  },
  logDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logItemText: {
    fontSize: 12,
    color: '#94a3b8',
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
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
