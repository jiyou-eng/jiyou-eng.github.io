/* Local preview: independent, cancellable image motion per heading or navigation. */
(()=>{'use strict';
const M=window.JiyouMotionSettings;
const root='/assets/motion/', reduce=matchMedia('(prefers-reduced-motion: reduce)');
const path=location.pathname.replace(/\/$/,'')||'/';
const asset=name=>name.startsWith('/')?name:root+name+'-480.webp';
const plans={
 '/company':{selector:'#company-title em',word:'안전',indices:[0,1],images:['helmet','/assets/construction-cutout-480.webp']},
 '/cases':{selector:'#support-title em',word:'안전이 연결되는 곳.',indices:[0,4,9],images:['helmet','call','location']},
 '/products':{selector:'.catalog-spectrum',marks:'.catalog-spectrum__mark',images:['camera','radio','wind','helmet','curing'],kind:'catalog'},
 '/solutions':{selector:'#solutions-title em',word:'오감으로',indices:[0,1,2,3],images:['camera','radio','wind','helmet'],variants:{0:['camera','curing']}},
 '/solutions/eyes':{selector:'.solution-hero__key',word:'VISUAL',indices:[0,2,4],images:['camera','cameraM','cameraL']},
 '/solutions/sound':{selector:'.solution-hero__key',word:'HEAR',indices:[0,2],images:['radio','location']},
 '/solutions/air':{selector:'.solution-hero__key',word:'SPACE',indices:[0,2],images:['wind','/assets/plant-cutout-480.webp']},
 '/solutions/guard':{selector:'.solution-hero__key',word:'PROTECT',indices:[0,3],images:['helmet','/assets/manufacturing-cutout-480.webp']},
 '/solutions/story':{selector:'.solution-hero__key',word:'RECORD',indices:[0,2,4],images:['assessment','curing','/assets/construction-cutout-480.webp']},
 '/products/mobile-cctv':{selector:'#mobile-cctv-lineup-title',word:'S. M. L.',indices:[0,3,6],images:['camera','cameraM','cameraL'],kind:'detail'},
 '/products/emergency-signal-location':{selector:'#emergency-problem-title',word:'응급호출에 위치 정보를 더합니다.',indices:[2,6],images:['call','location'],kind:'detail'},
 '/products/ai-quick-risk-assessment':{selector:'.expansion-intro h2',word:'현장 사진에서 위험성평가 초안까지.',indices:[3,14],images:['/assets/construction-cutout-480.webp','assessment'],kind:'detail'}
};
Object.assign(plans,window.JiyouProductMotionPlans||{});
const productLinks={camera:['mobile-cctv','무빙캠 S'],cameraM:['mobile-cctv','무빙캠 M'],cameraL:['mobile-cctv','무빙캠 L'],radio:['digital-radio','SE-400 디지털 무전기'],wind:['lte-anemometer','LTE 풍속계'],helmet:['smart-helmet','스마트 안전모'],curing:['concrete-curing','콘크리트 양생 계측기']};
function linkInfo(name){return productLinks[name]||null}
const linkedPage=path==='/solutions'||/^\/solutions\/(eyes|sound|air|guard|story)$/.test(path);
const plan=plans[path],group=plan&&document.querySelector(plan.selector);if(!group)return;
let paused=false;try{paused=localStorage.getItem('jiyou-motion-paused')==='yes'}catch{}
const slots=[];
function slot(text,index,imageName){const info=linkedPage&&linkInfo(imageName);const el=document.createElement(info?'a':'span');el.className='j-motion-slot';if(info){el.classList.add('j-motion-product-link');el.href='/products/'+info[0]+'/';el.setAttribute('aria-label',info[1]+' 제품 보기');el.dataset.productName=info[1];el.title=info[1]+' 제품 보기';}el.dataset.motionIndex=index;const glyph=document.createElement('span');glyph.className='j-motion-glyph';glyph.textContent=text;const art=document.createElement('span');art.className='j-motion-art';art.setAttribute('aria-hidden','true');const img=document.createElement('img');img.src=asset(imageName);img.alt='';img.width=480;img.height=480;img.draggable=false;art.append(img);el.append(glyph,art);el.style.setProperty('--j-order',slots.length);slots.push(el);return el}
if(plan.marks){group.querySelectorAll(plan.marks).forEach((mark,i)=>mark.replaceChildren(slot(mark.textContent,i,plan.images[i])))}else{
 const text=group.textContent,start=text.indexOf(plan.word);if(start<0)return;
 const positions=new Map(plan.indices.map((i,n)=>[start+i,{index:i,image:plan.images[n]}]));
 const walker=document.createTreeWalker(group,NodeFilter.SHOW_TEXT),nodes=[];let node,offset=0;
 while(node=walker.nextNode()){nodes.push({node,offset});offset+=node.textContent.length}
 for(const {node,offset} of nodes){const str=node.textContent,f=document.createDocumentFragment();let changed=false;
 for(let i=0;i<str.length;i++){const hit=positions.get(offset+i);if(hit){f.append(slot(str[i],hit.index,hit.image));changed=true}else f.append(document.createTextNode(str[i]))}
 if(changed)node.replaceWith(f)}
}
if(!slots.length)return;
group.normalize();const heading=group.closest('h1,h2');if(heading)heading.setAttribute('aria-label',heading.textContent);
group.classList.add('j-motion-group');group.dataset.motionKind=plan.kind||'heading';group.style.setProperty('--j-intro',M.intro+'ms');group.style.setProperty('--j-stagger',M.stagger+'ms');
let generation=0;
let timer=0,hoverTimer=0,leaveTimer=0,raf=0,active=null,inView=false,ready=false,entered=false,hovered=false,focused=false,index=0,variant=0,position={x:0,y:0,r:0},target={x:0,y:0,r:0};
const stop=()=>{generation++;clearTimeout(hoverTimer);clearTimeout(leaveTimer);clearTimeout(timer);timer=0;cancelAnimationFrame(raf);raf=0};
function clear(){group.classList.remove('j-motion-intro');slots.forEach(el=>{el.classList.remove('j-motion-active');el.style.removeProperty('--j-x');el.style.removeProperty('--j-y');el.style.removeProperty('--j-r')});active=null;position={x:0,y:0,r:0};target={x:0,y:0,r:0}}
function allowed(){return ready&&inView&&!document.hidden&&!paused&&!reduce.matches&&!hovered&&!focused}
function show(el){if(!el.querySelector('img').naturalWidth)return;clear();el.classList.add('j-motion-active');active=el;position={x:0,y:2,r:-3};if(!raf)raf=requestAnimationFrame(follow)}
function follow(){raf=0;if(!active||reduce.matches)return;let delta=0;for(const key of ['x','y','r']){position[key]+=(target[key]-position[key])*M.follow;delta+=Math.abs(target[key]-position[key])}active.style.setProperty('--j-x',position.x.toFixed(2)+'px');active.style.setProperty('--j-y',position.y.toFixed(2)+'px');active.style.setProperty('--j-r',position.r.toFixed(2)+'deg');if(delta>.025)raf=requestAnimationFrame(follow)}
function schedule(delay=M.resume){stop();if(!allowed())return;timer=setTimeout(()=>{if(!allowed())return;clear();if(!entered){entered=true;slots.forEach(el=>el.classList.toggle('j-motion-ready',!!el.querySelector('img').naturalWidth));group.classList.add('j-motion-intro');timer=setTimeout(()=>{clear();schedule(M.postIntro)},M.intro+M.stagger*(slots.length-1)+M.introTail);return}
const el=slots[index++%slots.length],alternates=plan.variants?.[Number(el.dataset.motionIndex)];if(alternates){const next=asset(alternates[variant++%alternates.length]);const img=el.querySelector('img');if(img.getAttribute('src')!==next){const token=generation,replacement=new Image(480,480);replacement.alt='';replacement.draggable=false;replacement.src=next;replacement.decode().then(()=>{if(!allowed()||token!==generation)return;img.replaceWith(replacement);const info=linkInfo(alternates[(variant-1)%alternates.length]);if(info&&el.tagName==='A'){el.href='/products/'+info[0]+'/';el.setAttribute('aria-label',info[1]+' 제품 보기');el.dataset.productName=info[1];el.title=info[1]+' 제품 보기'}show(el)}).catch(()=>{})}else show(el)}else show(el);
timer=setTimeout(()=>{clear();schedule(M.gap)},M.hold)},delay)}
function interact(el){stop();clear();if(paused||reduce.matches)return;entered=true;show(el)}
slots.forEach(el=>{const trigger=plan.marks?el.closest('a'):el;
 trigger.addEventListener('pointerenter',e=>{if(e.pointerType==='touch')return;hovered=true;stop();hoverTimer=setTimeout(()=>interact(el),M.hoverDelay)});
 trigger.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||active!==el)return;const r=trigger.getBoundingClientRect(),dx=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1)),dy=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));target={x:dx*5,y:dy*3-1,r:dx*6};if(!raf)raf=requestAnimationFrame(follow)});
 trigger.addEventListener('pointerleave',()=>{hovered=false;stop();leaveTimer=setTimeout(()=>{clear();schedule(M.resume)},M.leaveDelay)});
 trigger.addEventListener('focus',()=>{focused=true;interact(el)});trigger.addEventListener('blur',()=>{focused=false;clear();schedule()});
 if(!plan.marks&&trigger.tagName!=='A')trigger.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')return;interact(el);timer=setTimeout(()=>{clear();schedule()},M.touchHold)});
});
const toggle=document.createElement('button');toggle.type='button';toggle.className='j-motion-toggle';function label(){toggle.textContent=paused?'모션 재생':'모션 일시정지';toggle.setAttribute('aria-pressed',String(paused))}label();toggle.addEventListener('click',()=>{paused=!paused;try{localStorage.setItem('jiyou-motion-paused',paused?'yes':'no')}catch{}stop();clear();label();schedule(100)});document.body.append(toggle);
function sync(){stop();clear();toggle.hidden=!inView||reduce.matches;if(allowed())schedule(entered?M.postIntro:M.firstEntryDelay)}
new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync()},{threshold:.35}).observe(group);
document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);window.addEventListener('pagehide',()=>{stop();clear()});window.addEventListener('pageshow',sync);
const names=[...plan.images,...Object.values(plan.variants||{}).flat()];Promise.all(names.map(n=>{const img=new Image();img.src=asset(n);return img.decode().catch(()=>{})})).then(()=>{ready=true;sync()});
})();
