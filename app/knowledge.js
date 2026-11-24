// Prepared guide: resolved entirely in the browser, without an AI request.
// Species facts checked against the four linked Bonsai Empire care guides.
export const questions=[
 {id:'basics',label:'Was braucht diese Art?'},
 {id:'water',label:'Wie gieße ich richtig?'},
 {id:'light',label:'Welcher Standort passt?'},
 {id:'winter',label:'Wie überwintert mein Baum?'},
 {id:'leaves',label:'Warum verändert sich das Laub?'},
 {id:'check',label:'Was soll ich jetzt prüfen?'},
 {id:'soil',label:'Welches Substrat passt?'},
 {id:'feed',label:'Wie dünge ich meinen Baum?'},
 {id:'repot',label:'Wann ist Umtopfen sinnvoll?'},
 {id:'prune',label:'Was ist beim Schneiden wichtig?'},
 {id:'away',label:'Was mache ich vor dem Urlaub?'},
 {id:'readings',label:'Sind das echte Messwerte?'}
];
const species={
 ficus:{
  leaves:'Beim Ficus können wenig Licht und ungünstige Winterbedingungen Blattverlust begünstigen. Prüfe Standort und Substrat, statt automatisch mehr zu gießen.',
  feed:'Bei aktivem Wachstum düngen; im Winter Wachstum und Licht berücksichtigen. Die Dosierung des gewählten Bonsaidüngers beachten.',
  repot:'Beim Ficus ist das Frühjahr ein üblicher Zeitraum. Ob es nötig ist, hängt von Wurzeln und Substrat ab.',
  prune:'Beim Ficus zuerst gesunden Neuaustrieb und die gewünschte Form beurteilen. Große Eingriffe mit fachlicher Anleitung planen.'
 },
 ulme:{
  leaves:'Je nach Herkunft und Winterkultur kann die Chinesische Ulme ihre Blätter behalten oder abwerfen. Plötzliche Veränderungen außerhalb dieses Rhythmus genauer prüfen.',
  feed:'Während des Wachstums passend zum Dünger dosieren. Bei kalter Überwinterung und Winterruhe wird nicht gedüngt.',
  repot:'Das Frühjahr ist ein üblicher Zeitpunkt. Jüngere Ulmen benötigen dies oft früher als ältere; entscheidend ist der tatsächliche Wurzelzustand.',
  prune:'Die Ulme verzweigt sich gut. Zwischen feinem Formschnitt und großen Astschnitten unterscheiden und den Zeitpunkt fachlich abstimmen.'
 },
 juniper:{
  leaves:'Wacholder ist immergrün. Winterliche Farbänderungen sind je nach Art möglich; braunes oder trockenes Laub sollte trotzdem sorgfältig auf Ursachen geprüft werden.',
  feed:'Während der Wachstumszeit geeigneten Bonsaidünger nach Produktangabe verwenden. Dünger ersetzt weder Licht noch passende Wasserversorgung.',
  repot:'Beim Wacholder ist das zeitige Frühjahr üblich. Wurzeln nicht pauschal stark kürzen; Zustand und Erfahrung berücksichtigen.',
  prune:'Nicht wie eine Hecke scheren. An erhaltenen Ästen muss grünes Laub bleiben: Kahle Holzbereiche treiben beim Wacholder nicht zuverlässig wieder aus.'
 },
 ahorn:{
  leaves:'Herbstlicher Blattfall gehört zum Japanischen Ahorn. Bei trockenen Blatträndern im Sommer Hitze, starke Sonne und Wasserversorgung zusammen prüfen.',
  feed:'Geeigneten Bonsaidünger maßvoll nach Produktangabe einsetzen. Übermäßig stickstoffreiche Düngung kann große Blätter und lange Triebe fördern.',
  repot:'Wurzelraum und Substratzustand prüfen. Beim Ahorn wachsen Wurzeln kräftig; Zeitpunkt und Wurzelarbeit am konkreten Baum fachlich planen.',
  prune:'Feine Triebe und große Äste benötigen unterschiedliche Behandlung. Starke Schnitte und Blattschnitt belasten den Baum; nicht ohne Plan beginnen.'
 }
};
export function matchQuestion(text){const normal=s=>s.normalize('NFC').toLocaleLowerCase('de').replace(/[?!.,:;]/g,'').replace(/\s+/g,' ').trim();return questions.find(q=>normal(q.label)===normal(text));}
export function answerQuestion(id,tree,game){
 const facts=species[tree.id];
 if(!facts)return null;
 const fixed={
  basics:`${tree.name}: ${tree.description}\n\n${tree.light}`,
  water:`${tree.water}\n\nPrüfe die echte Erde vor jeder Entscheidung. Ein fester Kalender und die Spielwerte sagen nicht, ob dein Baum jetzt Wasser braucht.`,
  light:`${tree.light}\n\n${tree.place==='outside'?'Dieser Baum gehört dauerhaft nach draußen, auch wenn er auf einem Beispielfoto im Innenraum steht.':'Beurteile Licht und Temperatur am tatsächlichen Standort.'}`,
  winter:tree.season,
  leaves:facts.leaves,
  soil:tree.substrate,
  feed:facts.feed,
  repot:facts.repot,
  prune:facts.prune,
  away:'Organisiere eine Person, die das echte Substrat und den Standort regelmäßig prüft. Zeige ihr den Baum vorher und erkläre das Gießen. Nicht vorsorglich im Wasser stehen lassen. Die Demo kann deinen Baum weder überwachen noch automatisch versorgen.',
  readings:'Nein. Feuchte, Licht und Temperatur sind erfundene Spielwerte. Das Foto zeigt einen Beispielbaum. Die Demo misst, erkennt und diagnostiziert nichts am echten Baum. Deine Pflegeaktionen ändern nur den lokalen Spielstand.'
 };
 if(id==='check'){
  const situation={dry:'Im Spiel ist das Substrat trocken. Prüfe zuerst die echte Erde; der Spielwert ist keine Gießanweisung.',dark:'Im Spiel gibt es wenig Licht. Vergleiche den echten Standort mit den Bedürfnissen dieser Art.',heat:'Im Spiel ist es warm. Prüfe am echten Baum Standort, Hitze und Substrat gemeinsam.',balanced:'Die Spielwerte wirken ruhig. Schau den echten Baum trotzdem aufmerksam an.'}[game.scenario]||'';
  return `${situation}\n\nDein nächster Demo-Schritt: ${!game.checked?'Substrat ansehen.':!game.placed?'Standort prüfen.':!game.noted?'Eine Beobachtung im Journal merken.':'Der heutige Pflege-Check ist vollständig.'}`;
 }
 return fixed[id]||null;
}
