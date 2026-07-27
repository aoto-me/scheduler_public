import * as Icons from '@remixicon/react';

const extensions = {
  css: 'RiCss3Fill',
  doc: 'RiFileWordLine',
  docm: 'RiFileWordLine',
  docx: 'RiFileWordLine',
  dot: 'RiFileWordLine',
  html: 'RiHtml5Line',
  js: 'RiJavascriptLine',
  jsx: 'RiReactjsFill',
  mp3: 'RiFileMusicLine',
  mp4: 'RiFileVideoLine',
  pdf: 'RiFilePdf2Line',
  php: 'RiPhpLine',
  potx: 'RiFilePptLine',
  ppt: 'RiFilePptLine',
  pptm: 'RiFilePptLine',
  pptx: 'RiFilePptLine',
  sql: 'RiDatabase2Line',
  tsx: 'RiReactjsFill',
  txt: 'RiFileTextLine',
  webm: 'RiFileVideoLine',
  xls: 'RiFileExcelLine',
  xlsm: 'RiFileExcelLine',
  xlsx: 'RiFileExcelLine',
  zip: 'RiFolderZipLine',
} as const;

export const getExtensionIcon = (key: string): keyof typeof Icons | undefined =>
  extensions[key as keyof typeof extensions];
