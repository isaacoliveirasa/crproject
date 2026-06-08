'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Position, Card, SolutionQuality } from '@/types/game';
import { initSimulation, tickSimulation, Entity, Projectile } from '@/lib/simulatorEngine';

interface ArenaCanvasProps {
  selectedCard: Card | null;
  placedPosition: Position | null;
  onPlaceCard: (pos: Position) => void;
  enemyTroop: {
    name: string;
    icon: string;
    startPos: Position;
    path: Position[];
  };
  solutions: Record<string, SolutionQuality>;
  showSolutions: boolean;
  isPlaying: boolean;
  onAnimationEnd: (reachedTarget: boolean, towerDamaged: boolean) => void;
}

export default function ArenaCanvas({
  selectedCard,
  placedPosition,
  onPlaceCard,
  enemyTroop,
  solutions,
  showSolutions,
  isPlaying,
  onAnimationEnd,
}: ArenaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastBgKeyRef = useRef<string>('');
  const [hoveredTile, setHoveredTile] = useState<Position | null>(null);
  const [imageElements, setImageElements] = useState<Record<string, HTMLImageElement>>({});

  // Simulation entities and projectiles state packaged atomically to prevent stale closures
  const [simState, setSimState] = useState<{
    entities: Entity[];
    projectiles: Projectile[];
  }>({ entities: [], projectiles: [] });
  
  const simStateRef = useRef<{
    entities: Entity[];
    projectiles: Projectile[];
  }>({ entities: [], projectiles: [] });

  const [aggroAlerts, setAggroAlerts] = useState<Record<string, number>>({}); // id -> timestamp to show '!'

  const gridWidth = 18;
  const gridHeight = 32;

  // Cache URL images
  useEffect(() => {
    const urlsToLoad: string[] = [
      '/assets/sc/arena_training_tex.png',
      '/assets/sc/building_tower_out/building_tower_sprite_201.png', // Red King Tower
      '/assets/sc/building_tower_out/building_tower_sprite_203.png', // Blue King Tower
      '/assets/sc/building_tower_out/building_tower_sprite_199.png', // Red Princess Tower
      '/assets/sc/building_tower_out/building_tower_sprite_200.png', // Blue Princess Tower
      '/assets/sc/building_tower_out/building_tower_sprite_050.png', // Red King
      '/assets/sc/building_tower_out/building_tower_sprite_101.png', // Blue King
    ];
    if (selectedCard && selectedCard.icon.includes('/')) {
      urlsToLoad.push(selectedCard.icon);
    }
    if (enemyTroop.icon.includes('/')) {
      urlsToLoad.push(enemyTroop.icon);
    }

    urlsToLoad.forEach((url) => {
      if (!imageElements[url]) {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          setImageElements((prev) => ({ ...prev, [url]: img }));
        };
      }
    });
  }, [selectedCard, enemyTroop, imageElements]);

  // Reset/Initialize simulation entities when state transitions
  useEffect(() => {
    if (!isPlaying) {
      const emptyState = { entities: [], projectiles: [] };
      simStateRef.current = emptyState;
      setSimState(emptyState);
      setAggroAlerts({});
      return;
    }

    const initialEntities = initSimulation(enemyTroop, selectedCard, placedPosition);
    const initialState = { entities: initialEntities, projectiles: [] };
    simStateRef.current = initialState;
    setSimState(initialState);
  }, [isPlaying, enemyTroop, placedPosition, selectedCard]);

  // Deterministic engine updates (100ms interval ticks)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const current = simStateRef.current;
      const { nextEntities, nextProjectiles, aggroTriggeredId } = tickSimulation(
        current.entities,
        current.projectiles,
        Date.now()
      );

      if (aggroTriggeredId) {
        setAggroAlerts((alerts) => ({ ...alerts, [aggroTriggeredId]: Date.now() }));
      }

      const activeEnemy = nextEntities.find((e) => e.id === 'enemy_troop' && e.alive);
      const playerLeftTowerDead = !nextEntities.find((e) => e.id === 'player_l_tower')?.alive;
      const playerRightTowerDead = !nextEntities.find((e) => e.id === 'player_r_tower')?.alive;

      let animationEnded = false;
      let reachedTarget = false;

      if (!activeEnemy || activeEnemy.y > 29) {
        animationEnded = true;
        reachedTarget = activeEnemy ? (activeEnemy.y > 25 && !playerLeftTowerDead && !playerRightTowerDead) : false;
      }

      const nextState = {
        entities: nextEntities,
        projectiles: nextProjectiles,
      };
      simStateRef.current = nextState;
      setSimState(nextState);

      if (animationEnded) {
        const leftTower = nextEntities.find((e) => e.id === 'player_l_tower');
        const rightTower = nextEntities.find((e) => e.id === 'player_r_tower');
        const kingTower = nextEntities.find((e) => e.id === 'player_k_tower');
        
        const towerDamaged = (leftTower ? leftTower.hp < leftTower.maxHp : false) ||
                             (rightTower ? rightTower.hp < rightTower.maxHp : false) ||
                             (kingTower ? kingTower.hp < kingTower.maxHp : false);

        clearInterval(interval);
        onAnimationEnd(reachedTarget, towerDamaged);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, onAnimationEnd]);

  const { entities, projectiles } = simState;

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get display sizes
    const rect = canvas.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);

    // Support high DPI screens
    const dpr = window.devicePixelRatio || 1;
    const expectedWidth = width * dpr;
    const expectedHeight = height * dpr;

    if (canvas.width !== expectedWidth || canvas.height !== expectedHeight) {
      canvas.width = expectedWidth;
      canvas.height = expectedHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const tileWidth = width / gridWidth;
    const tileHeight = height / gridHeight;

    const getEntityRadius = (name: string) => {
      const nameLower = name.toLowerCase();
      if (nameLower.includes('giant')) return tileWidth * 0.85;
      if (nameLower.includes('mini-pekka') || nameLower.includes('mini p.e.k.k.a')) return tileWidth * 0.58;
      if (nameLower.includes('cannon')) return tileWidth * 0.55;
      if (nameLower.includes('skeleton')) return tileWidth * 0.35;
      return tileWidth * 0.45;
    };

    // Render offscreen background if sizes or dpr change
    const bgKey = `${width}_${height}_${dpr}`;
    if (!offscreenCanvasRef.current || lastBgKeyRef.current !== bgKey) {
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      const offscreen = offscreenCanvasRef.current;
      offscreen.width = expectedWidth;
      offscreen.height = expectedHeight;
      const oCtx = offscreen.getContext('2d');
      
      if (oCtx) {
        oCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Clear background - Grass color
        oCtx.fillStyle = '#4d7c0f'; // Dark grass base
        oCtx.fillRect(0, 0, width, height);

        // Draw grass textures (nice HSL checkerboard tiles)
        for (let i = 0; i < gridWidth; i++) {
          for (let j = 0; j < gridHeight; j++) {
            if (j === 15 || j === 16) continue; // Skip river rows

            // Alternate light/dark grass tiles
            oCtx.fillStyle = (i + j) % 2 === 0 ? '#65a30d' : '#4d7c0f';
            oCtx.fillRect(i * tileWidth, j * tileHeight, tileWidth, tileHeight);

            // Draw small blade detail randomly on some tiles
            if ((i * 3 + j * 7) % 11 === 0) {
              oCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
              oCtx.lineWidth = 1;
              oCtx.beginPath();
              oCtx.moveTo((i + 0.3) * tileWidth, (j + 0.7) * tileHeight);
              oCtx.lineTo((i + 0.4) * tileWidth, (j + 0.4) * tileHeight);
              oCtx.lineTo((i + 0.5) * tileWidth, (j + 0.8) * tileHeight);
              oCtx.stroke();
            }
          }
        }

        // Draw Lane Paths (Dirt/sand road linking towers to bridges)
        const drawPath = (xCenter: number) => {
          const grad = oCtx.createLinearGradient((xCenter - 1) * tileWidth, 0, (xCenter + 1) * tileWidth, 0);
          grad.addColorStop(0, '#c2410c'); // darker sienna dirt
          grad.addColorStop(0.3, '#d97706'); // lighter amber dirt
          grad.addColorStop(0.7, '#d97706');
          grad.addColorStop(1, '#9a3412');
          oCtx.fillStyle = grad;
          oCtx.fillRect((xCenter - 0.7) * tileWidth, 0, 1.4 * tileWidth, height);

          // Add soft dirt borders with semi-transparent black
          oCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
          oCtx.fillRect((xCenter - 0.9) * tileWidth, 0, 0.2 * tileWidth, height);
          oCtx.fillRect((xCenter + 0.7) * tileWidth, 0, 0.2 * tileWidth, height);
        };

        // Draw paths for left lane (x=3.5) and right lane (x=14.5)
        drawPath(3.5);
        drawPath(14.5);

        // Cross connector paths
        oCtx.fillStyle = '#d97706';
        oCtx.fillRect(2.2 * tileWidth, 10 * tileHeight, 13.6 * tileWidth, 1.0 * tileHeight);
        oCtx.fillRect(2.2 * tileWidth, 20 * tileHeight, 13.6 * tileWidth, 1.0 * tileHeight);

        // Redraw grass in the middle zone (to cover lane crossing in center if needed)
        oCtx.fillStyle = '#4d7c0f';
        oCtx.fillRect(4.5 * tileWidth, 0, 9.0 * tileWidth, height);
        for (let i = 5; i < 14; i++) {
          for (let j = 0; j < gridHeight; j++) {
            if (j === 15 || j === 16) continue;
            oCtx.fillStyle = (i + j) % 2 === 0 ? '#65a30d' : '#4d7c0f';
            oCtx.fillRect(i * tileWidth, j * tileHeight, tileWidth, tileHeight);
          }
        }

        // Draw Side Zones / Cliffs / Forests
        // Left side treetop forest circles
        oCtx.save();
        oCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        oCtx.shadowBlur = 6;
        oCtx.shadowOffsetY = 4;

        oCtx.fillStyle = '#14532d'; // Very dark forest green
        oCtx.fillRect(0, 0, 1.5 * tileWidth, height);
        oCtx.fillRect(width - 1.5 * tileWidth, 0, 1.5 * tileWidth, height);

        // Draw overlapping forest tree canopy circles
        for (let y = 0; y < height + 20; y += 22) {
          // Left Forest
          oCtx.fillStyle = y % 3 === 0 ? '#15803d' : y % 3 === 1 ? '#166534' : '#14532d';
          oCtx.beginPath();
          oCtx.arc(0.5 * tileWidth + (y % 5), y, tileWidth * 0.9, 0, Math.PI * 2);
          oCtx.fill();

          // Right Forest
          oCtx.fillStyle = y % 3 === 0 ? '#166534' : y % 3 === 1 ? '#15803d' : '#14532d';
          oCtx.beginPath();
          oCtx.arc(width - 0.5 * tileWidth - (y % 5), y, tileWidth * 0.9, 0, Math.PI * 2);
          oCtx.fill();
        }
        oCtx.restore();

        // 1. Draw River (Y index 15 to 16)
        const riverGrad = oCtx.createLinearGradient(0, 15 * tileHeight, 0, 17 * tileHeight);
        riverGrad.addColorStop(0, '#0369a1'); // Sky blue shore
        riverGrad.addColorStop(0.5, '#0f172a'); // Navy deep center
        riverGrad.addColorStop(1, '#0369a1'); // Sky blue shore
        oCtx.fillStyle = riverGrad;
        oCtx.fillRect(1.5 * tileWidth, 15 * tileHeight, width - 3.0 * tileWidth, 2.0 * tileHeight);

        // River wave lines (white ripples)
        oCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        oCtx.lineWidth = 1.5;
        for (let offset = 0.2; offset <= 1.8; offset += 0.4) {
          oCtx.beginPath();
          oCtx.moveTo(1.5 * tileWidth, (15 + offset) * tileHeight);
          oCtx.bezierCurveTo(
            width * 0.3, (15 + offset - 0.1) * tileHeight,
            width * 0.7, (15 + offset + 0.1) * tileHeight,
            width - 1.5 * tileWidth, (15 + offset) * tileHeight
          );
          oCtx.stroke();
        }
        
        // Draw Bridges (Detailed Wooden bridge decks)
        const drawBridge = (bx: number) => {
          oCtx.save();
          // Drop Shadow over river
          oCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          oCtx.shadowBlur = 8;
          oCtx.shadowOffsetY = 5;

          // Wooden base
          oCtx.fillStyle = '#7c2d12'; // Sienna base
          oCtx.fillRect(bx * tileWidth, 14.6 * tileHeight, 2.0 * tileWidth, 2.8 * tileHeight);

          // Wooden horizontal planks
          oCtx.strokeStyle = '#431407'; // Dark brown separators
          oCtx.lineWidth = 2;
          oCtx.shadowBlur = 0;
          oCtx.shadowOffsetY = 0;

          const numPlanks = 6;
          const plankHeight = (2.8 * tileHeight) / numPlanks;
          for (let p = 0; p <= numPlanks; p++) {
            oCtx.beginPath();
            oCtx.moveTo(bx * tileWidth, 14.6 * tileHeight + p * plankHeight);
            oCtx.lineTo((bx + 2) * tileWidth, 14.6 * tileHeight + p * plankHeight);
            oCtx.stroke();
          }

          // Bridge handrails (Ropes/borders)
          oCtx.fillStyle = '#451a03'; // Extra dark wood
          oCtx.fillRect(bx * tileWidth, 14.6 * tileHeight, 0.15 * tileWidth, 2.8 * tileHeight);
          oCtx.fillRect((bx + 1.85) * tileWidth, 14.6 * tileHeight, 0.15 * tileWidth, 2.8 * tileHeight);

          oCtx.restore();
        };

        // Draw bridges at left side (x=2.5) and right side (x=13.5)
        drawBridge(2.5); 
        drawBridge(13.5); 

        // 2. Draw subtle grid overlays
        oCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        oCtx.lineWidth = 0.5;
        for (let x = 0; x <= gridWidth; x++) {
          oCtx.beginPath();
          oCtx.moveTo(x * tileWidth, 0);
          oCtx.lineTo(x * tileWidth, height);
          oCtx.stroke();
        }
        for (let y = 0; y <= gridHeight; y++) {
          oCtx.beginPath();
          oCtx.moveTo(0, y * tileHeight);
          oCtx.lineTo(width, y * tileHeight);
          oCtx.stroke();
        }

        // Lane indicators
        oCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        oCtx.setLineDash([4, 4]);
        oCtx.beginPath();
        oCtx.moveTo(3.5 * tileWidth, 0);
        oCtx.lineTo(3.5 * tileWidth, height);
        oCtx.moveTo(14.5 * tileWidth, 0);
        oCtx.lineTo(14.5 * tileWidth, height);
        oCtx.stroke();
        oCtx.setLineDash([]);
      }

      lastBgKeyRef.current = bgKey;
    }

    // Draw the offscreen background cache
    if (offscreenCanvasRef.current) {
      ctx.drawImage(offscreenCanvasRef.current, 0, 0, width, height);
    }

    // 3. Draw Solutions Overlays if toggled
    if (showSolutions) {
      Object.entries(solutions).forEach(([key, quality]) => {
        const [x, y] = key.split(',').map(Number);
        if (quality === 'optimal') ctx.fillStyle = 'rgba(34, 197, 94, 0.25)'; // Green
        else if (quality === 'good') ctx.fillStyle = 'rgba(59, 130, 246, 0.25)'; // Blue
        else if (quality === 'acceptable') ctx.fillStyle = 'rgba(234, 179, 8, 0.25)'; // Yellow
        else ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; // Red

        ctx.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
        ctx.strokeStyle = quality === 'optimal' ? '#22c55e' : quality === 'good' ? '#3b82f6' : '#eab308';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
      });
    }

    // Tower rendering helper
    const drawTower = (
      x: number,
      y: number,
      size: number,
      team: 'blue' | 'red',
      isKing = false,
      hp = 1400,
      maxHp = 1400
    ) => {
      // Try to load preloaded sprite first
      let towerImg: HTMLImageElement | undefined = undefined;
      if (isKing) {
        towerImg = imageElements[team === 'blue' 
          ? '/assets/sc/building_tower_out/building_tower_sprite_203.png' 
          : '/assets/sc/building_tower_out/building_tower_sprite_201.png'];
      } else {
        towerImg = imageElements[team === 'blue' 
          ? '/assets/sc/building_tower_out/building_tower_sprite_200.png' 
          : '/assets/sc/building_tower_out/building_tower_sprite_199.png'];
      }

      if (towerImg) {
        ctx.save();
        // Drop Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 6;
        ctx.drawImage(
          towerImg,
          x - size / 2,
          y - size * (isKing ? 0.6 : 0.55),
          size,
          size * (isKing ? 1.2 : 1.1)
        );
        ctx.restore();
      } else {
        ctx.save();
        // Drop Shadow for 3D depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 6;

        // 1. Draw Stone Base Cylindrical structure
        const stoneGrad = ctx.createLinearGradient(x - size / 2, y, x + size / 2, y);
        stoneGrad.addColorStop(0, '#78716c');
        stoneGrad.addColorStop(0.3, '#a8a29e');
        stoneGrad.addColorStop(0.7, '#a8a29e');
        stoneGrad.addColorStop(1, '#57534e');
        ctx.fillStyle = stoneGrad;

        // Draw round stone body
        ctx.beginPath();
        ctx.roundRect(x - size * 0.45, y - size * 0.3, size * 0.9, size * 0.9, [10, 10, 4, 4]);
        ctx.fill();
        
        // Draw stone brick horizontal lines
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

        // 2. Draw Crenellations (battlements) at the top
        ctx.fillStyle = '#78716c';
        const numMerlons = isKing ? 5 : 3;
        const merlonWidth = (size * 0.9) / (numMerlons * 2 - 1);
        const merlonHeight = size * 0.15;
        
        for (let i = 0; i < numMerlons; i++) {
          const merlonX = x - size * 0.45 + i * 2 * merlonWidth;
          ctx.fillRect(merlonX, y - size * 0.45, merlonWidth, merlonHeight);
        }

        // 3. Draw Team Colored Canopy / Roof Accent
        ctx.fillStyle = team === 'blue' ? '#2563eb' : '#dc2626';
        ctx.beginPath();
        if (isKing) {
          ctx.arc(x, y - size * 0.1, size * 0.3, Math.PI, 0);
        } else {
          ctx.arc(x, y - size * 0.05, size * 0.25, Math.PI, 0);
        }
        ctx.fill();

        // Gold trim details on roof
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 4. Draw Flagpole and Flag
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

        // Gold sphere crown at center top
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.1, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 5. Draw Health Bar
      const barWidth = size * 0.9;
      const barHeight = 4;
      const barX = x - barWidth / 2;
      const barY = y + size * 0.75;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const hpPercentage = Math.max(0, Math.min(1, hp / maxHp));
      ctx.fillStyle = team === 'blue' ? '#22c55e' : '#ef4444';
      ctx.fillRect(barX, barY, barWidth * hpPercentage, barHeight);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    };

    // 4. Render active simulation entities (Troops, Buildings, Towers)
    if (isPlaying) {
      entities.forEach((entity) => {
        if (!entity.alive) return;
        const entityX = entity.x * tileWidth;
        const entityY = entity.y * tileHeight;

        if (entity.isTower) {
          drawTower(entityX, entityY, tileWidth * (entity.isKing ? 4.5 : 3.5), entity.team, entity.isKing, entity.hp, entity.maxHp);
        } else {
          // Draw target link lines for clarity
          if (entity.targetId) {
            const targetEnt = entities.find(e => e.id === entity.targetId && e.alive);
            if (targetEnt) {
              ctx.save();
              ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
              ctx.lineWidth = 1.5;
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.moveTo(entityX, entityY);
              ctx.lineTo(targetEnt.x * tileWidth, targetEnt.y * tileHeight);
              ctx.stroke();
              ctx.restore();
            }
          }

          // Draw troop or building token with rotation transforms
          ctx.save();
          
          // Drop Shadow under the token
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 3;

          const rad = getEntityRadius(entity.name);
          const clipRad = rad * 0.93;

          // Fill circle background
          ctx.beginPath();
          ctx.arc(entityX, entityY, rad, 0, Math.PI * 2);
          ctx.fillStyle = entity.team === 'blue' ? '#3b82f6' : '#ef4444';
          ctx.fill();

          ctx.shadowColor = 'transparent'; // Reset shadow for clipping

          // Rotate unit token graphics if direction is specified
          ctx.save();
          ctx.translate(entityX, entityY);
          let rotationAngle = 0;
          if (entity.direction === 'left') rotationAngle = -Math.PI / 2;
          else if (entity.direction === 'right') rotationAngle = Math.PI / 2;
          else if (entity.direction === 'up') rotationAngle = 0;
          else if (entity.direction === 'down') rotationAngle = Math.PI;
          ctx.rotate(rotationAngle);

          // Clip image to circle
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, clipRad, 0, Math.PI * 2);
          ctx.clip();

          if (entity.icon && entity.icon.includes('/')) {
            const img = imageElements[entity.icon];
            if (img) {
              ctx.drawImage(
                img,
                -rad,
                -rad * (tileHeight / tileWidth),
                rad * 2,
                rad * 2 * (tileHeight / tileWidth)
              );
            } else {
              ctx.fillStyle = '#ffffff';
              ctx.font = `${rad * 0.5}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(entity.name.substring(0, 3), 0, 0);
            }
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.font = `${rad * 0.8}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(entity.icon || '👾', 0, 0);
          }
          ctx.restore(); // restore clip
          ctx.restore(); // restore rotation translation

          // Outer Border
          ctx.beginPath();
          ctx.arc(entityX, entityY, rad, 0, Math.PI * 2);
          ctx.strokeStyle = entity.team === 'blue' ? '#2563eb' : '#dc2626';
          ctx.lineWidth = rad > tileWidth * 0.6 ? 4 : 3;
          ctx.stroke();

          // Gold inner circle highlight for premium token look
          ctx.beginPath();
          ctx.arc(entityX, entityY, rad, 0, Math.PI * 2);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.restore(); // restore shadow context

          // Health Bar
          const barWidth = tileWidth * 1.2;
          const barHeight = 4;
          const barX = entityX - barWidth / 2;
          const barY = entityY - tileHeight * 0.7;

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(barX, barY, barWidth, barHeight);

          const hpPercentage = Math.max(0, Math.min(1, entity.hp / entity.maxHp));
          ctx.fillStyle = entity.team === 'blue' ? '#22c55e' : '#ef4444';
          ctx.fillRect(barX, barY, barWidth * hpPercentage, barHeight);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(barX, barY, barWidth, barHeight);

          // Aggro Exclamation mark
          const alertTime = aggroAlerts[entity.id];
          if (alertTime && Date.now() - alertTime < 1000) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(entityX, barY - 10, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', entityX, barY - 10);
          }
        }
      });

      // 5. Draw Projectiles
      projectiles.forEach((p) => {
        const targetEnt = entities.find(e => e.id === p.targetId && e.alive);
        ctx.save();
        if (p.speed > 8.0) {
          // Fast projectiles (Musketeer bullets) - Small bright dots
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(p.x * tileWidth, p.y * tileHeight, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.speed > 7.0) {
          // Cannon ball - Big heavy grey circle with shadow
          ctx.fillStyle = '#4b5563';
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x * tileWidth, p.y * tileHeight, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          // Normal Arrow projectile - Line pointing to movement vector
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          const pTargetX = targetEnt ? targetEnt.x : p.x;
          const pTargetY = targetEnt ? targetEnt.y : p.y;
          const angle = Math.atan2(pTargetY - p.y, pTargetX - p.x);
          ctx.moveTo(p.x * tileWidth, p.y * tileHeight);
          ctx.lineTo((p.x - Math.cos(angle) * 0.4) * tileWidth, (p.y - Math.sin(angle) * 0.4) * tileHeight);
          ctx.stroke();
        }
        ctx.restore();
      });

    } else {
      // STATIC MODE / PLACEMENT PHASE

      // Draw Towers
      drawTower(3.5 * tileWidth, 7.5 * tileHeight, tileWidth * 3.5, 'red');
      drawTower(14.5 * tileWidth, 7.5 * tileHeight, tileWidth * 3.5, 'red');
      drawTower(8.5 * tileWidth, 2.5 * tileHeight, tileWidth * 4.5, 'red', true);

      drawTower(3.5 * tileWidth, 24.5 * tileHeight, tileWidth * 3.5, 'blue');
      drawTower(14.5 * tileWidth, 24.5 * tileHeight, tileWidth * 3.5, 'blue');
      drawTower(8.5 * tileWidth, 29.5 * tileHeight, tileWidth * 4.5, 'blue', true);

      // Draw Placed Defender
      if (placedPosition && selectedCard) {
        const px = (placedPosition.x + 0.5) * tileWidth;
        const py = (placedPosition.y + 0.5) * tileHeight;

        ctx.beginPath();
        const radius = selectedCard.id === 'cannon' ? 5.5 * tileWidth : 4 * tileWidth;
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(232, 18, 166, 0.08)';
        ctx.fill();
        ctx.strokeStyle = '#e812a6';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 3;

        const rad = getEntityRadius(selectedCard.name);
        const clipRad = rad * 0.93;

        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();

        ctx.shadowColor = 'transparent';

        // Clip card image
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, clipRad, 0, Math.PI * 2);
        ctx.clip();

        if (selectedCard.icon.includes('/')) {
          const img = imageElements[selectedCard.icon];
          if (img) {
            ctx.drawImage(img, px - rad, py - rad * (tileHeight / tileWidth), rad * 2, rad * 2 * (tileHeight / tileWidth));
          } else {
            ctx.fillStyle = selectedCard.color;
            ctx.fillRect(px - rad, py - rad * (tileHeight / tileWidth), rad * 2, rad * 2 * (tileHeight / tileWidth));
          }
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.font = `${rad * 0.8}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(selectedCard.icon, px, py);
        }
        ctx.restore();

        // Border
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = rad > tileWidth * 0.6 ? 4 : 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }

      // Draw Hover snapping tile
      if (hoveredTile && selectedCard) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.fillRect(hoveredTile.x * tileWidth, hoveredTile.y * tileHeight, tileWidth, tileHeight);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(hoveredTile.x * tileWidth, hoveredTile.y * tileHeight, tileWidth, tileHeight);
      }

      // Draw Static Enemy Troop
      const ex = (enemyTroop.startPos.x + 0.5) * tileWidth;
      const ey = (enemyTroop.startPos.y + 0.5) * tileHeight;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 3;

      const rad = getEntityRadius(enemyTroop.name);
      const clipRad = rad * 0.93;

      ctx.beginPath();
      ctx.arc(ex, ey, rad, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      ctx.shadowColor = 'transparent';

      ctx.save();
      ctx.beginPath();
      ctx.arc(ex, ey, clipRad, 0, Math.PI * 2);
      ctx.clip();

      if (enemyTroop.icon.includes('/')) {
        const img = imageElements[enemyTroop.icon];
        if (img) {
          ctx.drawImage(img, ex - rad, ey - rad * (tileHeight / tileWidth), rad * 2, rad * 2 * (tileHeight / tileWidth));
        } else {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(ex - rad, ey - rad * (tileHeight / tileWidth), rad * 2, rad * 2 * (tileHeight / tileWidth));
        }
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${rad * 0.8}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemyTroop.icon, ex, ey);
      }
      ctx.restore();

      // Border
      ctx.beginPath();
      ctx.arc(ex, ey, rad, 0, Math.PI * 2);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = rad > tileWidth * 0.6 ? 4 : 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ex, ey, rad, 0, Math.PI * 2);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  }, [
    hoveredTile,
    placedPosition,
    selectedCard,
    showSolutions,
    isPlaying,
    enemyTroop,
    solutions,
    imageElements,
    entities,
    projectiles,
    aggroAlerts
  ]);

  // Click & Drag Events
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

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPlaying) return;
    const tile = getMouseTile(e);
    setHoveredTile(tile);
  };

  const handleMouseLeave = () => {
    setHoveredTile(null);
  };

  const handleMouseClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPlaying) return;
    const tile = getMouseTile(e);
    if (tile && selectedCard) {
      onPlaceCard(tile);
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
    if (isPlaying) return;
    const tile = getTouchTile(e);
    if (tile && selectedCard) {
      onPlaceCard(tile);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isPlaying) return;
    const tile = getTouchTile(e);
    if (tile) {
      setHoveredTile(tile);
      if (selectedCard) {
        onPlaceCard(tile);
      }
    }
  };

  return (
    <div className="relative aspect-[9/16] w-full max-w-[380px] overflow-hidden rounded-xl border border-white/10 shadow-2xl">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair"
        style={{ touchAction: 'none' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleMouseClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseLeave}
      />
      
      {/* Top Banner Indicator */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between rounded-lg bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-md border border-white/5">
        <span className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></span>
          {isPlaying ? 'Simulation Running' : `Enemy: ${enemyTroop.name}`}
        </span>
        <span>Grid: 18 x 32</span>
      </div>
    </div>
  );
}
