"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Move,
  RotateCw,
  Trash2,
  Plus,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Sparkles,
  Undo2,
  Download,
  MousePointer2,
  Square,
  Circle,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export interface FloorItem {
  id: string;
  type: "device" | "furniture" | "zone";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  icon?: string;
}

interface FloorPlannerProps {
  category: string;
  services?: any[];
  onLayoutChange?: (items: FloorItem[]) => void;
}

const FURNITURE_PRESETS = [
  { name: "Door", type: "furniture" as const, width: 60, height: 10, color: "#8B4513", icon: "🚪" },
  { name: "Reception", type: "furniture" as const, width: 120, height: 50, color: "#6366f1", icon: "🛎️" },
  { name: "Waiting Area", type: "zone" as const, width: 150, height: 100, color: "#10b981", icon: "🪑" },
  { name: "Restroom", type: "zone" as const, width: 80, height: 80, color: "#64748b", icon: "🚻" },
  { name: "Storage", type: "zone" as const, width: 80, height: 60, color: "#94a3b8", icon: "📦" },
  { name: "Counter", type: "furniture" as const, width: 100, height: 30, color: "#78716c", icon: "🗄️" },
  { name: "Table", type: "furniture" as const, width: 60, height: 60, color: "#a16207", icon: "🪑" },
  { name: "Wall", type: "furniture" as const, width: 200, height: 8, color: "#374151", icon: "🧱" },
];

const CANVAS_W = 800;
const CANVAS_H = 600;

export function FloorPlanner({ category, services = [], onLayoutChange }: FloorPlannerProps) {
  const [items, setItems] = useState<FloorItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<FloorItem[][]>([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Push to history
  const pushHistory = useCallback(
    (newItems: FloorItem[]) => {
      const newHistory = history.slice(0, historyIdx + 1);
      newHistory.push([...newItems]);
      setHistory(newHistory);
      setHistoryIdx(newHistory.length - 1);
    },
    [history, historyIdx],
  );

  const undo = useCallback(() => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setItems(history[historyIdx - 1]);
    }
  }, [history, historyIdx]);

  // Notify parent of changes
  useEffect(() => {
    onLayoutChange?.(items);
  }, [items, onLayoutChange]);

  // Add device items from services
  const addServiceItem = useCallback(
    (service: any) => {
      const count = service.numberOfDevices || 1;
      const newItems: FloorItem[] = [];
      for (let i = 0; i < count; i++) {
        newItems.push({
          id: crypto.randomUUID(),
          type: "device",
          name: `${service.name} ${i + 1}`,
          x: 100 + (i % 5) * 90,
          y: 100 + Math.floor(i / 5) * 90,
          width: 70,
          height: 70,
          rotation: 0,
          color: "#6366f1",
          icon: service.icon || "🎮",
        });
      }
      const updated = [...items, ...newItems];
      setItems(updated);
      pushHistory(updated);
    },
    [items, pushHistory],
  );

  const addFurniture = useCallback(
    (preset: (typeof FURNITURE_PRESETS)[0]) => {
      const item: FloorItem = {
        id: crypto.randomUUID(),
        type: preset.type,
        name: preset.name,
        x: CANVAS_W / 2 - preset.width / 2,
        y: CANVAS_H / 2 - preset.height / 2,
        width: preset.width,
        height: preset.height,
        rotation: 0,
        color: preset.color,
        icon: preset.icon,
      };
      const updated = [...items, item];
      setItems(updated);
      pushHistory(updated);
    },
    [items, pushHistory],
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    const updated = items.filter((i) => i.id !== selectedId);
    setItems(updated);
    setSelectedId(null);
    pushHistory(updated);
  }, [items, selectedId, pushHistory]);

  const rotateSelected = useCallback(() => {
    if (!selectedId) return;
    const updated = items.map((i) =>
      i.id === selectedId ? { ...i, rotation: (i.rotation + 45) % 360 } : i,
    );
    setItems(updated);
    pushHistory(updated);
  }, [items, selectedId, pushHistory]);

  // Drag handling
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation();
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      setSelectedId(itemId);
      setIsDragging(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX / zoom - item.x - rect.left / zoom,
          y: e.clientY / zoom - item.y - rect.top / zoom,
        });
      }
    },
    [items, zoom],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !selectedId) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(CANVAS_W - 40, e.clientX / zoom - dragOffset.x - rect.left / zoom));
      const y = Math.max(0, Math.min(CANVAS_H - 40, e.clientY / zoom - dragOffset.y - rect.top / zoom));
      // Snap to grid
      const snappedX = showGrid ? Math.round(x / 20) * 20 : x;
      const snappedY = showGrid ? Math.round(y / 20) * 20 : y;
      setItems((prev) =>
        prev.map((i) => (i.id === selectedId ? { ...i, x: snappedX, y: snappedY } : i)),
      );
    },
    [isDragging, selectedId, zoom, dragOffset, showGrid],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      pushHistory(items);
    }
  }, [isDragging, items, pushHistory]);

  // AI auto-layout
  const generateAiLayout = useCallback(async () => {
    setAiLoading(true);
    try {
      const serviceDesc = services
        .map((s) => `${s.name}: ${s.numberOfDevices || 1} units, ${s.maxPlayersPerDevice || 1} people each`)
        .join("; ");
      const res = await api.post<{ reply: string; layout?: any }>("/ai-assistant/floor-plan", {
        description: `I have a ${category} with these services: ${serviceDesc}. Design an optimal floor layout with entrance, reception, and all service areas properly spaced. Canvas is ${CANVAS_W}x${CANVAS_H} pixels.`,
        category,
        existingLayout: items.length > 0 ? { items } : undefined,
      });
      if (res.layout?.items) {
        const newItems: FloorItem[] = res.layout.items.map((item: any) => ({
          id: crypto.randomUUID(),
          type: item.type || "device",
          name: item.name || "Item",
          x: Math.max(0, Math.min(CANVAS_W - 40, item.x || 0)),
          y: Math.max(0, Math.min(CANVAS_H - 40, item.y || 0)),
          width: item.width || 70,
          height: item.height || 70,
          rotation: item.rotation || 0,
          color: item.color || "#6366f1",
          icon: item.icon,
        }));
        setItems(newItems);
        pushHistory(newItems);
      }
    } catch {
      // silently fail — AI not available
    } finally {
      setAiLoading(false);
    }
  }, [category, services, items, pushHistory]);

  const selectedItem = items.find((i) => i.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-xl border border-border/40">
        <div className="flex items-center gap-1 mr-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={generateAiLayout}
            disabled={aiLoading}
          >
            <Sparkles className={cn("h-3.5 w-3.5", aiLoading && "animate-spin")} />
            {aiLoading ? "Generating..." : "AI Auto-Layout"}
          </Button>
        </div>

        <div className="h-6 w-px bg-border/60" />

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <span className="text-xs font-mono text-muted-foreground w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border/60" />

        <Button
          variant={showGrid ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setShowGrid(!showGrid)}
          title="Toggle grid"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={undo}
          disabled={historyIdx <= 0}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>

        {selectedId && (
          <>
            <div className="h-6 w-px bg-border/60" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={rotateSelected}
              title="Rotate 45°"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={deleteSelected}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground ml-1">
              {selectedItem?.name}
            </span>
          </>
        )}
      </div>

      <div className="flex gap-4">
        {/* Left panel — items to add */}
        <div className="w-48 shrink-0 space-y-3">
          {/* Services from wizard */}
          {services.length > 0 && (
            <div>
              <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Your Services
              </p>
              <div className="space-y-1.5">
                {services.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => addServiceItem(s)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                  >
                    <span className="text-base">{s.icon || "🎯"}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {s.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        ×{s.numberOfDevices || 1} units
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Furniture presets */}
          <div>
            <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
              <Square className="h-3.5 w-3.5 text-muted-foreground" />
              Furniture & Zones
            </p>
            <div className="space-y-1.5">
              {FURNITURE_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => addFurniture(p)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                >
                  <span className="text-base">{p.icon}</span>
                  <span className="text-xs font-medium text-foreground">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto rounded-xl border-2 border-dashed border-border/60 bg-white">
          <div
            ref={canvasRef}
            className="relative select-none"
            style={{
              width: CANVAS_W * zoom,
              height: CANVAS_H * zoom,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelectedId(null)}
          >
            {/* Grid */}
            {showGrid && (
              <svg
                className="absolute inset-0 pointer-events-none"
                width={CANVAS_W}
                height={CANVAS_H}
              >
                <defs>
                  <pattern
                    id="grid"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            )}

            {/* Items */}
            {items.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "absolute cursor-move flex flex-col items-center justify-center rounded-lg border-2 transition-shadow select-none",
                    isSelected
                      ? "border-primary shadow-lg shadow-primary/20 z-20"
                      : "border-transparent hover:border-primary/30 z-10",
                    item.type === "zone" && "border-dashed",
                  )}
                  style={{
                    left: item.x,
                    top: item.y,
                    width: item.width,
                    height: item.height,
                    backgroundColor:
                      item.type === "zone"
                        ? `${item.color}15`
                        : `${item.color}25`,
                    borderColor: isSelected ? undefined : `${item.color}60`,
                    transform: `rotate(${item.rotation}deg)`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, item.id)}
                >
                  {item.icon && (
                    <span
                      className="text-lg leading-none"
                      style={{ transform: `rotate(-${item.rotation}deg)` }}
                    >
                      {item.icon}
                    </span>
                  )}
                  <span
                    className="text-[9px] font-bold text-foreground/70 leading-none mt-0.5 text-center px-1 truncate max-w-full"
                    style={{ transform: `rotate(-${item.rotation}deg)` }}
                  >
                    {item.name}
                  </span>
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-primary border-2 border-white" />
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {items.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/60">
                <MousePointer2 className="h-10 w-10 mb-3" />
                <p className="text-sm font-medium">
                  Add items from the left panel
                </p>
                <p className="text-xs mt-1">
                  or click <strong>AI Auto-Layout</strong> to generate
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item count summary */}
      {items.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            <strong className="text-foreground">{items.filter((i) => i.type === "device").length}</strong> devices
          </span>
          <span>
            <strong className="text-foreground">{items.filter((i) => i.type === "furniture").length}</strong> furniture
          </span>
          <span>
            <strong className="text-foreground">{items.filter((i) => i.type === "zone").length}</strong> zones
          </span>
          <span className="ml-auto">
            Canvas: {CANVAS_W}×{CANVAS_H}px (≈{(CANVAS_W * 5) / 100}m × {(CANVAS_H * 5) / 100}m)
          </span>
        </div>
      )}
    </div>
  );
}
