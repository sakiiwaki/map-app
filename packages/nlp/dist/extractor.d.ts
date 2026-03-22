export type FeatureExtractionResult = {
    value: boolean | null;
    score: number;
    confidence: number;
    matchedPatterns: string[];
};
export type ExtractionOutput = Record<string, FeatureExtractionResult>;
/**
 * テキストから全特徴を抽出する
 *
 * @param text 解析するテキスト（HTML除去済みを想定）
 * @returns 各 featureKey に対する判定結果
 */
export declare function extractFeatures(text: string): ExtractionOutput;
