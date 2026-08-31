"use client";

import { useEffect, useRef, useState } from "react";
import { animate, type AnimationParams, type FunctionValue } from "animejs";
import { buildMapModel } from "@/lib/historical-places/map-model";
import type { HistoricalPlace } from "@/lib/historical-places/types";

interface Residence {
  residence: string;
  count: number;
}

interface KoreaMapProps {
  residences: Residence[];
  bonGwan: string;
  mainResidence: string;
  markerMode?: "all" | "bonGwan" | "residences";
  className?: string;
}

const MAP_ZOOM = 5;
const TILE_SIZE = 256;
const MAP_WIDTH = 300;
const MAP_HEIGHT = 360;
const MAP_CENTER: [number, number] = [38, 127.2];
const MAP_SCALE = 1.2;

function worldPoint([lat, lon]: [number, number]): [number, number] {
  const scale = TILE_SIZE * 2 ** MAP_ZOOM;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  return [((lon + 180) / 360) * scale, (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale];
}

function markerPosition(coord: [number, number]): { left: string; top: string } {
  const [centerX, centerY] = worldPoint(MAP_CENTER);
  const [x, y] = worldPoint(coord);
  return {
    left: `${(50 + (((x - centerX) * MAP_SCALE) / MAP_WIDTH) * 100).toFixed(4)}%`,
    top: `${(50 + (((y - centerY) * MAP_SCALE) / MAP_HEIGHT) * 100).toFixed(4)}%`,
  };
}

export default function KoreaMap({ residences, bonGwan, mainResidence, markerMode = "all", className }: KoreaMapProps) {
  const top = residences.slice(0, 5).filter((r) => r.residence !== "기록 없음");
  const model = buildMapModel({ bonGwan, residences: top });
  const markers = model.markers;
  const max = Math.max(...markers.map((marker) => marker.count), 1);
  const [selectedMarker, setSelectedMarker] = useState<{ label: string; count?: number; kind: string; place: HistoricalPlace } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const bonPlace = model.bonGwan.status === "resolved" ? model.bonGwan.place : null;
  const [centerX, centerY] = worldPoint(MAP_CENTER);
  const centerTileX = Math.floor(centerX / TILE_SIZE);
  const centerTileY = Math.floor(centerY / TILE_SIZE);
  const tiles = Array.from({ length: 16 }, (_, index) => {
    const offsetX = (index % 4) - 1;
    const offsetY = Math.floor(index / 4) - 1;
    const x = centerTileX + offsetX;
    const y = centerTileY + offsetY;
    return {
      x,
      y,
      left: (((x * TILE_SIZE - centerX) * MAP_SCALE + MAP_WIDTH / 2) / MAP_WIDTH) * 100,
      top: (((y * TILE_SIZE - centerY) * MAP_SCALE + MAP_HEIGHT / 2) / MAP_HEIGHT) * 100,
      width: ((TILE_SIZE * MAP_SCALE) / MAP_WIDTH) * 100,
      height: ((TILE_SIZE * MAP_SCALE) / MAP_HEIGHT) * 100,
    };
  });

  useEffect(() => {
    if (!mapRef.current) return;
    const markerDelay: FunctionValue<number> = (_target, index = 0) => index * 80;
    const markerAnimation: AnimationParams = {
      scale: [0, 1],
      opacity: [0, 1],
      duration: 360,
      delay: markerDelay,
      easing: "outQuad",
    };
    animate(mapRef.current.querySelectorAll(".korea-dot"), markerAnimation);
  }, [bonGwan, mainResidence]);

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded border border-line bg-subtle">
        <div ref={mapRef} className="relative aspect-[5/6] overflow-hidden bg-subtle" role="img" aria-label="한반도 거주지 분포">
          {tiles.map((tile) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${tile.x}-${tile.y}`}
              src={`https://tile.openstreetmap.org/${MAP_ZOOM}/${tile.x}/${tile.y}.png`}
              alt=""
              width={TILE_SIZE}
              height={TILE_SIZE}
              className="absolute max-w-none opacity-90 grayscale-[0.2]"
              style={{
                left: `${tile.left.toFixed(4)}%`,
                top: `${tile.top.toFixed(4)}%`,
                width: `${tile.width.toFixed(4)}%`,
                height: `${tile.height.toFixed(4)}%`,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-background/10" />
          {bonPlace && markerMode !== "residences" && (
            <div className="korea-dot absolute z-10 -translate-x-1/2 -translate-y-1/2" style={markerPosition([...bonPlace.coordinate])} title={`본관 ${bonGwan}`} role="button" tabIndex={0} onClick={() => setSelectedMarker({ label: bonGwan, kind: "본관", place: bonPlace })} onKeyDown={(event) => event.key === "Enter" && setSelectedMarker({ label: bonGwan, kind: "본관", place: bonPlace })}>
              <span className="block size-3 rounded-full border-2 border-white bg-accent" />
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-white [text-shadow:0_1px_2px_black]">본관</span>
            </div>
          )}
          {markerMode !== "bonGwan" && markers.map((marker) => {
            const isMain = marker.residences.some((r) => r.residence === mainResidence);
            const size = 10 + (marker.count / max) * 8;
            const position = markerPosition([...marker.place.coordinate]);
            const names = marker.residences.map((r) => r.residence).join(", ");
            return (
              <div
                key={marker.place.id}
                className="korea-dot absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
                title={names}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedMarker({ label: names, count: marker.count, kind: isMain ? "주 거주지" : "거주지", place: marker.place })}
                onKeyDown={(event) => event.key === "Enter" && setSelectedMarker({ label: names, count: marker.count, kind: isMain ? "주 거주지" : "거주지", place: marker.place })}
                style={{
                  ...position,
                  width: `${size.toFixed(2)}px`,
                  height: `${size.toFixed(2)}px`,
                  backgroundColor: isMain ? "var(--accent)" : "var(--fg-2)",
                }}
              />
            );
          })}
          {selectedMarker && (
            <div className="absolute bottom-2 left-2 right-2 z-20 border border-line bg-background/95 px-3 py-2 text-xs text-foreground">
              <div className="flex items-center justify-between gap-3">
                <span><strong>{selectedMarker.kind}</strong> · {selectedMarker.label}{selectedMarker.count ? ` · ${selectedMarker.count.toLocaleString()}건` : ""}</span>
                <button type="button" className="text-ink-2" onClick={() => setSelectedMarker(null)} aria-label="지도 상세 닫기">닫기</button>
              </div>
              <p className="mt-1 text-ink-2">{selectedMarker.place.modernArea}{selectedMarker.place.confidence === "approximate" ? " · 근사 위치" : ""}</p>
              <a className="mt-1 inline-block text-accent underline underline-offset-2" href={selectedMarker.place.source.url} target="_blank" rel="noreferrer">{selectedMarker.place.source.title}</a>
            </div>
          )}
        </div>
        <div className="border-t border-line bg-background px-3 py-2">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span>
              <span className="mr-1 text-ink-3">본관</span>
              <strong className="font-semibold text-foreground">{bonGwan}</strong>
            </span>
            <span className="text-right">
              <span className="mr-1 text-ink-3">주 거주지</span>
              <strong className="font-semibold text-foreground">{mainResidence}</strong>
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 text-[10px] text-ink-3">
            <span>표시 {markers.length}곳 · 미확인 {model.unresolvedResidences.length}곳</span>
            <span>© OpenStreetMap contributors</span>
          </div>
          {(model.bonGwan.status !== "resolved" || model.unresolvedResidences.length > 0) && (
            <details className="mt-2 border-t border-line pt-2 text-[11px] text-ink-2">
              <summary className="cursor-pointer select-none">위치 확인이 필요한 항목</summary>
              <ul className="mt-1 space-y-0.5">
                {model.bonGwan.status !== "resolved" && <li>본관 {bonGwan}: {model.bonGwan.status === "ambiguous" ? "동음 지명이 여러 곳입니다." : "근거 좌표가 없습니다."}</li>}
                {model.unresolvedResidences.map((item) => <li key={item.residence}>{item.residence || "기록 없음"} · {item.count.toLocaleString()}건</li>)}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
