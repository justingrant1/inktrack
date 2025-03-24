
import React from 'react';

interface DebugInfoProps {
  message: string;
  type: 'info' | 'error' | 'success';
}

const DebugInfo = ({ message, type }: DebugInfoProps) => {
  if (!message) return null;
  
  return (
    <div className={`mb-4 p-3 rounded-md ${
      type === 'error' ? 'bg-destructive/10 text-destructive' :
      type === 'success' ? 'bg-green-500/10 text-green-600' :
      'bg-primary/10 text-primary'
    }`}>
      {message}
    </div>
  );
};

export default DebugInfo;
