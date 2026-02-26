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
  // Default to premium (no blocking) - subscription is optional
  const [isPremium, setIsPremium] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  // Initialize RevenueCat - but don't block user access
  const initializeSubscriptions = useCallback(async () => {
    // Skip on web - grant access
    if (Platform.OS === 'web') {
      console.log('[SubscriptionContext] Web platform - access granted');
      setIsPremium(true);
      setIsAvailable(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Try to initialize RevenueCat
      try {
        await subscriptionService.initialize();
      } catch (initError) {
        console.log('[SubscriptionContext] RevenueCat init skipped:', initError);
        setIsPremium(true); // Don't block user
        setIsAvailable(false);
        setIsLoading(false);
        return;
      }

      const available = subscriptionService.isAvailable();
      setIsAvailable(available);

      if (!available) {
        console.log('[SubscriptionContext] RevenueCat not available - access granted');
        setIsPremium(true);
        setIsLoading(false);
        return;
      }

      // If user is authenticated, identify them
      if (isAuthenticated && user?.id) {
        try {
          await subscriptionService.loginUser(user.id);
        } catch (loginError) {
          console.log('[SubscriptionContext] RevenueCat login skipped');
        }
      }

      // Check subscription status - but don't block if it fails
      try {
        const premium = await subscriptionService.isPremiumUser();
        setIsPremium(premium || true); // Default to true if check fails
      } catch {
        setIsPremium(true);
      }

      // Get offerings (non-blocking)
      try {
        const offers = await subscriptionService.getOfferings();
        setOfferings(offers);
      } catch {
        // Ignore
      }

      // Get customer info (non-blocking)
      try {
        const info = await subscriptionService.getCustomerInfo();
        setCustomerInfo(info);
      } catch {
        // Ignore
      }

    } catch (err: any) {
      console.log('[SubscriptionContext] Error (non-blocking):', err.message);
      setIsPremium(true); // Don't block user on errors
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Initialize on mount with delay to not block app startup
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeSubscriptions();
    }, 500); // Delay to let app render first

    return () => clearTimeout(timer);
  }, [initializeSubscriptions]);

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
      if (success) setIsPremium(true);
      
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
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { customerInfo: info, isPremium: premium } = await subscriptionService.restorePurchases();
      
      setCustomerInfo(info);
      if (premium) setIsPremium(true);
      
      return premium;
    } catch (err: any) {
      console.error('[SubscriptionContext] Restore error:', err);
      setError(err.message || 'Restore failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);

  // Refresh subscription status
  const refreshSubscriptionStatus = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'web' || !isAvailable) return;
    
    try {
      const premium = await subscriptionService.isPremiumUser();
      if (premium) setIsPremium(true);
      
      const info = await subscriptionService.getCustomerInfo();
      setCustomerInfo(info);
    } catch {
      // Ignore errors
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
