/* All current and future image motion uses this single timing profile. */
window.JiyouMotionSettings=Object.freeze({
  firstEntryDelay:1000,
  intro:860,stagger:110,introTail:100,
  postIntro:1200,hold:1800,gap:900,resume:2400,
  hoverDelay:55,leaveDelay:180,touchHold:1500,
  space:380,glyphOpacity:170,glyphTransform:300,imageOpacity:220,imageTransform:420,follow:.18
});
for(const [name,value] of Object.entries(window.JiyouMotionSettings)){
  document.documentElement.style.setProperty('--motion-'+name,value+'ms');
}
