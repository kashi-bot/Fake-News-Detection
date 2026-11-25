export interface OcrResult {
  text: string;
  confidence: number;
  language: string;
  lowConfidence: boolean;
}

export interface OcrProvider {
  name: string;
  recognize(buffer: Buffer, language: string): Promise<OcrResult>;
}