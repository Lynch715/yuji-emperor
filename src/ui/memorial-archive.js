import { memorialParagraphHTML, memorialAuthor, memorialSignature } from './memorial-document.js';
import { memorialArchive, memorialReviewDate } from '../core/memorial-records.js';
import { esc, openDialog, toast, download } from './common.js';
import { onDialogExit } from './request-scope.js';
import { createMemorialImages } from './memorial-image.js';

export function filterMemorialArchive(records, query='', type='', written=false) {
  const word = query.trim().toLocaleLowerCase();
  return records.filter(r => (!type || r.type===type) && (!written || r.remark.trim()) &&
    (!word || [r.title,r.from,r.text,r.remark,r.decision,r.emperor].join('\n').toLocaleLowerCase().includes(word)));
}
export function memorialArchiveListHTML(records, page=0) {
  if (!records.length) return '<p class="muted">没有找到相应奏折。批阅奏折并起驾后，就会收进这里。</p>';
  return records.slice(page*20,page*20+20).map(r =>
    '<button class="archive-entry" data-archive-record="'+esc(r.id)+'"><strong>'+esc(r.title)+'</strong><small>'+
    esc(memorialReviewDate(r)+' · '+(r.from||'旧折摘录'))+'</small><span>'+esc(r.decision)+'</span>'+
    (r.remark?'<p class="archive-remark-preview">'+esc(r.remark)+'</p>':'')+'</button>').join('');
}
export function memorialArchiveDetailHTML(r) {
  return '<p><button data-archive-back>‹ 返回档案</button></p><article class="paper archive-document"><p class="muted">'+
    esc([r.dynasty,r.emperor,memorialReviewDate(r),r.slot&&r.slot+'间'].filter(Boolean).join(' · '))+'</p><h3>'+esc(r.title)+
    '</h3><p>'+esc([memorialAuthor(r),r.type].filter(Boolean).join(' · '))+'</p><div class="archive-original">'+
    memorialParagraphHTML(r.text||'旧卷未留存奏折全文，以下为起居注中留下的批阅记录。')+'</div><p class="memorial-signature">'+esc(memorialSignature(r))+'</p><section class="archive-verdict"><h4>御批</h4><p>'+esc(r.decision)+
    '</p>'+(r.consequence?'<p>'+esc(r.consequence)+'</p>':'')+(r.remark?'<blockquote class="archive-brush">'+esc(r.remark)+
    '</blockquote>':'<p class="muted">未另写朱批。</p>')+'</section></article><div class="dialog-actions">'+
    '<button class="primary" data-archive-image>生成分享图</button></div><div id="archive-images" aria-live="polite"></div>';
}

export function openMemorialArchive(state) {
  const records = memorialArchive(state);
  let query='', type='', written=false, page=0, selected=null, generation=0, urls=[];
  const clearImages = () => { generation++; for (const url of urls) URL.revokeObjectURL(url); urls=[]; };
  openDialog('御批档案','<div id="memorial-archive"></div>');
  const dialog = document.querySelector('#modal'), root = dialog.querySelector('#memorial-archive');
  const paintResults = () => {
    const result = filterMemorialArchive(records,query,type,written), pages = Math.max(1,Math.ceil(result.length/20));
    page=Math.max(0,Math.min(page,pages-1));
    root.querySelector('#archive-count').textContent='共 '+result.length+' 份批阅记录';
    root.querySelector('#archive-results').innerHTML=memorialArchiveListHTML(result,page)+
      '<div class="archive-pagination"><button data-archive-prev '+(page?'':'disabled')+'>上一页</button><span>'+ (page+1)+' / '+pages+
      '</span><button data-archive-next '+(page+1<pages?'':'disabled')+'>下一页</button></div>';
  };
  const paintList = () => {
    clearImages(); selected=null;
    root.innerHTML='<p class="muted">每次亲批，留一份底稿。留中和再议的朱批也收录于此。</p><label for="archive-search">搜索奏折</label>'+
      '<input id="archive-search" type="search" maxlength="100" placeholder="标题、上奏人、正文或朱批" value="'+esc(query)+'">'+
      '<label for="archive-type">奏折类型</label><select id="archive-type"><option value="">全部类型</option>'+
      [...new Set(records.map(r=>r.type))].sort().map(t=>'<option '+(t===type?'selected ':'')+'value="'+esc(t)+'">'+esc(t)+'</option>').join('')+
      '</select><label class="archive-written"><input type="checkbox" id="archive-written" '+(written?'checked':'')+'>只看写过朱批的奏折</label>'+
      '<p id="archive-count"></p><div id="archive-results"></div>';
    paintResults();
  };
  const detail = record => {clearImages();selected=record;root.innerHTML=memorialArchiveDetailHTML(record);dialog.scrollTop=0;};
  root.oninput = e => { if(e.target.id==='archive-search'){query=e.target.value;page=0;paintResults();} };
  root.onchange = e => {
    if(e.target.id==='archive-type')type=e.target.value;
    else if(e.target.id==='archive-written')written=e.target.checked;
    else return;
    page=0;paintResults();
  };
  root.onclick = async e => {
    const b=e.target.closest('button'); if(!b||b.disabled)return;
    if(b.hasAttribute('data-archive-back')){paintList();dialog.scrollTop=0;}
    else if(b.dataset.archiveRecord){const r=records.find(r=>r.id===b.dataset.archiveRecord);if(r)detail(r);}
    else if(b.hasAttribute('data-archive-prev')){page--;paintResults();}
    else if(b.hasAttribute('data-archive-next')){page++;paintResults();}
    else if(b.hasAttribute('data-archive-image')&&selected){
      const record=selected, token=++generation; b.disabled=true;b.textContent='正在生成图片…';
      try {
        const images=await createMemorialImages(record);
        if(token!==generation||!dialog.open||!root.isConnected)return;
        for(const url of urls)URL.revokeObjectURL(url);
        urls=images.map(x=>URL.createObjectURL(x.blob));
        const stem='御极-'+record.title.replace(/[\\/:*?"<>|\x00-\x1f]/g,'').slice(0,60)+'-第'+record.turn+'旬';
        const files=typeof File==='function'?images.map((x,i)=>new File([x.blob],stem+(images.length>1?'-'+(i+1):'')+'.png',{type:'image/png'})):[];
        const canShare=files.length&&typeof navigator.share==='function'&&navigator.canShare?.({files});
        const target=root.querySelector('#archive-images');
        target.innerHTML='<p class="muted">可保存图片后分享，也可长按图片保存。'+(images.length>1?'长奏折分成 '+images.length+' 张，全文均已保留。':'')+'</p>'+
          (canShare?'<button data-share-memorial>分享图片</button>':'')+
          images.map((x,i)=>'<figure><img class="archive-share-image" src="'+urls[i]+'" alt="'+esc(record.title)+' · 分享图'+(i+1)+'">'+
            '<figcaption><button data-save-memorial="'+i+'">保存图片'+(images.length>1?' '+(i+1):'')+'</button></figcaption></figure>').join('');
        target.onclick = async event => {
          const save=event.target.closest('[data-save-memorial]');
          if(save){const i=Number(save.dataset.saveMemorial);download(files[i]?.name||stem+'.png',images[i].blob,'image/png');}
          if(event.target.closest('[data-share-memorial]'))try{await navigator.share({files,title:record.title});}catch(err){if(err.name!=='AbortError')toast('未能打开分享，请先保存图片。');}
        };
        b.textContent='重新生成分享图';
      } catch(err) {if(token===generation&&root.isConnected){toast(err.message);b.textContent='重新生成分享图';}}
      finally {if(token===generation&&root.isConnected)b.disabled=false;}
    }
  };
  onDialogExit(dialog,root,clearImages);
  paintList();
}
