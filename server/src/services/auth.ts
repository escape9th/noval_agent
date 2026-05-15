import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from './db';
import { initializePresetStyles } from './ai/styleEngine';

const JWT_SECRET = process.env.JWT_SECRET || 'novel-agent-local-secret-key';

export function register(username: string, password: string) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) throw new Error('用户名已存在');

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
  const userId = result.lastInsertRowid as number;

  // Create default settings and preset styles
  db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(userId);
  initializePresetStyles(userId);

  const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '30d' });
  return { token, user: { id: userId, username, created_at: new Date().toISOString() } };
}

export function login(username: string, password: string) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user) throw new Error('用户名或密码错误');

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) throw new Error('用户名或密码错误');

  const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: '30d' });
  return { token, user: { id: user.id, username: user.username, created_at: user.created_at } };
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
}
