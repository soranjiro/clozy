import type { ReactNode } from 'react';

export type IconName = 'home' | 'hanger' | 'calendar' | 'chart' | 'settings' | 'plus' | 'heart' | 'search' | 'arrow' | 'left' | 'right' | 'download' | 'upload' | 'shield' | 'trash' | 'edit' | 'close' | 'check' | 'sparkles' | 'image' | 'menu' | 'sun' | 'shirt' | 'pants' | 'coat' | 'dress' | 'bag' | 'shoe' | 'cloud' | 'user' | 'lock' | 'box' | 'flower' | 'leaf' | 'snowflake' | 'grid' | 'list' | 'camera' | 'bell';
const shapes: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></>,
  hanger: <><path d="M9 6a3 3 0 0 1 6 0c0 1.5-1 2.1-3 3.3V11l9 6a2 2 0 0 1-1 3H4a2 2 0 0 1-1-3l9-6" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 18h3" /></>,
  chart: <><path d="M4 20V10m5 10V4m5 16v-7m5 7V8M2 20h20" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m20 12 2-1-2-4-2 1-2-2 1-2-4-2-1 2h-2L9 2 5 4l1 2-2 2-2-1-2 4 2 1v2l-2 1 2 4 2-1 2 2-1 2 4 2 1-2h2l1 2 4-2-1-2 2-2 2 1 2-4-2-1z" transform="translate(2 1) scale(.83)" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  heart: <path d="M20.8 8.6c0 5-8.8 10.6-8.8 10.6S3.2 13.6 3.2 8.6A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8.8 1.6z" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  arrow: <path d="M4 12h16m-7-7 7 7-7 7" />,
  left: <path d="m15 18-6-6 6-6" />,
  right: <path d="m9 18 6-6-6-6" />,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></>,
  upload: <><path d="M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4" /></>,
  shield: <><path d="m12 2 9 4v6c0 5-3.5 8-9 10-5.5-2-9-5-9-10V6z" /><path d="m8 12 3 3 5-6" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3m-9 0 1 14h10l1-14M10 11v6m4-6v6" /></>,
  edit: <><path d="M4 20h16M5 16 16 5l3 3L8 19l-4 1zM15 6l3 3" /></>,
  close: <path d="M5 5 19 19M19 5 5 19" />,
  check: <path d="m4 12 5 5L20 6" />,
  sparkles: <><path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m3 17 6-6 4 4 3-3 5 5" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  shirt: <path d="m8 3 4 3 4-3 4 4 2 5-5 2-1-3v10H8V11l-1 3-5-2 2-5z" />,
  pants: <path d="M6 3h12l-1 18h-5l-1-10-1 10H5zM6 7h12"/>,
  coat: <><path d="M8 2 4 5 2 12l4 2 1-3v10h10V11l1 3 4-2-2-7-4-3-4 4z"/><path d="M12 6v15M9 9l2 3M15 9l-2 3"/></>,
  dress: <path d="m8 2 4 3 4-3 3 5-3 3 1 4 4 7H3l4-7 1-4-3-3zM8 13h8"/>,
  bag: <><rect x="4" y="8" width="16" height="13" rx="2"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></>,
  shoe: <path d="M4 7c3-2 5 3 8 5l8 3v5H2v-5zM8 17h10"/>,
  cloud: <path d="M6 19a5 5 0 1 1 1-9.9A7 7 0 0 1 21 12a4 4 0 0 1-2 7z"/>,
  user: <><circle cx="12" cy="7.5" r="4"/><path d="M4 21v-2c0-7 16-7 16 0v2"/></>,
  lock: <><rect x="4" y="10" width="16" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3M12 15v3"/></>,
  box: <><path d="M4 7 12 3l8 4v12l-8 4-8-4zM4 7l8 5 8-5M12 12v11"/></>,
  flower: <><circle cx="12" cy="12" r="2"/><path d="M12 10c-4-10 4-10 2 0 9-5 11 4 1 3 5 9-4 11-3 2-9 6-12-3-3-3-7-8 0-12 3-2"/></>,
  leaf: <path d="M20 3Q3 4 4 17q11 8 16-14ZM4 20q7-11 15-15"/>,
  snowflake: <path d="M12 2v20M3 7l18 10M3 17 21 7M9 5l3 3 3-3M9 19l3-3 3 3M2 12h20"/>,
  grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  list: <path d="M8 5h13M8 12h13M8 19h13M3 5h1M3 12h1M3 19h1"/>,
  camera: <><path d="M3 7h5l2-3h5l2 3h4v14H3z"/><circle cx="12" cy="14" r="4"/></>,
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 10h18c0-2-3-3-3-10ZM10 21h4"/>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></>
};
export default function Icon({ name, size = 20, fill = 'none' }: { name: IconName; size?: number; fill?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}
