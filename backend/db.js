import { createClient } from '@libsql/client/web';

// Подключаемся к облачной базе Turso через переменные окружения Vercel
export const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Инициализация таблиц и тестовых данных
async function initDb() {
  try {
    await db.execute(`
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

    // Проверяем, есть ли данные. Если база пустая — добавляем тестовые.
    const result = await db.execute('SELECT COUNT(*) as c FROM campus');
    if (result.rows[0].c === 0) {
      await db.execute({ sql: 'INSERT INTO campus (name) VALUES (?)', args: ['Кампус'] });
      const cId = (await db.execute('SELECT last_insert_rowid() as id')).rows[0].id;
      
      await db.execute({ sql: 'INSERT INTO venue (campus_id, name) VALUES (?,?)', args: [cId, 'Отель'] });
      const vId = (await db.execute('SELECT last_insert_rowid() as id')).rows[0].id;
      
      await db.execute({ sql: 'INSERT INTO floor (venue_id, level, plan_image_url) VALUES (?,?,?)', args: [vId, 1, '/uploads/plan.svg'] });
      const fId = (await db.execute('SELECT last_insert_rowid() as id')).rows[0].id;
      
      await db.execute({ sql: 'INSERT INTO point (floor_id,x,y,name,description,category) VALUES (?,?,?,?,?,?)', args: [fId, 200, 200, 'Ресепшн', 'Стойка', 'service'] });
      const p1 = (await db.execute('SELECT last_insert_rowid() as id')).rows[0].id;

      await db.execute({ sql: 'INSERT INTO point (floor_id,x,y,name,description,category) VALUES (?,?,?,?,?,?)', args: [fId, 600, 400, 'Ресторан', 'Завтрак', 'food'] });
      const p2 = (await db.execute('SELECT last_insert_rowid() as id')).rows[0].id;
      
      await db.execute({ sql: 'INSERT INTO edge (from_point, to_point) VALUES (?,?)', args: [p1, p2] });
      await db.execute({ sql: 'INSERT INTO panorama (point_id, image_url) VALUES (?,?)', args: [p1, 'https://photo-sphere-viewer.js.org/assets/photo-sphere-viewer.jpg'] });
      const panoId = (await db.execute('SELECT last_insert_rowid() as id')).rows[0].id;
      await db.execute({ sql: 'INSERT INTO hotspot (panorama_id, target_panorama_id, yaw, pitch) VALUES (?,?,?,?)', args: [panoId, panoId, 0, 0] });
    }
  } catch (error) {
    console.error("DB Init Error:", error);
  }
}

initDb();