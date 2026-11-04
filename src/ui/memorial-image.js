import { memorialReviewDate } from '../core/memorial-records.js';

export function wrapMemorialText(text, width, measure) {
  return String(text).split('\n').flatMap(paragraph => {
    const lines = []; let line = '';
    for (const ch of Array.from(paragraph)) {
      if (line && measure(line + ch) > width) {
        const chars=Array.from(line); let tail='';
        const close=/^[，。；：！？、）》」』】…,.!?;:]/, open=/[（《「『【(]$/;
        if(close.test(ch)||open.test(line)) {
          do {tail=chars.pop()+tail;} while(chars.length>1&&(close.test(tail)||open.test(chars.join(''))));
        }
        if(!chars.length||measure(tail+ch)>width){lines.push(line);line=ch;}
        else {lines.push(chars.join(''));line=tail+ch;}
      } else line += ch;
    }
    return [...lines, line];
  });
}

// Layout is independent of canvas so full text, long titles and page breaks
// can be checked without relying on a browser's image encoder.
export function memorialImageLayout(record, measure) {
  const pages = []; let runs = [], y = 222;
  const finish = () => { pages.push({runs, height:Math.max(1280, y + 150)}); runs = []; y = 222; };
  const add = (text, size, line, tone = 'ink', brush = false) => {
    for (const textLine of wrapMemorialText(text, 912, t => measure(t, size, brush))) {
      if (y + line > 7300) finish();
      runs.push({text:textLine, size, y, tone, brush}); y += line;
    }
  };
  add(record.title, 46, 70);
  add([record.dynasty,record.emperor].filter(Boolean).join(' · '), 28, 48, 'soft');
  add([record.from && '上奏 '+record.from, record.type].filter(Boolean).join(' · '), 28, 48, 'soft');
  y += 28;
  add(record.text || '旧卷未留存奏折全文。', 32, 54, record.text ? 'ink' : 'soft');
  y += 38;
  add('御批', 28, 52, 'red');
  add(record.decision, 38, 64, 'red');
  if (record.consequence) add(record.consequence, 28, 48, 'soft');
  if (record.remark) { y += 28; add(record.remark, 52, 82, 'red', true); }
  if (record.legacy) { y += 20; add('旧折摘录 · 据起居注留存', 26, 42, 'soft'); }
  finish();
  return pages;
}

export async function createMemorialImages(record) {
  await document.fonts?.ready;
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('此浏览器暂时无法生成图片，请换一个浏览器试试。');
  const font = (size, brush) => size + 'px ' + (brush ? '"Ma Shan Zheng","Kaiti SC",STKaiti,serif' : '"Noto Serif SC","Songti SC",SimSun,serif');
  const pages = memorialImageLayout(record, (text,size,brush) => { ctx.font = font(size,brush); return ctx.measureText(text).width; });
  const style = getComputedStyle(document.documentElement);
  const colors = {paper:style.getPropertyValue('--paper').trim(), ink:style.getPropertyValue('--ink').trim(),
    soft:style.getPropertyValue('--ink-muted').trim(), red:style.getPropertyValue('--cinnabar-ink').trim(),
    gold:style.getPropertyValue('--gold').trim()};
  const images = [];
  for (const [i,page] of pages.entries()) {
    canvas.width = 1080; canvas.height = page.height;
    ctx.fillStyle = colors.paper; ctx.fillRect(0,0,1080,page.height);
    ctx.strokeStyle = colors.gold; ctx.lineWidth = 2; ctx.strokeRect(40,40,1000,page.height-80);
    ctx.fillStyle = colors.red; ctx.font = font(30,false);
    ctx.fillText('御 极  ·  御 批 档 案' + (i ? '  ·  续' : ''),84,108);
    ctx.fillStyle = colors.soft; ctx.font = font(24,false);
    // Exact date is retained; long dynasty/emperor names wrap with the body.
    ctx.fillText(memorialReviewDate(record) + (record.slot ? ' · '+record.slot+'间' : ''),84,162);
    for (const r of page.runs) { ctx.fillStyle = colors[r.tone]; ctx.font = font(r.size,r.brush); ctx.fillText(r.text,84,r.y); }
    ctx.strokeStyle = colors.gold; ctx.beginPath(); ctx.moveTo(84,page.height-112); ctx.lineTo(996,page.height-112); ctx.stroke();
    ctx.fillStyle = colors.soft; ctx.font = font(24,false);
    ctx.fillText('御极 · 皇帝模拟器',84,page.height-70);
    ctx.textAlign = 'right'; ctx.fillText((pages.length>1?(i+1)+' / '+pages.length+' · ':'')+'亲批留档',996,page.height-70); ctx.textAlign = 'left';
    const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/png'));
    if (!blob) throw new Error('图片没能生成，请重试。');
    images.push({blob, width:canvas.width, height:canvas.height});
  }
  return images;
}
