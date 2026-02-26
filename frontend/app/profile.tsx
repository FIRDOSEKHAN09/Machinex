import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'App Admin';
      case 'owner': return 'Machine Owner';
      case 'user': return 'Renter';
      case 'manager': return 'Manager';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'owner': return '#3b82f6';
      case 'user': return '#22c55e';
      case 'manager': return '#a855f7';
      default: return '#64748b';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Picture & Name */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: `${getRoleColor(user?.role || '')}20` }]}>
            <Text style={[styles.avatarText, { color: getRoleColor(user?.role || '') }]}>
              {getInitials(user?.name || '')}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(user?.role || '')}20` }]}>
            <Text style={[styles.roleText, { color: getRoleColor(user?.role || '') }]}>
              {getRoleLabel(user?.role || '')}
            </Text>
          </View>
        </View>

        {/* Subscription Status Card */}
        <TouchableOpacity
          style={[styles.card, isPremium ? styles.premiumCard : styles.freeCard]}
          onPress={() => !isPremium && router.push('/paywall')}
        >
          <View style={styles.subscriptionHeader}>
            <Ionicons
              name={isPremium ? 'diamond' : 'diamond-outline'}
              size={28}
              color={isPremium ? '#f97316' : '#64748b'}
            />
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionTitle}>
                {isPremium ? 'MachineX Pro' : 'Free Plan'}
              </Text>
              <Text style={styles.subscriptionStatus}>
                {isPremium ? 'Active Subscription' : 'Upgrade for full access'}
              </Text>
            </View>
            {!isPremium && (
              <View style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </View>
            )}
          </View>
          {isTrialActive && (
            <View style={styles.subscriptionDetails}>
              <Ionicons name="time-outline" size={16} color="#22c55e" />
              <Text style={styles.subscriptionDetailText}>
                {trialDaysRemaining} days free remaining
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Information</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="person-outline" size={20} color="#94a3b8" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{user?.name}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="mail-outline" size={20} color="#94a3b8" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Contact</Text>
              <Text style={styles.detailValue}>{user?.phone_or_email}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#94a3b8" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Role</Text>
              <Text style={styles.detailValue}>{getRoleLabel(user?.role || '')}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Member Since</Text>
              <Text style={styles.detailValue}>
                {user?.created_at ? formatDate(user.created_at) : 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="key-outline" size={20} color="#94a3b8" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>User ID</Text>
              <Text style={[styles.detailValue, styles.userIdText]} numberOfLines={1}>
                {user?.id}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions</Text>

          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/home')}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="home-outline" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.actionText}>Go to Home</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>

          {user?.role === 'admin' && (
            <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/admin')}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#ef4444" />
                </View>
                <Text style={styles.actionText}>Admin Dashboard</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748b" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              </View>
              <Text style={[styles.actionText, { color: '#ef4444' }]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ef4444" />
          </TouchableOpacity>
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
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '500',
  },
  userIdText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#f8fafc',
  },
  bottomSpacer: {
    height: 32,
  },
  // Subscription styles
  premiumCard: {
    borderWidth: 2,
    borderColor: '#f97316',
    backgroundColor: 'rgba(249, 115, 22, 0.05)',
  },
  freeCard: {
    borderWidth: 1,
    borderColor: '#334155',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  subscriptionStatus: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  subscriptionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  subscriptionDetailText: {
    fontSize: 13,
    color: '#22c55e',
  },
});
