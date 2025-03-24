
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SubscriptionTier, SUBSCRIPTION_TIERS, hasReachedTattooLimit } from '@/utils/subscriptionTiers';
import { CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionBannerProps {
  tattooCount: number;
  userTier: SubscriptionTier;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ 
  tattooCount, 
  userTier 
}) => {
  const navigate = useNavigate();
  const isLimitReached = hasReachedTattooLimit(userTier, tattooCount);
  
  if (userTier === 'premium' || !isLimitReached) {
    return null;
  }

  const handleUpgrade = () => {
    navigate('/subscription');
  };

  return (
    <Alert className="mb-6 border-amber-500 bg-amber-500/10">
      <AlertTitle className="text-amber-500 flex items-center gap-2">
        <CreditCard className="h-4 w-4" />
        You've reached your free tier limit
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          You've used {tattooCount} out of {SUBSCRIPTION_TIERS.free.maxTattoos} tattoos 
          available in your free plan.
        </p>
        <Button
          onClick={handleUpgrade}
          variant="outline"
          className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
        >
          Upgrade to Premium
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default SubscriptionBanner;
