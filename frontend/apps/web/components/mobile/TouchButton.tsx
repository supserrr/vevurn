'use client';

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'sm' | 'default' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ variant = 'default', size = 'default', children, className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-10 min-w-[44px] px-3 text-sm',
      default: 'h-12 min-w-[48px] px-4 text-base',
      lg: 'h-14 min-w-[56px] px-6 text-lg',
      xl: 'h-16 min-w-[64px] px-8 text-xl'
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn(
          'touch-manipulation',
          'active:scale-95 transition-transform duration-75',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

TouchButton.displayName = 'TouchButton';
