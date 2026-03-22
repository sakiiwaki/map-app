/**
 * 各特徴のキーワードルール定義
 *
 * positive: テキストに含まれると「あり」と判定するパターン
 * negative: テキストに含まれると「なし」と判定するパターン（否定語 + キーワード）
 */
export type FeatureRule = {
    positive: RegExp[];
    negative: RegExp[];
};
export declare const FEATURE_RULES: Record<string, FeatureRule>;
