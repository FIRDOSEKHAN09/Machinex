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
import { adminAPI } from '@/src/services/api';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [runningMachines, setRunningMachines] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState<any>({ logins: 0, newContracts: 0, newUsers: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      console.log('Admin: Fetching data, user:', user);
      const [overviewRes, runningRes, activityRes] = await Promise.all([
        adminAPI.getOverview(),
        adminAPI.getRunningMachines(),
        adminAPI.getRecentActivity(),
      ]);
      
      console.log('Admin: Data fetched successfully');
      setOverview(overviewRes.data);
      setRunningMachines(runningRes.data || []);
      setRecentActivity(activityRes.data || []);
      
      // Calculate today's stats
      const today = new Date().toDateString();
      const todayActivity = (activityRes.data || []).filter((a: any) => 
        new Date(a.timestamp).toDateString() === today
      );
      setTodayStats({
        logins: todayActivity.filter((a: any) => a.type === 'login').length,
        newContracts: todayActivity.filter((a: any) => a.type === 'contract_created').length,
        newUsers: todayActivity.filter((a: any) => a.type === 'user_registered').length,
      });
    } catch (error: any) {
      console.error('Admin: Error fetching data:', error);
      console.error('Admin: Error response:', error.response?.data);
      if (error.response?.status === 403) {
        alert('Admin access denied. Please ensure you have admin privileges.');
        router.replace('/home');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('Admin page mounted, user:', user);
      if (user) {
        fetchData();
      }
      
      // Auto-refresh every 30 seconds for live data
      const interval = setInterval(() => {
        if (user) {
          fetchData();
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }, [user?.id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return { name: 'person-add', color: '#22c55e' };
      case 'contract_created':
        return { name: 'document-text', color: '#3b82f6' };
      case 'engine_started':
        return { name: 'play-circle', color: '#f97316' };
      case 'engine_stopped':
        return { name: 'stop-circle', color: '#ef4444' };
      default:
        return { name: 'ellipse', color: '#64748b' };
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading Admin Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Don't block on role check - let users see the page and handle auth via API
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
            <Text style={styles.greeting}>Admin Dashboard</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#f8fafc" />
          </TouchableOpacity>
        </View>

        {/* Today's Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <View style={styles.todayGrid}>
            <View style={styles.todayCard}>
              <Ionicons name="log-in" size={24} color="#3b82f6" />
              <Text style={styles.todayValue}>{todayStats.logins}</Text>
              <Text style={styles.todayLabel}>Logins</Text>
            </View>
            <View style={styles.todayCard}>
              <Ionicons name="document-text" size={24} color="#22c55e" />
              <Text style={styles.todayValue}>{todayStats.newContracts}</Text>
              <Text style={styles.todayLabel}>New Contracts</Text>
            </View>
            <View style={styles.todayCard}>
              <Ionicons name="person-add" size={24} color="#f97316" />
              <Text style={styles.todayValue}>{todayStats.newUsers}</Text>
              <Text style={styles.todayLabel}>New Users</Text>
            </View>
          </View>
        </View>

        {/* Overview Stats */}
        {overview && (
          <>
            {/* Users Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Users Overview</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, styles.statCardPrimary]}>
                  <Ionicons name="people" size={28} color="#f97316" />
                  <Text style={styles.statValue}>{overview.users?.total || 0}</Text>
                  <Text style={styles.statLabel}>Total Users</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="business" size={24} color="#3b82f6" />
                  <Text style={styles.statValue}>{overview.users?.owners || 0}</Text>
                  <Text style={styles.statLabel}>Owners</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="person" size={24} color="#22c55e" />
                  <Text style={styles.statValue}>{overview.users?.renters || 0}</Text>
                  <Text style={styles.statLabel}>Renters</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="settings" size={24} color="#a855f7" />
                  <Text style={styles.statValue}>{overview.users?.managers || 0}</Text>
                  <Text style={styles.statLabel}>Managers</Text>
                </View>
              </View>
            </View>

            {/* Machines Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Machines Status</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="construct" size={24} color="#f97316" />
                  <Text style={styles.statValue}>{overview.machines?.total || 0}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                  <Text style={styles.statValue}>{overview.machines?.available || 0}</Text>
                  <Text style={styles.statLabel}>Available</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="swap-horizontal" size={24} color="#3b82f6" />
                  <Text style={styles.statValue}>{overview.machines?.rented || 0}</Text>
                  <Text style={styles.statLabel}>Rented</Text>
                </View>
                <View style={[styles.statCard, styles.statCardRunning]}>
                  <Ionicons name="pulse" size={24} color="#ef4444" />
                  <Text style={[styles.statValue, styles.runningValue]}>{overview.machines?.running || 0}</Text>
                  <Text style={styles.statLabel}>Running NOW</Text>
                </View>
              </View>
            </View>

            {/* Contracts & Revenue */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contracts & Revenue</Text>
              <View style={styles.statsRow}>
                <View style={[styles.statCardWide, styles.revenueCard]}>
                  <Ionicons name="cash" size={32} color="#22c55e" />
                  <View>
                    <Text style={styles.revenueLabel}>Total Revenue</Text>
                    <Text style={styles.revenueValue}>₹{(overview.revenue?.total || 0).toLocaleString()}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="document-text" size={24} color="#3b82f6" />
                  <Text style={styles.statValue}>{overview.contracts?.total || 0}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="time" size={24} color="#f97316" />
                  <Text style={styles.statValue}>{overview.contracts?.active || 0}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-done" size={24} color="#22c55e" />
                  <Text style={styles.statValue}>{overview.contracts?.completed || 0}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Running Machines - LIVE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Machines Running NOW</Text>
              <View style={styles.pulseIndicator}>
                <View style={styles.pulseCircle} />
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/admin/running-machines')}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {runningMachines.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="pause-circle-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>No machines running</Text>
            </View>
          ) : (
            runningMachines.slice(0, 3).map((machine) => (
              <View key={machine.log_id} style={styles.runningCard}>
                <View style={styles.runningHeader}>
                  <View style={styles.runningIcon}>
                    <Ionicons name="construct" size={20} color="#22c55e" />
                    <View style={styles.runningDot} />
                  </View>
                  <View style={styles.runningInfo}>
                    <Text style={styles.runningMachine}>{machine.machine_name}</Text>
                    <Text style={styles.runningRenter}>Rented by: {machine.renter_name}</Text>
                  </View>
                  <View style={styles.runningTime}>
                    <Text style={styles.runningHours}>{machine.running_hours.toFixed(1)}h</Text>
                    <Text style={styles.runningLabel}>Running</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/admin/users')}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="people" size={28} color="#3b82f6" />
              </View>
              <Text style={styles.actionText}>All Users</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/admin/all-contracts')}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <Ionicons name="document-text" size={28} color="#22c55e" />
              </View>
              <Text style={styles.actionText}>All Contracts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/admin/all-machines')}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                <Ionicons name="construct" size={28} color="#f97316" />
              </View>
              <Text style={styles.actionText}>All Machines</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/admin/daily-logs')}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                <Ionicons name="time" size={28} color="#a855f7" />
              </View>
              <Text style={styles.actionText}>Daily Logs</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.slice(0, 10).map((activity, index) => {
            const icon = getActivityIcon(activity.type);
            return (
              <View key={index} style={styles.activityCard}>
                <View style={[styles.activityIcon, { backgroundColor: `${icon.color}20` }]}>
                  <Ionicons name={icon.name as any} size={20} color={icon.color} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityMessage}>{activity.message}</Text>
                  <Text style={styles.activityTime}>{formatDate(activity.timestamp)}</Text>
                </View>
              </View>
            );
          })}
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
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  backButton: {
    marginTop: 24,
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
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveText: {
    color: '#ef4444',
    fontSize: 11,
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  todayGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  todayCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  todayValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  todayLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
  },
  pulseIndicator: {
    marginBottom: 12,
  },
  pulseCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  seeAll: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statsRow: {
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statCardPrimary: {
    minWidth: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    padding: 16,
    marginBottom: 8,
  },
  statCardWide: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  statCardRunning: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 4,
  },
  runningValue: {
    color: '#ef4444',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  revenueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  revenueLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  revenueValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#1e293b',
    borderRadius: 16,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 12,
    fontSize: 14,
  },
  runningCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  runningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  runningIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  runningDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  runningInfo: {
    flex: 1,
    marginLeft: 12,
  },
  runningMachine: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
  },
  runningRenter: {
    fontSize: 12,
    color: '#64748b',
  },
  runningTime: {
    alignItems: 'flex-end',
  },
  runningHours: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  runningLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 13,
    color: '#f8fafc',
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  bottomSpacer: {
    height: 32,
  },
});
