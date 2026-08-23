import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageContainer({ children, className, ...props }: PageContainerProps) {
  return (
    <div 
      className={cn("w-full max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8", className)}
      {...props}
    >
      {children}
    </div>
  );
}
