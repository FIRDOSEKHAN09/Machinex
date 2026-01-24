import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { machineAPI } from '../../src/services/api';

export default function MachineDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [machine, setMachine] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMachine();
  }, [id]);

  const fetchMachine = async () => {
    try {
      const response = await machineAPI.getOne(id);
      setMachine(response.data);
    } catch (error) {
      console.error('Error fetching machine:', error);
      Alert.alert('Error', 'Failed to load machine details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Machine',
      'Are you sure you want to delete this machine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await machineAPI.delete(id);
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete machine');
            }
          },
        },
      ]
    );
  };

  const handleCreateContract = () => {
    router.push({
      pathname: '/contracts/create',
      params: { machineId: id, machineName: machine?.model_name },
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

  if (!machine) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Machine not found</Text>
          <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = user?.role === 'owner' && machine.owner_id === user?.id;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Machine Details</Text>
        {isOwner ? (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Machine Hero */}
        <View style={styles.heroSection}>
          <View style={styles.machineIconLarge}>
            <Ionicons name="construct" size={64} color="#f97316" />
          </View>
          <Text style={styles.machineName}>{machine.model_name}</Text>
          <View style={[
            styles.statusBadgeLarge,
            machine.status === 'available' ? styles.statusAvailable : styles.statusRented,
          ]}>
            <Text style={[
              styles.statusTextLarge,
              machine.status === 'available' ? styles.statusTextAvailable : styles.statusTextRented,
            ]}>
              {machine.status === 'available' ? 'Available for Rent' : 'Currently Rented'}
            </Text>
          </View>
        </View>

        {/* Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.specsGrid}>
            <View style={styles.specCard}>
              <Ionicons name="options" size={24} color="#f97316" />
              <Text style={styles.specLabel}>Type</Text>
              <Text style={styles.specValue}>{machine.machine_type}</Text>
            </View>
            <View style={styles.specCard}>
              <Ionicons name="speedometer" size={24} color="#3b82f6" />
              <Text style={styles.specLabel}>Engine</Text>
              <Text style={styles.specValue}>{machine.engine_capacity}</Text>
            </View>
            <View style={styles.specCard}>
              <Ionicons name="water" size={24} color="#22c55e" />
              <Text style={styles.specLabel}>Fuel</Text>
              <Text style={styles.specValue}>{machine.fuel_type}</Text>
            </View>
          </View>
        </View>

        {/* Rental Rates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Rates</Text>
          <View style={styles.ratesContainer}>
            <View style={styles.rateCard}>
              <Ionicons name="time" size={28} color="#f97316" />
              <View style={styles.rateInfo}>
                <Text style={styles.rateLabel}>Hourly Rate</Text>
                <Text style={styles.rateValue}>₹{machine.hourly_rate?.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.rateCard}>
              <Ionicons name="calendar" size={28} color="#f97316" />
              <View style={styles.rateInfo}>
                <Text style={styles.rateLabel}>Daily Rate</Text>
                <Text style={styles.rateValue}>₹{machine.daily_rate?.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        {machine.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{machine.description}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Button */}
      {machine.status === 'available' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.rentButton} onPress={handleCreateContract}>
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles.rentButtonText}>Create Rental Contract</Text>
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
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonLarge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
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
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  machineIconLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  machineName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  statusBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusAvailable: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusRented: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  statusTextLarge: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextAvailable: {
    color: '#22c55e',
  },
  statusTextRented: {
    color: '#f97316',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 16,
  },
  specsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  specCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 4,
    textAlign: 'center',
  },
  ratesContainer: {
    gap: 12,
  },
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  rateInfo: {
    flex: 1,
  },
  rateLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  rateValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 4,
  },
  descriptionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  rentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  rentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
