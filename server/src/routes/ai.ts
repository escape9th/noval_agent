import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { streamAgentResponse, AgentContext } from '../services/ai/agent';
import { getDb } from '../services/db';

const router = Router();

// Stream chat with AI agent
router.post('/chat', async (req: AuthRequest, res: Response) => {
  const { project_id, chapter_id, message, mode, style_id } = req.body;

  if (!project_id || !message) {
    return res.status(400).json({ success: false, error: '项目ID和消息不能为空' });
  }

  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const ctx: AgentContext = {
    userId: req.userId!,
    projectId: project_id,
    chapterId: chapter_id,
    mode: mode || 'auto',
    styleId: style_id,
    userMessage: message,
  };

  try {
    for await (const { chunk, result } of streamAgentResponse(ctx)) {
      if (result) {
        res.write(`data: ${JSON.stringify({ type: 'done', result })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      }
    }
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

// Get chat history for a project
router.get('/history/:projectId', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const limit = parseInt(req.query.limit as string) || 50;
  const chapterId = req.query.chapter_id as string;

  let query = 'SELECT * FROM chat_messages WHERE user_id = ? AND project_id = ?';
  const params: any[] = [req.userId, req.params.projectId];

  if (chapterId) {
    query += ' AND chapter_id = ?';
    params.push(chapterId);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const messages = db.prepare(query).all(...params).reverse();
  res.json({ success: true, data: messages });
});

// Clear chat history
router.delete('/history/:projectId', (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM chat_messages WHERE user_id = ? AND project_id = ?').run(req.userId, req.params.projectId);
  res.json({ success: true });
});

export default router;
