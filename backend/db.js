import Database from 'better-sqlite3';
export const db = new Database('db.sqlite');

db.exec(`
CREATE TABLE IF NOT EXISTS campus (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE IF NOT EXISTS venue (id INTEGER PRIMARY KEY, campus_id INTEGER, name TEXT);
CREATE TABLE IF NOT EXISTS floor (id INTEGER PRIMARY KEY, venue_id INTEGER, level INTEGER, plan_image_url TEXT);
CREATE TABLE IF NOT EXISTS point (id INTEGER PRIMARY KEY, floor_id INTEGER, x REAL, y REAL, name TEXT, description TEXT, category TEXT, is_transition INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS panorama (id INTEGER PRIMARY KEY, point_id INTEGER, image_url TEXT);
CREATE TABLE IF NOT EXISTS hotspot (id INTEGER PRIMARY KEY, panorama_id INTEGER, target_panorama_id INTEGER, yaw REAL, pitch REAL);
CREATE TABLE IF NOT EXISTS edge (id INTEGER PRIMARY KEY, from_point INTEGER, to_point INTEGER, weight REAL DEFAULT 1);
CREATE TABLE IF NOT EXISTS event_log (id INTEGER PRIMARY KEY, type TEXT, point_id INTEGER, panorama_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, role TEXT DEFAULT 'organizer');
`);

// Seed (если база пустая)
const count = db.prepare('SELECT COUNT(*) as c FROM campus').get().c;
if (count === 0) {
  const c = db.prepare('INSERT INTO campus (name) VALUES (?)').run('Кампус').lastInsertRowid;
  const v1 = db.prepare('INSERT INTO venue (campus_id, name) VALUES (?,?)').run(c, 'Отель').lastInsertRowid;
  const f1 = db.prepare('INSERT INTO floor (venue_id, level, plan_image_url) VALUES (?,?,?)').run(v1, 1, '/uploads/plan.svg').lastInsertRowid;
  
  const p1 = db.prepare('INSERT INTO point (floor_id,x,y,name,description,category) VALUES (?,?,?,?,?,?)').run(f1, 200, 200, 'Ресепшн', 'Стойка регистрации', 'service').lastInsertRowid;
  const p2 = db.prepare('INSERT INTO point (floor_id,x,y,name,description,category) VALUES (?,?,?,?,?,?)').run(f1, 600, 400, 'Ресторан', 'Завтрак', 'food').lastInsertRowid;
  
  const edge = db.prepare('INSERT INTO edge (from_point, to_point) VALUES (?,?)');
  edge.run(p1, p2);

  // Тестовая панорама (заглушка)
  const pano1 = db.prepare('INSERT INTO panorama (point_id, image_url) VALUES (?,?)').run(p1, 'https://photo-sphere-viewer.js.org/assets/photo-sphere-viewer.jpg').lastInsertRowid;
  db.prepare('INSERT INTO hotspot (panorama_id, target_panorama_id, yaw, pitch) VALUES (?,?,?,?)').run(pano1, pano1, 0, 0);
}