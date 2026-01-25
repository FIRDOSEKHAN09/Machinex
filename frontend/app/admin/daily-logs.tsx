import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '@/src/services/api';

export default function AdminDailyLogsScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const response = await adminAPI.getAllDailyLogs();
      setLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <Text style={styles.headerTitle}>All Daily Logs ({logs.length})</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />
        }
      >
        {logs.map((log) => (
          <View 
            key={log.id} 
            style={[
              styles.logCard,
              log.is_running && styles.logCardRunning
            ]}
          >
            <View style={styles.logHeader}>
              <View style={styles.logLeft}>
                <View style={[
                  styles.dayBadge,
                  log.is_running && styles.dayBadgeRunning
                ]}>
                  <Text style={[
                    styles.dayText,
                    log.is_running && styles.dayTextRunning
                  ]}>
                    Day {log.day_number}
                  </Text>
                </View>
                <View>
                  <Text style={styles.machineName}>{log.machine_name}</Text>
                  <Text style={styles.renterName}>{log.renter_name}</Text>
                </View>
              </View>
              {log.is_running ? (
                <View style={styles.runningBadge}>
                  <View style={styles.runningDot} />
                  <Text style={styles.runningText}>RUNNING</Text>
                </View>
              ) : (
                <View style={styles.hoursBadge}>
                  <Text style={styles.hoursValue}>{log.working_hours?.toFixed(1)}h</Text>
                </View>
              )}
            </View>

            <View style={styles.consumptionGrid}>
              <View style={styles.consumptionItem}>
                <Ionicons name="water" size={14} color="#f97316" />
                <Text style={styles.consumptionValue}>{log.petrol_filled}L</Text>
                <Text style={styles.consumptionLabel}>Petrol</Text>
              </View>
              <View style={styles.consumptionItem}>
                <Ionicons name="color-fill" size={14} color="#3b82f6" />
                <Text style={styles.consumptionValue}>{log.engine_oil}L</Text>
                <Text style={styles.consumptionLabel}>Engine Oil</Text>
              </View>
              <View style={styles.consumptionItem}>
                <Ionicons name="beaker" size={14} color="#a855f7" />
                <Text style={styles.consumptionValue}>{log.grease_oil}L</Text>
                <Text style={styles.consumptionLabel}>Grease</Text>
              </View>
              <View style={styles.consumptionItem}>
                <Ionicons name="flask" size={14} color="#22c55e" />
                <Text style={styles.consumptionValue}>{log.hydraulic_oil}L</Text>
                <Text style={styles.consumptionLabel}>Hydraulic</Text>
              </View>
            </View>

            <View style={styles.logFooter}>
              <View style={[
                styles.filledByBadge,
                log.filled_by === 'user' ? styles.filledByUser : styles.filledByOwner
              ]}>
                <Text style={styles.filledByText}>
                  {log.filled_by === 'user' ? 'User Filled' : 'Owner Filled'}
                </Text>
              </View>
              <Text style={styles.expenseText}>₹{log.expenses?.toLocaleString()}</Text>
              <Text style={styles.dateText}>{formatDate(log.created_at)}</Text>
            </View>
          </View>
        ))}
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  logCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  logCardRunning: {
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dayBadgeRunning: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  dayTextRunning: {
    color: '#22c55e',
  },
  machineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  renterName: {
    fontSize: 11,
    color: '#64748b',
  },
  runningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  runningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  runningText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  hoursBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hoursValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  consumptionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  consumptionItem: {
    alignItems: 'center',
    gap: 2,
  },
  consumptionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
  },
  consumptionLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  logFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  expenseText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f97316',
  },
  dateText: {
    fontSize: 10,
    color: '#64748b',
  },
  bottomSpacer: {
    height: 32,
  },
});
