import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import { db } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// ВАЖНО: На Vercel нельзя создавать папки (fs.mkdirSync).
// Поэтому мы оборачиваем это в try-catch. На локальном компьютере папка создастся, а на Vercel — нет (и это нормально).
try {
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
  if (!fs.existsSync('uploads/plan.svg')) {
    fs.writeFileSync('uploads/plan.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000"><rect width="1000" height="1000" fill="#f0f0f0"/><rect x="100" y="100" width="800" height="800" fill="none" stroke="#333" stroke-width="5"/><text x="20" y="40" font-size="30">DEMO PLAN</text></svg>`);
  }
} catch (error) {
  console.log("File system is read-only, skipping uploads folder creation.");
}

// Раздаем статические файлы из папки uploads (если она есть)
app.use('/uploads', express.static('uploads'));

// API: Кампусы
app.get('/api/campuses', (req, res) => res.json(db.prepare('SELECT * FROM campus').all()));
app.get('/api/venues', (req, res) => res.json(db.prepare('SELECT * FROM venue').all()));
app.get('/api/floors', (req, res) => res.json(db.prepare('SELECT * FROM floor').all()));

// API: Точки на этаже
app.get('/api/floor/:id/points', (req, res) => {
  try {
    db.prepare('INSERT INTO event_log (type, point_id) VALUES (?,?)').run('floor_view', req.params.id);
  } catch (e) { console.log('Stats error', e) }
  res.json({
    points: db.prepare('SELECT * FROM point WHERE floor_id=?').all(req.params.id),
    edges: db.prepare('SELECT * FROM edge').all(),
    panoramas: db.prepare('SELECT * FROM panorama').all()
  });
});

// API: Панорама
app.get('/api/point/:id/panorama', (req, res) => {
  const p = db.prepare('SELECT * FROM panorama WHERE point_id=?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'no pano' });
  const hotspots = db.prepare(`
    SELECT h.*, p.image_url as target_url FROM hotspot h 
    JOIN panorama p ON p.id = h.target_panorama_id WHERE h.panorama_id = ?
  `).all(p.id);
  res.json({ ...p, hotspots });
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

app.get('/api/route', (req, res) => {
  const edges = db.prepare('SELECT * FROM edge').all();
  const path = aStar(+req.query.from, +req.query.to, edges);
  if (!path) return res.status(404).json({ error: 'no path' });
  res.json({ path: path.map(id => db.prepare('SELECT * FROM point WHERE id=?').get(id)) });
});

// API: Статистика
app.get('/api/stats', (req, res) => {
  res.json({
    total: db.prepare('SELECT COUNT(*) as c FROM event_log').get().c,
    byPoint: db.prepare('SELECT p.name, COUNT(e.id) as views FROM event_log e JOIN point p ON p.id=e.point_id WHERE e.point_id IS NOT NULL GROUP BY e.point_id').all()
  });
});

// ЭКСПОРТ ДЛЯ VERCEL (вместо app.listen)
export default app;