import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '@/src/services/api';

export default function AdminRunningMachinesScreen() {
  const router = useRouter();
  const [machines, setMachines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMachines = async () => {
    try {
      const response = await adminAPI.getRunningMachines();
      setMachines(response.data || []);
    } catch (error) {
      console.error('Error fetching running machines:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMachines();
      // Auto-refresh every 10 seconds for live data
      const interval = setInterval(fetchMachines, 10000);
      return () => clearInterval(interval);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMachines();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Running Machines</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
        }
      >
        {machines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="pause-circle-outline" size={80} color="#475569" />
            <Text style={styles.emptyTitle}>No Machines Running</Text>
            <Text style={styles.emptyText}>All machines are currently stopped</Text>
          </View>
        ) : (
          <>
            <View style={styles.countBanner}>
              <Ionicons name="pulse" size={24} color="#22c55e" />
              <Text style={styles.countText}>{machines.length} machine(s) running</Text>
            </View>
            
            {machines.map((machine) => (
              <View key={machine.log_id} style={styles.machineCard}>
                <View style={styles.machineHeader}>
                  <View style={styles.machineIcon}>
                    <Ionicons name="construct" size={28} color="#22c55e" />
                    <View style={styles.runningDot} />
                  </View>
                  <View style={styles.machineInfo}>
                    <Text style={styles.machineName}>{machine.machine_name}</Text>
                    <Text style={styles.machineType}>{machine.machine_type}</Text>
                  </View>
                  <View style={styles.timeBox}>
                    <Text style={styles.timeValue}>{machine.running_hours.toFixed(2)}</Text>
                    <Text style={styles.timeLabel}>HOURS</Text>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Ionicons name="person" size={16} color="#64748b" />
                    <View>
                      <Text style={styles.detailLabel}>Owner</Text>
                      <Text style={styles.detailValue}>{machine.owner_name}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="swap-horizontal" size={16} color="#64748b" />
                    <View>
                      <Text style={styles.detailLabel}>Renter</Text>
                      <Text style={styles.detailValue}>{machine.renter_name}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar" size={16} color="#64748b" />
                    <View>
                      <Text style={styles.detailLabel}>Day</Text>
                      <Text style={styles.detailValue}>Day {machine.day_number}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time" size={16} color="#64748b" />
                    <View>
                      <Text style={styles.detailLabel}>Total Today</Text>
                      <Text style={styles.detailValue}>{machine.total_hours_today?.toFixed(2)}h</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.startedRow}>
                  <Ionicons name="play-circle" size={14} color="#22c55e" />
                  <Text style={styles.startedText}>
                    Started: {new Date(machine.started_at).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))}
          </>
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 48,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  countBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 14,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
  machineCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  machineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  machineIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  runningDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  machineInfo: {
    flex: 1,
    marginLeft: 14,
  },
  machineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  machineType: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  timeBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  timeLabel: {
    fontSize: 9,
    color: '#22c55e',
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '45%',
  },
  detailLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
  },
  startedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  startedText: {
    fontSize: 12,
    color: '#22c55e',
  },
  bottomSpacer: {
    height: 32,
  },
});
