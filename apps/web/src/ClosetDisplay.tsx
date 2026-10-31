import type { ReactNode } from 'react';
import type { Clothing } from '@clozy/domain';

const fabrics = ['#e8ded0', '#65717a', '#b49b7e', '#baaaa0', '#8b9385', '#ae8a6f', '#bab0a0', '#85847b'];
function fabricColor(item: Pick<Clothing, 'category' | 'color'>): string {
  const color = item.color.normalize('NFKC').toLowerCase();
  const shades: [RegExp, string][] = [
    [/黒|ブラック|black/, '#3e4140'], [/白|ホワイト|white|アイボリー/, '#eee9df'],
    [/紺|ネイビー|navy/, '#455361'], [/ベージュ|beige|生成/, '#c8b599'],
    [/グレー|灰|grey|gray/, '#96958f'], [/茶|ブラウン|brown/, '#8b6954'],
    [/緑|グリーン|カーキ|green|khaki/, '#858c70'], [/青|ブルー|blue/, '#829ca9'],
    [/赤|レッド|red/, '#a0695d'], [/ピンク|pink/, '#c5a3a0'], [/黄|イエロー|yellow/, '#c6ad73']
  ];
  return shades.find(([pattern]) => pattern.test(color))?.[1] ?? fabrics[['トップス', 'ボトムス', 'アウター', 'ワンピース', 'シューズ', 'バッグ', 'アクセサリー', 'その他'].indexOf(item.category)] ?? fabrics[0]!;
}
// Illustrations are only placeholders, never a claim to reconstruct an uploaded garment.
export function GarmentSilhouette({ item }: { item: Pick<Clothing, 'category' | 'color'> }) {
  let shape: ReactNode;
  switch (item.category) {
    case 'ボトムス':
      shape = <><path d="M48 21h84l7 159-33 3-16-112-16 112-33-3z" /><path d="M48 34h84M90 35v36M58 35l-2 27M122 35l2 27" /><path d="m87 21 3 14 4-14" /></>;
      break;
    case 'アウター':
      shape = <><path d="m62 24-24 8-24 79 25 8 14-44-6 105h86l-6-105 14 44 25-8-24-79-24-8-28 10z" /><path d="m72 24-11 39 19-6 10 20 10-20 19 6-11-39M90 77v103M59 119h19v22H58m44-22h19l1 22h-20" /><path d="M72 24q18 21 36 0" /><circle cx="96" cy="96" r="1.5" /><circle cx="96" cy="116" r="1.5" /><circle cx="96" cy="136" r="1.5" /></>;
      break;
    case 'ワンピース':
      shape = <><path d="m67 23-23 13-13 39 24 10 9-23 4 38-26 77q47 18 96 0l-26-77 4-38 9 23 24-10-13-39-23-13q-23 22-46 0z" /><path d="M68 100h44M77 112l-9 63m35-63 9 63M67 23q23 29 46 0" /></>;
      break;
    case 'シューズ':
      shape = <><path d="m28 111 24-13 18 28 31 13q13 4 12 19H24q-6-29 4-47zm64-13 24-13 18 28 25 13q13 5 12 20h-51q-1-13-19-21z" /><path d="M24 150h88M120 138h49M59 119l11-6m-5 13 13-6m-4 13 13-6M128 106l10-5m-3 12 10-4" /></>;
      break;
    case 'バッグ':
      shape = <><path d="M39 70h102l8 99H31z" /><path d="M64 78V49q0-25 26-25t26 25v29M72 77V49q0-17 18-17t18 17v28M39 93h102" /><rect x="80" y="87" width="20" height="13" rx="2" /></>;
      break;
    case 'アクセサリー':
      shape = <><path d="M54 32q-26 64 36 112 62-48 36-112" fill="none" strokeWidth="5" /><path d="m90 143 15 17-15 20-15-20z" /><circle cx="49" cy="51" r="8" /><circle cx="131" cy="51" r="8" /></>;
      break;
    default:
      shape = <><path d="m63 28-29 13-20 47 28 13 13-27-3 101h76l-3-101 13 27 28-13-20-47-29-13q-27 22-54 0z" /><path d="M63 28q27 35 54 0M57 162h66M35 77l-10-4m120 4 10-4" /><path d="m69 56-5 92m47-92 5 92" opacity=".25" /></>;
  }
  const onShelf = ['シューズ', 'バッグ', 'アクセサリー'].includes(item.category);
  const viewBox = item.category === 'シューズ' ? '10 80 170 80' : item.category === 'バッグ' ? '20 15 140 158' : item.category === 'アクセサリー' ? '30 20 120 165' : '0 20 180 180';
  return <svg className={'garment-silhouette silhouette-' + item.category} viewBox={viewBox} preserveAspectRatio={onShelf ? 'xMidYMax' : 'xMidYMin'} fill={fabricColor(item)} stroke="#342b23" strokeOpacity=".24" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">{shape}</svg>;
}
export function DisplayHanger() {
  return <svg className="display-hanger" viewBox="0 0 160 64" fill="none" aria-hidden="true"><path d="M74 15c-1-10 15-11 15-1 0 6-9 7-9 13v5" stroke="currentColor" strokeWidth="2.4" /><path d="m80 30 65 25c5 2 3 6-2 6H17c-5 0-7-4-2-6z" fill="currentColor" fillOpacity=".13" stroke="currentColor" strokeWidth="2.6" /><path d="m30 53 50-18 50 18" stroke="#f7e2bd" strokeOpacity=".5" /></svg>;
}
export interface ClosetGroup { category: string; count: number; children: ReactNode }
export function ClosetCollection({ children, count, label, preview = false, groups }: { children: ReactNode; count: number; label: string; preview?: boolean; groups?: ClosetGroup[] }) {
  return <section className={'closet-collection ' + (preview ? 'closet-preview' : '')} aria-label={label}>
    <div className="closet-heading"><div><span className="closet-monogram" aria-hidden="true">C.</span><span>THE PRIVATE COLLECTION</span></div><span>{String(count).padStart(2, '0')} <small>PIECES</small></span></div>
    <div className={'closet-cabinet ' + (!count ? 'closet-is-empty' : '')}>{count ? groups ? groups.map(group => <section className="closet-compartment" key={group.category} aria-label={group.category + 'の棚'}><div className="compartment-heading"><h3>{group.category}</h3><span>{String(group.count).padStart(2, '0')} PIECES</span></div><div className="garment-grid wardrobe-grid">{group.children}</div></section>) : <div className="garment-grid wardrobe-grid">{children}</div> : children}</div>
    <div className="closet-plinth" aria-hidden="true"><span>clozy atelier</span><i /><span>CURATED BY YOU</span></div>
  </section>;
}
export function ClosetScene() {
  return <div className="closet-scene" aria-hidden="true"><div className="scene-cornice" /><div className="scene-interior"><div className="scene-hanging"><div className="scene-rail" /><span className="scene-coat"><DisplayHanger /><GarmentSilhouette item={{ category: 'アウター', color: 'ベージュ' }} /></span><span className="scene-dress"><DisplayHanger /><GarmentSilhouette item={{ category: 'ワンピース', color: 'ブラック' }} /></span><span className="scene-shirt"><DisplayHanger /><GarmentSilhouette item={{ category: 'トップス', color: 'アイボリー' }} /></span></div><div className="scene-shelves"><div><span className="folded-linen" /><span className="folded-linen dark" /></div><div><GarmentSilhouette item={{ category: 'バッグ', color: 'ブラウン' }} /></div><div><span className="storage-box" /></div></div></div><div className="scene-drawers"><i /><i /></div><span className="scene-signature">a place for what you love.</span></div>;
}
