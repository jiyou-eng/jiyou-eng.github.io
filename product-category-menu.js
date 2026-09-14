import senses from './product-menu-data.js';
const menu=document.querySelector('#mega-products');
const shell=menu?.querySelector('.mega-menu__product-shell');
const count=s=>s.categories.reduce((n,c)=>n+c.products.length,0);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
function productLink(product){const a=el('a','j-products__link',product.name);a.href=product.href;return a}
function overview(s){const a=el('a','j-products__overview',s.label+' 전체 보기 ↗');a.href='/products?category='+s.key;return a}
if(shell){
 const nav=el('div','j-products');nav.setAttribute('aria-label','오감별 제품 찾기');
 const tabs=el('div','j-products__tabs');tabs.role='tablist';tabs.setAttribute('aria-label','오감 제품군');nav.append(tabs);
 const buttons=[],panels=[];
 senses.forEach((sense,i)=>{
  const button=el('button','j-products__tab');button.type='button';button.role='tab';button.id='j-products-tab-'+sense.key;button.setAttribute('aria-controls','j-products-panel-'+sense.key);
  const badge=el('span','j-products__badge',sense.mark);badge.style.setProperty('--sense-color',`var(--moving-${sense.key}-badge)`);badge.setAttribute('aria-hidden','true');button.append(badge,el('span','',sense.label),el('small','',String(count(sense))));tabs.append(button);buttons.push(button);
  const panel=el('div','j-products__panel');panel.id='j-products-panel-'+sense.key;panel.role='tabpanel';panel.setAttribute('aria-labelledby',button.id);panels.push(panel);nav.append(panel);
  const side=el('div','j-products__categories');side.setAttribute('aria-label',sense.label+' 세부 카테고리');panel.append(side);
  const result=el('div','j-products__results');result.id='j-products-results-'+sense.key;panel.append(result);
  const filters=[{label:'전체 제품',products:sense.categories.flatMap(c=>c.products)},...sense.categories],filterButtons=[];
  function selectCategory(index){filterButtons.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===index)));result.replaceChildren();const head=el('div','j-products__result-head');head.append(el('h3','',index===0?sense.label+' 제품':filters[index].label),el('span','j-products__count',filters[index].products.length+'개 제품'));result.append(head);
   const list=el('ul','j-products__list');for(const product of filters[index].products){const li=el('li');li.append(productLink(product));list.append(li)}result.append(list,overview(sense));
  }
  filters.forEach((category,j)=>{const b=el('button','j-products__category');b.type='button';b.setAttribute('aria-controls',result.id);b.append(el('span','',category.label),el('small','',String(category.products.length)));b.addEventListener('click',()=>selectCategory(j));filterButtons.push(b);side.append(b)});selectCategory(0);
  button.addEventListener('click',()=>selectSense(i));button.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%senses.length;else if(e.key==='ArrowLeft')next=(i+senses.length-1)%senses.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=senses.length-1;else return;e.preventDefault();selectSense(next);buttons[next].focus()});
 });
 function selectSense(index){buttons.forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;panels[i].hidden=i!==index})}
 const current=location.pathname.replace(/\/$/,'');const match=senses.findIndex(s=>s.categories.some(c=>c.products.some(p=>p.href===current)));
 selectSense(Math.max(0,match));shell.querySelector('.mega-menu__product-grid')?.replaceWith(nav);
}
const mobile=document.querySelector('.drawer__axes[aria-label="제품 축 바로가기"]');
if(mobile){
 const content=el('div','j-products-mobile');const details=[];
 for(const sense of senses){const group=el('details','j-products-mobile__sense');details.push(group);const summary=el('summary','',sense.label);summary.append(el('small','',count(sense)+'개'));group.append(summary);
  const body=el('div','j-products-mobile__body');body.append(overview(sense));group.append(body);
  const cats=[];for(const category of sense.categories){const d=el('details','j-products-mobile__category');cats.push(d);const label=el('summary','',category.label);label.append(el('small','',category.products.length+'개'));d.append(label);const list=el('ul','j-products-mobile__list');for(const p of category.products){const li=el('li');li.append(productLink(p));list.append(li)}d.append(list);d.addEventListener('toggle',()=>{if(d.open)cats.forEach(other=>{if(other!==d)other.open=false})});body.append(d)}
  group.addEventListener('toggle',()=>{if(group.open)details.forEach(other=>{if(other!==group)other.open=false})});content.append(group);
 }
 mobile.querySelector('div')?.replaceWith(content);
}
