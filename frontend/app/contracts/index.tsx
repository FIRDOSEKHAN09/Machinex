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
import { useAuth } from '@/src/context/AuthContext';
import { contractAPI } from '@/src/services/api';

export default function ContractsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const fetchContracts = async () => {
    try {
      const response = await contractAPI.getAll();
      setContracts(response.data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchContracts();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchContracts();
  };

  const filteredContracts = contracts.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

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
        <Text style={styles.headerTitle}>Contracts</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'active', 'completed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />
        }
      >
        {filteredContracts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#475569" />
            <Text style={styles.emptyTitle}>No contracts</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? "You don't have any contracts yet"
                : `No ${filter} contracts`}
            </Text>
          </View>
        ) : (
          <View style={styles.contractsList}>
            {filteredContracts.map((contract) => (
              <TouchableOpacity
                key={contract.id}
                style={styles.contractCard}
                onPress={() => router.push(`/contracts/${contract.id}`)}
              >
                <View style={styles.contractHeader}>
                  <View style={styles.contractIcon}>
                    <Ionicons name="construct" size={24} color="#f97316" />
                  </View>
                  <View style={styles.contractInfo}>
                    <Text style={styles.contractMachine}>{contract.machine_name}</Text>
                    <Text style={styles.contractRenter}>
                      <Ionicons name="person" size={12} color="#64748b" /> {contract.renter_name}
                    </Text>
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

                <View style={styles.contractDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Duration</Text>
                      <Text style={styles.detailValue}>{contract.total_days} days</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Total</Text>
                      <Text style={styles.detailValue}>₹{contract.total_amount?.toLocaleString()}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Advance</Text>
                      <Text style={[styles.detailValue, styles.greenText]}>
                        ₹{contract.advance_amount?.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Remaining</Text>
                      <Text style={[styles.detailValue, styles.orangeText]}>
                        ₹{contract.remaining_amount?.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {contract.deductions > 0 && (
                  <View style={styles.deductionRow}>
                    <Ionicons name="information-circle" size={16} color="#f97316" />
                    <Text style={styles.deductionText}>
                      Deductions: ₹{contract.deductions?.toLocaleString()}
                    </Text>
                  </View>
                )}

                <View style={styles.viewMore}>
                  <Text style={styles.viewMoreText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#f97316" />
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
  placeholder: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#f97316',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
  },
  filterTextActive: {
    color: '#fff',
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
  contractsList: {
    padding: 16,
    gap: 12,
  },
  contractCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
  },
  contractHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contractIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contractMachine: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  contractRenter: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#22c55e',
  },
  statusTextCompleted: {
    color: '#64748b',
  },
  contractDetails: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 2,
  },
  greenText: {
    color: '#22c55e',
  },
  orangeText: {
    color: '#f97316',
  },
  deductionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderRadius: 8,
  },
  deductionText: {
    fontSize: 12,
    color: '#f97316',
    fontWeight: '500',
  },
  viewMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 4,
  },
  viewMoreText: {
    fontSize: 13,
    color: '#f97316',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 32,
  },
});
