
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_TIERS } from '@/utils/subscriptionTiers';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  // In a real app, this would integrate with a payment processor like Stripe
  const handleUpgrade = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Update the user's subscription tier in the database
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          subscription_tier: 'premium',
          subscription_updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast.success('Successfully upgraded to Premium!');
      navigate('/app');
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast.error('Failed to upgrade subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
              <Button variant="outline" className="w-full" onClick={() => navigate('/app')}>
                Current Plan
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
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Upgrade Now
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Subscription;
