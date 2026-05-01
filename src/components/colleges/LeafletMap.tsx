import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Star, Plus, Check, MapPin, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type MapUni = {
  id: string;
  name: string;
  country: string;
  state: string;
  city: string | null;
  type: string;
  nature: string;
  division: string | null;
  estimated_cost_usd: number | null;
  scholarship_available: boolean;
  acceptance_chance: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  unis: MapUni[];
  favIds: Set<string>;
  pipeIds: Set<string>;
  onToggleFav: (id: string) => void;
  onAddPipeline: (id: string) => void;
  /** ISO state/province code; "ALL" shows full map */
  zoomState?: string;
  stateCenters?: Record<string, { center: [number, number]; zoom: number }>;
};

/** Recenters the map when zoomState changes. */
function FlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

const DEFAULT_CENTER: [number, number] = [50, -95];
const DEFAULT_ZOOM = 3;

function buildIcon(color: string, size = 14, ring = false) {
  const html = `
    <span style="
      display:inline-block;width:${size}px;height:${size}px;border-radius:9999px;
      background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.35);
      ${ring ? `outline:3px solid ${color}40;outline-offset:1px;` : ""}
    "></span>`;
  return L.divIcon({
    html,
    className: "ns-marker",
    iconSize: [size + 4, size + 4],
    iconAnchor: [(size + 4) / 2, (size + 4) / 2],
  });
}

export default function LeafletMap({
  unis,
  favIds,
  pipeIds,
  onToggleFav,
  onAddPipeline,
  zoomState = "ALL",
  stateCenters = {},
}: Props) {
  const points = useMemo(
    () =>
      unis.filter((u) => {
        const lat = Number(u.latitude);
        const lng = Number(u.longitude);
        return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 18 && lat <= 75 && lng >= -170 && lng <= -50;
      }),
    [unis],
  );

  const target =
    zoomState !== "ALL" && stateCenters[zoomState]
      ? {
          // stateCenters use [lng, lat]; Leaflet uses [lat, lng]
          center: [stateCenters[zoomState].center[1], stateCenters[zoomState].center[0]] as [number, number],
          zoom: Math.min(8, Math.max(5, Math.round(stateCenters[zoomState].zoom + 3))),
        }
      : { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };

  const favColor = "hsl(28 100% 60%)"; // accent-ish
  const pipeColor = "hsl(265 89% 65%)"; // primary lilac
  const highColor = "hsl(150 60% 45%)"; // success
  const baseColor = "hsl(265 30% 60%)";

  const colorOf = (u: MapUni) => {
    if (favIds.has(u.id)) return favColor;
    if (pipeIds.has(u.id)) return pipeColor;
    if (u.acceptance_chance === "high") return highColor;
    return baseColor;
  };

  // Highlights render OUTSIDE cluster group so they always show
  const highlights = points.filter((u) => favIds.has(u.id) || pipeIds.has(u.id));
  const regulars = points.filter((u) => !favIds.has(u.id) && !pipeIds.has(u.id));

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-border" style={{ height: 480 }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={2}
        maxZoom={14}
        scrollWheelZoom
        style={{ width: "100%", height: "100%", background: "hsl(var(--muted, 240 10% 96%))" }}
      >
        <FlyTo center={target.center} zoom={target.zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Regular points clustered */}
        <MarkerClusterGroup chunkedLoading maxClusterRadius={50} showCoverageOnHover={false}>
          {regulars.map((u) => (
            <CircleMarker
              key={u.id}
              center={[Number(u.latitude), Number(u.longitude)]}
              radius={5}
              pathOptions={{ color: "white", weight: 1, fillColor: colorOf(u), fillOpacity: 0.9 }}
            >
              <Popup>
                <UniPopup u={u} fav={false} pipe={pipeIds.has(u.id)} onFav={onToggleFav} onPipe={onAddPipeline} />
              </Popup>
            </CircleMarker>
          ))}
        </MarkerClusterGroup>

        {/* Favorites + pipeline always visible (no cluster) */}
        {highlights.map((u) => {
          const isFav = favIds.has(u.id);
          return (
            <CircleMarker
              key={u.id}
              center={[Number(u.latitude), Number(u.longitude)]}
              radius={isFav ? 8 : 7}
              pathOptions={{
                color: "white",
                weight: 2,
                fillColor: isFav ? favColor : pipeColor,
                fillOpacity: 1,
              }}
            >
              <Popup>
                <UniPopup u={u} fav={isFav} pipe={pipeIds.has(u.id)} onFav={onToggleFav} onPipe={onAddPipeline} />
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

function UniPopup({
  u,
  fav,
  pipe,
  onFav,
  onPipe,
}: {
  u: MapUni;
  fav: boolean;
  pipe: boolean;
  onFav: (id: string) => void;
  onPipe: (id: string) => void;
}) {
  return (
    <div className="min-w-[220px] space-y-2">
      <div>
        <div className="font-semibold text-sm leading-tight">{u.name}</div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
          <MapPin className="h-3 w-3" />
          {[u.city, u.state, u.country === "USA" ? "EUA" : "Canadá"].filter(Boolean).join(", ")}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary" className="text-[10px]">
          {u.type === "community_college" ? "Community" : u.type === "college" ? "College" : "University"}
        </Badge>
        {u.division && u.division !== "NONE" && (
          <Badge variant="outline" className="text-[10px]">
            {u.division.replace("_", " ")}
          </Badge>
        )}
        {u.scholarship_available && <Badge className="bg-success text-success-foreground text-[10px]">Bolsa</Badge>}
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          <DollarSign className="h-3 w-3" />${u.estimated_cost_usd?.toLocaleString() ?? "—"}/ano
        </span>
        <span
          className={
            u.acceptance_chance === "high"
              ? "text-success font-medium"
              : u.acceptance_chance === "low"
              ? "text-destructive font-medium"
              : "text-warning font-medium"
          }
        >
          {u.acceptance_chance === "high" ? "Alta chance" : u.acceptance_chance === "low" ? "Baixa chance" : "Média chance"}
        </span>
      </div>
      <div className="flex gap-1.5 pt-1">
        <Button size="sm" variant={fav ? "secondary" : "outline"} className="flex-1 h-7 text-[11px]" onClick={() => onFav(u.id)}>
          <Star className={`h-3 w-3 mr-1 ${fav ? "fill-accent text-accent" : ""}`} />
          {fav ? "Favorita" : "Favoritar"}
        </Button>
        <Button
          size="sm"
          variant={pipe ? "secondary" : "default"}
          className="flex-1 h-7 text-[11px]"
          disabled={pipe}
          onClick={() => onPipe(u.id)}
        >
          {pipe ? <Check className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
          {pipe ? "Pipeline" : "Pipeline"}
        </Button>
      </div>
    </div>
  );
}
