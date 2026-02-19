import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ownerAPI } from '@/src/services/api';

export default function OwnerProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await ownerAPI.getProfile(id);
      setProfile(res.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load owner profile');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchProfile();
      }
    }, [id])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Owner not found</Text>
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
        <Text style={styles.headerTitle}>Owner Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color="#f97316" />
          </View>
          <Text style={styles.ownerName}>{profile.name}</Text>
          <Text style={styles.ownerContact}>{profile.contact}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.total_machines || 0}</Text>
              <Text style={styles.statLabel}>Machines</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.total_contracts || 0}</Text>
              <Text style={styles.statLabel}>Contracts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.active_contracts || 0}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>
        </View>

        {/* Machines Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Machines</Text>
          {profile.machines && profile.machines.length > 0 ? (
            profile.machines.map((machine: any) => (
              <TouchableOpacity
                key={machine.id}
                style={styles.machineCard}
                onPress={() => router.push(`/machines/detail/${machine.id}`)}
              >
                <View style={styles.machineImageContainer}>
                  {machine.images && machine.images.length > 0 && machine.images[0] ? (
                    <Image
                      source={{ uri: machine.images[0] }}
                      style={styles.machineImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.machineImagePlaceholder}>
                      <Ionicons name="construct" size={32} color="#64748b" />
                    </View>
                  )}
                </View>
                <View style={styles.machineInfo}>
                  <Text style={styles.machineName}>{machine.model_name}</Text>
                  <Text style={styles.machineType}>{machine.machine_type}</Text>
                  <View style={styles.machineDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="water-outline" size={14} color="#3b82f6" />
                      <Text style={styles.detailText}>{machine.fuel_type}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="location-outline" size={14} color="#ef4444" />
                      <Text style={styles.detailText}>{machine.city || 'N/A'}</Text>
                    </View>
                  </View>
                  <Text style={styles.machineRate}>₹{machine.hourly_rate}/hour</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  machine.status === 'available' ? styles.statusAvailable : styles.statusRented,
                ]}>
                  <Text style={styles.statusText}>
                    {machine.status === 'available' ? 'Available' : 'Rented'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="construct-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>No machines available</Text>
            </View>
          )}
        </View>

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
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#1e293b',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ownerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  ownerContact: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
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
  machineCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  machineImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  machineImage: {
    width: '100%',
    height: '100%',
  },
  machineImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
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
  machineDetails: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  machineRate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
    marginTop: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusAvailable: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusRented: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
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
