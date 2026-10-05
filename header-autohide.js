/* Hide the site header while scrolling down; show it again on any upward scroll.
   Mirrors the musma.net pattern. State lives on <html data-header="top|shown|hidden">,
   and --header-height follows the header so sticky elements and anchor offsets move with it. */
(()=>{'use strict';
const header=document.querySelector('.site-header');if(!header)return;
const root=document.documentElement,THRESHOLD=6;
let lastY=Math.max(0,scrollY),state='',ticking=false,height=0;
function measure(){height=Math.round(header.getBoundingClientRect().height)||height}
function menuOpen(){
 if(header.querySelector(':focus-visible'))return true; // keyboard users only; a mouse click leaves no :focus-visible
 if(header.querySelector('[aria-expanded="true"]'))return true;
 if(header.querySelector('[data-mega-menu]:not([hidden])'))return true;
 const drawer=document.getElementById('mobile-drawer');return !!(drawer&&!drawer.hidden);
}
function set(next){
 if(next===state)return;state=next;root.dataset.header=next;
 root.style.setProperty('--header-height',(next==='hidden'?0:height)+'px');
}
function update(){
 ticking=false;const y=Math.max(0,scrollY),dy=y-lastY;
 if(y<=height){set('top');lastY=y;return}
 if(menuOpen()){set('shown');lastY=y;return}
 if(Math.abs(dy)<THRESHOLD)return;
 set(dy>0?'hidden':'shown');lastY=y;
}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update)}},{passive:true});
addEventListener('resize',()=>{measure();if(state!=='hidden')root.style.setProperty('--header-height',height+'px')});
header.addEventListener('focusin',()=>set(scrollY<=height?'top':'shown'));
// In-page links: decide the header state before the jump so the landing offset is right.
document.addEventListener('click',e=>{
 const a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a||a.getAttribute('href').length<2)return;
 let t=null;try{t=document.querySelector(decodeURIComponent(a.getAttribute('href')))}catch{}
 if(!t)return;const top=t.getBoundingClientRect().top+scrollY;
 if(top>scrollY+height)set('hidden');else set(top<=height?'top':'shown');
},true);
measure();update();set(Math.max(0,scrollY)<=height?'top':'shown');
})();
