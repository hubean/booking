import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as path from 'path'
import * as schema from './schema'
import { seed } from './seed'

const BetterSqlite3 = require('better-sqlite3')
// __dirname 指向 server/dist/db，向上两级再拼 server/data
const dbPath = path.resolve(__dirname, '../../data/appointment.db')
const sqliteDb = new BetterSqlite3(dbPath)
export const db = drizzle(sqliteDb, { schema })

// 初始化表和种子数据
export async function initDb() {
  // 创建表
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'beauty',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL REFERENCES services(id),
      service_name TEXT NOT NULL,
      service_price INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS time_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL REFERENCES services(id),
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      max_capacity INTEGER NOT NULL DEFAULT 1,
      booked_count INTEGER NOT NULL DEFAULT 0
    );
  `)

  // 执行种子数据
  await seed(db)
}
