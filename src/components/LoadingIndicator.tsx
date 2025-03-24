
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface LoadingIndicatorProps {
  progress: number;
  message?: string;
}

const LoadingIndicator = ({ progress, message = 'Loading...' }: LoadingIndicatorProps) => {
  return (
    <div className="mb-8">
      <p className="text-center text-sm text-muted-foreground mb-2">{message}</p>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

export default LoadingIndicator;
