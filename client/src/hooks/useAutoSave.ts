import { useEffect, useRef, useCallback, useState } from 'react';

export function useAutoSave(
  content: string,
  onSave: (content: string) => Promise<void>,
  delay: number = 1000
) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedRef = useRef<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const save = useCallback(async (text: string) => {
    if (text === lastSavedRef.current) return;
    setIsSaving(true);
    try {
      await onSave(text);
      lastSavedRef.current = text;
      setLastSaved(new Date());
    } catch (e) {
      console.error('Auto-save failed:', e);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(content), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, delay, save]);

  return { isSaving, lastSaved };
}
