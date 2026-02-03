import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { discoveryAPI } from '@/src/services/api';

export default function DiscoveryScreen() {
  const router = useRouter();
  const [machines, setMachines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'excavator' | 'jcb'>('all');

  useEffect(() => {
    fetchNearbyMachines();
  }, []);

  const fetchNearbyMachines = async (type?: string) => {
    try {
      // Using mock location for now (Mumbai)
      const res = await discoveryAPI.nearbyMachines(19.0760, 72.8777, type, 100);
      setMachines(res.data || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilter: 'all' | 'excavator' | 'jcb') => {
    setFilter(newFilter);
    setIsLoading(true);
    fetchNearbyMachines(newFilter === 'all' ? undefined : newFilter);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Finding machines...</Text>
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
        <View>
          <Text style={styles.headerTitle}>Discover Machines</Text>
          <Text style={styles.headerSubtitle}>{machines.length} machines found</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filters}>
        <TouchableOpacity style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]} onPress={() => handleFilterChange('all')}>
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, filter === 'excavator' && styles.filterButtonActive]} onPress={() => handleFilterChange('excavator')}>
          <Text style={[styles.filterText, filter === 'excavator' && styles.filterTextActive]}>Excavator</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, filter === 'jcb' && styles.filterButtonActive]} onPress={() => handleFilterChange('jcb')}>
          <Text style={[styles.filterText, filter === 'jcb' && styles.filterTextActive]}>JCB</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {machines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#64748b" />
            <Text style={styles.emptyText}>No machines found</Text>
          </View>
        ) : (
          machines.map((machine) => (
            <TouchableOpacity key={machine.id} style={styles.machineCard} onPress={() => router.push(`/contracts/create?machineId=${machine.id}`)}>
              <View style={styles.machineHeader}>
                <View style={styles.machineInfo}>
                  <Text style={styles.machineName}>{machine.model_name}</Text>
                  <Text style={styles.machineType}>{machine.machine_type}</Text>
                </View>
                {machine.distance_km && (
                  <View style={styles.distanceBadge}>
                    <Ionicons name="location" size={16} color="#f97316" />
                    <Text style={styles.distanceText}>{machine.distance_km} km</Text>
                  </View>
                )}
              </View>
              <View style={styles.machineDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="business" size={16} color="#94a3b8" />
                  <Text style={styles.detailText}>{machine.city || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="speedometer" size={16} color="#94a3b8" />
                  <Text style={styles.detailText}>{machine.engine_capacity}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="cash" size={16} color="#94a3b8" />
                  <Text style={styles.detailText}>₹{machine.hourly_rate}/hr</Text>
                </View>
              </View>
              {machine.owner_name && (
                <View style={styles.ownerSection}>
                  <View style={styles.ownerInfo}>
                    <Ionicons name="person-circle" size={20} color="#f97316" />
                    <View>
                      <Text style={styles.ownerName}>{machine.owner_name}</Text>
                      <Text style={styles.ownerContact}>{machine.owner_contact}</Text>
                    </View>
                  </View>
                  {machine.owner_total_machines > 0 && (
                    <View style={styles.ownerBadge}>
                      <Text style={styles.ownerBadgeText}>{machine.owner_total_machines} machines</Text>
                    </View>
                  )}
                </View>
              )}
              <TouchableOpacity style={styles.requestButton} onPress={() => router.push(`/contracts/create?machineId=${machine.id}`)}>
                <Text style={styles.requestButtonText}>Request Contract</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 16, color: '#94a3b8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#f8fafc' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 2 },
  filters: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  filterButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  filterButtonActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  filterTextActive: { color: '#fff' },
  scrollView: { flex: 1, padding: 16 },
  machineCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  machineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  machineInfo: { flex: 1 },
  machineName: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc' },
  machineType: { fontSize: 14, color: '#94a3b8', marginTop: 4, textTransform: 'capitalize' },
  distanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(249, 115, 22, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  distanceText: { fontSize: 14, fontWeight: 'bold', color: '#f97316' },
  machineDetails: { flexDirection: 'row', gap: 16, marginBottom: 12, flexWrap: 'wrap' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#94a3b8' },
  ownerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155', marginBottom: 12 },
  ownerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  ownerName: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  ownerContact: { fontSize: 12, color: '#64748b', marginTop: 2 },
  ownerBadge: { backgroundColor: 'rgba(34, 197, 94, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ownerBadgeText: { fontSize: 11, fontWeight: '600', color: '#22c55e' },
  requestButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f97316', borderRadius: 12, paddingVertical: 14, gap: 8 },
  requestButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 16 },
});