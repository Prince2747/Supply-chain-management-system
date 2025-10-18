"use client";

import { useEffect, useRef } from "react";

export function AnimatedGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const globeRadius = 120;
    const packageOrbitRadius = 160;

    let animationFrame: number;
    let rotation = 0;
    let packageAngle = 0;

    // Draw function
    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Save context
      ctx.save();

      // Draw globe shadow
      ctx.beginPath();
      ctx.arc(centerX, centerY + 10, globeRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(22, 163, 74, 0.1)";
      ctx.fill();

      // Draw globe
      const gradient = ctx.createRadialGradient(
        centerX - 40,
        centerY - 40,
        20,
        centerX,
        centerY,
        globeRadius
      );
      gradient.addColorStop(0, "#22c55e");
      gradient.addColorStop(0.5, "#16a34a");
      gradient.addColorStop(1, "#15803d");

      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw latitude lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;

      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        const y = centerY + (i * globeRadius) / 3;
        const width = Math.sqrt(
          globeRadius * globeRadius -
            Math.pow((i * globeRadius) / 3, 2)
        ) * 2;
        
        ctx.ellipse(
          centerX,
          y,
          width / 2,
          width / 8,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      // Draw longitude lines (animated)
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 + rotation;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, globeRadius, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
      }

      // Draw continents (simplified shapes)
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      
      // Africa-like shape
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      
      ctx.beginPath();
      ctx.ellipse(20, -10, 25, 40, 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      // Asia-like shape
      ctx.beginPath();
      ctx.ellipse(-30, -30, 35, 30, -0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Americas-like shape
      ctx.beginPath();
      ctx.ellipse(60, 0, 20, 50, 0.1, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();

      // Calculate package position
      const packageX = centerX + Math.cos(packageAngle) * packageOrbitRadius;
      const packageY = centerY + Math.sin(packageAngle) * packageOrbitRadius * 0.5;

      // Draw orbit path (dashed line)
      ctx.save();
      ctx.strokeStyle = "rgba(22, 163, 74, 0.2)";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        packageOrbitRadius,
        packageOrbitRadius * 0.5,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.restore();

      // Draw package trail
      ctx.save();
      ctx.strokeStyle = "rgba(22, 163, 74, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let i = 0; i < 20; i++) {
        const trailAngle = packageAngle - (i * 0.05);
        const trailX = centerX + Math.cos(trailAngle) * packageOrbitRadius;
        const trailY = centerY + Math.sin(trailAngle) * packageOrbitRadius * 0.5;
        const opacity = 1 - (i / 20);
        
        if (i === 0) {
          ctx.moveTo(trailX, trailY);
        } else {
          ctx.globalAlpha = opacity * 0.3;
          ctx.lineTo(trailX, trailY);
        }
      }
      ctx.stroke();
      ctx.restore();

      // Draw package box (more visible and detailed)
      ctx.save();
      ctx.translate(packageX, packageY);
      
      // Rotate package slightly for 3D effect
      const packageRotation = packageAngle * 0.5;
      ctx.rotate(packageRotation);
      
      // Package shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(-14, 18, 28, 4);
      
      // Main box body (brown cardboard color)
      ctx.fillStyle = "#a0826d";
      ctx.strokeStyle = "#6d5843";
      ctx.lineWidth = 2;
      ctx.fillRect(-12, -12, 24, 24);
      ctx.strokeRect(-12, -12, 24, 24);
      
      // Box flap lines (top)
      ctx.strokeStyle = "#8b6f47";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-12, -4);
      ctx.lineTo(12, -4);
      ctx.moveTo(-12, 4);
      ctx.lineTo(12, 4);
      ctx.stroke();
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(0, 12);
      ctx.stroke();
      
      // Tape strips (lighter brown/beige)
      ctx.fillStyle = "#d4b896";
      // Horizontal tape
      ctx.fillRect(-12, -2, 24, 4);
      // Vertical tape
      ctx.fillRect(-2, -12, 4, 24);
      
      // Fragile symbol or arrows
      ctx.strokeStyle = "#16a34a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Up arrow
      ctx.moveTo(0, -6);
      ctx.lineTo(-4, -2);
      ctx.moveTo(0, -6);
      ctx.lineTo(4, -2);
      ctx.stroke();
      
      // Another up arrow
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(-4, 6);
      ctx.moveTo(0, 2);
      ctx.lineTo(4, 6);
      ctx.stroke();
      
      // Box edge highlight (3D effect)
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(-12, -12, 2, 24);
      ctx.fillRect(-12, -12, 24, 2);
      
      // Barcode (small detail)
      ctx.fillStyle = "#000000";
      for (let i = 0; i < 6; i++) {
        const barWidth = i % 2 === 0 ? 1 : 0.5;
        ctx.fillRect(-6 + i * 2, 8, barWidth, 3);
      }
      
      ctx.restore();

      // Update rotation and package angle
      rotation += 0.005;
      packageAngle += 0.02;

      // Continue animation
      animationFrame = requestAnimationFrame(draw);
    };

    // Start animation
    draw();

    // Cleanup
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto"
        style={{ width: "100%", height: "auto" }}
      />
    </div>
  );
}
