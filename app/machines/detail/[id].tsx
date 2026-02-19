import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { machineAPI } from '@/src/services/api';

const { width } = Dimensions.get('window');

export default function MachineDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [machine, setMachine] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchMachine = async () => {
    try {
      const res = await machineAPI.getOne(id);
      setMachine(res.data);
    } catch (error) {
      console.error('Error fetching machine:', error);
      Alert.alert('Error', 'Failed to load machine details');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchMachine();
      }
    }, [id])
  );

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentImageIndex(index);
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
        </View>
      </SafeAreaView>
    );
  }

  const images = machine.images && machine.images.length > 0 ? machine.images : [''];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Machine Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Image Slider */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {images.map((img, index) => (
              <View key={index} style={styles.imageSlide}>
                {img ? (
                  <Image
                    source={{ uri: img }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.image, styles.placeholderImage]}>
                    <Ionicons name="construct" size={64} color="#64748b" />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
          
          {/* Image Pagination */}
          {images.length > 1 && (
            <View style={styles.paginationContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Machine Info */}
        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            <View style={styles.titleSection}>
              <Text style={styles.machineName}>{machine.model_name}</Text>
              <Text style={styles.machineType}>{machine.machine_type}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              machine.status === 'available' ? styles.statusAvailable : styles.statusRented,
            ]}>
              <Text style={styles.statusText}>
                {machine.status === 'available' ? 'Available' : 'Rented'}
              </Text>
            </View>
          </View>

          {/* Hourly Rate */}
          <View style={styles.rateCard}>
            <Ionicons name="cash-outline" size={24} color="#22c55e" />
            <View style={styles.rateInfo}>
              <Text style={styles.rateLabel}>Hourly Rate</Text>
              <Text style={styles.rateValue}>₹{machine.hourly_rate}/hour</Text>
            </View>
          </View>

          {/* Specifications */}
          <View style={styles.specsSection}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            <View style={styles.specsGrid}>
              <View style={styles.specItem}>
                <Ionicons name="speedometer-outline" size={20} color="#f97316" />
                <Text style={styles.specLabel}>Engine Capacity</Text>
                <Text style={styles.specValue}>{machine.engine_capacity}</Text>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="water-outline" size={20} color="#3b82f6" />
                <Text style={styles.specLabel}>Fuel Type</Text>
                <Text style={styles.specValue}>{machine.fuel_type}</Text>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="location-outline" size={20} color="#ef4444" />
                <Text style={styles.specLabel}>Location</Text>
                <Text style={styles.specValue}>{machine.city || 'N/A'}</Text>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="resize-outline" size={20} color="#a855f7" />
                <Text style={styles.specLabel}>Radius</Text>
                <Text style={styles.specValue}>{machine.operational_radius_km}km</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {machine.description && (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{machine.description}</Text>
            </View>
          )}

          {/* Owner Info */}
          {machine.owner_name && (
            <View style={styles.ownerSection}>
              <Text style={styles.sectionTitle}>Machine Owner</Text>
              <View style={styles.ownerCard}>
                <View style={styles.ownerIcon}>
                  <Ionicons name="person" size={24} color="#f97316" />
                </View>
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{machine.owner_name}</Text>
                  <Text style={styles.ownerContact}>{machine.owner_contact}</Text>
                  {machine.owner_total_machines && (
                    <Text style={styles.ownerMachines}>
                      {machine.owner_total_machines} machine(s) available
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.viewProfileButton}
                  onPress={() => router.push(`/owners/${machine.owner_id}`)}
                >
                  <Text style={styles.viewProfileText}>View Profile</Text>
                  <Ionicons name="chevron-forward" size={16} color="#f97316" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Request Contract Button - Only for Farmers */}
      {user?.role === 'user' && machine.status === 'available' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.requestButton}
            onPress={() =>
              router.push({
                pathname: '/contracts/request',
                params: {
                  machineId: machine.id,
                  machineName: machine.model_name,
                  hourlyRate: machine.hourly_rate,
                  ownerId: machine.owner_id,
                },
              })
            }
          >
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles.requestButtonText}>Request Contract</Text>
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
  imageContainer: {
    height: 300,
    backgroundColor: '#1e293b',
    position: 'relative',
  },
  imageSlide: {
    width: width,
    height: 300,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  paginationDotActive: {
    backgroundColor: '#f97316',
    width: 24,
  },
  infoCard: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
  },
  machineName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  machineType: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusAvailable: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusRented: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
  },
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  rateInfo: {
    flex: 1,
  },
  rateLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  rateValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    marginTop: 2,
  },
  specsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specItem: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 2,
  },
  descSection: {
    marginBottom: 24,
  },
  description: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  ownerSection: {
    marginBottom: 24,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  ownerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  ownerContact: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  ownerMachines: {
    fontSize: 11,
    color: '#f97316',
    marginTop: 4,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#f97316',
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
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
