/**
 * 指定したパス文字列から、階層ごとの累積パス配列を返す
 * @param path - スラッシュ区切りのパス ('/pathA/pathB/pathC')
 * @returns 各階層のパスを含む配列 (['/pathA', '/pathA/pathB', '/pathA/pathB/pathC'])
 */
export const getPathHierarchy = (path: string): string[] => {
  return path
    .split('/')
    .filter(Boolean)
    .reduce<string[]>((acc, part) => {
      const prev = acc[acc.length - 1] ?? '';
      acc.push(`${prev}/${part}`);
      return acc;
    }, []);
};
