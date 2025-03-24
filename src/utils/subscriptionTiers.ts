
// Define subscription tier types and limits
export type SubscriptionTier = 'free' | 'premium';

export interface TierLimit {
  name: string;
  maxTattoos: number;
  price: number | null; // null means free
  features: string[];
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierLimit> = {
  free: {
    name: 'Free',
    maxTattoos: 5,
    price: null,
    features: [
      'Store up to 5 tattoos',
      'Basic tattoo information',
      'Image upload'
    ]
  },
  premium: {
    name: 'Premium',
    maxTattoos: Infinity,
    price: 4.99,
    features: [
      'Unlimited tattoos',
      'All free features',
      'Priority support',
      'Access to premium templates'
    ]
  }
};

// Helper function to check if user has reached their limit
export const hasReachedTattooLimit = (
  currentTier: SubscriptionTier,
  tattooCount: number
): boolean => {
  const tierLimit = SUBSCRIPTION_TIERS[currentTier].maxTattoos;
  return tattooCount >= tierLimit;
};

// Helper function to get user's subscription tier
export const getUserSubscriptionTier = (): SubscriptionTier => {
  return localStorage.getItem('subscription_tier') === 'premium' ? 'premium' : 'free';
};
