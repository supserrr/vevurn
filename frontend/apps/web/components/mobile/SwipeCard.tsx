'use client';

import { useState, useRef, useEffect, TouchEvent } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  className?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export function SwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
  className,
  leftAction,
  rightAction
}: SwipeCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (!e.touches[0]) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !e.touches[0]) return;
    
    const x = e.touches[0].clientX;
    setCurrentX(x);
    const deltaX = x - startX;
    
    // Limit swipe distance
    const maxSwipe = 120;
    const limitedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
    setTranslateX(limitedDelta);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaX = currentX - startX;
    setIsDragging(false);
    
    if (Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    // Reset position
    setTranslateX(0);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setTranslateX(0);
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="relative overflow-hidden">
      {/* Left action background */}
      {leftAction && (
        <div className={cn(
          "absolute right-0 top-0 h-full flex items-center justify-end pr-4 transition-opacity",
          translateX > 50 ? "opacity-100" : "opacity-0"
        )}>
          {leftAction}
        </div>
      )}
      
      {/* Right action background */}
      {rightAction && (
        <div className={cn(
          "absolute left-0 top-0 h-full flex items-center justify-start pl-4 transition-opacity",
          translateX < -50 ? "opacity-100" : "opacity-0"
        )}>
          {rightAction}
        </div>
      )}

      {/* Main card */}
      <Card
        ref={cardRef}
        className={cn(
          "relative transition-transform duration-200 ease-out touch-manipulation",
          isDragging ? "transition-none" : "",
          className
        )}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent className="p-4">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
