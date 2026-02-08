import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { contractAPI, notificationAPI, machineAPI } from '@/src/services/api';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      if (user?.role === 'user') {
        // Farmer: Fetch available machines AND contracts
        const [machinesRes, contractsRes, notifRes] = await Promise.all([
          machineAPI.browseAll(),
          contractAPI.getAll(),
          notificationAPI.getAll(),
        ]);
        setMachines(machinesRes.data || []);
        setContracts(contractsRes.data || []);
        setUnreadCount(notifRes.data?.filter((n: any) => !n.read).length || 0);
      } else {
        // Owner/Manager: Fetch contracts
        const [contractsRes, notifRes] = await Promise.all([
          contractAPI.getAll(),
          notificationAPI.getAll(),
        ]);
        setContracts(contractsRes.data || []);
        setUnreadCount(notifRes.data?.filter((n: any) => !n.read).length || 0);
      }
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

  const handleApprove = async (contractId: string) => {
    try {
      await contractAPI.approve(contractId);
      fetchData();
    } catch (error: any) {
      console.error('Approve error:', error);
    }
  };

  const handleReject = async (contractId: string) => {
    try {
      await contractAPI.reject(contractId, 'Not available');
      fetchData();
    } catch (error: any) {
      console.error('Reject error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'active': return '#22c55e';
      case 'completed': return '#64748b';
      default: return '#64748b';
    }
  };

  // Sort contracts: pending first, then active, then completed
  const sortedContracts = [...contracts].sort((a, b) => {
    const order = { pending: 0, active: 1, completed: 2 };
    return (order[a.status as keyof typeof order] || 3) - (order[b.status as keyof typeof order] || 3);
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#f97316" />
      </SafeAreaView>
    );
  }

  // ROLE-BASED RENDERING
  if (user?.role === 'owner') {
    // MACHINE OWNER VIEW - Enhanced Dashboard
    const pendingContracts = sortedContracts.filter(c => c.status === 'pending');
    const activeContracts = sortedContracts.filter(c => c.status === 'active');
    
    // Calculate earnings
    const todayEarnings = activeContracts.reduce((sum, c) => sum + ((c.total_working_hours || 0) * (c.hourly_rate || 0)), 0);
    const totalEarnings = sortedContracts.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Dashboard</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color="#f8fafc" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
              <Ionicons name="person-outline" size={24} color="#f8fafc" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}>
          {/* Earnings Summary */}
          <View style={styles.earningsSection}>
            <Text style={styles.sectionTitle}>Earnings Overview</Text>
            <View style={styles.earningsGrid}>
              <View style={styles.earningCard}>
                <Ionicons name="trending-up" size={24} color="#22c55e" />
                <Text style={styles.earningLabel}>Today's Earnings</Text>
                <Text style={styles.earningValue}>₹{todayEarnings.toLocaleString()}</Text>
              </View>
              <View style={styles.earningCard}>
                <Ionicons name="cash" size={24} color="#3b82f6" />
                <Text style={styles.earningLabel}>Total Revenue</Text>
                <Text style={styles.earningValue}>₹{totalEarnings.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.earningsGrid}>
              <View style={styles.earningCard}>
                <Ionicons name="documents" size={24} color="#f97316" />
                <Text style={styles.earningLabel}>Active Contracts</Text>
                <Text style={styles.earningValue}>{activeContracts.length}</Text>
              </View>
              <View style={styles.earningCard}>
                <Ionicons name="time" size={24} color="#a855f7" />
                <Text style={styles.earningLabel}>Pending Approval</Text>
                <Text style={styles.earningValue}>{pendingContracts.length}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.monthlyReportButton}
              onPress={() => router.push('/profile/monthly-summary')}
            >
              <Ionicons name="bar-chart" size={20} color="#f97316" />
              <Text style={styles.monthlyReportText}>View Monthly Report</Text>
              <Ionicons name="chevron-forward" size={20} color="#f97316" />
            </TouchableOpacity>
          </View>

          {/* Pending Contracts Section */}
          {pendingContracts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Pending Approvals</Text>
              {pendingContracts.map((contract) => (
                <View key={contract.id} style={styles.pendingContractCard}>
                  <TouchableOpacity 
                    style={styles.pendingContractInfo}
                    onPress={() => router.push(`/contracts/${contract.id}`)}
                  >
                    <View style={styles.pendingContractHeader}>
                      <Ionicons name="alert-circle" size={24} color="#f97316" />
                      <View style={styles.pendingContractDetails}>
                        <Text style={styles.machineName}>{contract.machine_name || 'Machine'}</Text>
                        <Text style={styles.renterName}>Requested by: {contract.renter_name}</Text>
                        <Text style={styles.contractAmount}>Amount: ₹{contract.total_amount?.toLocaleString()}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.rejectButton} 
                      onPress={() => handleReject(contract.id)}
                    >
                      <Ionicons name="close" size={18} color="#fff" />
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.approveButton} 
                      onPress={() => handleApprove(contract.id)}
                    >
                      <Ionicons name="checkmark" size={18} color="#fff" />
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Active Contracts Section */}
          {activeContracts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Active Contracts</Text>
              {activeContracts.map((contract) => (
                <TouchableOpacity
                  key={contract.id}
                  style={styles.contractCard}
                  onPress={() => router.push(`/contracts/${contract.id}`)}
                >
                  <View style={styles.contractHeader}>
                    <View style={styles.contractInfo}>
                      <Text style={styles.machineName}>{contract.machine_name || 'Machine'}</Text>
                      <Text style={styles.renterName}>Renter: {contract.renter_name}</Text>
                      {contract.total_working_hours > 0 && (
                        <Text style={styles.workingHours}>
                          {contract.total_working_hours.toFixed(1)}h worked
                        </Text>
                      )}
                    </View>
                    <View style={styles.contractStatus}>
                      <View style={styles.engineStatusBadge}>
                        {contract.engine_status === 'running' ? (
                          <>
                            <View style={styles.runningIndicator} />
                            <Text style={styles.engineStatusText}>Running</Text>
                          </>
                        ) : (
                          <>
                            <View style={styles.idleIndicator} />
                            <Text style={styles.engineStatusText}>Idle</Text>
                          </>
                        )}
                      </View>
                      <Text style={styles.earningsText}>
                        ₹{((contract.total_working_hours || 0) * (contract.hourly_rate || 0)).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Manage Machines Button */}
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/machines')}>
            <Ionicons name="construct" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Manage Machines</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  } else if (user?.role === 'user') {
    // FARMER VIEW - Show Machine Discovery
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Find Machines</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color="#f8fafc" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
              <Ionicons name="person-outline" size={24} color="#f8fafc" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}>
          <Text style={styles.sectionTitle}>Available Machines</Text>

          {machines.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="construct-outline" size={64} color="#64748b" />
              <Text style={styles.emptyText}>No machines available</Text>
            </View>
          ) : (
            machines.map((machine) => (
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
                  <Text style={styles.machineNameText}>{machine.model_name}</Text>
                  <Text style={styles.machineTypeText}>{machine.machine_type}</Text>
                  <View style={styles.machineDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="person-outline" size={14} color="#94a3b8" />
                      <Text style={styles.detailText}>{machine.owner_name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={14} color="#94a3b8" />
                      <Text style={styles.detailText}>{machine.city || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="water-outline" size={14} color="#94a3b8" />
                      <Text style={styles.detailText}>{machine.fuel_type}</Text>
                    </View>
                  </View>
                  <Text style={styles.machineRateText}>\u20b9{machine.hourly_rate}/hour</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
            ))
          )}

          {/* Active Contracts Section for Farmers */}
          {contracts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>My Contracts</Text>
              {contracts.filter(c => c.status === 'active' || c.status === 'pending').map((contract) => (
                <TouchableOpacity
                  key={contract.id}
                  style={styles.contractCard}
                  onPress={() => router.push(`/contracts/${contract.id}`)}
                >
                  <View style={styles.contractHeader}>
                    <View style={styles.contractInfo}>
                      <Text style={styles.machineName}>{contract.machine_name || 'Machine'}</Text>
                      <View style={[
                        styles.statusBadge,
                        contract.status === 'active' ? { backgroundColor: 'rgba(34, 197, 94, 0.2)' } : { backgroundColor: 'rgba(249, 115, 22, 0.2)' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          contract.status === 'active' ? { color: '#22c55e' } : { color: '#f97316' }
                        ]}>
                          {contract.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#64748b" />
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  } else if (user?.role === 'manager') {
    // SUPERVISOR VIEW - Show Assigned Contracts
    const assignedContracts = contracts.filter((c) => c.supervisor_id === user.id);

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>My Assignments</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color="#f8fafc" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
              <Ionicons name="person-outline" size={24} color="#f8fafc" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}>
          <Text style={styles.sectionTitle}>Assigned Contracts</Text>
          {assignedContracts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={64} color="#64748b" />
              <Text style={styles.emptyText}>No assignments yet</Text>
            </View>
          ) : (
            assignedContracts.map((contract) => (
              <TouchableOpacity key={contract.id} style={styles.contractCard} onPress={() => router.push(`/contracts/${contract.id}`)}>
                <View style={styles.contractHeader}>
                  <View>
                    <Text style={styles.machineName}>{contract.machine_name || 'Machine'}</Text>
                    <Text style={styles.renterName}>Renter: {contract.renter_name}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(contract.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(contract.status) }]}>
                      {contract.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

 // Default fallback 
 return
  ( 
  <SafeAreaView style={styles.container}> 
  <Text>Loading...</Text> 
  </SafeAreaView> 
  ); 
  }



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  greeting: { fontSize: 14, color: '#94a3b8' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc' },
  headerActions: { flexDirection: 'row', gap: 12 },
  notificationButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  profileButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  scrollView: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', marginBottom: 16 },
  contractCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  contractHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  machineName: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
  renterName: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  supervisorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  supervisorText: { fontSize: 13, color: '#94a3b8' },
  contractFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountText: { fontSize: 18, fontWeight: 'bold', color: '#f97316' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  rejectButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#ef4444', borderRadius: 8 },
  rejectText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  approveButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#22c55e', borderRadius: 8 },
  approveText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, color: '#64748b', marginTop: 16 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f97316', borderRadius: 12, paddingVertical: 16, marginTop: 16, gap: 8 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  discoveryCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 24, borderWidth: 2, borderColor: '#f97316', borderStyle: 'dashed' },
  discoveryTitle: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginTop: 16 },
  discoverySubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
  machineCard: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 16, padding: 12, marginBottom: 12, gap: 12, alignItems: 'center' },
  machineImageContainer: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  machineImage: { width: '100%', height: '100%' },
  earningsSection: { marginBottom: 24 },
  earningsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  earningCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 16, padding: 16, gap: 8 },
  earningLabel: { fontSize: 12, color: '#94a3b8' },
  earningValue: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc' },
  monthlyReportButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249, 115, 22, 0.1)', borderRadius: 12, paddingVertical: 12, gap: 8, borderWidth: 1, borderColor: '#f97316' },
  monthlyReportText: { fontSize: 14, fontWeight: '600', color: '#f97316' },
  pendingContractCard: { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f97316' },
  pendingContractInfo: { marginBottom: 12 },
  pendingContractHeader: { flexDirection: 'row', gap: 12 },
  pendingContractDetails: { flex: 1 },
  contractAmount: { fontSize: 14, color: '#22c55e', marginTop: 4, fontWeight: '600' },
  contractInfo: { flex: 1 },
  contractStatus: { alignItems: 'flex-end' },
  engineStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  engineStatusText: { fontSize: 11, color: '#94a3b8' },
  runningIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  idleIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#64748b' },
  earningsText: { fontSize: 16, fontWeight: 'bold', color: '#f97316', marginTop: 4 },
  workingHours: { fontSize: 12, color: '#3b82f6', marginTop: 2 },
  bottomSpacer: { height: 32 },
  machineImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  machineInfo: { flex: 1 },
  machineNameText: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
  machineTypeText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  machineDetails: { flexDirection: 'column', gap: 4, marginTop: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 11, color: '#94a3b8' },
  machineRateText: { fontSize: 14, fontWeight: '600', color: '#22c55e', marginTop: 6 },
  contractCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12 },
  contractHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contractInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  machineName: { fontSize: 16, fontWeight: '600', color: '#f8fafc', flex: 1 },
});
