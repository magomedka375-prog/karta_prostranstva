import { MapContainer, ImageOverlay, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Красивая иконка маркера
const createIcon = (emoji) => L.divIcon({
  className: 'custom-map-marker-wrapper',
  html: `<div class="custom-map-marker">${emoji}</div>`,
  iconSize: [32, 32], iconAnchor: [16, 16]
});

// Компонент для программного перемещения карты
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 1, { duration: 1.5 });
  }, [center, map]);
  return null;
}

export default function MapView({ data, route, onPointClick, onRoute, selectedPoint }) {
  const points = data.points || [];
  const routeCoords = (route || []).map(p => [p.y, p.x]);

  return (
    <div className="map-container">
      <MapContainer 
        crs={L.CRS.Simple} 
        bounds={[[0,0],[1000,1000]]} 
        style={{ height: '100%', width: '100%' }} 
        minZoom={-1}
        zoomControl={false} // Скрываем стандартные кнопки зума, чтобы не портить вид
      >
        <ImageOverlay url="/plan.svg" bounds={[[0,0],[1000,1000]]} />
        
        {points.map(p => (
          <Marker 
            key={p.id} 
            position={[p.y, p.x]} 
            icon={createIcon(p.category === 'food' ? '🍔' : '📍')}
            eventHandlers={{ click: () => onPointClick(p) }}
          />
        ))}

        {routeCoords.length > 1 && (
          <Polyline positions={routeCoords} color="#007AFF" weight={6} opacity={0.8} dashArray="10, 10" />
        )}
        
        <MapController center={selectedPoint ? [selectedPoint.y, selectedPoint.x] : null} />
      </MapContainer>
    </div>
  );
}