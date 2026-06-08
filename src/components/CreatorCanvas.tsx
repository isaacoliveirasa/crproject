'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Position, SolutionQuality } from '@/types/game';

interface CreatorCanvasProps {
  brushType: 'optimal' | 'good' | 'acceptable' | 'clear' | 'enemy-start' | 'enemy-path';
  solutions: Record<string, SolutionQuality>;
  onUpdateSolutions: (solutions: Record<string, SolutionQuality>) => void;
  enemyStart: Position | null;
  onUpdateEnemyStart: (pos: Position | null) => void;
  enemyPath: Position[];
  onUpdateEnemyPath: (path: Position[]) => void;
}

export default function CreatorCanvas({
  brushType,
  solutions,
  onUpdateSolutions,
  enemyStart,
  onUpdateEnemyStart,
  enemyPath,
  onUpdateEnemyPath,
}: CreatorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredTile, setHoveredTile] = useState<Position | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const gridWidth = 18;
  const gridHeight = 32;

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const tileWidth = width / gridWidth;
    const tileHeight = height / gridHeight;

    // Clear background - Grass color
    ctx.fillStyle = '#4d7c0f'; // Dark grass base
    ctx.fillRect(0, 0, width, height);

    // Draw grass textures (nice HSL checkerboard tiles)
    for (let i = 0; i < gridWidth; i++) {
      for (let j = 0; j < gridHeight; j++) {
        if (j === 15 || j === 16) continue; // Skip river rows

        // Alternate light/dark grass tiles
        ctx.fillStyle = (i + j) % 2 === 0 ? '#65a30d' : '#4d7c0f';
        ctx.fillRect(i * tileWidth, j * tileHeight, tileWidth, tileHeight);

        // Draw small blade detail randomly on some tiles
        if ((i * 3 + j * 7) % 11 === 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo((i + 0.3) * tileWidth, (j + 0.7) * tileHeight);
          ctx.lineTo((i + 0.4) * tileWidth, (j + 0.4) * tileHeight);
          ctx.lineTo((i + 0.5) * tileWidth, (j + 0.8) * tileHeight);
          ctx.stroke();
        }
      }
    }

    // Draw Lane Paths (Dirt/sand road linking towers to bridges)
    const drawPath = (xCenter: number) => {
      const grad = ctx.createLinearGradient((xCenter - 1) * tileWidth, 0, (xCenter + 1) * tileWidth, 0);
      grad.addColorStop(0, '#c2410c'); // darker sienna dirt
      grad.addColorStop(0.3, '#d97706'); // lighter amber dirt
      grad.addColorStop(0.7, '#d97706');
      grad.addColorStop(1, '#9a3412');
      ctx.fillStyle = grad;
      ctx.fillRect((xCenter - 0.7) * tileWidth, 0, 1.4 * tileWidth, height);

      // Add soft dirt borders
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect((xCenter - 0.9) * tileWidth, 0, 0.2 * tileWidth, height);
      ctx.fillRect((xCenter + 0.7) * tileWidth, 0, 0.2 * tileWidth, height);
    };

    // Draw paths for left lane (x=3.5) and right lane (x=14.5)
    drawPath(3.5);
    drawPath(14.5);

    // Cross connector paths
    ctx.fillStyle = '#d97706';
    ctx.fillRect(2.2 * tileWidth, 10 * tileHeight, 13.6 * tileWidth, 1.0 * tileHeight);
    ctx.fillRect(2.2 * tileWidth, 20 * tileHeight, 13.6 * tileWidth, 1.0 * tileHeight);

    // Redraw grass in the middle zone (to cover lane crossing in center if needed)
    ctx.fillStyle = '#4d7c0f';
    ctx.fillRect(4.5 * tileWidth, 0, 9.0 * tileWidth, height);
    for (let i = 5; i < 14; i++) {
      for (let j = 0; j < gridHeight; j++) {
        if (j === 15 || j === 16) continue;
        ctx.fillStyle = (i + j) % 2 === 0 ? '#65a30d' : '#4d7c0f';
        ctx.fillRect(i * tileWidth, j * tileHeight, tileWidth, tileHeight);
      }
    }

    // Draw Side Zones / Cliffs / Forests
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = '#14532d'; // Very dark forest green
    ctx.fillRect(0, 0, 1.5 * tileWidth, height);
    ctx.fillRect(width - 1.5 * tileWidth, 0, 1.5 * tileWidth, height);

    // Draw overlapping forest tree canopy circles
    for (let y = 0; y < height + 20; y += 22) {
      // Left Forest
      ctx.fillStyle = y % 3 === 0 ? '#15803d' : y % 3 === 1 ? '#166534' : '#14532d';
      ctx.beginPath();
      ctx.arc(0.5 * tileWidth + (y % 5), y, tileWidth * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Right Forest
      ctx.fillStyle = y % 3 === 0 ? '#166534' : y % 3 === 1 ? '#15803d' : '#14532d';
      ctx.beginPath();
      ctx.arc(width - 0.5 * tileWidth - (y % 5), y, tileWidth * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 1. Draw River (Y index 15 to 16)
    const riverGrad = ctx.createLinearGradient(0, 15 * tileHeight, 0, 17 * tileHeight);
    riverGrad.addColorStop(0, '#0369a1'); // Sky blue shore
    riverGrad.addColorStop(0.5, '#0f172a'); // Navy deep center
    riverGrad.addColorStop(1, '#0369a1'); // Sky blue shore
    ctx.fillStyle = riverGrad;
    ctx.fillRect(1.5 * tileWidth, 15 * tileHeight, width - 3.0 * tileWidth, 2.0 * tileHeight);

    // River wave ripples
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.5;
    for (let offset = 0.2; offset <= 1.8; offset += 0.4) {
      ctx.beginPath();
      ctx.moveTo(1.5 * tileWidth, (15 + offset) * tileHeight);
      ctx.bezierCurveTo(
        width * 0.3, (15 + offset - 0.1) * tileHeight,
        width * 0.7, (15 + offset + 0.1) * tileHeight,
        width - 1.5 * tileWidth, (15 + offset) * tileHeight
      );
      ctx.stroke();
    }
    
    // Draw Bridges
    const drawBridge = (bx: number) => {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 5;

      ctx.fillStyle = '#7c2d12'; // Wooden brown logs base
      ctx.fillRect(bx * tileWidth, 14.6 * tileHeight, 2.0 * tileWidth, 2.8 * tileHeight);

      // Horizontal planks
      ctx.strokeStyle = '#431407';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      const numPlanks = 6;
      const plankHeight = (2.8 * tileHeight) / numPlanks;
      for (let p = 0; p <= numPlanks; p++) {
        ctx.beginPath();
        ctx.moveTo(bx * tileWidth, 14.6 * tileHeight + p * plankHeight);
        ctx.lineTo((bx + 2) * tileWidth, 14.6 * tileHeight + p * plankHeight);
        ctx.stroke();
      }

      ctx.fillStyle = '#451a03';
      ctx.fillRect(bx * tileWidth, 14.6 * tileHeight, 0.15 * tileWidth, 2.8 * tileHeight);
      ctx.fillRect((bx + 1.85) * tileWidth, 14.6 * tileHeight, 0.15 * tileWidth, 2.8 * tileHeight);

      ctx.restore();
    };

    drawBridge(2.5); 
    drawBridge(13.5); 

    // 2. Draw subtle grid overlays
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= gridWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileWidth, 0);
      ctx.lineTo(x * tileWidth, height);
      ctx.stroke();
    }
    for (let y = 0; y <= gridHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * tileHeight);
      ctx.lineTo(width, y * tileHeight);
      ctx.stroke();
    }

    // Draw Towers
    drawTower(ctx, 3.5 * tileWidth, 24.5 * tileHeight, tileWidth * 2, 'blue');
    drawTower(ctx, 14.5 * tileWidth, 24.5 * tileHeight, tileWidth * 2, 'blue');
    drawTower(ctx, 8.5 * tileWidth, 29.5 * tileHeight, tileWidth * 2.5, 'blue', true);
    drawTower(ctx, 3.5 * tileWidth, 7.5 * tileHeight, tileWidth * 2, 'red');
    drawTower(ctx, 14.5 * tileWidth, 7.5 * tileHeight, tileWidth * 2, 'red');
    drawTower(ctx, 8.5 * tileWidth, 2.5 * tileHeight, tileWidth * 2.5, 'red', true);

    // Draw painted solutions
    Object.entries(solutions).forEach(([key, quality]) => {
      const [x, y] = key.split(',').map(Number);
      if (quality === 'optimal') ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
      else if (quality === 'good') ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      else if (quality === 'acceptable') ctx.fillStyle = 'rgba(234, 179, 8, 0.3)';

      ctx.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
      ctx.strokeStyle = quality === 'optimal' ? '#22c55e' : quality === 'good' ? '#3b82f6' : '#eab308';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
    });

    // Draw Enemy Path Connections
    if (enemyStart) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo((enemyStart.x + 0.5) * tileWidth, (enemyStart.y + 0.5) * tileHeight);
      enemyPath.forEach((pt) => {
        ctx.lineTo((pt.x + 0.5) * tileWidth, (pt.y + 0.5) * tileHeight);
      });
      ctx.stroke();

      // Spawn point icon indicator
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc((enemyStart.x + 0.5) * tileWidth, (enemyStart.y + 0.5) * tileHeight, tileWidth * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏁', (enemyStart.x + 0.5) * tileWidth, (enemyStart.y + 0.5) * tileHeight);

      // Path node circles
      enemyPath.forEach((pt, idx) => {
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.arc((pt.x + 0.5) * tileWidth, (pt.y + 0.5) * tileHeight, tileWidth * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px sans-serif';
        ctx.fillText(String(idx + 1), (pt.x + 0.5) * tileWidth, (pt.y + 0.5) * tileHeight);
      });
    }

    // Hover Indicator
    if (hoveredTile) {
      if (brushType === 'optimal') ctx.strokeStyle = '#22c55e';
      else if (brushType === 'good') ctx.strokeStyle = '#3b82f6';
      else if (brushType === 'acceptable') ctx.strokeStyle = '#eab308';
      else if (brushType === 'clear') ctx.strokeStyle = '#ef4444';
      else ctx.strokeStyle = '#ffd700';

      ctx.lineWidth = 2;
      ctx.strokeRect(hoveredTile.x * tileWidth, hoveredTile.y * tileHeight, tileWidth, tileHeight);
    }
  }, [hoveredTile, solutions, enemyStart, enemyPath, brushType]);

  const drawTower = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    team: 'blue' | 'red',
    isKing = false
  ) => {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 6;

    // Stone base
    const stoneGrad = ctx.createLinearGradient(x - size / 2, y, x + size / 2, y);
    stoneGrad.addColorStop(0, '#78716c');
    stoneGrad.addColorStop(0.3, '#a8a29e');
    stoneGrad.addColorStop(0.7, '#a8a29e');
    stoneGrad.addColorStop(1, '#57534e');
    ctx.fillStyle = stoneGrad;

    ctx.beginPath();
    ctx.roundRect(x - size * 0.45, y - size * 0.3, size * 0.9, size * 0.9, [10, 10, 4, 4]);
    ctx.fill();

    // Stone lines
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    for (let offset = -0.1; offset <= 0.5; offset += 0.2) {
      ctx.beginPath();
      ctx.moveTo(x - size * 0.45, y + size * offset);
      ctx.lineTo(x + size * 0.45, y + size * offset);
      ctx.stroke();
    }

    // Battlements
    ctx.fillStyle = '#78716c';
    const numMerlons = isKing ? 5 : 3;
    const merlonWidth = (size * 0.9) / (numMerlons * 2 - 1);
    const merlonHeight = size * 0.15;
    for (let i = 0; i < numMerlons; i++) {
      const merlonX = x - size * 0.45 + i * 2 * merlonWidth;
      ctx.fillRect(merlonX, y - size * 0.45, merlonWidth, merlonHeight);
    }

    // Roof dome
    ctx.fillStyle = team === 'blue' ? '#2563eb' : '#dc2626';
    ctx.beginPath();
    if (isKing) {
      ctx.arc(x, y - size * 0.1, size * 0.3, Math.PI, 0);
    } else {
      ctx.arc(x, y - size * 0.05, size * 0.25, Math.PI, 0);
    }
    ctx.fill();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Flagpole
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.3);
    ctx.lineTo(x, y - size * 0.75);
    ctx.stroke();

    ctx.fillStyle = team === 'blue' ? '#3b82f6' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.75);
    ctx.lineTo(x + size * 0.35, y - size * 0.65);
    ctx.lineTo(x, y - size * 0.55);
    ctx.fill();

    ctx.restore();
  };

  const getMouseTile = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * gridWidth);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * gridHeight);
    if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
      return { x, y };
    }
    return null;
  };

  const applyBrush = (tile: Position) => {
    const key = `${tile.x},${tile.y}`;
    if (brushType === 'optimal' || brushType === 'good' || brushType === 'acceptable') {
      onUpdateSolutions({ ...solutions, [key]: brushType });
    } else if (brushType === 'clear') {
      const next = { ...solutions };
      delete next[key];
      onUpdateSolutions(next);
    } else if (brushType === 'enemy-start') {
      onUpdateEnemyStart(tile);
    } else if (brushType === 'enemy-path') {
      // Append node if it is not already the last coordinate
      const last = enemyPath[enemyPath.length - 1] || enemyStart;
      if (last && (last.x !== tile.x || last.y !== tile.y)) {
        onUpdateEnemyPath([...enemyPath, tile]);
      }
    }
  };

  const getTouchTile = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return null;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.floor(((touch.clientX - rect.left) / rect.width) * gridWidth);
    const y = Math.floor(((touch.clientY - rect.top) / rect.height) * gridHeight);
    if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
      return { x, y };
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const tile = getTouchTile(e);
    if (tile) applyBrush(tile);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const tile = getTouchTile(e);
    setHoveredTile(tile);
    if (isDrawing && tile) {
      applyBrush(tile);
    }
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    setHoveredTile(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const tile = getMouseTile(e);
    if (tile) applyBrush(tile);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const tile = getMouseTile(e);
    setHoveredTile(tile);
    if (isDrawing && tile && brushType !== 'enemy-start' && brushType !== 'enemy-path') {
      applyBrush(tile);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <div className="relative aspect-[9/16] w-full max-w-[380px] overflow-hidden rounded-xl border border-white/10 shadow-2xl">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-cell"
        style={{ touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <div className="absolute top-2 left-2 right-2 flex justify-between bg-black/60 px-3 py-1 text-[10px] text-white rounded backdrop-blur border border-white/5">
        <span>Tool Mode: <strong className="text-elixir capitalize">{brushType.replace('-', ' ')}</strong></span>
        <span>Snapping Grid</span>
      </div>
    </div>
  );
}
