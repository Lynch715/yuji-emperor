import { textParagraphs } from '../core/text.js';
import { esc } from './common.js';
export function memorialParagraphHTML(text){return textParagraphs(text).map(p=>'<p>'+esc(p)+'</p>').join('');}
export function memorialAuthor(m,fallbackPost=''){
 const name=String(m.from||'').trim(),post=m.fromPost??fallbackPost;
 if(!name||['通政司','兵部'].includes(name))return (name||'原折')+'转呈（原折未留署名）';
 return [post,name,m.fromRole||'上奏'].filter(Boolean).join('　');
}
export function memorialSignature(m,fallbackPost=''){
 if(!m.from||['通政司','兵部'].includes(m.from))return '原折未留署名';
 return [m.fromPost??fallbackPost,m.from,m.fromRole==='转奏'?'谨转奏':'谨奏'].filter(Boolean).join('　');
}
