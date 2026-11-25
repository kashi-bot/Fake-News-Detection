import { createWorker } from 'tesseract.js';
import { ApiError } from '../../utils/ApiError';

export interface OcrResult {
  text: string;
  confidence: number;   // 0..1
  language: string;
  lowConfidence: boolean;
}

const LANG_MAP: Record<string, string> = { en: 'eng', hi: 'hin' };

export async function runOcr(buffer: Buffer, language = 'en'): Promise<OcrResult> {
  const lang = LANG_MAP[language] ?? 'eng';
  let worker;
  try {
    worker = await createWorker(lang);
    const { data } = await worker.recognize(buffer);
    const confidence = (data.confidence ?? 0) / 100;
    const text = (data.text ?? '').replace(/\n{3,}/g, '\n\n').trim();

    if (!text || text.length < 10) {
      throw new ApiError(422, 'OCR_EMPTY', 'No readable text was found in that image.');
    }
    return { text, confidence, language, lowConfidence: confidence < 0.75 };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, 'OCR_FAILED', 'Text extraction from the image failed.');
  } finally {
    await worker?.terminate().catch(() => {});
  }
}