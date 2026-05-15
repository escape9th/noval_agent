import OpenAI from 'openai';
import { getDb } from '../db';
import { buildPlannerPrompt } from './planner';
import { buildWriterPrompt } from './writer';
import { buildEvaluatorPrompt } from './evaluator';
import { buildCheckerPrompt } from './checker';

export interface AgentContext {
  userId: number;
  projectId: number;
  chapterId?: number;
  mode: 'plan' | 'write' | 'auto';
  styleId?: number;
  userMessage: string;
}

export interface AgentResult {
  message: string;
  mode_used: 'plan' | 'write' | 'auto';
  action?: {
    type: 'edit_chapter' | 'create_chapter' | 'update_outline';
    target_id?: number;
    content?: string;
    title?: string;
  };
}

function getClient(userId: number): OpenAI {
  const db = getDb();
  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as any;
  if (!settings?.api_key) throw new Error('请先在设置中配置API Key');

  return new OpenAI({
    apiKey: settings.api_key,
    baseURL: settings.api_base_url || 'https://api.openai.com/v1',
  });
}

function getModel(userId: number): string {
  const db = getDb();
  const settings = db.prepare('SELECT model FROM user_settings WHERE user_id = ?').get(userId) as any;
  return settings?.model || 'gpt-4o';
}

function getProjectContext(userId: number, projectId: number) {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(projectId, userId) as any;
  const chapters = db.prepare('SELECT id, title, chapter_outline, sort_order, status, word_count FROM chapters WHERE project_id = ? ORDER BY sort_order').all(projectId);
  return { project, chapters };
}

function getChapterContent(userId: number, chapterId: number) {
  const db = getDb();
  return db.prepare(`
    SELECT c.* FROM chapters c
    JOIN projects p ON c.project_id = p.id
    WHERE c.id = ? AND p.user_id = ?
  `).get(chapterId, userId);
}

function getStylePrompt(userId: number, styleId?: number): string | null {
  if (!styleId) {
    // Try to get active style
    const db = getDb();
    const settings = db.prepare('SELECT active_style_id FROM user_settings WHERE user_id = ?').get(userId) as any;
    if (!settings?.active_style_id) return null;
    styleId = settings.active_style_id;
  }
  const db = getDb();
  const style = db.prepare('SELECT style_prompt FROM style_profiles WHERE id = ? AND user_id = ?').get(styleId, userId) as any;
  return style?.style_prompt || null;
}

function getRecentChatHistory(userId: number, projectId: number, limit = 10) {
  const db = getDb();
  return db.prepare(`
    SELECT role, content FROM chat_messages
    WHERE user_id = ? AND project_id = ?
    ORDER BY created_at DESC LIMIT ?
  `).all(userId, projectId, limit).reverse();
}

function detectIntent(message: string): 'evaluate' | 'check' | 'plan' | 'write' {
  const evaluateKeywords = ['评价', '点评', '读者视角', '怎么样', '好看吗', '毒点', '降智', '评价一下', '客观评价'];
  const checkKeywords = ['检查', '语病', '错别字', '设定冲突', '人设冲突', '校对', '查错', 'bug'];
  // Only trigger plan mode for explicit planning requests, not general writing
  const planPatterns = ['帮我写.*大纲', '生成.*大纲', '规划.*大纲', '细纲', '章纲', '构思一下', '帮我规划', '世界观设定', '人物设定'];

  const lower = message.toLowerCase();
  if (evaluateKeywords.some(k => lower.includes(k))) return 'evaluate';
  if (checkKeywords.some(k => lower.includes(k))) return 'check';
  if (planPatterns.some(p => new RegExp(p).test(lower))) return 'plan';
  // Default to write — most requests are writing requests
  return 'write';
}

export async function* streamAgentResponse(ctx: AgentContext): AsyncGenerator<{ chunk: string; result?: AgentResult }> {
  const client = getClient(ctx.userId);
  const model = getModel(ctx.userId);
  const { project, chapters } = getProjectContext(ctx.userId, ctx.projectId);
  const stylePrompt = getStylePrompt(ctx.userId, ctx.styleId);
  const chatHistory = getRecentChatHistory(ctx.userId, ctx.projectId);

  // Determine actual mode
  type ExtendedMode = 'plan' | 'write' | 'auto' | 'evaluate' | 'check';
  let effectiveMode: ExtendedMode = ctx.mode;
  if (ctx.mode === 'auto') {
    effectiveMode = detectIntent(ctx.userMessage);
  }

  // Build messages array
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  // System prompt based on mode
  let systemPrompt = '';
  switch (effectiveMode) {
    case 'evaluate':
      systemPrompt = buildEvaluatorPrompt(project, chapters, ctx.chapterId);
      break;
    case 'check':
      systemPrompt = buildCheckerPrompt(project, chapters, ctx.chapterId);
      break;
    case 'plan':
      systemPrompt = buildPlannerPrompt(project, chapters);
      break;
    case 'write':
    default:
      systemPrompt = buildWriterPrompt(project, chapters, ctx.chapterId);
      break;
  }

  if (stylePrompt) {
    systemPrompt += `\n\n## 文风要求\n${stylePrompt}`;
  }

  messages.push({ role: 'system', content: systemPrompt });

  // Add chat history
  for (const msg of chatHistory as any[]) {
    messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
  }

  // Add current chapter content if relevant
  if (ctx.chapterId && (effectiveMode === 'write' || effectiveMode === 'check' || effectiveMode === 'evaluate')) {
    const chapter = getChapterContent(ctx.userId, ctx.chapterId) as any;
    if (chapter?.content) {
      messages.push({
        role: 'system',
        content: `当前章节「${chapter.title}」的内容：\n\n${chapter.content}`
      });
    }
  }

  // Add user message
  messages.push({ role: 'user', content: ctx.userMessage });

  // Save user message to DB (map extended modes to valid DB values)
  const dbMode = (effectiveMode === 'evaluate' || effectiveMode === 'check') ? 'plan' : effectiveMode;
  const db = getDb();
  db.prepare('INSERT INTO chat_messages (user_id, project_id, chapter_id, role, content, mode) VALUES (?, ?, ?, ?, ?, ?)').run(
    ctx.userId, ctx.projectId, ctx.chapterId || null, 'user', ctx.userMessage, dbMode
  );

  // Stream response
  const stream = await client.chat.completions.create({
    model,
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 16384,
  });

  let fullResponse = '';
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullResponse += content;
      yield { chunk: content };
    }
  }

  // Save assistant message
  db.prepare('INSERT INTO chat_messages (user_id, project_id, chapter_id, role, content, mode) VALUES (?, ?, ?, ?, ?, ?)').run(
    ctx.userId, ctx.projectId, ctx.chapterId || null, 'assistant', fullResponse, dbMode
  );

  // Parse action (check all modes, not just write)
  let action: AgentResult['action'] | undefined;
  if (fullResponse.includes('[WRITE_ACTION]')) {
    try {
      const actionMatch = fullResponse.match(/\[WRITE_ACTION\]([\s\S]*?)\[\/WRITE_ACTION\]/);
      if (actionMatch) {
        action = JSON.parse(actionMatch[1].trim());
      }
    } catch {}
  }
  // Also try to parse JSON action blocks from AI response
  if (!action && fullResponse.includes('"type":"create_chapter"')) {
    try {
      const jsonMatch = fullResponse.match(/\{[\s\S]*?"type"\s*:\s*"create_chapter"[\s\S]*?\}/);
      if (jsonMatch) {
        action = JSON.parse(jsonMatch[0]);
      }
    } catch {}
  }

  yield {
    chunk: '',
    result: {
      message: fullResponse,
      mode_used: effectiveMode as any,
      action,
    }
  };
}

// Non-streaming version for simple calls
export async function agentChat(ctx: AgentContext): Promise<AgentResult> {
  let result: AgentResult = { message: '', mode_used: ctx.mode };
  for await (const { chunk, result: r } of streamAgentResponse(ctx)) {
    if (r) result = r;
    else result.message += chunk;
  }
  return result;
}
