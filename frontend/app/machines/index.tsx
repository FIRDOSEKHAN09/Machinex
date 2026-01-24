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
import { useAuth } from '../../src/context/AuthContext';
import { machineAPI } from '../../src/services/api';

export default function MachinesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [machines, setMachines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMachines = async () => {
    try {
      const response = user?.role === 'owner' 
        ? await machineAPI.getAll()
        : await machineAPI.getAllPublic();
      setMachines(response.data || []);
    } catch (error) {
      console.error('Error fetching machines:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMachines();
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
        <Text style={styles.headerTitle}>
          {user?.role === 'owner' ? 'My Machines' : 'Available Machines'}
        </Text>
        {user?.role === 'owner' ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/machines/add')}
          >
            <Ionicons name="add" size={24} color="#f8fafc" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />
        }
      >
        {machines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={64} color="#475569" />
            <Text style={styles.emptyTitle}>No machines yet</Text>
            <Text style={styles.emptyText}>
              {user?.role === 'owner'
                ? 'Add your first machine to start renting'
                : 'No machines available for rent'}
            </Text>
            {user?.role === 'owner' && (
              <TouchableOpacity
                style={styles.addMachineButton}
                onPress={() => router.push('/machines/add')}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addMachineText}>Add Machine</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.machinesList}>
            {machines.map((machine) => (
              <TouchableOpacity
                key={machine.id}
                style={styles.machineCard}
                onPress={() => router.push(`/machines/${machine.id}`)}
              >
                <View style={styles.machineIconContainer}>
                  <Ionicons name="construct" size={32} color="#f97316" />
                </View>
                <View style={styles.machineInfo}>
                  <Text style={styles.machineName}>{machine.model_name}</Text>
                  <Text style={styles.machineType}>{machine.machine_type}</Text>
                  <View style={styles.machineSpecs}>
                    <View style={styles.specItem}>
                      <Ionicons name="speedometer-outline" size={14} color="#64748b" />
                      <Text style={styles.specText}>{machine.engine_capacity}</Text>
                    </View>
                    <View style={styles.specItem}>
                      <Ionicons name="water-outline" size={14} color="#64748b" />
                      <Text style={styles.specText}>{machine.fuel_type}</Text>
                    </View>
                  </View>
                  <View style={styles.machineRates}>
                    <Text style={styles.rateText}>₹{machine.hourly_rate}/hr</Text>
                    <Text style={styles.rateSeparator}>•</Text>
                    <Text style={styles.rateText}>₹{machine.daily_rate}/day</Text>
                  </View>
                </View>
                <View style={styles.machineStatusContainer}>
                  <View style={[
                    styles.statusBadge,
                    machine.status === 'available' ? styles.statusAvailable : styles.statusRented,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      machine.status === 'available' ? styles.statusTextAvailable : styles.statusTextRented,
                    ]}>
                      {machine.status === 'available' ? 'Available' : 'Rented'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#64748b" />
                </View>
              </TouchableOpacity>
            ))}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  addMachineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
  },
  addMachineText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  machinesList: {
    padding: 16,
    gap: 12,
  },
  machineCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  machineIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  machineInfo: {
    flex: 1,
    marginLeft: 16,
  },
  machineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  machineType: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  machineSpecs: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 12,
    color: '#64748b',
  },
  machineRates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  rateText: {
    fontSize: 12,
    color: '#f97316',
    fontWeight: '500',
  },
  rateSeparator: {
    color: '#475569',
  },
  machineStatusContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusAvailable: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusRented: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextAvailable: {
    color: '#22c55e',
  },
  statusTextRented: {
    color: '#f97316',
  },
  bottomSpacer: {
    height: 32,
  },
});
