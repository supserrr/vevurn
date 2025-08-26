'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  disabled = false,
  className
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    setStartY(e.touches[0]?.clientY || 0);
    setIsPulling(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const currentY = e.touches[0]?.clientY || 0;
    const deltaY = currentY - startY;
    
    if (deltaY > 0) {
      e.preventDefault();
      // Apply resistance
      const resistance = 0.5;
      const distance = Math.min(deltaY * resistance, threshold * 1.5);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || disabled || isRefreshing) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  };

  useEffect(() => {
    const handleTouchEndGlobal = () => {
      if (isPulling) {
        handleTouchEnd();
      }
    };

    document.addEventListener('touchend', handleTouchEndGlobal);
    return () => document.removeEventListener('touchend', handleTouchEndGlobal);
  }, [isPulling, pullDistance, threshold]);

  const getRefreshIconRotation = () => {
    if (isRefreshing) return 'rotate-180';
    if (pullDistance >= threshold) return 'rotate-180';
    return `rotate-${Math.min(180, (pullDistance / threshold) * 180)}`;
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-y-auto touch-manipulation", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 ease-out",
          "bg-white border-b z-10",
          isPulling || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{
          height: Math.max(0, pullDistance),
          transform: `translateY(-${Math.max(0, threshold - pullDistance)}px)`
        }}
      >
        <div className="flex items-center space-x-2 text-gray-600">
          <RefreshCw
            className={cn(
              "h-5 w-5 transition-transform duration-200",
              isRefreshing ? "animate-spin" : getRefreshIconRotation()
            )}
          />
          <span className="text-sm font-medium">
            {isRefreshing
              ? "Refreshing..."
              : pullDistance >= threshold
              ? "Release to refresh"
              : "Pull to refresh"
            }
          </span>
        </div>
      </div>

      {/* Content with transform for pull effect */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${isPulling ? pullDistance : 0}px)`
        }}
      >
        {children}
      </div>
    </div>
  );
}
