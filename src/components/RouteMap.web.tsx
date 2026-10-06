/* Versión web del mapa (Chrome): Leaflet + OpenStreetMap, cargado desde CDN la primera vez.
   En el teléfono se usa RouteMap.tsx (mapa nativo de Apple / Google). */
import { useEffect, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { RouteSketch } from '@/components/RouteSketch';
import { useColors } from '@/constants/theme';

type LatLon = [number, number];
type LeafletNS = any;

let leafletPromise: Promise<LeafletNS> | null = null;
function loadLeaflet(): Promise<LeafletNS> {
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  leafletPromise ??= new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = () => resolve(w.L);
    js.onerror = () => { leafletPromise = null; reject(new Error('sin mapa')); };
    document.head.appendChild(js);
  });
  return leafletPromise;
}

export function RouteMap({ route, live, style, interactive = true }: {
  route: LatLon[]; live?: boolean; style?: StyleProp<ViewStyle>; interactive?: boolean;
}) {
  const c = useColors();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const layers = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadLeaflet().then((L) => {
      if (!alive || !el.current || map.current) return;
      const m = L.map(el.current, {
        zoomControl: false, attributionControl: true,
        dragging: interactive, scrollWheelZoom: interactive, doubleClickZoom: interactive, touchZoom: interactive,
      });
      // OpenStreetMap (libre, sin clave). En modo oscuro invertimos los colores de las teselas.
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(m);
      if (c.scheme === 'dark') {
        const pane = m.getPane('tilePane');
        if (pane) pane.style.filter = 'invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.9)';
      }
      layers.current = L.layerGroup().addTo(m);
      map.current = m;
      setReady(true);
    }).catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    const m = map.current;
    if (!ready || !L || !m || !layers.current) return;
    layers.current.clearLayers();
    if (!route.length) return;
    if (route.length > 1) {
      L.polyline(route, { color: c.scheme === 'dark' ? '#0B0C10' : '#FFFFFF', weight: 9, opacity: 0.9 }).addTo(layers.current);
      L.polyline(route, { color: c.primary, weight: 5, lineJoin: 'round', lineCap: 'round' }).addTo(layers.current);
    }
    const dot = (p: LatLon, color: string, r: number) =>
      L.circleMarker(p, { radius: r, color: '#fff', weight: 3, fillColor: color, fillOpacity: 1 }).addTo(layers.current);
    dot(route[0], c.green, 7);
    const last = route[route.length - 1];
    if (route.length > 1 || live) dot(last, live ? c.primary : c.red, live ? 9 : 7);
    if (live || route.length === 1) m.setView(last, 16, { animate: true });
    else m.fitBounds(route, { padding: [30, 30] });
  }, [ready, route, live, c]);

  if (failed) {
    return (
      <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.soft }, style]}>
        <RouteSketch route={route} size={220} />
      </View>
    );
  }
  return (
    <View style={[{ flex: 1, backgroundColor: c.soft, overflow: 'hidden' }, style]}>
      <div ref={el} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
    </View>
  );
}
