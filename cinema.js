'use strict';
const matrixIcon=(name,extra='')=>`<img class="matrix-icon ${extra}" src="assets/themes/icon-${name}.svg" alt="" aria-hidden="true">`;
const chapterFilms=[
 ['bonsai-opening-2a68058835aa','Ein Baum. Ein digitaler Begleiter.','AUFTAKT / LEBENDIGE DATEN'],
 ['bonsai-opening-2a68058835aa','Ein Name wächst aus einer Idee.','IDENTITÄT / BONSAI + PILOT'],
 ['water','Eine Frage des richtigen Maßes.','DAS PROBLEM / WASSER'],
 ['roots','Pflege und Gestaltung verbinden.','DIE LÖSUNG / ZUSAMMENHÄNGE'],
 ['bluetooth','Ein Baumprofil bekommt Kontext.','DAS SYSTEM / FOTO + KI + ZWILLING'],
 ['phone','Dein Bonsai. Dein digitaler Pflegepilot.','DIE APP / DEIN GRÜN'],
 ['focus','Ein Hobby verbindet Menschen.','DIE MENSCHEN / LEBENSRÄUME'],
 ['market','Bonsai-Interesse gezielt erreichen.','DER MARKT / EINGRENZUNG'],
 ['choice','Verschiedene Wege. Ein Bedürfnis.','WETTBEWERB / ENTSCHEIDUNGEN'],
 ['commerce','Kostenlos starten. Gezielt erweitern.','GESCHÄFTSMODELL / APP + PARTNER'],
 ['balance','Wert und Aufwand ins Gleichgewicht.','FINANZPLAN / JAHR DREI'],
 ['circuit','Technik, die genauer hinsieht.','TECHNIK / TEAM / ZUKUNFT'],
 ['forest','Wissen teilen. Bäume begleiten.','AUSBLICK / MEHR GRÜN']
];
let chapterTime=0;
function mountChapterFilm(slide,index){
 chapterTime=0;
 if(index===1){slide.dataset.overture='none';return;}
 const [key,title,label]=chapterFilms[index],layer=document.createElement('section');layer.className='chapter-prelude';layer.setAttribute('aria-label',title);
 layer.innerHTML=`<div class="prelude-meta"><span>${label}</span><span>BONSAIPILOT ( )</span></div><video muted playsinline preload="auto" poster="assets/themes/${key}.jpg" aria-label="Thematische cmatrix-Animation"><source src="assets/themes/${key}.mp4" type="video/mp4"></video><div class="prelude-bottom"><div><span class="prelude-rule"></span><h2>${title}</h2></div><button data-skip-chapter>Inhalt anzeigen ${matrixIcon('plus')}</button></div>`;
 slide.append(layer);slide.dataset.overture=motionPaused?'done':'playing';layer.inert=motionPaused;
}
function finishChapterFilm(){
 const slide=document.querySelector('.slide');if(!slide||slide.dataset.overture!=='playing')return;
 chapterTime=3900;slide.dataset.overture='done';const layer=slide.querySelector('.chapter-prelude');if(layer){layer.inert=true;layer.setAttribute('aria-hidden','true');layer.querySelector('video').pause();}
 sceneTime=0;
}
function replayChapterFilm(){
 const slide=document.querySelector('.slide');if(!slide)return;
 if(current===1){sceneTime=0;lastNamePhase='';const v=slide.querySelector('.identity-opening video');if(v){v.currentTime=0;v.play().catch(()=>{});}return;}
 chapterTime=0;sceneTime=0;const layer=slide.querySelector('.chapter-prelude');if(!layer)return;layer.inert=false;layer.removeAttribute('aria-hidden');slide.dataset.overture='playing';const v=layer.querySelector('video');v.currentTime=0;if(!motionPaused)v.play().catch(()=>{});
}
