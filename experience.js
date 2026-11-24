'use strict';
// Every scene is driven by the same visible-time clock. Pause means pause.
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const lotus='<img src="assets/bonsaipilot-mark.svg" alt="BonsaiPilot cmatrix Bonsai">';
const replay=`<button class="scene-replay" data-replay>Sequenz wiederholen ${matrixIcon('replay')}</button>`;



const systemScenes=[
 {name:'Dokumentieren',title:'Ein Baum.<br>Ein eigenes Profil.',description:'Fotos, Baumart, Standort und Pflegegeschichte werden zusammengeführt. Externe Sensoren sind optional.',visual:`<div class="signal-plant"><img src="assets/ficus-matrix.svg" alt="cmatrix Ficus-Bonsai"><div class="signal-scan"></div><div class="signal-point a"><b>FOTO</b><span>VERÄNDERUNGEN</span></div><div class="signal-point b"><b>ART</b><span>PFLEGEPROFIL</span></div><div class="signal-point c"><b>ZEIT</b><span>ENTWICKLUNG</span></div></div><p class="system-caption">Ein individueller Verlauf statt eines starren Standardplans</p>`},
 {name:'Verbinden',title:'Wissen wird<br>zusammengeführt.',description:'Geplant: Bilder in einer sicheren Cloud, KI-Auswertung und ein digitaler Bonsai-Zwilling. Bluetooth oder WLAN ergänzen Sensordaten.',visual:`<div class="transfer-scene"><div class="transfer-source">${lotus}<span>BAUMPROFIL</span></div><div class="transfer-stream"><span class="transfer-bluetooth">${matrixIcon('chip')}</span>${Array.from({length:25},(_,i)=>`<i style="--i:${i}">${'01:+'[i%4]}</i>`).join('')}</div><div class="transfer-target"><span class="dot-font">KI</span><small>CLOUD + DIGITALER ZWILLING</small></div><div class="transfer-rings"></div></div><p class="system-caption">Produktziel. Die Browser-Demo verarbeitet keine Bilder in einer Cloud.</p>`},
 {name:'Verstehen',title:'Veränderungen<br>bekommen Kontext.',description:'Art, Jahreszeit, Fotos und Pflegeverlauf sollen individuelle Empfehlungen ermöglichen. Die Qualität muss bonsaispezifisch geprüft werden.',visual:`<div class="context-scene"><div class="context-inputs"><span>BONSAI-ART</span><span>FOTOZEITREIHE</span><span>PFLEGEVERLAUF</span></div><div class="context-core">${matrixIcon('chip')}<div></div></div><svg class="context-chart" viewBox="0 0 400 90" aria-label="Illustrativer Entwicklungsverlauf"><path d="M0 70L45 65L90 68L135 52L180 48L225 42L270 38L315 27L360 22L400 12"/></svg><div class="context-result">Muster erkennen.<br><b>Fachlich prüfen statt blind vertrauen.</b></div></div><p class="system-caption">Keine automatische Diagnose und keine garantierte Wachstumsprognose</p>`},
 {name:'Gestalten',title:'Erst virtuell prüfen.<br>Dann bewusst handeln.',description:'AR-Schnittvarianten, Entwicklungsszenarien, Standortideen und verständliche Anleitungen begleiten die Entscheidung.',visual:`<div class="system-task-scene"><span class="eyebrow">DEIN BONSAI / NÄCHSTER SCHRITT</span><div class="system-task"><span class="task-cross">+</span><div><b>Gestaltung ausprobieren.</b><p>Schnittvariante virtuell ansehen.<br>Den echten Eingriff fachlich prüfen.</p></div></div><div class="system-task muted-task"><span>✓</span><div><b>Pflege dokumentieren</b><p>Fotos und Erfahrungen festhalten.</p></div></div><div class="system-local">Wissen und Erinnerungen · Mensch entscheidet</div></div><p class="system-caption">Die App pflegt den Baum nicht automatisch.</p>`}
];
const peopleScenes=[
 {label:'KERNZIELGRUPPE / 35–70 JAHRE',title:'Ein Baum begleitet<br>viele Jahre.',problem:'Hobbyzüchter und Sammler investieren Zeit und Geld. Bei wertvollen Bäumen zählt eine verlässliche, nachvollziehbare Begleitung.',answer:'Entwicklung dokumentieren, Pflegewissen bündeln und Gestaltung vor dem echten Schnitt ausprobieren. Schwerpunkt Männer laut Plan; offen für alle.',art:'focus',words:['HOBBY','SAMMLUNG','LANGFRISTIG']},
 {label:'EINSTIEG / 18–35 JAHRE',title:'Begeisterung braucht<br>Orientierung.',problem:'Der erste Bonsai ist spannend. Art, Standort, Jahreszeit und Wasserbedarf müssen erst verstanden werden.',answer:'Kostenlos einsteigen, verständliche Pflegehinweise nutzen und die Entwicklung Schritt für Schritt kennenlernen.',art:'begin',words:['LERNEN','BEOBACHTEN','VERSTEHEN']},
 {label:'WEITERE ZIELGRUPPE / FACHLEUTE',title:'Erfahrung trifft<br>digitale Begleitung.',problem:'Züchter, Baumschulen und Fachgeschäfte möchten Wissen vermitteln und interessierte Menschen erreichen.',answer:'Beratung und Produktvermittlung verbinden. Kooperationen und bezahlte Platzierungen transparent kennzeichnen.',art:'together',words:['FACHWISSEN','BERATUNG','VERNETZUNG']}
];
const plants=[
 {id:'ficus',name:'Ficus-Bonsai',latin:'Ficus microcarpa',price:49,set:88,light:'Sehr hell · frostfrei',care:'Für den Einstieg',detail:'Ein tropischer Bonsai für einen sehr hellen, warmen Platz. Wasserbedarf am Substrat prüfen.',soil:'Kein fester Gießrhythmus.'},
 {id:'ulme',name:'Chinesische Ulme',latin:'Ulmus parvifolia',price:59,set:98,light:'Hell · Herkunft beachten',care:'Saisonale Pflege',detail:'Feine Verzweigung und kleine Blätter. Überwinterung hängt von Herkunft und Kultur ab.',soil:'Nicht vollständig austrocknen lassen.'},
 {id:'juniper',name:'Wacholder',latin:'Juniperus chinensis',price:69,set:108,light:'Draußen · sonnig',care:'Outdoor-Bonsai',detail:'Ein immergrüner Outdoor-Bonsai. Kein Baum für eine dauerhafte Haltung im Wohnzimmer.',soil:'Gut drainiertes Bonsaisubstrat.'}
];
let selectedPlant=0,selectedBundle='set',purchased=false;
const plantImage=(p,cls='')=>`<img class="${cls}" src="assets/${p.id}-matrix.svg" alt="${p.name} als Matrix-Zeichen">`;
const appButton=(label,action='next')=>`<button class="app-button" ${action==='next'?'data-app-next':action==='buy'?'data-app-buy':'data-app-restart'}>${label}${matrixIcon('plus')}</button>`;
const appTop=(section,title)=>`<div class="app-eyebrow">${section}</div><h3>${title}</h3>`;
const demoScenes=[
 {label:'Baumprofil',duration:5500,caption:'Jeder Bonsai bekommt seine eigene Geschichte.',body:()=>`${appTop('DEIN DIGITALER BEGLEITER','Dein Baum.<br>Dein Pflegepilot.')}<div class="find-orbit">${lotus}<span></span></div><div class="app-field"><span>Dein Einstieg</span><button class="option selected" data-app-next>Art und Standort festhalten ${matrixIcon('leaf')}</button></div><p class="app-small">Fotos, Pflege und Entwicklung an einem Ort.</p>${appButton('Bonsai hinzufügen')}`},
 {label:'Kennenlernen',duration:6000,caption:'Art und Standort sind wichtiger als ein starrer Pflegeplan.',body:()=>`${appTop('BONSAI-WISSEN','Welcher Baum<br>begleitet dich?')}<div class="catalog-list">${plants.map((p,i)=>`<button class="catalog-item" data-plant="${i}">${plantImage(p)}<span><b>${p.name}</b><small>${p.light}</small></span>${matrixIcon('plus')}</button>`).join('')}</div><p class="app-small">Vorhandenen Baum erfassen oder ein Partnerangebot ansehen.</p>${appButton('Profil anlegen')}`},
 {label:'Fotos',duration:6000,caption:'Regelmäßige Bilder machen Veränderungen nachvollziehbar.',body:()=>`${appTop('BAUMPROFIL / FOTOTAGEBUCH',plants[selectedPlant].name)}<div class="product-image">${plantImage(plants[selectedPlant])}<span>BEISPIELBILD / AUFNAHME 01</span></div><div class="product-facts"><span>Art<b>${plants[selectedPlant].latin}</b></span><span>Verlauf<b>Heute · 09:41</b></span></div><p class="product-description">In der geplanten App werden Bilder sicher gespeichert und mit dem Baumprofil verknüpft.</p>${appButton('Entwicklung dokumentieren')}`},
 {label:'Premium',duration:5000,caption:'Kostenloser Einstieg; Premium ist im Plan mit 5,99 € pro Monat vorgesehen.',body:()=>`${appTop('DEIN PROFIL / BEISPIEL','Hallo, Alex.')}<div class="profile-avatar dot-font">A</div><div class="profile-info"><b>BonsaiPilot Premium</b><span>KI, AR und erweiterte Pflegefunktionen.</span></div><div class="profile-row"><span>Geplanter Monatspreis</span><b>5,99 €</b></div><div class="profile-row"><span>Kostenloser Einstieg</span><b>Ja</b></div>${appButton('Premium-Demo ansehen')}<p class="app-small">Keine Zahlung und kein echtes Abo. Funktionsumfang ist geplant.</p>`},
 {label:'Fotoanalyse',duration:6500,caption:'Ein Beispielbefund zeigt den Ablauf. Es läuft keine echte Bilderkennung.',body:()=>`${appTop('KI / GEPLANTER ABLAUF','Veränderungen<br>besser einordnen.')}<div class="product-image plan-phone-analysis">${plantImage(plants[selectedPlant])}<span>FOTO + ART + PFLEGEGESCHICHTE</span></div><div class="app-advice"><b>Beispiel: Blattveränderung.</b><p>Licht, Substrat und den Verlauf prüfen. Ein Foto allein beweist keine Ursache.</p></div>${appButton('Gestaltung entdecken')}<p class="app-small">Demobefund, keine KI-Diagnose. Bei unklaren Symptomen Fachwissen einholen.</p>`},
 {label:'AR-Trainer',duration:6500,caption:'Schnittideen virtuell prüfen — bevor am echten Baum etwas verändert wird.',body:()=>`${appTop('AR-TRAINER / KONZEPT','Erst ausprobieren.<br>Dann entscheiden.')}<div class="product-image plan-phone-prune">${plantImage(plants[selectedPlant])}<span>VIRTUELLE KRONENVARIANTE</span></div><div class="app-advice"><b>Gestaltungsvariante 01.</b><p>Die schematische Vorschau verändert den echten Baum nicht. Ein Schnitt braucht fachliche Prüfung.</p></div>${appButton('Entwicklung ansehen')}<p class="app-small">Animation, keine Kamera-AR und keine Schnittanweisung.</p>`},
 {label:'Entwicklung',duration:6500,caption:'Mögliche Gestaltungsbilder sind Szenarien und keine verlässlichen Vorhersagen.',body:()=>`${appTop('DIGITALER ZWILLING / ZIELBILD','Heute denken.<br>Jahre mitgestalten.')}<div class="product-image plan-phone-future">${plantImage(plants[selectedPlant])}<span>GESTALTUNGSSZENARIO / +3 JAHRE</span></div><div class="monitor-values"><span>Heute<b>Dokumentieren</b></span><span>Morgen<b>Möglichkeiten prüfen</b></span></div><p class="app-small">Wachstum hängt von Art und Pflege ab. Die Grafik ist keine Prognose und kein rekonstruiertes 3D-Modell.</p>${appButton('Standort prüfen')}`},
 {label:'Standort',duration:6000,caption:'Der geplante Raumscan muss Licht und Artenbedarf verbinden.',body:()=>`${appTop('STANDORT / BEISPIEL','Ein Platz,<br>der zum Baum passt.')}<div class="connect-ring">${matrixIcon('leaf')}<span></span><span></span></div><div class="app-advice"><b>${plants[selectedPlant].light}</b><p>${plants[selectedPlant].id==='juniper'?'Dieser Baum gehört dauerhaft nach draußen. Ein Raumscan ersetzt das nicht.':'Artgerechten Platz und tatsächliche Lichtverhältnisse prüfen.'}</p></div>${appButton('Partnerprodukte ansehen')}<p class="app-small">Demonstration: kein echter Kamerascan oder Lux-Messwert.</p>`},
 {label:'Partnerprodukte',duration:5500,caption:'Vermittlung kann Provisionen erzeugen. Bezahlte Platzierungen werden markiert.',body:()=>`${appTop('PARTNERMARKT / BEISPIELE','Passendes Zubehör.')}<div class="catalog-list"><div class="catalog-item">${matrixIcon('leaf')}<span><b>Bonsaischere</b><small>Beispielangebot · 24 €</small></span></div><div class="catalog-item">${matrixIcon('chip')}<span><b>Bonsaisubstrat</b><small>Beispielangebot · 12 €</small></span></div><div class="catalog-item">${matrixIcon('bluetooth')}<span><b>Externer Sensor</b><small>Optional · Beispielpreis 39 €</small></span></div></div><p class="app-small">Geplante Produktvermittlung. Keine bestätigten Händlerangebote oder echte Bestellung.</p>${appButton('Zur Pflege')}`},
 {label:'Pflegealltag',duration:5500,caption:'Wissen, Erinnerungen und eigene Beobachtungen begleiten die Entwicklung.',body:()=>`${appTop('DEIN PFLEGEALLTAG','Ein Baum.<br>Viele kleine Schritte.')}<div class="completion-icon">${matrixIcon('check')}</div><div class="app-advice"><b>Heute dokumentiert.</b><p>Foto ergänzt. Erde geprüft. Den Standort im Blick behalten. Die Geschichte des Baums wächst mit.</p></div><div class="local-stamp">Demo lokal · Produktziel Cloud-Profil</div>${appButton('Rundgang wiederholen','restart')}<p class="app-small">Wissen zugänglich machen. Wasser bewusst nutzen. Wirkung noch nicht gemessen.</p>`}
];

let current=0,auto=false,motionPaused=matchMedia('(prefers-reduced-motion: reduce)').matches,elapsed=0,sceneTime=0,transitioning=false;
let demoIndex=0,demoRunning=!motionPaused,demoElapsed=0,systemIndex=-1,personIndex=-1,lastNamePhase='',booted=false,loaderTime=0;
let fitScale=1,pointer={x:0,y:0},pendingSlide=null;
const stage=$('#stage');
$('#total').textContent=String(slides.length);
$('#sourceList').innerHTML=sources.map(s=>`<article class="source-item"><span class="eyebrow">${s.label}</span>${s.url?`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name}</a>`:`<strong>${s.name}</strong>`}<p>${s.note}</p></article>`).join('');
$('#chapterMenu').innerHTML=slides.map((s,i)=>`<button data-goto="${s.id}"><span class="dot-font">${String(i+1).padStart(2,'0')}</span>${s.name}</button>`).join('');
$('#chapterRail').innerHTML=slides.map(s=>`<button data-goto="${s.id}" aria-label="${s.name}" title="${s.name}"><i></i></button>`).join('');
function fitSlide(){
 const compact=stage.clientWidth<stage.clientHeight*1.05;document.body.classList.toggle('compact',compact);
 const w=compact?480:1280,h=compact?800:720,fit=$('.slide-fit');
 fitScale=Math.min(stage.clientWidth/w,stage.clientHeight/h);
 if(fit){fit.style.width=w+'px';fit.style.height=h+'px';fit.style.transform=`translate(-50%,-50%) scale(${fitScale})`;}
}
const fitObserver=new ResizeObserver(fitSlide);fitObserver.observe(stage);
function applyMotion(){
 document.body.classList.toggle('motion-paused',motionPaused);$('#motionButton').textContent=motionPaused?'Bewegung an':'Bewegung aus';$('#motionButton').setAttribute('aria-pressed',String(motionPaused));
 $$('video').forEach(v=>{v.muted=true;const hiddenPrelude=v.closest('.chapter-prelude')&&v.closest('.slide').dataset.overture==='done';if(!booted||motionPaused||document.hidden||hiddenPrelude)v.pause();else v.play().catch(()=>{});});
}
function showSystem(i){
 if(i===systemIndex)return;systemIndex=i;const s=systemScenes[i];
 $('#systemTitle').innerHTML=s.title;$('#systemTitle').classList.remove('text-enter');void $('#systemTitle').offsetWidth;$('#systemTitle').classList.add('text-enter');
 $('#systemDescription').textContent=s.description;$('#systemDescription').classList.remove('text-enter');void $('#systemDescription').offsetWidth;$('#systemDescription').classList.add('text-enter');
 const layer=document.createElement('div');layer.className='system-layer';layer.innerHTML=s.visual;
 const old=$('#systemLayers').lastElementChild;$('#systemLayers').append(layer);
 if(old){old.classList.add('layer-exit');setTimeout(()=>old.remove(),650);}
 $('#systemSteps').innerHTML=systemScenes.map((s,n)=>`<button data-system="${n}" class="${i===n?'active':''}"><span class="dot-font">${String(n+1).padStart(2,'0')}</span><b>${s.name}</b><i></i></button>`).join('');
}
function showPerson(i){
 if(i===personIndex)return;personIndex=i;const s=peopleScenes[i];
 $('#peopleLabel').textContent=s.label;$('#peopleTitle').innerHTML=s.title;$('#peopleProblem').textContent=s.problem;$('#peopleAnswer').textContent=s.answer;
 $('.people-narrative').classList.remove('text-enter');void $('.people-narrative').offsetWidth;$('.people-narrative').classList.add('text-enter');
 $('#peopleIllustration').innerHTML=`<div class="matrix-life-film"><video autoplay loop muted playsinline preload="auto" poster="assets/themes/${s.art}.jpg" aria-label="${s.label}: vollständige cmatrix-Szene"><source src="assets/themes/${s.art}.mp4" type="video/mp4"></video><div class="matrix-life-caption"><span>${s.words.join(' / ')}</span><span>CMATRIX / LIVING SCENE</span></div></div>`;
 applyMotion();
 $$('.people-switches button').forEach((b,n)=>{b.classList.toggle('active',n===i);b.setAttribute('aria-pressed',String(n===i));});
}
function renderDemo(){
 const s=demoScenes[demoIndex];demoElapsed=0;
 const screen=$('#phoneScreen');screen.innerHTML=`<div class="app-view">${s.body()}</div>`;
 $('#phoneCaption').textContent=s.caption;
 $('#demoSteps').innerHTML=demoScenes.map((s,i)=>`<button data-demo-stage="${i}" class="${i===demoIndex?'active':''}" aria-pressed="${i===demoIndex}"><span class="step-dot"></span><span>${s.label}</span></button>`).join('');
 $('#demoPlay').textContent=demoRunning?'Demo pausieren':'Demo abspielen';
 $('#phoneTabs').innerHTML=[['Bäume',0,'leaf'],['Studio',4,'chip'],['Markt',8,'shop'],['Profil',3,'user']].map(([label,i,icon])=>`<button data-app-route="${i}" class="${i===(demoIndex<=2?0:demoIndex===3?3:demoIndex===8?8:4)?'active':''}">${matrixIcon(icon)}<span>${label}</span></button>`).join('');
 $('.phone').dataset.view=String(demoIndex);$('.phone-stage').classList.toggle('demo-playing',demoRunning&&!motionPaused);
 requestAnimationFrame(updatePointer);
}
function updatePointer(){
 const target=$('#phoneScreen [data-app-next],#phoneScreen [data-app-buy],#phoneScreen [data-app-restart],#phoneScreen [data-plant]');if(!target)return;
 const r=target.getBoundingClientRect(),p=$('.phone').getBoundingClientRect();
 const localScale=fitScale*(document.body.classList.contains('compact')?.77:1);
 const x=(r.left+r.width*.64-p.left)/localScale,y=(r.top+r.height*.5-p.top)/localScale;
 $('#demoCursor').style.left=x+'px';$('#demoCursor').style.top=y+'px';
}
function nextDemo(){if(demoIndex===4)purchased=true;demoIndex=(demoIndex+1)%demoScenes.length;renderDemo();}
function changeSlide(index,initial=false){
 index=Math.max(0,Math.min(slides.length-1,index));if(index===current&&!initial)return;
 if(transitioning){pendingSlide=index;return;}
 transitioning=true;
 const change=()=>{
  current=index;elapsed=0;sceneTime=0;demoElapsed=0;systemIndex=-1;personIndex=-1;lastNamePhase='';
  stage.innerHTML=`<div class="slide-fit">${slides[index].html()}</div>`;stage.classList.remove('leaving');
  $('#pageNumber').textContent=String(index+1).padStart(2,'0');$('#chapterName').textContent=slides[index].name.toUpperCase();$('#prevButton').disabled=index===0;
  $('#nextButton').innerHTML=index===slides.length-1?'Zum Anfang '+matrixIcon('replay'):'Weiter '+matrixIcon('plus');
  $('#deckProgress').style.width=`${(index+1)/slides.length*100}%`;
  $$('#chapterRail button').forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-current',i===index?'step':'false');});
  $$('#chapterMenu button').forEach((b,i)=>b.classList.toggle('active',i===index));
  history.replaceState(null,'','#'+slides[index].id);$('#announcer').textContent=`Kapitel ${index+1}: ${slides[index].name}`;
  if(index===4)showSystem(0);if(index===6)showPerson(0);if(index===5){demoIndex=0;demoRunning=!motionPaused;renderDemo();}
  stage.querySelectorAll('[data-count]').forEach(el=>el.dataset.final=el.textContent);
  mountChapterFilm($('.slide'),index);if(slides[index].id==='ausblick')renderAppQR(stage);fitSlide();applyMotion();updateScene();transitioning=false;
  if(pendingSlide!==null){const target=pendingSlide;pendingSlide=null;changeSlide(target);}
 };
 if(initial||motionPaused)change();else{stage.classList.add('leaving');setTimeout(change,400);}
}
function updateScene(){
 const slide=$('.slide');if(!slide)return;
 slide.style.setProperty('--scene-progress',String(Math.min(1,sceneTime/slides[current].time)));
 if(current===1){
  const t=sceneTime,phase=motionPaused?'joined':t<3600?'lotus':t<6000?'whole':t<12500?'split':t<14900?'closing':'joined';
  if(phase!==lastNamePhase){lastNamePhase=phase;slide.dataset.phase=phase;$('#identityCaption').textContent=phase==='lotus'?'Ein Baum. Seine Geschichte.':phase==='split'?'Bonsai + Pilot. Ein Baum und sein Co-Pilot.':'Dein Bonsai. Dein digitaler Pflegepilot.';}
 }
 if(current===4)showSystem(motionPaused?systemIndex:Math.floor(sceneTime/6300)%systemScenes.length);
 if(current===6)showPerson(motionPaused?personIndex:Math.floor(sceneTime/6600)%peopleScenes.length);
 stage.querySelectorAll('[data-count]').forEach(el=>{const v=+el.dataset.count,d=+el.dataset.decimals||0,t=motionPaused?1:Math.min(1,sceneTime/1800);el.textContent=(v*(1-(1-t)**3)).toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d})+(el.dataset.suffix||'');});
 if(current===0){const h=$('.hero h1'),node=h.firstChild,word='bonsaipilot',t=Math.min(1,sceneTime/1700);node.textContent=motionPaused?word:Array.from(word,(c,i)=>i<Math.floor(t*word.length)?c:'01:+'[(i+Math.floor(sceneTime/100))%4]).join('');}
 if(current===5){
  const progress=demoElapsed/demoScenes[demoIndex].duration;
  $('#demoCursor').style.opacity=demoRunning&&!motionPaused&&progress>.62&&progress<.98?'1':'0';
  $('#demoCursor').style.transform=`translate(-50%,-50%) scale(${progress>.89?.65:1})`;
  $('.phone-stage').style.setProperty('--demo-progress',String(progress));
 }
}
function stopAuto(){auto=false;$('#autoButton').setAttribute('aria-pressed','false');$('#autoLabel').textContent='Autoplay';$('#playIcon').innerHTML=matrixIcon('play');}
function toggleAuto(){auto=!auto;$('#autoButton').setAttribute('aria-pressed',String(auto));$('#autoLabel').textContent=auto?'Pause':'Autoplay';$('#playIcon').innerHTML=matrixIcon(auto?'pause':'play');}
function openDialog(id){stopAuto();$(id).showModal();if(id==='#menuDialog')$('#menuButton').setAttribute('aria-expanded','true');}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}}
function finishLoading(){
 if(booted)return;booted=true;$('#loader').classList.add('loaded');document.body.classList.remove('loading');$('#loader').setAttribute('aria-hidden','true');$('#loadingPercent').textContent='100';$('#loadingBar').style.width='100%';
 setTimeout(()=>{$('#loader').hidden=true;$('#loader').inert=true;},850);sceneTime=0;elapsed=0;chapterTime=0;applyMotion();
}
document.body.classList.add('loading');
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.id==='skipIntro')finishLoading();if(b.hasAttribute('data-skip-chapter'))finishChapterFilm();if(b.id==='chapterAnimationButton')replayChapterFilm();
 if(b.hasAttribute('data-next'))changeSlide(current===slides.length-1?0:current+1);
 if(b.dataset.goto){$$('dialog[open]').forEach(d=>d.close());changeSlide(slides.findIndex(s=>s.id===b.dataset.goto));}
 if(b.hasAttribute('data-close'))b.closest('dialog').close();if(b.hasAttribute('data-sources'))openDialog('#sourcesDialog');
 if(b.hasAttribute('data-replay')){sceneTime=0;systemIndex=-1;personIndex=-1;lastNamePhase='';updateScene();const v=$('.identity-opening video');if(v)v.currentTime=0;}
 if(b.dataset.system!==undefined){sceneTime=+b.dataset.system*6300;showSystem(+b.dataset.system);}
 if(b.dataset.person!==undefined){sceneTime=+b.dataset.person*6600;showPerson(+b.dataset.person);}
 if(b.dataset.demoStage!==undefined){demoRunning=false;demoIndex=+b.dataset.demoStage;renderDemo();}
 if(b.id==='demoPlay'){demoRunning=!demoRunning;renderDemo();}
 if(b.id==='demoRestart'||b.hasAttribute('data-app-restart')){demoIndex=0;demoRunning=!motionPaused;purchased=false;renderDemo();}
 if(b.dataset.plant!==undefined){selectedPlant=+b.dataset.plant;demoIndex=2;renderDemo();}
 if(b.dataset.bundle){selectedBundle=b.dataset.bundle;renderDemo();}
 if(b.hasAttribute('data-app-next'))nextDemo();if(b.hasAttribute('data-app-buy')){purchased=true;nextDemo();}
 if(b.dataset.appRoute!==undefined){demoRunning=false;demoIndex=+b.dataset.appRoute;renderDemo();}
 if(b.dataset.option){const options=b.dataset.option==='light'?['Hell, indirektes Licht','Weniger Tageslicht']:['Ich fange gerade an','Ich habe schon Erfahrung'];b.firstChild.textContent=options.find(x=>!b.textContent.includes(x))+' ';}
});
$('#nextButton').onclick=()=>changeSlide(current===slides.length-1?0:current+1);$('#prevButton').onclick=()=>changeSlide(current-1);$('#autoButton').onclick=toggleAuto;
$('#motionButton').onclick=()=>{motionPaused=!motionPaused;applyMotion();updateScene();};$('#fullscreenButton').onclick=fullscreen;$('#fullscreenButton').innerHTML=matrixIcon('expand');$('#menuButton').innerHTML=matrixIcon('menu');$('#playIcon').innerHTML=matrixIcon('play');$('#chapterAnimationButton').innerHTML=matrixIcon('replay');
$('#sourcesButton').onclick=()=>openDialog('#sourcesDialog');$('#menuButton').onclick=()=>openDialog('#menuDialog');
$$('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d)d.close();});d.addEventListener('close',()=>$('#menuButton').setAttribute('aria-expanded','false'));});
document.addEventListener('keydown',e=>{
 if(e.repeat)return;
 if(!booted){if(e.key==='Escape'||e.key==='Enter')finishLoading();return;}
 if($('dialog[open]')||e.target.matches('input,textarea,select'))return;
 if(e.target.matches('input,textarea,select'))return;
 if(['ArrowRight','PageDown','Enter',' '].includes(e.key)){e.preventDefault();changeSlide(current===slides.length-1?0:current+1);}
 if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();changeSlide(current-1);}
 if(e.key.toLowerCase()==='f')fullscreen();if(e.key==='Home')changeSlide(0);if(e.key==='End')changeSlide(slides.length-1);
});
let touchX=0,touchY=0;
stage.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;touchY=e.changedTouches[0].clientY;},{passive:true});
stage.addEventListener('touchend',e=>{if(e.target.closest('.phone,button,a'))return;const dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;if(Math.abs(dx)>65&&Math.abs(dy)<65)changeSlide(current+(dx<0?1:-1));},{passive:true});
window.addEventListener('hashchange',()=>{const i=slides.findIndex(s=>'#'+s.id===location.hash);if(i>=0)changeSlide(i);});
window.addEventListener('resize',()=>{fitSlide();if(current===5)requestAnimationFrame(updatePointer);resizeMatrix();});
document.addEventListener('visibilitychange',applyMotion);

// A fullscreen cmatrix field is the loading scene, not a blocking fake spinner.
const canvas=$('#loadingMatrix'),ctx=canvas.getContext('2d');let drops=[],matrixWidth=0,matrixHeight=0,matrixFrame=0;
function resizeMatrix(){const d=Math.min(devicePixelRatio||1,2);matrixWidth=innerWidth;matrixHeight=innerHeight;canvas.width=innerWidth*d;canvas.height=innerHeight*d;ctx.setTransform(d,0,0,d,0,0);drops=Array.from({length:Math.ceil(innerWidth/22)},(_,i)=>({x:i*22,y:(i*97)%innerHeight,speed:1+(i%5)*.3}));}
function drawMatrix(dt){
 if(!ctx||motionPaused)return;matrixFrame+=dt;if(matrixFrame<40)return;matrixFrame=0;
 ctx.fillStyle='rgba(27,39,22,.12)';ctx.fillRect(0,0,matrixWidth,matrixHeight);ctx.font='12px Mono,monospace';
 drops.forEach((d,i)=>{d.y+=8*d.speed;if(d.y>matrixHeight+200)d.y=-150;for(let j=0;j<7;j++){ctx.fillStyle=`rgba(225,205,172,${(1-j/7)*.18})`;ctx.fillText('01:+'[(i+j+Math.floor(loaderTime/130))%4],d.x,d.y-j*17);}});
}
resizeMatrix();let last=performance.now();
let readyAssets=false;
Promise.allSettled([document.fonts.ready,...['assets/bonsaipilot-mark.svg','assets/bonsai-matrix-9f307e58ee10.mp4','assets/botanical-matrix.mp4'].map(url=>fetch(url).then(r=>{if(!r.ok)throw Error(url);return r.arrayBuffer();}))]).then(()=>readyAssets=true);
function tick(now){
 const dt=Math.min(100,now-last);last=now;
 if(!document.hidden){
  if(!booted){loaderTime+=dt;drawMatrix(dt);const p=Math.min(readyAssets?100:92,Math.floor(loaderTime/4400*100));$('#loadingPercent').textContent=String(p).padStart(2,'0');$('#loadingBar').style.width=p+'%';$('#loadingLabel').textContent=p<30?'Ein neuer Weg beginnt.':p<60?'Natur und Daten verbinden sich.':p<95?'Deine Präsentation nimmt Gestalt an.':'Bereit für mehr Grün.';if(motionPaused&&readyAssets||readyAssets&&loaderTime>4600||loaderTime>12000)finishLoading();}
  else if(!$('dialog[open]')&&!transitioning){
   const prelude=$('.slide').dataset.overture==='playing';if(prelude){if(!motionPaused)chapterTime+=dt;if(chapterTime>=3900||motionPaused)finishChapterFilm();}else if(!motionPaused)sceneTime+=dt;
   if(!prelude&&current===5&&demoRunning&&!motionPaused){demoElapsed+=dt;if(demoElapsed>=demoScenes[demoIndex].duration)nextDemo();}
   if(auto&&!prelude){elapsed+=dt;if(elapsed>=slides[current].time){if(current===slides.length-1)stopAuto();else changeSlide(current+1);}}
   updateScene();
  }
 }
 $('#autoProgress').style.width=auto?`${Math.min(1,elapsed/slides[current].time)*100}%`:'0%';requestAnimationFrame(tick);
}
const initial=slides.findIndex(s=>'#'+s.id===location.hash);changeSlide(initial<0?0:initial,true);requestAnimationFrame(tick);
