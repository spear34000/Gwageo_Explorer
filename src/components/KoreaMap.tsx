"use client";

import { useEffect, useRef, useState } from "react";
import { animate, type AnimationParams, type FunctionValue } from "animejs";
import { buildMapModel } from "@/lib/historical-places/map-model";
import type { HistoricalPlace } from "@/lib/historical-places/types";
import type { ClanLocation } from "@/lib/data/types";

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
  clanLocations?: ClanLocation[];
}

const MAP_ZOOM = 5;
const TILE_SIZE = 256;
const MAP_WIDTH = 300;
const MAP_HEIGHT = 360;
const MAP_CENTER: [number, number] = [38, 127.2];
const MAP_SCALE = 1.2;
const MAP_TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

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

export default function KoreaMap({ residences, bonGwan, mainResidence, markerMode = "all", className, clanLocations = [] }: KoreaMapProps) {
  const top = residences.slice(0, 5).filter((r) => r.residence !== "기록 없음");
  const model = buildMapModel({ bonGwan, residences: top });
  const markers = model.markers;
  const max = Math.max(...markers.map((marker) => marker.count), 1);
  const [selectedMarker, setSelectedMarker] = useState<{ label: string; count?: number; kind: string; place: HistoricalPlace } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  // Show an approximate 본관 point when the gazetteer has a unique match.
  // It is purple but the popup labels it as approximate; ambiguous/unknown
  // names remain unplaced instead of being guessed.
  const bonPlace = model.bonGwan.status === "resolved" ? model.bonGwan.place : null;
  const approximateMarkers = markers.filter((marker) => marker.place.confidence !== "verified");
  const visibleClanLocations = clanLocations.filter((location) => {
    if (markerMode === "bonGwan") return location.kind === "origin";
    if (markerMode === "residences") return location.kind !== "origin";
    return true;
  });
  const reviewClanLocationCount = clanLocations.filter((location) => location.status !== "verified").length;
  const unresolvedCount = model.unresolvedResidences.length + reviewClanLocationCount;
  const verifiedLocationCount = clanLocations.length - reviewClanLocationCount + markers.length + (bonPlace ? 1 : 0);
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
    const targets = Array.from(mapRef.current.querySelectorAll<HTMLElement>(".korea-dot"));
    if (targets.length > 0) animate(targets, markerAnimation);
  }, [bonGwan, mainResidence]);

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded border border-line bg-subtle">
        <div ref={mapRef} className="relative aspect-[5/6] overflow-hidden bg-subtle" role="img" aria-label="한반도 거주지 분포">
          {tiles.map((tile) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${tile.x}-${tile.y}`}
              src={MAP_TILE_URL
                .replace("{z}", String(MAP_ZOOM))
                .replace("{x}", String(tile.x))
                .replace("{y}", String(tile.y))}
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
          {unresolvedCount > 0 && (
            <div className="absolute right-2 top-2 z-20 rounded-full border border-[#f59e0b]/70 bg-[#f59e0b]/95 px-2 py-1 text-[10px] font-semibold text-black shadow-sm" aria-label={`미확인 ${unresolvedCount}건`}>
              미확인 {unresolvedCount}건
            </div>
          )}
          {visibleClanLocations.map((location) => {
            const mappedPlace: HistoricalPlace = {
              id: location.id,
              labels: [location.name],
              modernArea: location.name,
              coordinate: [location.latitude, location.longitude],
              precision: location.kind === "origin" ? "settlement" : "regional-center",
              confidence: "verified",
              source: {
                title: location.evidence[0]?.title ?? "공식 출처",
                url: location.evidence[0]?.url ?? "https://www.aks.ac.kr/",
              },
            };
            return (
              <button
                key={location.id}
                type="button"
                className={`korea-dot absolute z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${location.status !== "verified" ? "bg-[#f59e0b]" : location.kind === "origin" ? "bg-[#8b5cf6]" : "bg-accent"}`}
                style={markerPosition([location.latitude, location.longitude])}
                title={location.name}
                onClick={() => setSelectedMarker({ label: location.name, kind: location.kind === "origin" ? "본관 발생지" : "거주지", place: mappedPlace })}
                aria-label={`${location.name} ${location.status === "verified" ? "검증됨" : "검토 중"}`}
              />
            );
          })}
          {bonPlace && markerMode !== "residences" && (
            <div className="korea-dot absolute z-10 -translate-x-1/2 -translate-y-1/2" style={markerPosition([...bonPlace.coordinate])} title={`본관 ${bonGwan}`} role="button" tabIndex={0} onClick={() => setSelectedMarker({ label: bonGwan, kind: "본관", place: bonPlace })} onKeyDown={(event) => event.key === "Enter" && setSelectedMarker({ label: bonGwan, kind: "본관", place: bonPlace })}>
              <span className="block size-3 rounded-full border-2 border-white bg-[#8b5cf6]" />
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
              {selectedMarker.kind !== "본관" && <p className="mt-1 text-ink-3">{selectedMarker.place.confidence === "approximate" ? "좌표는 지명 중심의 근사 위치 · 공식 본관 연고는 별도 검토 중" : "좌표·원자료 관측은 검증됨 · 본관 연고는 별도 검토 중"}</p>}
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
            <span>표시 {verifiedLocationCount}곳 · 미확인 {unresolvedCount}곳</span>
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline underline-offset-2">© OpenStreetMap contributors</a>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink-3" aria-label="지도 범례">
            <span><i className="mr-1 inline-block size-2 rounded-full bg-accent" />검증 위치</span>
            <span><i className="mr-1 inline-block size-2 rounded-full bg-[#f59e0b]" />검토 중</span>
            <span><i className="mr-1 inline-block size-2 rounded-full bg-[#8b5cf6]" />본관</span>
          </div>
          {(bonPlace === null || model.unresolvedResidences.length > 0 || approximateMarkers.length > 0 || reviewClanLocationCount > 0) && (
            <details className="mt-2 border-t border-line pt-2 text-[11px] text-ink-2">
              <summary className="cursor-pointer select-none">위치 확인이 필요한 항목</summary>
              <ul className="mt-1 space-y-0.5">
                {bonPlace === null && <li>본관 {bonGwan}: 공식 출처와 재배포 권리 확인이 필요합니다.</li>}
                {model.unresolvedResidences.map((item) => <li key={item.residence}>{item.residence || "기록 없음"} · {item.count.toLocaleString()}건</li>)}
                {approximateMarkers.map((marker) => <li key={`approximate-${marker.place.id}`}>{marker.residences.map((item) => item.residence).join(", ")} · 근사 위치</li>)}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
