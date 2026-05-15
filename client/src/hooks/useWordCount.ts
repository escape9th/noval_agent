import { useMemo } from 'react';

export function useWordCount(text: string) {
  return useMemo(() => {
    if (!text) return { chars: 0, words: 0 };
    // For Chinese: count characters (excluding spaces and punctuation for "words")
    const chars = text.replace(/\s/g, '').length;
    // Rough word count: Chinese chars + English words
    const chineseChars = (text.match(/[一-鿿]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return { chars, words: chineseChars + englishWords };
  }, [text]);
}
