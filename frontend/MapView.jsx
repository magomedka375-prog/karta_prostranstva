import { MapContainer, ImageOverlay, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const icon = (color) => L.divIcon({
  className: 'custom-icon',
  html: `<div style="background:${color};width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [22, 22], iconAnchor: [11, 11]
});

export default function MapView({ data, route, onPointClick, onRoute }) {
  const points = data.points || [];
  const routeCoords = (route || []).map(p => [p.y, p.x]);

  return (
    <div style={{ height: 'calc(100vh - 110px)' }}>
      <MapContainer crs={L.CRS.Simple} bounds={[[0,0],[1000,1000]]} style={{ height: '100%' }} minZoom={-1}>
        <ImageOverlay url="/uploads/plan.svg" bounds={[[0,0],[1000,1000]]} />
        {points.map(p => (
          <Marker key={p.id} position={[p.y, p.x]} icon={icon('#2563eb')}>
            <Popup>
              <b>{p.name}</b><br/>{p.description}<br/>
              <button className="popup-btn" onClick={() => onPointClick(p.id)}>Открыть панораму</button>
              <button className="popup-btn" onClick={() => {
                const from = prompt('ID начальной точки для маршрута:');
                if (from) onRoute(+from, p.id); // Упрощённый вызов
              }}>Построить маршрут</button>
            </Popup>
          </Marker>
        ))}
        {routeCoords.length > 1 && <Polyline positions={routeCoords} color="#dc2626" weight={5} />}
      </MapContainer>
    </div>
  );
}