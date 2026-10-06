/* Mapa con el recorrido. En vivo sigue tu posición; en el detalle encuadra toda la salida. */
import { useEffect, useRef } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { useColors } from '@/constants/theme';

type LatLon = [number, number];

export function RouteMap({ route, live, style, interactive = true }: {
  route: LatLon[]; live?: boolean; style?: StyleProp<ViewStyle>; interactive?: boolean;
}) {
  const c = useColors();
  const ref = useRef<MapView>(null);
  const coords = route.map(([latitude, longitude]) => ({ latitude, longitude }));
  const last = coords[coords.length - 1];

  // En vivo: la cámara sigue el último punto. En el detalle: encuadra todo el recorrido.
  useEffect(() => {
    if (!ref.current || !last) return;
    if (live) ref.current.animateCamera({ center: last, zoom: 16.5 }, { duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, last?.latitude, last?.longitude]);

  const fit = () => {
    if (live || coords.length < 2) return;
    ref.current?.fitToCoordinates(coords, { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: false });
  };

  return (
    <MapView
      ref={ref}
      style={[{ flex: 1 }, style]}
      onMapReady={fit}
      showsUserLocation={live}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      userInterfaceStyle={c.scheme}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={interactive}
      pitchEnabled={false}
      initialRegion={last ? { ...last, latitudeDelta: 0.01, longitudeDelta: 0.01 } : undefined}>
      {coords.length > 1 && (
        <>
          <Polyline coordinates={coords} strokeColor={c.scheme === 'dark' ? '#0B0C10' : '#FFFFFF'} strokeWidth={9} />
          <Polyline coordinates={coords} strokeColor={c.primary} strokeWidth={5} lineJoin="round" lineCap="round" />
        </>
      )}
      {coords.length > 0 && <Marker coordinate={coords[0]} pinColor="green" anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false} />}
      {!live && coords.length > 1 && <Marker coordinate={last} pinColor="red" tracksViewChanges={false} />}
    </MapView>
  );
}
