import { useEffect, useState } from 'react';
import MapView from './MapView';
import PanoramaView from './PanoramaView';
import Stats from './Stats';
import { api } from './api';

export default function App() {
  const [campuses, setCampuses] = useState([]);
  const [campusId, setCampusId] = useState(null);
  const [venues, setVenues] = useState([]);
  const [venueId, setVenueId] = useState(null);
  const [floors, setFloors] = useState([]);
  const [floorId, setFloorId] = useState(null);
  const [data, setData] = useState({ points: [], edges: [], panoramas: [] });
  
  const [view, setView] = useState('map');
  const [selectedPoint, setSelectedPoint] = useState(null); // Выбранная точка
  const [panoId, setPanoId] = useState(null);
  const [route, setRoute] = useState(null);

  useEffect(() => { api.get('/campuses').then(cs => { setCampuses(cs); if(cs[0]) setCampusId(cs[0].id); }); }, []);
  useEffect(() => { if(campusId) api.get(`/venues?campus_id=${campusId}`).then(vs => { setVenues(vs); if(vs[0]) setVenueId(vs[0].id); }); }, [campusId]);
  useEffect(() => { if(venueId) api.get(`/floors?venue_id=${venueId}`).then(fs => { setFloors(fs); if(fs[0]) setFloorId(fs[0].id); }); }, [venueId]);
  useEffect(() => { if(floorId) api.get(`/floor/${floorId}/points`).then(setData); }, [floorId]);

  const openPano = async (point) => {
    const p = await api.get(`/point/${point.id}/panorama`);
    if (p && p.id) { setPanoId(p.id); setView('pano'); }
    else alert('Для этой точки еще нет панорамы');
  };

  return (
    <>
      {/* Если открыт режим карты */}
      {view === 'map' && (
        <>
          <MapView 
            data={data} 
            route={route} 
            selectedPoint={selectedPoint}
            onPointClick={(p) => setSelectedPoint(p)} 
            onRoute={setRoute} 
          />

          {/* Верхняя панель с фильтрами */}
          <div className="search-panel">
            <div className="search-input-wrapper">
              <span>🔍</span>
              <input type="text" placeholder="Поиск по карте..." disabled />
            </div>
            
            <div className="filter-chips">
              <select className="chip" value={campusId || ''} onChange={e => setCampusId(+e.target.value)}>
                {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="chip" value={venueId || ''} onChange={e => setVenueId(+e.target.value)}>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <select className="chip" value={floorId || ''} onChange={e => { setFloorId(+e.target.value); setRoute(null); }}>
                {floors.map(f => <option key={f.id} value={f.id}>Этаж {f.level}</option>)}
              </select>
              <button className="chip" onClick={() => setView('stats')}>📊 Статистика</button>
            </div>
          </div>

          {/* Нижняя карточка (появляется при клике на точку) */}
          {selectedPoint && (
            <div className="bottom-sheet">
              <h2>{selectedPoint.name}</h2>
              <p>{selectedPoint.description}</p>
              
              <div className="action-buttons">
                <button className="btn-primary" onClick={() => openPano(selectedPoint)}>
                  🌐 Смотреть панораму
                </button>
                <button className="btn-secondary" onClick={() => {
                  const from = prompt('ID откуда начать (1):');
                  if (from) onRoute(+from, selectedPoint.id);
                  setSelectedPoint(null);
                }}>
                  🧭 Маршрут
                </button>
              </div>
              
              <button 
                onClick={() => setSelectedPoint(null)}
                style={{width: '100%', marginTop: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '14px'}}>
                Закрыть
              </button>
            </div>
          )}
          
          {/* Отображение маршрута */}
          {route && !selectedPoint && (
            <div className="bottom-sheet">
              <h2>Маршрут построен</h2>
              <p>{route.map(p => p.name).join(' → ')}</p>
              <button className="btn-secondary" style={{width: '100%'}} onClick={() => setRoute(null)}>
                Сбросить маршрут
              </button>
            </div>
          )}
        </>
      )}

      {/* Режим панорамы */}
      {view === 'pano' && panoId && (
        <PanoramaView 
          panoId={panoId} 
          onClose={() => { setView('map'); setSelectedPoint(null); }} 
          onNavigate={setPanoId} 
        />
      )}

      {/* Режим статистики */}
      {view === 'stats' && (
        <div className="stats-page">
          <div className="stats-header">
            <h1>📊 Статистика</h1>
            <button className="btn-secondary" onClick={() => setView('map')}>Назад</button>
          </div>
          <Stats />
        </div>
      )}
    </>
  );
}