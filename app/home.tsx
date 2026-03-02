import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Image, Modal, TextInput, Alert } from 'react-native';
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
  
  // Negotiation modal state
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [counterOfferRate, setCounterOfferRate] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Negotiation handlers
  const handleAcceptNegotiation = async (contract: any) => {
    try {
      setIsProcessing(true);
      await contractAPI.negotiate(contract.id, { action: 'accept' });
      Alert.alert('Success', 'Negotiation accepted! Contract is now active.');
      fetchData();
    } catch (error: any) {
      console.error('Accept negotiation error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to accept negotiation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectNegotiation = async (contract: any) => {
    try {
      setIsProcessing(true);
      await contractAPI.negotiate(contract.id, { action: 'reject', message: 'Price not acceptable' });
      Alert.alert('Rejected', 'Negotiation has been rejected.');
      fetchData();
    } catch (error: any) {
      console.error('Reject negotiation error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to reject negotiation');
    } finally {
      setIsProcessing(false);
    }
  };

  const openCounterOfferModal = (contract: any) => {
    setSelectedContract(contract);
    setCounterOfferRate(contract.original_hourly_rate?.toString() || '');
    setCounterMessage('');
    setShowNegotiationModal(true);
  };

  const submitCounterOffer = async () => {
    if (!counterOfferRate || isNaN(parseFloat(counterOfferRate))) {
      Alert.alert('Error', 'Please enter a valid counter offer rate');
      return;
    }

    try {
      setIsProcessing(true);
      await contractAPI.negotiate(selectedContract.id, {
        action: 'counter',
        counter_rate: parseFloat(counterOfferRate),
        message: counterMessage || undefined,
      });
      Alert.alert('Success', 'Counter-offer sent to farmer!');
      setShowNegotiationModal(false);
      setSelectedContract(null);
      setCounterOfferRate('');
      setCounterMessage('');
      fetchData();
    } catch (error: any) {
      console.error('Counter offer error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send counter-offer');
    } finally {
      setIsProcessing(false);
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={{ color: '#94a3b8', marginTop: 12 }}>Loading...</Text>

          <TouchableOpacity
            style={{
              marginTop: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: '#1e293b',
            }}
            onPress={() => router.replace('/auth/login')}
          >
            <Text style={{ color: '#f97316', fontWeight: '600' }}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ROLE-BASED RENDERING
  
  // ADMIN ROLE - Redirect to Admin Dashboard
  if (user?.role === 'admin') {
    // Admin sees the dedicated admin dashboard
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Admin Dashboard</Text>
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
          {/* Admin Quick Actions */}
          <View style={styles.adminWelcome}>
            <Ionicons name="shield-checkmark" size={48} color="#f97316" />
            <Text style={styles.adminWelcomeTitle}>Welcome, Admin</Text>
            <Text style={styles.adminWelcomeSubtitle}>You have full access to manage the platform</Text>
          </View>

          <TouchableOpacity 
            style={styles.adminCardButton}
            onPress={() => router.push('/admin')}
          >
            <View style={styles.adminCardIcon}>
              <Ionicons name="analytics" size={28} color="#f97316" />
            </View>
            <View style={styles.adminCardContent}>
              <Text style={styles.adminCardTitle}>View Full Dashboard</Text>
              <Text style={styles.adminCardSubtitle}>Users, machines, contracts, revenue & more</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#64748b" />
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

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
              {pendingContracts.map((contract) => {
                const hasNegotiation = contract.negotiation_status === 'pending' || contract.negotiation_status === 'countered';
                const proposedRate = contract.proposed_hourly_rate;
                const originalRate = contract.original_hourly_rate;
                const counterRate = contract.counter_offer_rate;
                
                return (
                  <View key={contract.id} style={[styles.pendingContractCard, hasNegotiation && styles.negotiationCard]}>
                    <TouchableOpacity 
                      style={styles.pendingContractInfo}
                      onPress={() => router.push(`/contracts/${contract.id}`)}
                    >
                      <View style={styles.pendingContractHeader}>
                        <Ionicons 
                          name={hasNegotiation ? "chatbubble-ellipses" : "alert-circle"} 
                          size={24} 
                          color={hasNegotiation ? "#a855f7" : "#f97316"} 
                        />
                        <View style={styles.pendingContractDetails}>
                          <Text style={styles.machineName}>{contract.machine_name || 'Machine'}</Text>
                          <Text style={styles.renterName}>Requested by: {contract.renter_name}</Text>
                          <Text style={styles.contractAmount}>Amount: ₹{contract.total_amount?.toLocaleString()}</Text>
                          
                          {/* Show negotiation details */}
                          {hasNegotiation && (
                            <View style={styles.negotiationBadge}>
                              <Ionicons name="pricetag" size={14} color="#a855f7" />
                              <Text style={styles.negotiationText}>
                                {contract.negotiation_status === 'pending' 
                                  ? `Proposed: ₹${proposedRate}/hr (was ₹${originalRate}/hr)`
                                  : `Your counter: ₹${counterRate}/hr`
                                }
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                    
                    {/* Action buttons - different for negotiation vs regular */}
                    {hasNegotiation ? (
                      <View style={styles.negotiationActions}>
                        <TouchableOpacity 
                          style={styles.rejectButton} 
                          onPress={() => handleRejectNegotiation(contract)}
                          disabled={isProcessing}
                        >
                          <Ionicons name="close" size={16} color="#fff" />
                          <Text style={styles.rejectText}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.counterButton} 
                          onPress={() => openCounterOfferModal(contract)}
                          disabled={isProcessing}
                        >
                          <Ionicons name="swap-horizontal" size={16} color="#fff" />
                          <Text style={styles.counterText}>Counter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.acceptNegotiationButton} 
                          onPress={() => handleAcceptNegotiation(contract)}
                          disabled={isProcessing}
                        >
                          <Ionicons name="checkmark" size={16} color="#fff" />
                          <Text style={styles.acceptText}>Accept ₹{proposedRate}/hr</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
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
                    )}
                  </View>
                );
              })}
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

        {/* Counter Offer Modal */}
        <Modal
          visible={showNegotiationModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowNegotiationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>💰 Make Counter Offer</Text>
                <TouchableOpacity onPress={() => setShowNegotiationModal(false)}>
                  <Ionicons name="close" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              
              {selectedContract && (
                <>
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalInfoLabel}>Machine</Text>
                    <Text style={styles.modalInfoValue}>{selectedContract.machine_name}</Text>
                  </View>
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalInfoLabel}>Farmer's Proposal</Text>
                    <Text style={styles.modalInfoValue}>₹{selectedContract.proposed_hourly_rate}/hour</Text>
                  </View>
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalInfoLabel}>Original Rate</Text>
                    <Text style={styles.modalInfoValue}>₹{selectedContract.original_hourly_rate}/hour</Text>
                  </View>
                </>
              )}
              
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Your Counter Rate (₹/hour)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter your rate"
                  placeholderTextColor="#64748b"
                  value={counterOfferRate}
                  onChangeText={setCounterOfferRate}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Message (Optional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  placeholder="e.g., This is my best offer..."
                  placeholderTextColor="#64748b"
                  value={counterMessage}
                  onChangeText={setCounterMessage}
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setShowNegotiationModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalSubmitButton, isProcessing && styles.buttonDisabled]}
                  onPress={submitCounterOffer}
                  disabled={isProcessing}
                >
                  <Ionicons name="paper-plane" size={18} color="#fff" />
                  <Text style={styles.modalSubmitText}>
                    {isProcessing ? 'Sending...' : 'Send Counter Offer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
                  <Text style={styles.machineRateText}>₹{machine.hourly_rate}/hour</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
            ))
          )}

          {/* Active Contracts Section for Farmers */}
          {contracts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>My Contracts</Text>
              {contracts.filter(c => c.status === 'active' || c.status === 'pending').map((contract) => {
                const hasCounterOffer = contract.negotiation_status === 'countered';
                
                return (
                  <View key={contract.id}>
                    <TouchableOpacity
                      style={[styles.contractCard, hasCounterOffer && styles.counterOfferCard]}
                      onPress={() => router.push(`/contracts/${contract.id}`)}
                    >
                      <View style={styles.contractHeader}>
                        <View style={{ flex: 1 }}>
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
                          
                          {/* Show counter-offer info */}
                          {hasCounterOffer && (
                            <View style={styles.counterOfferBadge}>
                              <Ionicons name="swap-horizontal" size={14} color="#f97316" />
                              <Text style={styles.counterOfferText}>
                                Counter-offer: ₹{contract.counter_offer_rate}/hr
                              </Text>
                            </View>
                          )}
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#64748b" />
                      </View>
                    </TouchableOpacity>
                    
                    {/* Counter-offer response buttons */}
                    {hasCounterOffer && (
                      <View style={styles.counterOfferActions}>
                        <TouchableOpacity 
                          style={styles.declineCounterButton}
                          onPress={async () => {
                            try {
                              await contractAPI.respondToCounter(contract.id, 'reject');
                              Alert.alert('Declined', 'Counter-offer declined. Contract cancelled.');
                              fetchData();
                            } catch (error: any) {
                              Alert.alert('Error', error.response?.data?.detail || 'Failed to decline');
                            }
                          }}
                        >
                          <Text style={styles.declineCounterText}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.acceptCounterButton}
                          onPress={async () => {
                            try {
                              await contractAPI.respondToCounter(contract.id, 'accept');
                              Alert.alert('Accepted!', 'Counter-offer accepted. Contract is now active!');
                              fetchData();
                            } catch (error: any) {
                              Alert.alert('Error', error.response?.data?.detail || 'Failed to accept');
                            }
                          }}
                        >
                          <Ionicons name="checkmark" size={16} color="#fff" />
                          <Text style={styles.acceptCounterText}>Accept ₹{contract.counter_offer_rate}/hr</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
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
  
  // Negotiation styles
  negotiationCard: { backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: '#a855f7' },
  negotiationBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: 'rgba(168, 85, 247, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  negotiationText: { fontSize: 12, color: '#a855f7', fontWeight: '500' },
  negotiationActions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  counterButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#a855f7', borderRadius: 8 },
  counterText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  acceptNegotiationButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#22c55e', borderRadius: 8, flex: 1, justifyContent: 'center' },
  acceptText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc' },
  modalInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  modalInfoLabel: { fontSize: 14, color: '#94a3b8' },
  modalInfoValue: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  modalInputGroup: { marginBottom: 16 },
  modalInputLabel: { fontSize: 14, color: '#94a3b8', marginBottom: 8 },
  modalInput: { backgroundColor: '#0f172a', borderRadius: 12, padding: 16, fontSize: 16, color: '#f8fafc', borderWidth: 1, borderColor: '#334155' },
  modalTextArea: { minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#334155', alignItems: 'center' },
  modalCancelText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
  modalSubmitButton: { flex: 2, flexDirection: 'row', paddingVertical: 14, borderRadius: 12, backgroundColor: '#a855f7', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalSubmitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  // Farmer counter-offer response styles
  counterOfferCard: { borderWidth: 1, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)' },
  counterOfferBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: 'rgba(249, 115, 22, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  counterOfferText: { fontSize: 12, color: '#f97316', fontWeight: '600' },
  counterOfferActions: { flexDirection: 'row', gap: 8, marginTop: -4, marginBottom: 12, paddingHorizontal: 4 },
  declineCounterButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#334155', alignItems: 'center' },
  declineCounterText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  acceptCounterButton: { flex: 2, flexDirection: 'row', paddingVertical: 10, borderRadius: 8, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', gap: 6 },
  acceptCounterText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  
  // Admin styles
  adminWelcome: { alignItems: 'center', paddingVertical: 40, marginBottom: 20 },
  adminWelcomeTitle: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc', marginTop: 16 },
  adminWelcomeSubtitle: { fontSize: 14, color: '#64748b', marginTop: 8 },
  adminCardButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  adminCardIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(249, 115, 22, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  adminCardContent: { flex: 1 },
  adminCardTitle: { fontSize: 18, fontWeight: '600', color: '#f8fafc' },
  adminCardSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
});
