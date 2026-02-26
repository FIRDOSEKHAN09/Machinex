import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import { subscriptionService } from '../services/subscriptionService';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  offerings: any;
  customerInfo: any;
  error: string | null;
  isAvailable: boolean;
  purchasePackage: (pkg: any) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshSubscriptionStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<any>(null);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  // Initialize RevenueCat and check subscription on app start
  const initializeSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Web platform doesn't support subscriptions - grant premium access for testing
      if (Platform.OS === 'web') {
        console.log('[SubscriptionContext] Web platform - granting premium access');
        setIsPremium(true);
        setIsAvailable(false);
        setIsLoading(false);
        return;
      }

      // Initialize RevenueCat with error handling
      try {
        await subscriptionService.initialize();
      } catch (initError) {
        console.error('[SubscriptionContext] RevenueCat init failed:', initError);
        // Continue without RevenueCat - grant premium for now
        setIsPremium(true);
        setIsAvailable(false);
        setIsLoading(false);
        return;
      }

      // Check if RevenueCat is actually available
      const available = subscriptionService.isAvailable();
      setIsAvailable(available);

      if (!available) {
        console.log('[SubscriptionContext] RevenueCat not available - granting premium access');
        setIsPremium(true);
        setIsLoading(false);
        return;
      }

      // If user is authenticated, identify them with RevenueCat
      if (isAuthenticated && user?.id) {
        try {
          await subscriptionService.loginUser(user.id);
        } catch (loginError) {
          console.error('[SubscriptionContext] RevenueCat login failed:', loginError);
        }
      }

      // Get subscription status
      try {
        const premium = await subscriptionService.isPremiumUser();
        setIsPremium(premium);
      } catch (premiumError) {
        console.error('[SubscriptionContext] Premium check failed:', premiumError);
        setIsPremium(false);
      }

      // Get customer info (non-blocking)
      try {
        const info = await subscriptionService.getCustomerInfo();
        setCustomerInfo(info);
      } catch (infoError) {
        console.error('[SubscriptionContext] Customer info failed:', infoError);
      }

      // Get offerings (non-blocking)
      try {
        const offers = await subscriptionService.getOfferings();
        setOfferings(offers);
      } catch (offerError) {
        console.error('[SubscriptionContext] Offerings failed:', offerError);
      }

      console.log('[SubscriptionContext] Initialized successfully');
    } catch (err: any) {
      console.error('[SubscriptionContext] Initialization error:', err);
      setError(err.message || 'Failed to initialize subscriptions');
      // On error, grant premium access to not block the user
      setIsPremium(true);
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Handle user login/logout changes
  useEffect(() => {
    // Small delay to let other contexts initialize first
    const timer = setTimeout(() => {
      initializeSubscriptions();
    }, 100);

    return () => clearTimeout(timer);
  }, [initializeSubscriptions]);

  // Handle logout
  useEffect(() => {
    if (!isAuthenticated) {
      // User logged out - reset state but don't crash
      if (Platform.OS !== 'web' && subscriptionService.isAvailable()) {
        subscriptionService.logoutUser().catch(console.error);
      }
    }
  }, [isAuthenticated]);

  // Purchase a subscription package
  const purchasePackage = useCallback(async (pkg: any): Promise<boolean> => {
    if (!isAvailable) {
      console.log('[SubscriptionContext] Purchases not available');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { customerInfo: info, success } = await subscriptionService.purchasePackage(pkg);
      
      setCustomerInfo(info);
      setIsPremium(success);
      
      return success;
    } catch (err: any) {
      console.error('[SubscriptionContext] Purchase error:', err);
      setError(err.message || 'Purchase failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);

  // Restore previous purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) {
      console.log('[SubscriptionContext] Purchases not available');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { customerInfo: info, isPremium: premium } = await subscriptionService.restorePurchases();
      
      setCustomerInfo(info);
      setIsPremium(premium);
      
      return premium;
    } catch (err: any) {
      console.error('[SubscriptionContext] Restore error:', err);
      setError(err.message || 'Restore failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);

  // Refresh subscription status (call on app resume)
  const refreshSubscriptionStatus = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'web' || !isAvailable) return;
    
    try {
      const premium = await subscriptionService.isPremiumUser();
      setIsPremium(premium);
      
      const info = await subscriptionService.getCustomerInfo();
      setCustomerInfo(info);
    } catch (err: any) {
      console.error('[SubscriptionContext] Refresh error:', err);
    }
  }, [isAvailable]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isLoading,
        offerings,
        customerInfo,
        error,
        isAvailable,
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
