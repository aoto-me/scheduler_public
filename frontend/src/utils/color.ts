/**
 * HEXカラーコードをRGBA形式の文字列に変換する
 * @param hex - HEX形式のカラーコード（"#ffffff" or "#fff"）
 * @param alpha - アルファ値（0〜1）。省略時には1
 * @returns RGBA形式の文字列（"rgba(255, 255, 255, 0.5)"）
 */
export const convertHexToRgba = (hex: string, alpha = 1) => {
  // 3桁の場合は6桁に変換
  const normalizedHex = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  // 正しい6桁形式かチェックして色を分解
  const regex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
  const match = regex.exec(normalizedHex);
  if (!match) throw new Error(`Invalid hex color format: ${hex}`);
  const [, r, g, b] = match.map(value => Number.parseInt(value, 16)); // 16進数から10進数に変換
  return `rgba(${String(r)}, ${String(g)}, ${String(b)}, ${String(alpha)})`;
};

/**
 * HEXカラーコードをRGB形式のオブジェクトに変換する
 * @param hex - HEX形式のカラーコード（"#ffffff"）
 * @returns { r: number, g: number, b: number } - RGB値のオブジェクト
 */
export const convertHexToRgb = (hex: string) => {
  const regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
  const match = regex.exec(hex);
  if (!match) throw new Error('Invalid HEX color');
  return {
    b: Number.parseInt(match[3], 16),
    g: Number.parseInt(match[2], 16),
    r: Number.parseInt(match[1], 16),
  };
};

const toHex = (x: number) => x.toString(16).padStart(2, '0');
/**
 * RGB値をHEXカラーコードに変換する
 * @param r - number, 赤の値（0〜255）
 * @param g - number, 緑の値（0〜255）
 * @param b - number, 青の値（0〜255）
 * @returns HEX形式のカラーコード（"#ffffff"）
 */
export const convertRgbToHex = (r: number, g: number, b: number) => {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};
