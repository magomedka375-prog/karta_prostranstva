import { useEffect, useState } from 'react';
import { api } from './api';

export default function Stats({ onClose }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats').then(setStats).catch(() => setStats({ error: true }));
  }, []);

  if (!stats) return <div style={{ padding: '20px' }}>Загрузка...</div>;
  if (stats.error) return (
    <div style={{ padding: '20px' }}>
      <h3>Ошибка загрузки статистики</h3>
      <button onClick={onClose}>Назад</button>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <h2>📊 Статистика</h2>
      <p>Всего событий: <b>{stats.total}</b></p>
      <h4>Топ точек</h4>
      <ul>
        {stats.byPoint.map(p => (
          <li key={p.name}>{p.name}: {p.views} просмотров</li>
        ))}
      </ul>
      <button onClick={onClose} style={{ marginTop: '20px', padding: '10px' }}>Назад к карте</button>
    </div>
  );
}