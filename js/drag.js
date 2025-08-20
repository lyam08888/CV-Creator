// drag.js
import { saveToStorage, pushHistory } from './state.js';
import { log } from './log.js';

let selected=null;
const GRID=8;
const snap = v=> Math.round(v/GRID)*GRID;

export function attachDragHandles(el, page){
  el.addEventListener('click', (e)=>{ selectBlock(el); e.stopPropagation(); });
  const content = el.querySelector('.block-content'); if(content) content.setAttribute('contenteditable','true');
}

export function selectBlock(el){
  if(selected) selected.classList.remove('selected');
  selected = el; if(el) el.classList.add('selected');
  showToolbarFor(el);
  log('select','block', { id: el?.dataset?.id, type: el?.dataset?.type });
}

export function onCanvasClick(e){ if(e.target.id==='cvPage') selectBlock(null); }

function showToolbarFor(el){
  const tb = document.getElementById('topToolbar');
  if(!el){ tb.classList.add('hidden'); return; }
  const rect = el.getBoundingClientRect();
  tb.style.left = (rect.left + rect.width/2 - 160) + 'px';
  tb.style.top = Math.max(56, rect.top - 46) + 'px';
  tb.classList.remove('hidden');
}

export function initDragAndResize(page, onSelect){
  page.addEventListener('mousedown', (e)=>{
    // In preview mode, do nothing
    if(document.body.classList.contains('preview')){ log('drag','blocked in preview'); return; }
    const block = e.target.closest('.drag-block');
    if(block){
      selectBlock(block); onSelect(block);
      const startX=e.clientX, startY=e.clientY;
      const rect=block.getBoundingClientRect(), pageRect=page.getBoundingClientRect();
      const offsetX = startX - rect.left, offsetY = startY - rect.top;
      const handle = e.target.closest('.handle');
      const inContentEditable = e.target.closest('.block-content');

      // If clicking inside editable area without holding Alt, let text selection happen instead of drag
      if(inContentEditable && !handle && !e.altKey){
        log('drag','click in editable (no drag). Hold ALT to drag text blocks.');
        return;
      }

      if(handle){
        const mode = handle.classList.contains('br')?'br':handle.classList.contains('tr')?'tr':handle.classList.contains('bl')?'bl':'tl';
        const initW = rect.width, initH=rect.height, initL=rect.left - pageRect.left, initT=rect.top - pageRect.top;
        log('resize','start', { id:block.dataset.id, mode, w:initW,h:initH,l:initL,t:initT });
        function onMove(ev){
          const dx=ev.clientX-startX, dy=ev.clientY-startY;
          let w=initW, h=initH, l=initL, t=initT;
          if(mode==='br'){ w+=dx; h+=dy; }
          if(mode==='tr'){ w+=dx; h-=dy; t=initT+dy; }
          if(mode==='bl'){ w-=dx; h+=dy; l=initL+dx; }
          if(mode==='tl'){ w-=dx; h-=dy; l=initL+dx; t=initT+dy; }
          block.style.width = Math.max(120, snap(w))+'px';
          block.style.height = Math.max(40, snap(h))+'px';
          block.style.left = snap(l)+'px'; block.style.top = snap(t)+'px';
          showToolbarFor(block);
        }
        function onUp(){
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          saveToStorage(); pushHistory('Redimensionnement');
          log('resize','end', { id:block.dataset.id, w:block.style.width, h:block.style.height, l:block.style.left, t:block.style.top });
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        e.preventDefault(); return;
      }

      // Drag
      block.classList.add('dragging');
      const startLeft = parseInt(block.style.left||'0'), startTop = parseInt(block.style.top||'0');
      log('drag','start', { id:block.dataset.id, startLeft, startTop });
      function onMove(ev){
        const x=snap(ev.clientX - pageRect.left - offsetX);
        const y=snap(ev.clientY - pageRect.top - offsetY);
        block.style.left=Math.max(0,x)+'px'; block.style.top=Math.max(0,y)+'px';
        showToolbarFor(block);
      }
      function onUp(){
        block.classList.remove('dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        saveToStorage(); pushHistory('Déplacement');
        log('drag','end', { id:block.dataset.id, left:block.style.left, top:block.style.top });
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }
  });

  // Toolbar actions
  const q=id=>document.getElementById(id);
  q('tbBold').addEventListener('click', ()=> document.execCommand('bold'));
  q('tbItal').addEventListener('click', ()=> document.execCommand('italic'));
  q('tbInc').addEventListener('click', ()=> fontDelta(1));
  q('tbDec').addEventListener('click', ()=> fontDelta(-1));
  q('tbAlignL').addEventListener('click', ()=> document.execCommand('justifyLeft'));
  q('tbAlignC').addEventListener('click', ()=> document.execCommand('justifyCenter'));
  q('tbAlignR').addEventListener('click', ()=> document.execCommand('justifyRight'));
  q('tbAI').addEventListener('click', ()=> document.getElementById('leftDrawer').classList.add('open'));

  // Keyboard shortcuts
  window.addEventListener('keydown', (e)=>{
    if(!selected) return;
    if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='d'){ e.preventDefault();
      const clone=selected.cloneNode(true);
      clone.style.left=(parseInt(selected.style.left||'0')+16)+'px';
      clone.style.top=(parseInt(selected.style.top||'0')+16)+'px';
      selected.parentElement.appendChild(clone);
      attachDragHandles(clone, selected.parentElement);
      selectBlock(clone); saveToStorage(); pushHistory('Duplication bloc'); log('block','duplicate', { from:selected.dataset.id, to: clone.dataset.id }); }
    if(e.key==='Delete' || e.key==='Backspace'){ const id=selected.dataset.id; selected.remove(); selectBlock(null); saveToStorage(); pushHistory('Suppression bloc'); log('block','delete', { id }); e.preventDefault(); }
    const move=(dx,dy)=>{ const x=snap((parseInt(selected.style.left||'0')+dx)); const y=snap((parseInt(selected.style.top||'0')+dy));
      selected.style.left=x+'px'; selected.style.top=y+'px'; showToolbarFor(selected); saveToStorage(); log('nudge','arrow', { id:selected.dataset.id, x, y }); };
    if(e.key==='ArrowLeft'){ move(-GRID,0); e.preventDefault(); }
    if(e.key==='ArrowRight'){ move(GRID,0); e.preventDefault(); }
    if(e.key==='ArrowUp'){ move(0,-GRID); e.preventDefault(); }
    if(e.key==='ArrowDown'){ move(0,GRID); e.preventDefault(); }
  });
}

function fontDelta(delta){
  const sel = window.getSelection();
  if(!sel || sel.rangeCount===0) return;
  const node = sel.anchorNode?.parentElement; if(!node) return;
  const size = parseInt(window.getComputedStyle(node).fontSize)||14;
  node.style.fontSize=(size+delta)+'px';
}


/* Preview delete support via dialog */
(function(){
  window.addEventListener('keydown', (e)=>{
    if(e.key==='Delete' || e.key==='Backspace'){
      if(document.body.classList.contains('preview')){
        e.preventDefault();
        const dlg=document.getElementById('deleteDialog'); const list=document.getElementById('deleteList');
        if(!dlg || !list) return;
        const blocks=[...document.querySelectorAll('#cvPage .drag-block')];
        list.innerHTML = blocks.map(b=>`<div class="row between"><span>${b.dataset.type||'bloc'} • ${b.dataset.id||''}</span><button class="btn" data-id="${b.dataset.id}">Supprimer</button></div>`).join('');
        dlg.showModal();
        list.querySelectorAll('button[data-id]').forEach(btn=> btn.addEventListener('click', ()=>{
          const id=btn.getAttribute('data-id'); const el=document.querySelector('.drag-block[data-id="'+id+'"]').remove();
          document.getElementById('btnCloseDelete').click();
        }));
      }
    }
  });
  const closeBtn = document.getElementById('btnCloseDelete'); if(closeBtn){ closeBtn.addEventListener('click', ()=> document.getElementById('deleteDialog').close()); }
})();
