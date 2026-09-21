export function normalizeOcrError(raw?: string): string {
  const msg = (raw ?? '').trim();
  if (!msg) return 'OCR failed. Please try again or check your AI provider configuration.';

  const lower = msg.toLowerCase();
  if (lower.includes('does not support image') || lower.includes('model does not support') || lower.includes('image input')) {
    return 'OCR failed: the selected AI model does not support image input. Configure a vision-capable model (e.g. GPT-4o or Gemini 1.5 Pro) in Settings, or switch AI provider.';
  }
  if (lower.includes('no ocr provider') || lower.includes('api key')) {
    return 'OCR is not configured. Add an OPENAI_API_KEY or GEMINI_API_KEY in Settings to enable AI extraction.';
  }
  if (lower.includes('rate limit') || lower.includes('429')) {
    return 'AI provider rate limit reached. Please wait a moment and try again.';
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'OCR timed out. The image may be too large — try a smaller file or clearer scan.';
  }
  if (lower.includes('invalid') || lower.includes('unauthorized') || lower.includes('401')) {
    return 'AI provider authentication failed. Check your API key in Settings.';
  }
  return msg;
}
