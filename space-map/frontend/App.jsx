import { useEffect, useState } from 'react';
import MapView from './MapView';
import PanoramaView from './PanoramaView';
import Stats from './Stats';
import { api } from './api';
import './styles.css';

export default function App() {
  const [campuses, setCampuses] = useState([]);
  const [campusId, setCampusId] = useState(null);
  const [venues, setVenues] = useState([]);
  const [venueId, setVenueId] = useState(null);
  const [floors, setFloors] = useState([]);
  const [floorId, setFloorId] = useState(null);
  const [data, setData] = useState({ points: [], edges: [], panoramas: [] });
  const [view, setView] = useState('map'); // 'map' | 'pano' | 'stats'
  const [panoId, setPanoId] = useState(null);
  const [route, setRoute] = useState(null);

  // Загрузка данных
  useEffect(() => { api.get('/campuses').then(cs => { setCampuses(cs); if(cs[0]) setCampusId(cs[0].id); }); }, []);
  useEffect(() => { if(campusId) api.get(`/venues?campus_id=${campusId}`).then(vs => { setVenues(vs); if(vs[0]) setVenueId(vs[0].id); }); }, [campusId]);
  useEffect(() => { if(venueId) api.get(`/floors?venue_id=${venueId}`).then(fs => { setFloors(fs); if(fs[0]) setFloorId(fs[0].id); }); }, [venueId]);
  useEffect(() => { if(floorId) api.get(`/floor/${floorId}/points`).then(setData); }, [floorId]);

  const openPano = async (pointId) => {
    const p = await api.get(`/point/${pointId}/panorama`);
    if (p) { setPanoId(p.id); setView('pano'); }
    else alert('Нет панорамы для этой точки');
  };

  return (
    <div className="app">
      <header className="mobile-header">
        <button onClick={() => setView('map')}>🗺 Карта</button>
        <button onClick={() => setView('stats')}>📊 Статистика</button>
      </header>

      {/* Панель фильтров (скроллится вбок) */}
      <div className="filter-bar">
        <select value={campusId || ''} onChange={e => setCampusId(+e.target.value)}>
          {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={venueId || ''} onChange={e => setVenueId(+e.target.value)}>
          {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select value={floorId || ''} onChange={e => { setFloorId(+e.target.value); setRoute(null); }}>
          {floors.map(f => <option key={f.id} value={f.id}>Этаж {f.level}</option>)}
        </select>
      </div>

      {view === 'map' && (
        <>
          <MapView data={data} route={route} onPointClick={openPano} onRoute={setRoute} />
          {route && (
            <div className="route-banner">
              <span>Маршрут: {route.map(p => p.name).join(' → ')}</span>
              <button onClick={() => setRoute(null)}>✕</button>
            </div>
          )}
        </>
      )}

      {view === 'pano' && panoId && (
        <PanoramaView panoId={panoId} onClose={() => setView('map')} onNavigate={setPanoId} />
      )}

      {view === 'stats' && <Stats onClose={() => setView('map')} />}
    </div>
  );
}