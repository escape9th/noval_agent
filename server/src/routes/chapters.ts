import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDb } from '../services/db';

const router = Router();

// List chapters for a project
router.get('/project/:projectId', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const chapters = db.prepare(`
    SELECT c.* FROM chapters c
    JOIN projects p ON c.project_id = p.id
    WHERE c.project_id = ? AND p.user_id = ?
    ORDER BY c.sort_order ASC
  `).all(req.params.projectId, req.userId);
  res.json({ success: true, data: chapters });
});

// Get single chapter
router.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const chapter = db.prepare(`
    SELECT c.* FROM chapters c
    JOIN projects p ON c.project_id = p.id
    WHERE c.id = ? AND p.user_id = ?
  `).get(req.params.id, req.userId);
  if (!chapter) return res.status(404).json({ success: false, error: '章节不存在' });
  res.json({ success: true, data: chapter });
});

// Create chapter
router.post('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { project_id, title, content, chapter_outline } = req.body;
  if (!project_id || !title) {
    return res.status(400).json({ success: false, error: '项目ID和标题不能为空' });
  }

  // Verify project ownership
  const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(project_id, req.userId);
  if (!project) return res.status(404).json({ success: false, error: '项目不存在' });

  // Get max sort order
  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM chapters WHERE project_id = ?').get(project_id) as any;
  const sortOrder = (maxOrder?.max || 0) + 1;

  const result = db.prepare(`
    INSERT INTO chapters (project_id, title, content, chapter_outline, sort_order, word_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(project_id, title, content || '', chapter_outline || '', sortOrder, (content || '').length);

  const chapter = db.prepare('SELECT * FROM chapters WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: chapter });
});

// Update chapter
router.put('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const chapter = db.prepare(`
    SELECT c.* FROM chapters c
    JOIN projects p ON c.project_id = p.id
    WHERE c.id = ? AND p.user_id = ?
  `).get(req.params.id, req.userId) as any;
  if (!chapter) return res.status(404).json({ success: false, error: '章节不存在' });

  const { title, content, chapter_outline, sort_order, status } = req.body;
  const wordCount = content !== undefined ? content.length : chapter.word_count;

  db.prepare(`
    UPDATE chapters SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      chapter_outline = COALESCE(?, chapter_outline),
      sort_order = COALESCE(?, sort_order),
      status = COALESCE(?, status),
      word_count = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, content, chapter_outline, sort_order, status, wordCount, req.params.id);

  // Update project updated_at
  db.prepare('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(chapter.project_id);

  const updated = db.prepare('SELECT * FROM chapters WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

// Delete chapter
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const chapter = db.prepare(`
    SELECT c.id FROM chapters c
    JOIN projects p ON c.project_id = p.id
    WHERE c.id = ? AND p.user_id = ?
  `).get(req.params.id, req.userId);
  if (!chapter) return res.status(404).json({ success: false, error: '章节不存在' });

  db.prepare('DELETE FROM chapters WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Reorder chapters
router.post('/reorder', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { orders } = req.body; // [{ id, sort_order }]
  if (!Array.isArray(orders)) return res.status(400).json({ success: false, error: '参数错误' });

  const stmt = db.prepare('UPDATE chapters SET sort_order = ? WHERE id = ?');
  const transaction = db.transaction(() => {
    for (const item of orders) {
      stmt.run(item.sort_order, item.id);
    }
  });
  transaction();

  res.json({ success: true });
});

export default router;
