import { useEffect, useState } from 'react';
import type { Category, Clothing } from '@clozy/domain';
import type { ClozyService } from '@clozy/application';
import { previewColor, previewAsset } from './PreviewWardrobe';

const tone: Record<Category, string> = {
  'トップス': '#f2e8d9', 'ボトムス': '#aa9987', 'アウター': '#9a876f',
  'ワンピース': '#c6b39d', 'シューズ': '#e9ddca', 'バッグ': '#835d42',
  'アクセサリー': '#c2a57c', 'その他': '#dad0c1'
};
/** Distinct, simple clothing silhouettes: visible even before a photo is added. */
export function GarmentArt({ category, small = false, fabricColor }: { category: Category; small?: boolean; fabricColor?: string }) {
  return <svg className={'garment-art' + (small ? ' garment-art-small' : '')} viewBox="0 0 100 112" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={'fabric-' + category} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".46" />
        <stop offset=".46" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#332414" stopOpacity=".18" />
      </linearGradient>
    </defs>
    <g fill={fabricColor ?? tone[category]} stroke="#5d4c3d" strokeOpacity=".36" strokeWidth="1.2" strokeLinejoin="round">
      {category === 'トップス' && <><path d="M32 13 41 9q9 9 18 0l9 4 19 18-13 17-9-7 3 62H32l3-62-9 7-13-17Z" /><path d="M41 9q9 18 18 0M34 41l2 56M66 41l-2 56" fill="none" /></>}
      {category === 'ボトムス' && <><path d="M29 10h42l-1 23 9 67H57l-7-54-7 54H21l9-67Z" /><path d="M31 17h38M50 18v28" fill="none" /></>}
      {category === 'アウター' && <><path d="m29 11 12-3 9 12 9-12 12 3 16 24-12 14-8-10 6 64H27l6-64-8 10-12-14Z" /><path d="m41 8 9 12 9-12M50 20v83M39 43l-8 19M62 43l8 19" fill="none" /><circle cx="54" cy="44" r="1.5" fill="#7b5635"/><circle cx="54" cy="60" r="1.5" fill="#7b5635"/></>}
      {category === 'ワンピース' && <><path d="m34 13 9-5q7 10 14 0l9 5 17 22-13 14-8-7-3 14 20 47H21l20-47-3-14-8 7-13-14Z" /><path d="M41 56h18M43 8q7 17 14 0" fill="none" /></>}
      {category === 'シューズ' && <><path d="M10 60q9-6 23-4l12 15 18 4q7 3 8 14v8H8q-8-15 2-37Z"/><path d="M46 54q9-7 22-4l11 15 14 5q8 4 8 14v8H71M15 86h53M52 79h36" fill="none"/></>}
      {category === 'バッグ' && <><rect x="18" y="36" width="64" height="64" rx="6"/><path d="M35 38V27q0-18 15-18t15 18v11M18 55h64M46 56v12h8V56" fill="none"/></>}
      {category === 'アクセサリー' && <><ellipse cx="50" cy="55" rx="27" ry="35" fill="none" strokeWidth="5"/><circle cx="50" cy="18" r="12"/><path d="M32 87q18 22 36 0" fill="none"/></>}
      {category === 'その他' && <><rect x="18" y="33" width="64" height="65" rx="4"/><path d="M18 53h64M33 33V18h34v15M42 68h16" fill="none"/></>}
    </g>
  </svg>;
}
export function GarmentThumb({ item, service, className = '' }: { item: Clothing; service: ClozyService; className?: string }) {
  const [url, setUrl] = useState<string>();
  const [assetFailed, setAssetFailed] = useState(false);
  const asset = !item.imageId && !assetFailed ? previewAsset(item) : undefined;
  useEffect(() => setAssetFailed(false), [item.id]);
  useEffect(() => {
    if (!item.imageId) { setUrl(undefined); return; }
    setUrl(undefined);
    let active = true, objectUrl: string | undefined;
    void service.image(item.id).then(blob => {
      if (active && blob) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); }
    }).catch(() => { if (active) setUrl(undefined); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [item.id, item.imageId, item.updatedAt, service]);
  return <span className={'garment-thumb ' + className + (asset ? ' has-preview-photo' : '')}>
    {url ? <img src={url} alt="" loading="lazy" onError={() => setUrl(undefined)} />  : asset ? <span className="preview-garment-photo" aria-hidden="true" style={{ backgroundImage: `url("${asset.src}")`, backgroundPosition: `${(asset.cell % 3) * 50}% ${Math.floor(asset.cell / 3) * 50}%` }}><img src={asset.src} alt="" onError={() => setAssetFailed(true)} className="preview-asset-probe" /></span> : <GarmentArt category={item.category} fabricColor={previewColor(item.id)} />}
  </span>;
}
