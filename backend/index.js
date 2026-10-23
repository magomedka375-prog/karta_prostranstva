import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { db } from './db.js';

const app = express();
// Разрешаем CORS для всех адресов (для хакатона это нормально)
app.use(cors());
app.use(express.json());

// Создание папки uploads (на Vercel просто пропустится)
try {
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
  if (!fs.existsSync('uploads/plan.svg')) {
    fs.writeFileSync('uploads/plan.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000"><rect width="1000" height="1000" fill="#f0f0f0"/><rect x="100" y="100" width="800" height="800" fill="none" stroke="#333" stroke-width="5"/><text x="20" y="40" font-size="30">DEMO PLAN</text></svg>`);
  }
} catch (error) {
  console.log("File system is read-only, skipping uploads folder creation.");
}

app.use('/uploads', express.static('uploads'));

// API: Кампусы
app.get('/api/campuses', async (req, res) => {
  const r = await db.execute('SELECT * FROM campus');
  res.json(r.rows);
});

app.get('/api/venues', async (req, res) => {
  const r = await db.execute('SELECT * FROM venue');
  res.json(r.rows);
});

app.get('/api/floors', async (req, res) => {
  const r = await db.execute('SELECT * FROM floor');
  res.json(r.rows);
});

// API: Точки на этаже
app.get('/api/floor/:id/points', async (req, res) => {
  try {
    await db.execute({ sql: 'INSERT INTO event_log (type, point_id) VALUES (?,?)', args: ['floor_view', req.params.id] });
  } catch (e) { console.log('Stats error', e) }
  
  const points = await db.execute({ sql: 'SELECT * FROM point WHERE floor_id=?', args: [req.params.id] });
  const edges = await db.execute('SELECT * FROM edge');
  const panoramas = await db.execute('SELECT * FROM panorama');
  res.json({ points: points.rows, edges: edges.rows, panoramas: panoramas.rows });
});

// API: Панорама
app.get('/api/point/:id/panorama', async (req, res) => {
  const p = await db.execute({ sql: 'SELECT * FROM panorama WHERE point_id=?', args: [req.params.id] });
  if (!p.rows.length) return res.status(404).json({ error: 'no pano' });
  const pano = p.rows[0];
  
  const h = await db.execute({ 
    sql: 'SELECT h.*, p.image_url as target_url FROM hotspot h JOIN panorama p ON p.id = h.target_panorama_id WHERE h.panorama_id = ?', 
    args: [pano.id] 
  });
  res.json({ ...pano, hotspots: h.rows });
});

// API: Навигация (A*)
function aStar(from, to, edges) {
  const adj = {};
  edges.forEach(e => {
    (adj[e.from_point] ??= []).push({ to: e.to_point, w: e.weight });
    (adj[e.to_point] ??= []).push({ to: e.from_point, w: e.weight });
  });
  const open = new Set([from]);
  const cameFrom = {}, g = { [from]: 0 }, f = { [from]: 0 };
  while (open.size) {
    let cur = [...open].reduce((a, b) => (f[a] < f[b] ? a : b));
    if (cur === to) {
      const path = [cur];
      while (cameFrom[cur]) { cur = cameFrom[cur]; path.unshift(cur); }
      return path;
    }
    open.delete(cur);
    (adj[cur] || []).forEach(({ to: n, w }) => {
      const t = g[cur] + w;
      if (t < (g[n] ?? Infinity)) { cameFrom[n] = cur; g[n] = t; f[n] = t; open.add(n); }
    });
  }
  return null;
}

app.get('/api/route', async (req, res) => {
  const edgesRes = await db.execute('SELECT * FROM edge');
  const path = aStar(+req.query.from, +req.query.to, edgesRes.rows);
  if (!path) return res.status(404).json({ error: 'no path' });
  
  const points = [];
  for (const id of path) {
    const p = await db.execute({ sql: 'SELECT * FROM point WHERE id=?', args: [id] });
    points.push(p.rows[0]);
  }
  res.json({ path: points });
});

// API: Статистика
app.get('/api/stats', async (req, res) => {
  const total = await db.execute('SELECT COUNT(*) as c FROM event_log');
  const byPoint = await db.execute('SELECT p.name, COUNT(e.id) as views FROM event_log e JOIN point p ON p.id=e.point_id WHERE e.point_id IS NOT NULL GROUP BY e.point_id');
  res.json({ total: total.rows[0].c, byPoint: byPoint.rows });
});

// ЭКСПОРТ ДЛЯ VERCEL
export default app;