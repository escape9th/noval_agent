import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDb } from '../services/db';

const router = Router();

// List projects
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const projects = db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC').all(req.userId);
  res.json({ success: true, data: projects });
});

// Get single project
router.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!project) return res.status(404).json({ success: false, error: '项目不存在' });
  res.json({ success: true, data: project });
});

// Create project
router.post('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { title, description, genre, setting, characters, outline } = req.body;
  if (!title) return res.status(400).json({ success: false, error: '项目标题不能为空' });

  const result = db.prepare(`
    INSERT INTO projects (user_id, title, description, genre, setting, characters, outline)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId, title, description || '', genre || '',
    typeof setting === 'object' ? JSON.stringify(setting) : (setting || '{}'),
    typeof characters === 'object' ? JSON.stringify(characters) : (characters || '[]'),
    outline || ''
  );

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: project });
});

// Update project
router.put('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ success: false, error: '项目不存在' });

  const { title, description, genre, setting, characters, outline } = req.body;
  db.prepare(`
    UPDATE projects SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      genre = COALESCE(?, genre),
      setting = COALESCE(?, setting),
      characters = COALESCE(?, characters),
      outline = COALESCE(?, outline),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(
    title, description, genre,
    typeof setting === 'object' ? JSON.stringify(setting) : setting,
    typeof characters === 'object' ? JSON.stringify(characters) : characters,
    outline, req.params.id, req.userId
  );

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: project });
});

// Delete project
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ success: false, error: '项目不存在' });
  res.json({ success: true });
});

export default router;
