import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import { CustomerInfo, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import { subscriptionService } from '../services/subscriptionService';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  offerings: PurchasesOfferings | null;
  customerInfo: CustomerInfo | null;
  error: string | null;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshSubscriptionStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize RevenueCat and check subscription on app start
  const initializeSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Web platform doesn't support subscriptions - grant premium access
      if (Platform.OS === 'web') {
        console.log('[SubscriptionContext] Web platform - granting premium access');
        setIsPremium(true);
        setIsLoading(false);
        return;
      }

      // Initialize RevenueCat
      await subscriptionService.initialize();

      // If user is authenticated, identify them with RevenueCat
      if (isAuthenticated && user?.id) {
        await subscriptionService.loginUser(user.id);
      }

      // Get subscription status
      const premium = await subscriptionService.isPremiumUser();
      setIsPremium(premium);

      // Get customer info
      const info = await subscriptionService.getCustomerInfo();
      setCustomerInfo(info);

      // Get offerings
      const offers = await subscriptionService.getOfferings();
      setOfferings(offers);

      console.log('[SubscriptionContext] Initialized - Premium:', premium);
    } catch (err: any) {
      console.error('[SubscriptionContext] Initialization error:', err);
      setError(err.message || 'Failed to initialize subscriptions');
      // On error, default to non-premium
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Handle user login/logout changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      initializeSubscriptions();
    } else {
      // User logged out - reset state
      setIsPremium(false);
      setCustomerInfo(null);
      setOfferings(null);
      setIsLoading(false);
      
      // Logout from RevenueCat
      if (Platform.OS !== 'web') {
        subscriptionService.logoutUser().catch(console.error);
      }
    }
  }, [isAuthenticated, user?.id, initializeSubscriptions]);

  // Purchase a subscription package
  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { customerInfo, success } = await subscriptionService.purchasePackage(pkg);
      
      setCustomerInfo(customerInfo);
      setIsPremium(success);
      
      return success;
    } catch (err: any) {
      console.error('[SubscriptionContext] Purchase error:', err);
      setError(err.message || 'Purchase failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Restore previous purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { customerInfo, isPremium } = await subscriptionService.restorePurchases();
      
      setCustomerInfo(customerInfo);
      setIsPremium(isPremium);
      
      return isPremium;
    } catch (err: any) {
      console.error('[SubscriptionContext] Restore error:', err);
      setError(err.message || 'Restore failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh subscription status (call on app resume)
  const refreshSubscriptionStatus = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    
    try {
      const premium = await subscriptionService.isPremiumUser();
      setIsPremium(premium);
      
      const info = await subscriptionService.getCustomerInfo();
      setCustomerInfo(info);
    } catch (err: any) {
      console.error('[SubscriptionContext] Refresh error:', err);
    }
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isLoading,
        offerings,
        customerInfo,
        error,
        purchasePackage,
        restorePurchases,
        refreshSubscriptionStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
