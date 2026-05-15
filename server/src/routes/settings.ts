import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDb } from '../services/db';
import OpenAI from 'openai';

const router = Router();

// Get user settings
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.userId);
  res.json({ success: true, data: settings });
});

// Test API connection
router.post('/test', async (req: AuthRequest, res: Response) => {
  const db = getDb();
  let { api_key, api_base_url, model } = req.body;

  // Fall back to saved settings if not provided
  if (!api_key || !api_base_url || !model) {
    const saved = db.prepare('SELECT api_key, api_base_url, model FROM user_settings WHERE user_id = ?').get(req.userId) as any;
    if (saved) {
      api_key = api_key || saved.api_key;
      api_base_url = api_base_url || saved.api_base_url;
      model = model || saved.model;
    }
  }

  if (!api_key) {
    return res.json({ success: false, error: '请先填写 API Key' });
  }

  const client = new OpenAI({
    apiKey: api_key,
    baseURL: api_base_url || 'https://api.openai.com/v1',
  });

  const startTime = Date.now();
  try {
    const completion = await client.chat.completions.create({
      model: model || 'gpt-4o',
      messages: [{ role: 'user', content: 'Say "ok" in one word.' }],
      max_tokens: 10,
    });

    const elapsed = Date.now() - startTime;
    const reply = completion.choices[0]?.message?.content?.trim() || '';
    const usedModel = completion.model || model;

    res.json({
      success: true,
      data: {
        message: `连接成功`,
        model: usedModel,
        reply,
        latency_ms: elapsed,
      },
    });
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    let errorMsg = error.message || '连接失败';

    // Friendly error messages
    if (error.status === 401) {
      errorMsg = 'API Key 无效或已过期';
    } else if (error.status === 403) {
      errorMsg = 'API Key 权限不足，无法访问该模型';
    } else if (error.status === 404) {
      errorMsg = `模型 "${model}" 不存在，请检查模型名称`;
    } else if (error.status === 429) {
      errorMsg = '请求频率过高或余额不足';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorMsg = `无法连接到 ${api_base_url}，请检查地址是否正确`;
    } else if (error.code === 'UND_ERR_CONNECT_TIMEOUT') {
      errorMsg = '连接超时，请检查网络或 API 地址';
    }

    res.json({
      success: false,
      error: errorMsg,
      data: { latency_ms: elapsed },
    });
  }
});

// Update user settings
router.put('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { api_key, api_base_url, model, language, theme, active_style_id } = req.body;

  db.prepare(`
    INSERT INTO user_settings (user_id, api_key, api_base_url, model, language, theme, active_style_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      api_key = COALESCE(?, api_key),
      api_base_url = COALESCE(?, api_base_url),
      model = COALESCE(?, model),
      language = COALESCE(?, language),
      theme = COALESCE(?, theme),
      active_style_id = COALESCE(?, active_style_id)
  `).run(
    req.userId, api_key || '', api_base_url || 'https://api.openai.com/v1',
    model || 'gpt-4o', language || 'zh', theme || 'dark', active_style_id || null,
    api_key, api_base_url, model, language, theme, active_style_id
  );

  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.userId);
  res.json({ success: true, data: settings });
});

export default router;
