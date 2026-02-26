import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_START_KEY = '@machinex_trial_start';
const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  error: string | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  // Default to premium (free access) - user can use app freely
  const [isPremium, setIsPremium] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrialActive, setIsTrialActive] = useState(true);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(60);
  const [error, setError] = useState<string | null>(null);

  // Check and initialize trial period
  const checkTrialStatus = useCallback(async () => {
    try {
      // Get trial start date from storage
      let trialStart = await AsyncStorage.getItem(TRIAL_START_KEY);
      
      if (!trialStart) {
        // First time user - start trial now
        trialStart = new Date().toISOString();
        await AsyncStorage.setItem(TRIAL_START_KEY, trialStart);
        console.log('[Subscription] Trial started:', trialStart);
      }

      const startDate = new Date(trialStart);
      const now = new Date();
      const elapsed = now.getTime() - startDate.getTime();
      const remaining = TWO_MONTHS_MS - elapsed;
      const daysRemaining = Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));

      setTrialDaysRemaining(daysRemaining);
      setIsTrialActive(daysRemaining > 0);
      
      // User has premium access during trial (2 months free)
      // After trial, they still have access (subscription is optional for now)
      setIsPremium(true);
      
      console.log('[Subscription] Trial days remaining:', daysRemaining);
    } catch (err: any) {
      console.error('[Subscription] Error checking trial:', err);
      setError(err.message);
      // On error, grant access
      setIsPremium(true);
      setIsTrialActive(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    // Small delay to let app render first
    const timer = setTimeout(() => {
      checkTrialStatus();
    }, 100);

    return () => clearTimeout(timer);
  }, [checkTrialStatus]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isLoading,
        isTrialActive,
        trialDaysRemaining,
        error,
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
