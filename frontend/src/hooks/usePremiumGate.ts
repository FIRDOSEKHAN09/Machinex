import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useSubscription } from '../context/SubscriptionContext';

/**
 * Hook to check premium status and navigate to paywall if not premium
 * Use this before allowing access to premium features
 */
export function usePremiumGate() {
  const router = useRouter();
  const { isPremium, isLoading } = useSubscription();

  /**
   * Check if user has premium access
   * If not, show alert and navigate to paywall
   * @returns true if user has access, false if redirected to paywall
   */
  const checkPremiumAccess = useCallback((): boolean => {
    if (isLoading) {
      return false; // Still loading, don't allow access yet
    }

    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'This feature requires an active subscription. Subscribe to MachineX Pro to unlock all features.',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'View Plans', onPress: () => router.push('/paywall') },
        ]
      );
      return false;
    }

    return true;
  }, [isPremium, isLoading, router]);

  /**
   * Navigate to paywall directly without alert
   */
  const goToPaywall = useCallback(() => {
    router.push('/paywall');
  }, [router]);

  return {
    isPremium,
    isLoading,
    checkPremiumAccess,
    goToPaywall,
  };
}

export default usePremiumGate;
