// domutil.js
export function getTextFromScope(scope){
  const page=document.getElementById('cvPage');
  let targets=[];
  if(scope==='selection'){ const sel=document.querySelector('.drag-block.selected'); if(sel) targets=[sel]; }
  else { targets=[...page.querySelectorAll('.drag-block')]; }
  const text = targets.map(t=>(t.querySelector('.block-content')||t).innerText).join('\n\n');
  return { text, targets };
}
export function setTextToScope(targets, output){
  if(targets.length===1){
    const area=targets[0].querySelector('.block-content')||targets[0];
    area.innerText=output; return;
  }
  const parts=output.split(/\n\n+/);
  targets.forEach((t,i)=>{ const area=t.querySelector('.block-content')||t; area.innerText = parts[i%parts.length] || output; });
}
