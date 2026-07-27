export const imageExtensions = [
  'xbm',
  'tif',
  'pjp',
  'apng',
  'jpeg',
  'jpg',
  'heif',
  'ico',
  'tiff',
  'webp',
  'svgz',
  'svg',
  'heic',
  'gif',
  'png',
  'bmp',
  'pjpeg',
  'avif',
];

export const thumbExtensions = ['jpeg', 'jpg', 'webp', 'png', 'gif', 'bmp'];

export const videoExtensions = ['ogm', 'wmv', 'mpg', 'webm', 'ogv', 'mov', 'asx', 'mpeg', 'mp4', 'm4v', 'avi'];

export const excludeExtensions = [
  'php',
  'php3',
  'php4',
  'php5',
  'phtml',
  'htaccess',
  'cgi',
  'pl',
  'sh',
  'bat',
  'jsp',
  'asp',
  'aspx',
  'phar',
  'inc',
  'shtml',
  'com',
  'jar',
  'ini',
];

export const viewableExtensions = [
  'mp3',
  'wav',
  'ogg',
  'pdf',
  'txt',
  'xml',
  'json',
  ...imageExtensions,
  ...videoExtensions,
];

export const isVideo = (extension: string): boolean => videoExtensions.includes(extension.toLowerCase());

export const isViewable = (ext: string) => {
  return viewableExtensions.includes(ext.toLowerCase());
};
