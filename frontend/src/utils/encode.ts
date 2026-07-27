export const base64Encode = (str: string): string => {
  const bytes = new TextEncoder().encode(str);
  const bin = [...bytes].map(b => String.fromCodePoint(b)).join('');
  return btoa(bin);
};

export const base64Decode = (b64: string): string => {
  const bin = atob(b64);
  const bytes = new Uint8Array(Array.from(bin, (char: string) => char.codePointAt(0)!));
  return new TextDecoder().decode(bytes);
};
