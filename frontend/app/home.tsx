import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { machineAPI, contractAPI, dashboardAPI, notificationAPI } from '@/src/services/api';

const FEATURED_MACHINES = [
  {
    id: '1',
    name: 'JCB 3DX Super',
    type: 'Backhoe Loader',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300',
    power: '92 HP',
  },
  {
    id: '2',
    name: 'CAT 320D',
    type: 'Excavator',
    image: 'https://images.unsplash.com/photo-1621922688758-e2e8b902c8ec?w=300',
    power: '148 HP',
  },
  {
    id: '3',
    name: 'Komatsu PC200',
    type: 'Excavator',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300',
    power: '155 HP',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [machines, setMachines] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [machinesRes, contractsRes, statsRes, notifRes] = await Promise.all([
        user?.role === 'owner' ? machineAPI.getAll() : machineAPI.getAllPublic(),
        contractAPI.getAll(),
        dashboardAPI.getStats(),
        notificationAPI.getAll(),
      ]);
      
      setMachines(machinesRes.data || []);
      setContracts(contractsRes.data || []);
      setStats(statsRes.data || {});
      setUnreadCount(notifRes.data?.filter((n: any) => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchData();
      }
    }, [user?.id, user?.role])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'App Admin';
      case 'owner': return 'Machine Owner';
      case 'user': return 'User';
      case 'manager': return 'Manager';
      default: return role;
    }
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
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={[styles.roleBadge, user?.role === 'admin' && styles.adminBadge]}>
              <Text style={[styles.roleText, user?.role === 'admin' && styles.adminText]}>
                {getRoleLabel(user?.role || '')}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color="#f8fafc" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={() => router.push('/profile')}>
              <Ionicons name="person-outline" size={24} color="#f8fafc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Admin Dashboard Button */}
        {user?.role === 'admin' && (
          <TouchableOpacity
            style={styles.adminBanner}
            onPress={() => router.push('/admin')}
          >
            <View style={styles.adminBannerIcon}>
              <Ionicons name="shield-checkmark" size={28} color="#ef4444" />
            </View>
            <View style={styles.adminBannerContent}>
              <Text style={styles.adminBannerTitle}>Admin Dashboard</Text>
              <Text style={styles.adminBannerSubtitle}>View all users, contracts & running machines</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {user?.role === 'owner' || user?.role === 'admin' ? (
            <>
              <View style={styles.statCard}>
                <Ionicons name="construct" size={24} color="#f97316" />
                <Text style={styles.statValue}>{stats.total_machines || 0}</Text>
                <Text style={styles.statLabel}>Machines</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="document-text" size={24} color="#22c55e" />
                <Text style={styles.statValue}>{stats.active_contracts || 0}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="cash" size={24} color="#3b82f6" />
                <Text style={styles.statValue}>₹{(stats.total_earnings || 0).toLocaleString()}</Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.statCard, styles.statCardWide]}>
                <Ionicons name="document-text" size={24} color="#f97316" />
                <Text style={styles.statValue}>{stats.active_contracts || 0}</Text>
                <Text style={styles.statLabel}>Active Rentals</Text>
              </View>
              <View style={[styles.statCard, styles.statCardWide]}>
                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                <Text style={styles.statValue}>{stats.total_contracts || 0}</Text>
                <Text style={styles.statLabel}>Total Contracts</Text>
              </View>
            </>
          )}
        </View>

        {/* Featured Machines Catalog */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Machines</Text>
            <TouchableOpacity onPress={() => router.push('/catalog')}>
              <Text style={styles.seeAll}>View Catalog</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.featuredRow}>
              {FEATURED_MACHINES.map((machine) => (
                <TouchableOpacity
                  key={machine.id}
                  style={styles.featuredCard}
                  onPress={() => router.push('/catalog')}
                >
                  <Image
                    source={{ uri: machine.image }}
                    style={styles.featuredImage}
                    resizeMode="cover"
                  />
                  <View style={styles.featuredOverlay}>
                    <Text style={styles.featuredName}>{machine.name}</Text>
                    <Text style={styles.featuredType}>{machine.type}</Text>
                    <View style={styles.featuredSpec}>
                      <Ionicons name="speedometer" size={12} color="#f97316" />
                      <Text style={styles.featuredSpecText}>{machine.power}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {(user?.role === 'owner' || user?.role === 'admin') && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/machines/add')}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                  <Ionicons name="add-circle" size={28} color="#f97316" />
                </View>
                <Text style={styles.actionText}>Add Machine</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/machines')}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="list" size={28} color="#3b82f6" />
              </View>
              <Text style={styles.actionText}>All Machines</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/contracts')}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <Ionicons name="document-text" size={28} color="#22c55e" />
              </View>
              <Text style={styles.actionText}>Contracts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/catalog')}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                <Ionicons name="images" size={28} color="#a855f7" />
              </View>
              <Text style={styles.actionText}>Catalog</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Contracts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Contracts</Text>
            <TouchableOpacity onPress={() => router.push('/contracts')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {contracts.filter(c => c.status === 'active').length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>No active contracts</Text>
            </View>
          ) : (
            contracts
              .filter(c => c.status === 'active')
              .slice(0, 3)
              .map((contract) => (
                <TouchableOpacity
                  key={contract.id}
                  style={styles.contractCard}
                  onPress={() => router.push(`/contracts/${contract.id}`)}
                >
                  <View style={styles.contractHeader}>
                    <View style={styles.contractIcon}>
                      <Ionicons name="construct" size={20} color="#f97316" />
                    </View>
                    <View style={styles.contractInfo}>
                      <Text style={styles.contractMachine}>{contract.machine_name}</Text>
                      <Text style={styles.contractRenter}>{contract.renter_name}</Text>
                    </View>
                    <View style={styles.contractStatus}>
                      <Text style={styles.statusText}>Active</Text>
                    </View>
                  </View>
                  <View style={styles.contractDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Days</Text>
                      <Text style={styles.detailValue}>{contract.total_days}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Total</Text>
                      <Text style={styles.detailValue}>₹{contract.total_amount?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Remaining</Text>
                      <Text style={styles.detailValue}>₹{contract.remaining_amount?.toLocaleString()}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
          )}
        </View>

        {/* My Machines (Owner only) */}
        {(user?.role === 'owner' || user?.role === 'admin') && machines.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Machines</Text>
              <TouchableOpacity onPress={() => router.push('/machines')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.machinesRow}>
                {machines.slice(0, 5).map((machine) => (
                  <TouchableOpacity
                    key={machine.id}
                    style={styles.machineCard}
                    onPress={() => router.push(`/machines/${machine.id}`)}
                  >
                    <View style={styles.machineIconBg}>
                      <Ionicons name="construct" size={32} color="#f97316" />
                    </View>
                    <Text style={styles.machineName} numberOfLines={1}>
                      {machine.model_name}
                    </Text>
                    <Text style={styles.machineType}>{machine.machine_type}</Text>
                    <View style={[
                      styles.machineStatus,
                      machine.status === 'available' ? styles.statusAvailable : styles.statusRented,
                    ]}>
                      <Text style={[
                        styles.machineStatusText,
                        machine.status === 'available' ? styles.statusTextAvailable : styles.statusTextRented,
                      ]}>
                        {machine.status === 'available' ? 'Available' : 'Rented'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 14,
    color: '#94a3b8',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  adminBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  roleText: {
    color: '#f97316',
    fontSize: 12,
    fontWeight: '600',
  },
  adminText: {
    color: '#ef4444',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  adminBannerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBannerContent: {
    flex: 1,
    marginLeft: 14,
  },
  adminBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  adminBannerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statCardWide: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeAll: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '500',
  },
  featuredRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 14,
  },
  featuredCard: {
    width: 200,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  featuredName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  featuredType: {
    fontSize: 12,
    color: '#94a3b8',
  },
  featuredSpec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  featuredSpecText: {
    fontSize: 11,
    color: '#f97316',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f8fafc',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginHorizontal: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 12,
    fontSize: 14,
  },
  contractCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  contractHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contractIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    color: '#94a3b8',
  },
  contractStatus: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  contractDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  detailItem: {
    alignItems: 'center',
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
  machinesRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  machineCard: {
    width: 140,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  machineIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  machineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'center',
  },
  machineType: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  machineStatus: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusAvailable: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusRented: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  machineStatusText: {
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
