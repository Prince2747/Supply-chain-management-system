"use client";

import { useRef, useEffect, useState, ReactNode } from "react";

interface ParallaxSectionProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxSection({ children, speed = 0.5, className = "" }: ParallaxSectionProps) {
  const [offsetY, setOffsetY] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const elementTop = rect.top + window.scrollY;
        const scrollPosition = window.scrollY;
        
        // Only apply parallax when element is in viewport
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setOffsetY((scrollPosition - elementTop) * speed);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return (
    <div ref={ref} className={className}>
      <div
        style={{
          transform: `translateY(${offsetY}px)`,
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface ParallaxBackgroundProps {
  children: ReactNode;
  speed?: number;
  className?: string;
  imageUrl?: string;
}

export function ParallaxBackground({ 
  children, 
  speed = 0.5, 
  className = "",
  imageUrl 
}: ParallaxBackgroundProps) {
  const [offsetY, setOffsetY] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const scrollPosition = window.scrollY;
        
        // Only apply parallax when element is in viewport
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setOffsetY(scrollPosition * speed);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `url(${imageUrl})`,
            transform: `translateY(${offsetY}px)`,
            willChange: "transform",
            height: "120%",
            top: "-10%",
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface ParallaxLayerProps {
  children: ReactNode;
  speed?: number;
  className?: string;
  zIndex?: number;
}

export function ParallaxLayer({ 
  children, 
  speed = 0.3, 
  className = "",
  zIndex = 1
}: ParallaxLayerProps) {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY * speed);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        transform: `translateY(${offsetY}px)`,
        zIndex,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
