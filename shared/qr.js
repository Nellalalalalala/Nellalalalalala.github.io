/* The URL is derived at render time, so a new Cloudflare address is respected. */
window.renderAppQR=function(root=document){
 const url=new URL('/app/',location.origin).href;
 root.querySelectorAll('[data-app-qr]').forEach(el=>{
  const code=qrcode(0,'M');code.addData(url);code.make();
  el.innerHTML=code.createSvgTag({cellSize:5,margin:20,scalable:true});
  el.dataset.url=url;el.setAttribute('role','img');el.setAttribute('aria-label','QR-Code: BonsaiPilot App-Demo öffnen');
 });
 root.querySelectorAll('[data-app-url]').forEach(a=>{a.href=url;});
};
