
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_TIERS } from '@/utils/subscriptionTiers';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { redirectToStripeCheckout, isUserPremium } from '@/utils/stripe';

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const isPremium = isUserPremium();

  // Handle upgrade with Stripe checkout
  const handleUpgrade = async () => {
    if (!user) {
      toast.error('You must be logged in to upgrade');
      return;
    }
    
    setIsLoading(true);
    try {
      // Redirect to Stripe checkout
      const success = redirectToStripeCheckout('price_premium_monthly', user.id);
      
      if (!success) {
        throw new Error('Failed to initialize checkout');
      }
      
      // Note: The page will be redirected to Stripe, so we don't need 
      // to reset isLoading here as the component will unmount
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast.error('Failed to upgrade subscription. Please try again.');
      setIsLoading(false);
    }
  };

  // Check for successful Stripe checkout
  React.useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const sessionId = query.get('session_id');
    
    if (sessionId) {
      // Process the successful checkout
      const processCheckout = async () => {
        setIsLoading(true);
        try {
          const success = await handleStripeCheckoutSuccess(sessionId);
          if (success) {
            // Clean up the URL
            window.history.replaceState({}, document.title, '/subscription');
            // Redirect to app
            navigate('/app');
          }
        } catch (error) {
          console.error('Error processing checkout:', error);
          toast.error('Failed to process your payment. Please contact support.');
        } finally {
          setIsLoading(false);
        }
      };
      
      processCheckout();
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container py-10 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8 text-center">Choose Your Plan</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">{SUBSCRIPTION_TIERS.free.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">Free</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {SUBSCRIPTION_TIERS.free.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant={isPremium ? "outline" : "default"} 
                className="w-full" 
                onClick={() => navigate('/app')}
              >
                {isPremium ? 'Switch to Free' : 'Current Plan'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Premium Tier */}
          <Card className="border-2 border-primary">
            <CardHeader className="bg-primary/10">
              <div className="absolute -top-3 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                RECOMMENDED
              </div>
              <CardTitle className="text-2xl">{SUBSCRIPTION_TIERS.premium.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">${SUBSCRIPTION_TIERS.premium.price}</span>
                <span className="text-muted-foreground"> / month</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {SUBSCRIPTION_TIERS.premium.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleUpgrade} 
                disabled={isLoading || isPremium}
              >
                {isLoading ? 'Processing...' : isPremium ? (
                  'Current Plan'
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Upgrade Now
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Payment Information */}
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-muted/50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
          <p className="mb-2">• Secure payments processed by Stripe</p>
          <p className="mb-2">• Cancel anytime from your account settings</p>
          <p className="mb-2">• Questions? Contact our support team</p>
        </div>
      </main>
    </div>
  );
};

export default Subscription;
