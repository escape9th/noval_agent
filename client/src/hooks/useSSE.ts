import { useState, useCallback, useRef } from 'react';

interface SSEOptions {
  url: string;
  body: any;
  token: string;
  onChunk: (content: string) => void;
  onDone: (result: any) => void;
  onError: (error: string) => void;
}

export function useSSE() {
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (options: SSEOptions) => {
    setIsLoading(true);
    abortRef.current = new AbortController();

    try {
      const response = await fetch(options.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.token}`,
        },
        body: JSON.stringify(options.body),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '请求失败');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'chunk') {
              options.onChunk(parsed.content);
            } else if (parsed.type === 'done') {
              options.onDone(parsed.result);
            } else if (parsed.type === 'error') {
              options.onError(parsed.error);
            }
          } catch {}
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        options.onError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return { send, abort, isLoading };
}
