const original=document.querySelector('#mega-solutions');
if(original){
 const links=new Map([...original.querySelectorAll('li a')].map(a=>[a.textContent.trim(),a.getAttribute('href')]));
 const functions=[['시각·관제','현장 영상과 통합 관제'],['청각·경보','방송과 위험 알림'],['공간','작업 환경과 현장 상태 확인'],['보호·안전장구','작업자 보호와 착용 안전'],['기록·콘텐츠','점검 기록과 안전 정보 관리']];
 const roles=[['현장 운영',['안전관리자','현장소장','환경·보건 담당','안전교육·출입관리 담당']],['기술·설비',['기술검토 담당','생산·설비 담당','플랜트 정비 담당','시설 유지관리 담당']],['관리·지원',['구매·조달 담당','본사 안전보건 담당']]];
 const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e};
 function build(prefix){
  const root=node('div','j-solutions');const head=node('div','j-solutions__head');head.append(node('p','j-solutions__title','솔루션 찾기'));const all=node('a','j-solutions__all','전체 솔루션 보기 ↗');all.href='/solutions';head.append(all);root.append(head);
  const tabs=node('div','j-solutions__tabs');tabs.role='tablist';tabs.setAttribute('aria-label','솔루션 찾는 기준');root.append(tabs);const panels=[],buttons=[];
  ['기능별 찾기','담당 업무별 찾기'].forEach((label,i)=>{const b=node('button','j-solutions__tab',label);b.type='button';b.role='tab';b.id=prefix+'-tab-'+i;b.setAttribute('aria-controls',prefix+'-panel-'+i);tabs.append(b);buttons.push(b);const p=node('div','j-solutions__panel');p.id=prefix+'-panel-'+i;p.role='tabpanel';p.setAttribute('aria-labelledby',b.id);panels.push(p);root.append(p);b.addEventListener('click',()=>select(i));b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?1:1-i;select(next);buttons[next].focus()})});
  function select(i){buttons.forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;panels[j].hidden=i!==j})}
  const axes=node('ul','j-solutions__axes');for(const [name,description] of functions){const li=node('li'),a=node('a','j-solutions__axis');a.href=links.get(name);a.append(node('span','j-solutions__name',name),node('span','j-solutions__description',description));li.append(a);axes.append(li)}panels[0].append(axes);
  const grid=node('div','j-solutions__roles');for(const [label,names] of roles){const section=node('section','j-solutions__role-group');section.setAttribute('aria-label',label);section.append(node('h3','',label));const list=node('ul');for(const name of names){const li=node('li'),a=node('a','j-solutions__role',name);a.href=links.get(name);li.append(a);list.append(li)}section.append(list);grid.append(section)}panels[1].append(grid);select(0);return root;
 }
 original.replaceChildren(build('j-solutions-desktop'));
 const mobile=document.querySelector('.drawer__axes[aria-label="담당 업무별 현장 바로가기"]');if(mobile){mobile.setAttribute('aria-label','솔루션 찾기');mobile.replaceChildren(build('j-solutions-mobile'));const products=document.querySelector('.drawer__axes[aria-label="제품 축 바로가기"]');if(products)products.before(mobile)}
}
