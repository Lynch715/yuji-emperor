export const TEXT_LIMITS={talk:8000,decree:8000,remark:2000};
export function textParagraphs(text){return String(text||'').replace(/\r\n?/g,'\n').split(/\n+/).map(p=>p.trim()).filter(Boolean);}
export function talkPeople(action){return [...new Set(action?.persons||[action?.person].filter(Boolean))];}
export function talkMode(line,structured=false){
 if(structured)return '议事';
 const text=String(line).split(/[。！？；\n]/).filter(t=>!/(不必|不要|无需|无须|不得|不可|勿|毋|未曾)/.test(t)).join('。');
 if(/威吓|问罪|严惩|朕要斩|朕要杀/.test(text))return '威吓';
 if(/试探|暗查|打探.*秘密|查.*底细/.test(text))return '试探';
 if(/说服|劝服|劝说|再考虑|请.*答应|请.*应允|愿不愿|肯不肯/.test(text))return '说服';
 if(/(?:拨|挪|转|赏|借|给).{0,12}[0-9一二三四五六七八九十百千万亿两]+.{0,3}(?:两|银)/.test(text))return '拨款';
 return '闲谈';
}
