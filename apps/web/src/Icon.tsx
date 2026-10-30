import type { ReactNode } from 'react';

export type IconName = 'home' | 'hanger' | 'calendar' | 'chart' | 'settings' | 'plus' | 'heart' | 'search' | 'arrow' | 'left' | 'right' | 'download' | 'upload' | 'shield' | 'trash' | 'edit' | 'close' | 'check' | 'sparkles' | 'image' | 'menu' | 'sun';
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
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></>
};
export default function Icon({ name, size = 20, fill = 'none' }: { name: IconName; size?: number; fill?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}
