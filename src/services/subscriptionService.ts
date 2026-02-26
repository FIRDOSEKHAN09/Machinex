import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";

// RevenueCat Configuration
const REVENUECAT_API_KEY = "goog_sOUpZMWsQkWSZITjXrdgJBEgyoM";
const ENTITLEMENT_ID = "pro_access";

// Product IDs
export const PRODUCT_IDS = {
  MONTHLY: "machinex_monthly",
  YEARLY: "machinex_yearly",
};

class SubscriptionService {
  private initialized: boolean = false;

  /**
   * Initialize RevenueCat SDK
   * Call this once on app startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log("[SubscriptionService] Already initialized");
      return;
    }

    try {
      // Set log level for debugging (change to WARN in production)
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);

      // Configure RevenueCat
      if (Platform.OS === "android") {
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        console.log("[SubscriptionService] RevenueCat configured for Android");
      } else if (Platform.OS === "ios") {
        // iOS not implemented yet - would need separate API key
        console.log("[SubscriptionService] iOS not configured yet");
        return;
      } else {
        // Web - RevenueCat not supported on web
        console.log(
          "[SubscriptionService] Web platform - subscriptions not available",
        );
        return;
      }

      this.initialized = true;
      console.log("[SubscriptionService] Initialized successfully");
    } catch (error) {
      console.error("[SubscriptionService] Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Identify user with their unique ID (Firebase UID or app user ID)
   */
  async loginUser(userId: string): Promise<CustomerInfo> {
    try {
      console.log("[SubscriptionService] Logging in user:", userId);
      const { customerInfo } = await Purchases.logIn(userId);
      console.log("[SubscriptionService] User logged in successfully");
      return customerInfo;
    } catch (error) {
      console.error("[SubscriptionService] Login failed:", error);
      throw error;
    }
  }

  /**
   * Log out user (clear RevenueCat identity)
   */
  async logoutUser(): Promise<CustomerInfo | null> {
    try {
      if (!this.initialized) {
        console.log(
          "[SubscriptionService] Not initialized yet. Skipping logout.",
        );
        return null;
      }

      console.log("[SubscriptionService] Logging out user");
      const customerInfo = await Purchases.logOut();
      console.log("[SubscriptionService] User logged out successfully");
      return customerInfo;
    } catch (error) {
      console.log("[SubscriptionService] Safe logout skip.");
      return null;
    }
  }

  /**
   * Get current customer info including subscription status
   */
  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      console.log("[SubscriptionService] Got customer info:", {
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: Object.keys(customerInfo.entitlements.active),
      });
      return customerInfo;
    } catch (error) {
      console.error(
        "[SubscriptionService] Failed to get customer info:",
        error,
      );
      throw error;
    }
  }

  /**
   * Check if user has pro_access entitlement (premium)
   */
  async isPremiumUser(): Promise<boolean> {
    try {
      if (!this.initialized) {
        console.log("[SubscriptionService] Not initialized, returning false");
        return false;
      }

      const customerInfo = await this.getCustomerInfo();
      const isPremium =
        customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

      console.log("[SubscriptionService] Premium status:", isPremium);
      return isPremium;
    } catch (error) {
      console.error(
        "[SubscriptionService] Failed to check premium status:",
        error,
      );
      return false;
    }
  }

  /**
   * Get available subscription offerings
   */
  async getOfferings(): Promise<PurchasesOfferings | null> {
    try {
      const offerings = await Purchases.getOfferings();
      console.log(
        "[SubscriptionService] Got offerings:",
        offerings.current?.identifier,
      );
      return offerings;
    } catch (error) {
      console.error("[SubscriptionService] Failed to get offerings:", error);
      return null;
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(
    pkg: PurchasesPackage,
  ): Promise<{ customerInfo: CustomerInfo; success: boolean }> {
    try {
      console.log("[SubscriptionService] Purchasing package:", pkg.identifier);
      const { customerInfo } = await Purchases.purchasePackage(pkg);

      const isPremium =
        customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      console.log(
        "[SubscriptionService] Purchase complete, premium:",
        isPremium,
      );

      return { customerInfo, success: isPremium };
    } catch (error: any) {
      // Check if user cancelled
      if (error.userCancelled) {
        console.log("[SubscriptionService] User cancelled purchase");
        return { customerInfo: await this.getCustomerInfo(), success: false };
      }
      console.error("[SubscriptionService] Purchase failed:", error);
      throw error;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<{
    customerInfo: CustomerInfo;
    isPremium: boolean;
  }> {
    try {
      console.log("[SubscriptionService] Restoring purchases");
      const customerInfo = await Purchases.restorePurchases();
      const isPremium =
        customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

      console.log(
        "[SubscriptionService] Restore complete, premium:",
        isPremium,
      );
      return { customerInfo, isPremium };
    } catch (error) {
      console.error("[SubscriptionService] Restore failed:", error);
      throw error;
    }
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
export default subscriptionService;
