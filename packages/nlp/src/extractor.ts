import { FEATURE_RULES } from './rules';

export type FeatureExtractionResult = {
  value: boolean | null;
  score: number;      // 0.0 〜 1.0
  confidence: number; // 0.0 〜 1.0
  matchedPatterns: string[];
};

export type ExtractionOutput = Record<string, FeatureExtractionResult>;

/**
 * テキストから全特徴を抽出する
 *
 * @param text 解析するテキスト（HTML除去済みを想定）
 * @returns 各 featureKey に対する判定結果
 */
export function extractFeatures(text: string): ExtractionOutput {
  const normalized = normalizeText(text);
  const output: ExtractionOutput = {};

  for (const [featureKey, rule] of Object.entries(FEATURE_RULES)) {
    output[featureKey] = extractOneFeature(normalized, rule.positive, rule.negative);
  }

  return output;
}

/**
 * 1特徴を判定する
 */
function extractOneFeature(
  text: string,
  positivePatterns: RegExp[],
  negativePatterns: RegExp[],
): FeatureExtractionResult {
  const positiveMatches = positivePatterns.filter((p) => p.test(text));
  const negativeMatches = negativePatterns.filter((p) => p.test(text));

  const matchedPatterns = [
    ...positiveMatches.map((p) => `+${p.source}`),
    ...negativeMatches.map((p) => `-${p.source}`),
  ];

  // マッチなし → 不明
  if (positiveMatches.length === 0 && negativeMatches.length === 0) {
    return { value: null, score: 0.5, confidence: 0.0, matchedPatterns: [] };
  }

  const totalMatches = positiveMatches.length + negativeMatches.length;

  if (negativeMatches.length > 0 && positiveMatches.length === 0) {
    // 否定のみ → なし
    const confidence = Math.min(0.95, 0.6 + negativeMatches.length * 0.1);
    return { value: false, score: 1 - confidence, confidence, matchedPatterns };
  }

  if (positiveMatches.length > 0 && negativeMatches.length === 0) {
    // 肯定のみ → あり
    const confidence = Math.min(0.95, 0.6 + positiveMatches.length * 0.1);
    return { value: true, score: confidence, confidence, matchedPatterns };
  }

  // 両方マッチ → 多数決
  const positiveRatio = positiveMatches.length / totalMatches;
  if (positiveRatio >= 0.5) {
    return { value: true, score: positiveRatio, confidence: positiveRatio * 0.8, matchedPatterns };
  } else {
    return {
      value: false,
      score: 1 - positiveRatio,
      confidence: (1 - positiveRatio) * 0.8,
      matchedPatterns,
    };
  }
}

/**
 * テキストの正規化（全角→半角、小文字化など）
 */
function normalizeText(text: string): string {
  return text
    .normalize('NFKC') // 全角英数字→半角、半角カタカナ→全角
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
