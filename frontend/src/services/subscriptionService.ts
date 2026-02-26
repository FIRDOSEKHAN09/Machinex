import { Platform } from 'react-native';

// RevenueCat Configuration
const REVENUECAT_API_KEY = 'goog_s0UpZMWsQkWSZITjXrdg';
const ENTITLEMENT_ID = 'pro_access';

// Product IDs
export const PRODUCT_IDS = {
  MONTHLY: 'machinex_monthly',
  YEARLY: 'machinex_yearly',
};

// Dynamic import to prevent crash if module not available
let Purchases: any = null;
let LOG_LEVEL: any = null;

const loadRevenueCat = async () => {
  if (Platform.OS === 'web') {
    console.log('[SubscriptionService] Web platform - RevenueCat not supported');
    return false;
  }
  
  try {
    const module = await import('react-native-purchases');
    Purchases = module.default;
    LOG_LEVEL = module.LOG_LEVEL;
    console.log('[SubscriptionService] RevenueCat module loaded successfully');
    return true;
  } catch (error) {
    console.error('[SubscriptionService] Failed to load RevenueCat module:', error);
    return false;
  }
};

class SubscriptionService {
  private initialized: boolean = false;
  private moduleLoaded: boolean = false;

  /**
   * Initialize RevenueCat SDK
   * Call this once on app startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[SubscriptionService] Already initialized');
      return;
    }

    // Skip on web
    if (Platform.OS === 'web') {
      console.log('[SubscriptionService] Web platform - skipping initialization');
      this.initialized = true;
      return;
    }

    try {
      // Try to load the module
      this.moduleLoaded = await loadRevenueCat();
      
      if (!this.moduleLoaded || !Purchases) {
        console.log('[SubscriptionService] RevenueCat not available - skipping');
        this.initialized = true;
        return;
      }

      // Set log level for debugging (change to WARN in production)
      if (LOG_LEVEL) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Configure RevenueCat
      if (Platform.OS === 'android') {
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        console.log('[SubscriptionService] RevenueCat configured for Android');
      } else if (Platform.OS === 'ios') {
        // iOS not implemented yet - would need separate API key
        console.log('[SubscriptionService] iOS not configured yet');
        this.initialized = true;
        return;
      }

      this.initialized = true;
      console.log('[SubscriptionService] Initialized successfully');
    } catch (error) {
      console.error('[SubscriptionService] Initialization failed:', error);
      // Don't throw - just mark as initialized to prevent retry loops
      this.initialized = true;
      this.moduleLoaded = false;
    }
  }

  /**
   * Check if RevenueCat is available and initialized
   */
  isAvailable(): boolean {
    return this.initialized && this.moduleLoaded && Purchases !== null;
  }

  /**
   * Identify user with their unique ID (Firebase UID or app user ID)
   */
  async loginUser(userId: string): Promise<any> {
    if (!this.isAvailable()) {
      console.log('[SubscriptionService] Not available - skipping login');
      return null;
    }

    try {
      console.log('[SubscriptionService] Logging in user:', userId);
      const { customerInfo } = await Purchases.logIn(userId);
      console.log('[SubscriptionService] User logged in successfully');
      return customerInfo;
    } catch (error) {
      console.error('[SubscriptionService] Login failed:', error);
      return null;
    }
  }

  /**
   * Log out user (clear RevenueCat identity)
   */
  async logoutUser(): Promise<any> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      console.log('[SubscriptionService] Logging out user');
      const customerInfo = await Purchases.logOut();
      console.log('[SubscriptionService] User logged out successfully');
      return customerInfo;
    } catch (error) {
      console.error('[SubscriptionService] Logout failed:', error);
      return null;
    }
  }

  /**
   * Get current customer info including subscription status
   */
  async getCustomerInfo(): Promise<any> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('[SubscriptionService] Got customer info:', {
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: Object.keys(customerInfo.entitlements.active),
      });
      return customerInfo;
    } catch (error) {
      console.error('[SubscriptionService] Failed to get customer info:', error);
      return null;
    }
  }

  /**
   * Check if user has pro_access entitlement (premium)
   */
  async isPremiumUser(): Promise<boolean> {
    if (!this.isAvailable()) {
      console.log('[SubscriptionService] Not available - returning false');
      return false;
    }

    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return false;
      
      const isPremium = customerInfo.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
      console.log('[SubscriptionService] Premium status:', isPremium);
      return isPremium;
    } catch (error) {
      console.error('[SubscriptionService] Failed to check premium status:', error);
      return false;
    }
  }

  /**
   * Get available subscription offerings
   */
  async getOfferings(): Promise<any> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      console.log('[SubscriptionService] Got offerings:', offerings?.current?.identifier);
      return offerings;
    } catch (error) {
      console.error('[SubscriptionService] Failed to get offerings:', error);
      return null;
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(pkg: any): Promise<{ customerInfo: any; success: boolean }> {
    if (!this.isAvailable()) {
      return { customerInfo: null, success: false };
    }

    try {
      console.log('[SubscriptionService] Purchasing package:', pkg.identifier);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      const isPremium = customerInfo.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
      console.log('[SubscriptionService] Purchase complete, premium:', isPremium);
      
      return { customerInfo, success: isPremium };
    } catch (error: any) {
      // Check if user cancelled
      if (error.userCancelled) {
        console.log('[SubscriptionService] User cancelled purchase');
        const info = await this.getCustomerInfo();
        return { customerInfo: info, success: false };
      }
      console.error('[SubscriptionService] Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<{ customerInfo: any; isPremium: boolean }> {
    if (!this.isAvailable()) {
      return { customerInfo: null, isPremium: false };
    }

    try {
      console.log('[SubscriptionService] Restoring purchases');
      const customerInfo = await Purchases.restorePurchases();
      const isPremium = customerInfo.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
      
      console.log('[SubscriptionService] Restore complete, premium:', isPremium);
      return { customerInfo, isPremium };
    } catch (error) {
      console.error('[SubscriptionService] Restore failed:', error);
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
