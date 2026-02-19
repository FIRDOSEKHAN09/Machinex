import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@/src/context/SubscriptionContext';
import { PurchasesPackage } from 'react-native-purchases';

const BENEFITS = [
  { icon: 'construct', title: 'List Unlimited Machines', description: 'Add as many machines as you want for rent' },
  { icon: 'document-text', title: 'Create Contracts', description: 'Create and manage rental contracts' },
  { icon: 'eye', title: 'View All Machines', description: 'Access full machine listings and details' },
  { icon: 'analytics', title: 'Track Earnings', description: 'Monitor your rental income and reports' },
  { icon: 'notifications', title: 'Real-time Notifications', description: 'Get instant updates on your rentals' },
  { icon: 'shield-checkmark', title: 'Priority Support', description: 'Get help when you need it' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { offerings, purchasePackage, restorePurchases, isLoading, error } = useSubscription();
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      setPurchaseLoading(true);
      const success = await purchasePackage(pkg);
      
      if (success) {
        Alert.alert(
          '🎉 Welcome to MachineX Pro!',
          'Your subscription is now active. Enjoy all premium features!',
          [{ text: 'Continue', onPress: () => router.back() }]
        );
      }
    } catch (err: any) {
      Alert.alert('Purchase Failed', err.message || 'Please try again later.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setRestoreLoading(true);
      const restored = await restorePurchases();
      
      if (restored) {
        Alert.alert(
          'Purchases Restored!',
          'Your subscription has been restored.',
          [{ text: 'Continue', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found for this account.');
      }
    } catch (err: any) {
      Alert.alert('Restore Failed', err.message || 'Please try again later.');
    } finally {
      setRestoreLoading(false);
    }
  };

  const monthlyPackage = offerings?.current?.availablePackages?.find(
    (p) => p.product.identifier === 'machinex_monthly'
  );
  const yearlyPackage = offerings?.current?.availablePackages?.find(
    (p) => p.product.identifier === 'machinex_yearly'
  );

  const isProcessing = purchaseLoading || restoreLoading || isLoading;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo & Title */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Ionicons name="diamond" size={48} color="#f97316" />
          </View>
          <Text style={styles.title}>MachineX Pro</Text>
          <Text style={styles.subtitle}>Unlock all premium features</Text>
        </View>

        {/* Trial Badge */}
        <View style={styles.trialBadge}>
          <Ionicons name="gift" size={20} color="#22c55e" />
          <Text style={styles.trialText}>Start with 2 months FREE trial!</Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          {BENEFITS.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Ionicons name={benefit.icon as any} size={20} color="#f97316" />
              </View>
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Subscription Plans */}
        <View style={styles.plansContainer}>
          <Text style={styles.plansTitle}>Choose Your Plan</Text>

          {/* Monthly Plan */}
          <TouchableOpacity
            style={[styles.planCard, isProcessing && styles.planCardDisabled]}
            onPress={() => monthlyPackage && handlePurchase(monthlyPackage)}
            disabled={isProcessing || !monthlyPackage}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Monthly</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.priceAmount}>
                  {monthlyPackage?.product?.priceString || '₹70'}
                </Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>
            </View>
            <Text style={styles.planDescription}>Perfect for trying out MachineX</Text>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.planFeatureText}>2 months free trial</Text>
            </View>
          </TouchableOpacity>

          {/* Yearly Plan - Best Value */}
          <TouchableOpacity
            style={[styles.planCard, styles.planCardBest, isProcessing && styles.planCardDisabled]}
            onPress={() => yearlyPackage && handlePurchase(yearlyPackage)}
            disabled={isProcessing || !yearlyPackage}
          >
            <View style={styles.bestBadge}>
              <Text style={styles.bestBadgeText}>BEST VALUE</Text>
            </View>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Yearly</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.priceAmount}>
                  {yearlyPackage?.product?.priceString || '₹700'}
                </Text>
                <Text style={styles.pricePeriod}>/year</Text>
              </View>
            </View>
            <Text style={styles.planDescription}>Save ₹140 compared to monthly!</Text>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.planFeatureText}>2 months free trial</Text>
            </View>
            <View style={styles.planFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.planFeatureText}>17% savings</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isProcessing}
        >
          {restoreLoading ? (
            <ActivityIndicator size="small" color="#64748b" />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Terms */}
        <Text style={styles.termsText}>
          By subscribing, you agree to our Terms of Service and Privacy Policy.
          Subscriptions auto-renew unless cancelled 24 hours before the end of the current period.
        </Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Loading Overlay */}
      {purchaseLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Processing...</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  trialText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
  benefitsContainer: {
    marginBottom: 32,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  plansContainer: {
    marginBottom: 24,
  },
  plansTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#334155',
  },
  planCardBest: {
    borderColor: '#f97316',
    position: 'relative',
  },
  planCardDisabled: {
    opacity: 0.6,
  },
  bestBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#f97316',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  planFeatureText: {
    fontSize: 14,
    color: '#f8fafc',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  restoreText: {
    fontSize: 14,
    color: '#64748b',
    textDecorationLine: 'underline',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    flex: 1,
  },
  termsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
  },
  bottomSpacer: {
    height: 40,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#f8fafc',
    fontSize: 16,
    marginTop: 16,
  },
});
