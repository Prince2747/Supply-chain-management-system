"use client";

import { useEffect, useRef } from "react";

export function AnimatedTree() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Disable image smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;

    let animationFrame: number;
    let growthProgress = 0;

    const PIXEL_SIZE = 8; // Size of each "pixel" block

    // Retro color palette
    const COLORS = {
      sky: "#87CEEB",
      ground: "#8B4513",
      grass: "#228B22",
      trunk: "#654321",
      trunkDark: "#4A2511",
      leaves: "#2ECC40",
      leavesDark: "#01B000",
      fruit: "#FF4136",
      fruitHighlight: "#FF6B61",
    };

    const drawPixel = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    };

    const drawPixelRect = (x: number, y: number, width: number, height: number, color: string) => {
      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          drawPixel(x + i, y + j, color);
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gradually increase growth (0 to 1)
      if (growthProgress < 1) {
        growthProgress += 0.005;
      }

      const gridWidth = Math.floor(canvas.width / PIXEL_SIZE);
      const gridHeight = Math.floor(canvas.height / PIXEL_SIZE);

      // Draw ground/dirt
      const groundY = gridHeight - 3;
      drawPixelRect(0, groundY, gridWidth, 3, COLORS.ground);

      // Draw grass (pixelated pattern)
      for (let i = 0; i < gridWidth; i++) {
        if (i % 2 === 0) {
          drawPixel(i, groundY - 1, COLORS.grass);
        }
        if (i % 3 === 1) {
          drawPixel(i, groundY - 2, COLORS.grass);
        }
      }

      const treeCenterX = Math.floor(gridWidth / 2);
      const treeBaseY = groundY - 1;

      // Trunk growth
      const maxTrunkHeight = 15;
      const trunkHeight = Math.floor(maxTrunkHeight * Math.min(growthProgress * 2, 1));
      const trunkWidth = 3;

      // Draw trunk with pixel texture
      for (let i = 0; i < trunkHeight; i++) {
        const y = treeBaseY - i;
        for (let j = 0; j < trunkWidth; j++) {
          const x = treeCenterX - Math.floor(trunkWidth / 2) + j;
          // Alternate colors for retro texture
          const color = (i + j) % 3 === 0 ? COLORS.trunkDark : COLORS.trunk;
          drawPixel(x, y, color);
        }
      }

      // Leaves/Crown (8-bit style)
      if (growthProgress > 0.5) {
        const leafProgress = (growthProgress - 0.5) / 0.5;
        const maxLeafSize = 12;
        const leafSize = Math.floor(maxLeafSize * leafProgress);

        const crownCenterY = treeBaseY - trunkHeight - Math.floor(leafSize / 2);

        // Classic pyramid/triangle crown shape
        for (let layer = 0; layer < leafSize; layer++) {
          if (layer > leafSize * leafProgress) break;

          const width = Math.min(layer + 1, maxLeafSize - layer);
          const y = crownCenterY - Math.floor(leafSize / 2) + layer;

          for (let i = 0; i < width * 2 + 1; i++) {
            const x = treeCenterX - width + i;
            
            // Create retro leaf pattern with different shades
            const isDark = (i + layer) % 3 === 0;
            const color = isDark ? COLORS.leavesDark : COLORS.leaves;
            
            // Skip some pixels for retro "transparency" effect
            if ((i + layer) % 5 !== 0) {
              drawPixel(x, y, color);
            }
          }
        }

        // Add retro fruits (pixelated cherries)
        if (growthProgress > 0.8) {
          const fruitProgress = (growthProgress - 0.8) / 0.2;
          
          const fruits = [
            { x: treeCenterX - 4, y: crownCenterY - 2 },
            { x: treeCenterX + 3, y: crownCenterY - 1 },
            { x: treeCenterX - 2, y: crownCenterY + 2 },
            { x: treeCenterX + 1, y: crownCenterY + 3 },
          ];

          fruits.forEach((fruit, index) => {
            const delay = index * 0.25;
            if (fruitProgress > delay) {
              // Draw 2x2 pixel fruit
              drawPixel(fruit.x, fruit.y, COLORS.fruit);
              drawPixel(fruit.x + 1, fruit.y, COLORS.fruit);
              drawPixel(fruit.x, fruit.y + 1, COLORS.fruit);
              drawPixel(fruit.x + 1, fruit.y + 1, COLORS.fruit);
              
              // Highlight pixel for retro shine
              drawPixel(fruit.x, fruit.y, COLORS.fruitHighlight);
            }
          });
        }
      }

      // Continue animation
      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <div className="flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="max-w-full h-auto"
        style={{
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}

