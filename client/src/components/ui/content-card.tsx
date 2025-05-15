import React from 'react';
import { cn } from '@/lib/utils';

interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ContentCard({ children, className }: ContentCardProps) {
  return (
    <div 
      className={cn(
        "bg-surface rounded-lg p-4 shadow-sm transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5", 
        className
      )}
    >
      {children}
    </div>
  );
}