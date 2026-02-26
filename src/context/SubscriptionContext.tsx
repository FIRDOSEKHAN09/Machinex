import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Platform } from "react-native";
import {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from "react-native-purchases";
import { subscriptionService } from "../services/subscriptionService";
import { useAuth } from "./AuthContext";

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

const SubscriptionContext = createContext<
  SubscriptionContextType | undefined
>(undefined);

export function SubscriptionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();

  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] =
    useState<PurchasesOfferings | null>(null);
  const [customerInfo, setCustomerInfo] =
    useState<CustomerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initializeSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (Platform.OS === "web") {
        setIsPremium(true);
        setIsLoading(false);
        return;
      }

      // Initialize RevenueCat safely
      if (!subscriptionService.isInitialized()) {
        await subscriptionService.initialize();
      }

      // Identify logged-in user
      if (isAuthenticated && user?.id) {
        await subscriptionService.loginUser(user.id);
      }

      const premium = await subscriptionService.isPremiumUser();
      setIsPremium(premium);

      const info = await subscriptionService.getCustomerInfo();
      setCustomerInfo(info);

      const offers = await subscriptionService.getOfferings();
      setOfferings(offers);

      console.log("[SubscriptionContext] Initialized - Premium:", premium);
    } catch (err: any) {
      console.error("[SubscriptionContext] Init error:", err);
      setError(err.message || "Subscription initialization failed");
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Run ONLY when auth state becomes ready
  useEffect(() => {
    if (!user) {
      setIsPremium(false);
      setCustomerInfo(null);
      setOfferings(null);
      setIsLoading(false);
      return;
    }

    initializeSubscriptions();
  }, [user, initializeSubscriptions]);

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const { customerInfo, success } =
          await subscriptionService.purchasePackage(pkg);

        setCustomerInfo(customerInfo);
        setIsPremium(success);

        return success;
      } catch (err: any) {
        console.error("[SubscriptionContext] Purchase error:", err);
        setError(err.message || "Purchase failed");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { customerInfo, isPremium } =
        await subscriptionService.restorePurchases();

      setCustomerInfo(customerInfo);
      setIsPremium(isPremium);

      return isPremium;
    } catch (err: any) {
      console.error("[SubscriptionContext] Restore error:", err);
      setError(err.message || "Restore failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSubscriptionStatus = useCallback(async () => {
    if (Platform.OS === "web") return;

    try {
      const premium = await subscriptionService.isPremiumUser();
      setIsPremium(premium);

      const info = await subscriptionService.getCustomerInfo();
      setCustomerInfo(info);
    } catch (err) {
      console.error("[SubscriptionContext] Refresh error:", err);
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
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
}