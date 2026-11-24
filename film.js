'use strict';

// Decode the white-backed masters into actual transparent pixels. SVG filters on
// hardware-decoded <video> are unreliable in some mobile browsers/WebViews.
const forestFilms = new Map();
function renderForestFilm(video) {
 if (document.documentElement.dataset.theme === 'light' || forestFilms.has(video)) return;
 for (const [old, state] of forestFilms) {
  if (!old.isConnected) {
   old.pause();state.stop();forestFilms.delete(old);
  }
 }
 const canvas = document.createElement('canvas');
 canvas.className = 'forest-film-frame';canvas.setAttribute('aria-hidden', 'true');
 canvas.style.pointerEvents = 'none';
 video.after(canvas);
 const ctx = canvas.getContext('2d', {willReadFrequently: true});
 if (!ctx) {canvas.remove();return;}
 const visibility = video.style.visibility;
 video.style.visibility = 'hidden';
 let stopped = false, callback = null, lastTime = -1;
 function align() {
  const css = getComputedStyle(video);
  Object.assign(canvas.style, {
   position: 'absolute', left: video.offsetLeft + 'px', top: video.offsetTop + 'px',
   width: video.offsetWidth + 'px', height: video.offsetHeight + 'px',
   transform: css.transform, transformOrigin: css.transformOrigin,
   objectFit: css.objectFit, objectPosition: css.objectPosition,
   opacity: css.opacity, zIndex: css.zIndex, borderRadius: css.borderRadius
  });
 }
 function draw(source) {
  if (stopped || !video.isConnected) return;
  const width = source.videoWidth || source.naturalWidth;
  const height = source.videoHeight || source.naturalHeight;
  if (!width || !height) return;
  const scale = Math.min(1, 960 / width);
  const w = Math.round(width * scale), h = Math.round(height * scale);
  if (canvas.width !== w || canvas.height !== h) {canvas.width = w;canvas.height = h;}
  ctx.drawImage(source, 0, 0, w, h);
  const frame = ctx.getImageData(0, 0, w, h), pixels = frame.data;
  for (let i = 0; i < pixels.length; i += 4) {
   const luminance = (.2126 * pixels[i] + .7152 * pixels[i+1] + .0722 * pixels[i+2]) / 255;
   pixels[i+3] *= Math.max(0, Math.min(1, (1 - luminance * 1.012) * 1.08 - .08));
   pixels[i] = 225;pixels[i+1] = 205;pixels[i+2] = 172;
  }
  ctx.putImageData(frame, 0, 0);
 }
 function cancel() {
  if (callback === null) return;
  if (video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(callback);
  else cancelAnimationFrame(callback);
  callback = null;
 }
 function tick() {
  callback = null;
  if (stopped || !video.isConnected) return;
  if (video.readyState >= 2 && video.currentTime !== lastTime) {
   draw(video);lastTime = video.currentTime;
  }
  if (!video.paused && !video.ended && !document.hidden) schedule();
 }
 function schedule() {
  if (callback !== null || stopped) return;
  callback = video.requestVideoFrameCallback ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick);
 }
 function refresh() {if (video.readyState >= 2) {draw(video);lastTime = video.currentTime;}}
 const observer = new ResizeObserver(align);observer.observe(video);
 const events = {loadeddata: refresh, seeked: refresh, pause: () => {cancel();refresh();}, play: schedule};
 for (const [event, listener] of Object.entries(events)) video.addEventListener(event, listener);
 window.addEventListener('resize', align);
 forestFilms.set(video, {stop() {
  stopped = true;cancel();observer.disconnect();window.removeEventListener('resize', align);
  for (const [event, listener] of Object.entries(events)) video.removeEventListener(event, listener);
  canvas.remove();video.style.visibility = visibility;
 }});
 align();
 if (video.readyState >= 2) refresh();
 else if (video.poster) {
  const poster = new Image();
  poster.onload = () => {if (video.readyState < 2) draw(poster);};
  poster.src = video.poster;
 }
 if (!video.paused) schedule();
}
