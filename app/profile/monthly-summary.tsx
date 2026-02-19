import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { reportsAPI } from '@/src/services/api';

export default function MonthlySummaryScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      const res = await reportsAPI.getMonthlySummary(selectedYear, selectedMonth);
      setSummary(res.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      Alert.alert('Error', 'Failed to load monthly summary');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSummary();
    }, [selectedMonth, selectedYear])
  );

  const changeMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Monthly Report</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
          <Ionicons name="chevron-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <View style={styles.monthDisplay}>
          <Text style={styles.monthText}>{monthNames[selectedMonth - 1]}</Text>
          <Text style={styles.yearText}>{selectedYear}</Text>
        </View>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
          <Ionicons name="chevron-forward" size={24} color="#f97316" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Ionicons name="cash" size={32} color="#22c55e" />
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>
              ₹{summary?.total_revenue?.toLocaleString() || '0'}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="time" size={32} color="#3b82f6" />
            <Text style={styles.summaryLabel}>Working Hours</Text>
            <Text style={styles.summaryValue}>
              {summary?.total_working_hours?.toFixed(1) || '0'}h
            </Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Ionicons name="water" size={32} color="#ef4444" />
            <Text style={styles.summaryLabel}>Fuel Cost</Text>
            <Text style={styles.summaryValue}>
              ₹{summary?.total_fuel_cost?.toLocaleString() || '0'}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="build" size={32} color="#a855f7" />
            <Text style={styles.summaryLabel}>Consumables</Text>
            <Text style={styles.summaryValue}>
              ₹{summary?.total_consumables_cost?.toLocaleString() || '0'}
            </Text>
          </View>
        </View>

        {/* Net Earnings */}
        <View style={styles.netEarningsCard}>
          <View style={styles.netEarningsHeader}>
            <Ionicons name="trending-up" size={28} color="#22c55e" />
            <Text style={styles.netEarningsLabel}>Net Earnings</Text>
          </View>
          <Text style={styles.netEarningsValue}>
            ₹{((summary?.total_revenue || 0) - (summary?.total_fuel_cost || 0) - (summary?.total_consumables_cost || 0)).toLocaleString()}
          </Text>
          <Text style={styles.netEarningsSubtext}>After deducting fuel & consumables</Text>
        </View>

        {/* Machine-Wise Breakdown */}
        {summary?.machine_breakdown && summary.machine_breakdown.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Machine-Wise Breakdown</Text>
            {summary.machine_breakdown.map((machine: any, index: number) => (
              <View key={index} style={styles.machineCard}>
                <View style={styles.machineHeader}>
                  <Ionicons name="construct" size={24} color="#f97316" />
                  <View style={styles.machineInfo}>
                    <Text style={styles.machineName}>{machine.machine_name}</Text>
                    <Text style={styles.machineType}>{machine.machine_type}</Text>
                  </View>
                </View>
                <View style={styles.machineStats}>
                  <View style={styles.machineStat}>
                    <Text style={styles.machineStatLabel}>Hours</Text>
                    <Text style={styles.machineStatValue}>{machine.working_hours?.toFixed(1) || '0'}h</Text>
                  </View>
                  <View style={styles.machineStatDivider} />
                  <View style={styles.machineStat}>
                    <Text style={styles.machineStatLabel}>Revenue</Text>
                    <Text style={[styles.machineStatValue, styles.revenueColor]}>
                      ₹{machine.revenue?.toLocaleString() || '0'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Empty State */}
        {(!summary || summary.total_revenue === 0) && (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#64748b" />
            <Text style={styles.emptyText}>No data for this month</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDisplay: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  yearText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  netEarningsCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  netEarningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  netEarningsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
  netEarningsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  netEarningsSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
  },
  machineCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  machineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  machineInfo: {
    flex: 1,
  },
  machineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  machineType: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  machineStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  machineStat: {
    flex: 1,
    alignItems: 'center',
  },
  machineStatLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  machineStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 4,
  },
  machineStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
  },
  revenueColor: {
    color: '#22c55e',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
  bottomSpacer: {
    height: 32,
  },
});
