import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDb } from '../services/db';
import OpenAI from 'openai';

const router = Router();

// List style profiles
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const styles = db.prepare('SELECT * FROM style_profiles WHERE user_id = ? ORDER BY type, name').all(req.userId);
  res.json({ success: true, data: styles });
});

// Get single style
router.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const style = db.prepare('SELECT * FROM style_profiles WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!style) return res.status(404).json({ success: false, error: '文风不存在' });
  res.json({ success: true, data: style });
});

// Create custom style
router.post('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { name, type, description, style_prompt, sample_text } = req.body;
  if (!name || !style_prompt) {
    return res.status(400).json({ success: false, error: '名称和风格提示词不能为空' });
  }

  const result = db.prepare(`
    INSERT INTO style_profiles (user_id, name, type, description, style_prompt, sample_text)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.userId, name, type || 'custom', description || '', style_prompt, sample_text || null);

  const style = db.prepare('SELECT * FROM style_profiles WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: style });
});

// Update style
router.put('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM style_profiles WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ success: false, error: '文风不存在' });

  const { name, description, style_prompt, sample_text } = req.body;
  db.prepare(`
    UPDATE style_profiles SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      style_prompt = COALESCE(?, style_prompt),
      sample_text = COALESCE(?, sample_text)
    WHERE id = ? AND user_id = ?
  `).run(name, description, style_prompt, sample_text, req.params.id, req.userId);

  const style = db.prepare('SELECT * FROM style_profiles WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: style });
});

// Delete style
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM style_profiles WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ success: false, error: '文风不存在' });
  res.json({ success: true });
});

// Extract style from sample text
router.post('/extract', async (req: AuthRequest, res: Response) => {
  const { sample_text, name } = req.body;
  if (!sample_text) return res.status(400).json({ success: false, error: '样本文字不能为空' });

  const db = getDb();
  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.userId) as any;
  if (!settings?.api_key) return res.status(400).json({ success: false, error: '请先配置API Key' });

  const client = new OpenAI({
    apiKey: settings.api_key,
    baseURL: settings.api_base_url || 'https://api.openai.com/v1',
  });

  try {
    const response = await client.chat.completions.create({
      model: settings.model || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `你是一个文学风格分析专家。你的任务是深度分析给定文本的写作风格，生成一段详细、可操作的风格提示词（style_prompt），以便AI可以精确模仿该风格写作。

请从以下维度深入分析，并在提示词中给出具体指导：

1. **叙事视角与人称**：第几人称？全知/限知视角？叙述者的语气和态度？
2. **句式特点**：偏好长句还是短句？节奏感如何？是否有标志性的句式结构？
3. **用词风格**：词汇偏向华丽/朴素/古典/现代/口语化？是否有高频词汇或独特的用词习惯？
4. **描写手法**：环境描写的特点（工笔/写意/白描）？心理描写的方式（内心独白/动作暗示）？动作描写的节奏？
5. **对话风格**：对话的比例？对话的语气和节奏？是否有潜台词？
6. **情感表达**：直抒胸臆还是含蓄内敛？是否有独特的情感触发方式？
7. **修辞手法**：常用哪些修辞？比喻的风格？是否有排比、通感等偏好？
8. **结构节奏**：段落长短？叙事节奏（快/慢/张弛有度）？场景切换的方式？
9. **整体氛围与基调**：温暖/冷峻/幽默/沉重/诗意？
10. **标志性特征**：该风格最独特的1-2个特征是什么？

输出要求：生成一段800-1200字的风格提示词，可以直接用作system prompt。要具体、可操作，避免泛泛而谈。`
        },
        {
          role: 'user',
          content: `请深入分析以下文本的写作风格，生成详细的风格提示词：\n\n${sample_text.slice(0, 8000)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const stylePrompt = response.choices[0]?.message?.content || '';

    // Save extracted style
    const result = db.prepare(`
      INSERT INTO style_profiles (user_id, name, type, description, style_prompt, sample_text)
      VALUES (?, ?, 'extracted', ?, ?, ?)
    `).run(req.userId, name || '提取的文风', '从样本文字中提取的写作风格', stylePrompt, sample_text.slice(0, 5000));

    const style = db.prepare('SELECT * FROM style_profiles WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, data: style });
  } catch (error: any) {
    res.status(500).json({ success: false, error: `文风提取失败: ${error.message}` });
  }
});

export default router;
