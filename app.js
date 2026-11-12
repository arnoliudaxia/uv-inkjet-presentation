const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const parts = ['supply', 'piezo', 'nozzle'];
const details = {
  supply: ['01 / 墨水供应管道', '墨水沿供应管道进入墨腔，再通向底部喷嘴。实际系统还需控制供墨压力、过滤与脱气；本图只保留单通道。'],
  piezo: ['02 / 压电陶瓷', '压电陶瓷位于墨腔外，通过可变形腔壁传递位移。形变改变墨腔容积并激发压力波，而不是直接接触墨水“挤出一滴”。'],
  nozzle: ['03 / 喷嘴', '墨腔与底部喷嘴直接连通。合适的瞬态压力使液面外凸、拉成液柱，并在惯性与表面张力作用下断滴。']
};
const stages = [
  { title: '补墨与扩容', description: '腔壁向外微移，墨腔容积增大；墨水由供应通路补入。', tag: '扩容' },
  { title: '压缩与压力波', description: '腔壁向内微移，墨腔容积减小；压力扰动向喷嘴传播。', tag: '压缩' },
  { title: '喷出与断滴', description: '喷嘴液面形成液柱，液柱颈缩、断裂，主墨滴离开喷嘴。', tag: '喷出 / 过渡' },
  { title: '恢复与回填', description: '腔壁与液面逐步恢复，残余振荡衰减，准备下一次喷射。', tag: '恢复' }
];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let page = 0;
let revealed = 0;
let selected = null;
let phase = 0;
let playing = !reducedMotion.matches;
let lastTime = 0;
let lastStage = -1;
let raf = null;

function diagram(prefix, interactive = false) {
  const attr = part => interactive ? `role="button" tabindex="0" aria-label="了解${{ supply: '墨水供应管道', piezo: '压电陶瓷', nozzle: '喷嘴' }[part]}" data-part="${part}"` : '';
  return `<svg viewBox="0 0 800 470" role="${interactive ? 'group' : 'img'}" aria-label="UV 压电喷头单通道剖面：左上供墨管道连入中央墨腔，墨腔连到底部喷嘴，金色压电陶瓷位于可变形腔壁外侧">
    <defs>
      <linearGradient id="${prefix}-inkGradient" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1f9db3"/><stop offset=".55" stop-color="#237f99"/><stop offset="1" stop-color="#51dce7"/></linearGradient>
      <linearGradient id="${prefix}-goldGradient" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f6d896"/><stop offset="1" stop-color="#ae7e36"/></linearGradient>
      <marker id="${prefix}-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 1L9 5L0 9" fill="none" stroke="#b2faff" stroke-width="1.5"/></marker>
    </defs>
    <path class="head-outline" d="M210 166H583Q598 166 598 181V336Q598 351 583 351H437L425 387V411H375V387L363 351H210Z"/>
    <path d="M75 94H276V192" fill="none" stroke="#547184" stroke-width="2"/>
    <path d="M75 141H219V205" fill="none" stroke="#547184" stroke-width="2"/>
    <!-- 单一封闭墨水路径：供墨管 → 墨腔 → 喷嘴，无遮断或孤立墨腔。 -->
    <path class="ink-path" style="fill:url(#${prefix}-inkGradient)" d="M75 105H265V205H560V330H425L411 380V408H389V380L375 330H230V130H75Z"/>
    <path class="flow-line" d="M92 118H247V255H350" marker-end="url(#${prefix}-arrow)"/>
    <path class="flow-line" d="M400 275V365" marker-end="url(#${prefix}-arrow)"/>
    <g class="part-group svg-part supply-part" ${attr('supply')}>
      <path d="M75 105H265V200M75 130H230V200" fill="none" stroke="#6df0f4" stroke-width="3"/>
      <path class="leader" d="M156 105V88H100"/><circle cx="156" cy="105" r="3" fill="#74f3f7"/>
      <text class="svg-label" x="78" y="51">01 墨水供应管道</text><text class="svg-sub" x="78" y="72">连续供墨入口</text>
    </g>
    <g class="part-group svg-part piezo-part" ${attr('piezo')}>
      <path class="ceramic" d="M286 174Q415 174 546 174L546 197Q415 197 286 197Z" fill="url(#${prefix}-goldGradient)" stroke="#ffe0a0" stroke-width="1.5"/>
      <path d="M303 177V193M325 177V193M347 177V193M369 177V193M391 177V193M413 177V193M435 177V193M457 177V193M479 177V193M501 177V193M523 177V193" stroke="#654f2c" stroke-width="1" opacity=".5"/>
      <path class="leader" d="M472 173V116H579"/><circle cx="472" cy="173" r="3" fill="#efc575"/>
      <text class="svg-label gold-label" x="488" y="77">02 压电陶瓷</text><text class="svg-sub" x="488" y="98">电信号 → 微小形变</text>
    </g>
    <path class="chamber-wall" d="M265 205Q412 205 560 205" fill="none" stroke="#dae3e8" stroke-width="6"/>
    <path class="leader" d="M552 205H619V231"/><text class="svg-sub" x="608" y="254">可变形腔壁</text>
    <path class="leader" d="M311 273H174V266H107"/><text class="svg-label" x="78" y="234">墨腔</text><text class="svg-sub" x="78" y="255">容纳墨水的空间</text>
    <g class="pressure-visual" opacity="0"><ellipse class="pressure-ring" cx="400" cy="275" rx="60" ry="20"/><ellipse class="pressure-ring" cx="400" cy="295" rx="95" ry="22" opacity=".5"/></g>
    <g class="part-group svg-part nozzle-part" ${attr('nozzle')}>
      <path d="M375 330L389 380V408M425 330L411 380V408" fill="none" stroke="#8cf5f7" stroke-width="3"/>
      <path class="leader" d="M417 390H493V412H544"/><circle cx="417" cy="390" r="3" fill="#74f3f7"/>
      <text class="svg-label" x="552" y="414">03 喷嘴</text><text class="svg-sub" x="552" y="437">液滴形成的出口</text>
    </g>
    <path class="meniscus" d="M389 408Q400 412 411 408" fill="#55e5ed" stroke="#affcff" stroke-width="1.5"/>
    <path class="ligament" d="M393 408Q397 425 396 435Q400 441 404 435Q403 425 407 408Z" fill="#55e5ed" opacity="0"/>
    <g class="drop-motion" opacity="0"><path class="droplet" d="M400 0C397 7 391 12 391 18A9 9 0 0 0 409 18C409 12 403 7 400 0Z"/></g>
    <text class="svg-sub" x="78" y="440">墨水通路：供应管道 → 墨腔 → 喷嘴</text>
  </svg>`;
}
$('#anatomyDiagram').innerHTML = diagram('anatomy', true);
$('#cycleDiagram').innerHTML = diagram('cycle');
$('#waveDiagram').innerHTML = diagram('wave');
$('#stageList').innerHTML = stages.map((stage, i) => `<button class="stage-button" data-stage="${i}" aria-pressed="false"><span class="stage-index">0${i + 1}</span><span><strong>${stage.title}</strong><small>${stage.description}</small></span></button>`).join('');

function renderReveal() {
  parts.forEach((part, i) => {
    const visible = i < revealed;
    const card = $(`.component-card[data-part="${part}"]`);
    card.classList.toggle('revealed', visible);
    card.classList.toggle('selected', selected === part);
    card.setAttribute('aria-pressed', String(selected === part));
    const group = $(`.${part}-part`, $('#anatomyDiagram'));
    group.classList.toggle('muted', !visible);
    group.classList.toggle('selected', selected === part);
    group.setAttribute('aria-pressed', String(selected === part));
  });
  $('#revealCount').textContent = `${revealed} / 3`;
  if (selected) {
    const [title, description] = details[selected];
    $('#partDetail').innerHTML = `<span class="tiny-label">${title}</span><p>${description}</p>`;
  } else {
    $('#partDetail').innerHTML = '<span class="tiny-label">观察提示</span><p>先看完整的墨路：供应管道 → 墨腔 → 底部喷嘴。按 → 或空格键，依次认识三个部件。</p>';
  }
  updateNavigation();
}
function choosePart(part) {
  revealed = Math.max(revealed, parts.indexOf(part) + 1);
  selected = part;
  renderReveal();
}
$$('[data-part]').forEach(el => {
  el.addEventListener('click', () => choosePart(el.dataset.part));
  if (el.tagName.toLowerCase() === 'g') el.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); choosePart(el.dataset.part); }
  });
});
function updateNavigation() {
  $('#previous').disabled = page === 0 && revealed === 0;
  $('#next').disabled = page === 2;
  $('#next').innerHTML = page === 0 && revealed < 3 ? '下一步 <span>→</span>' : page === 2 ? '已到末页 <span>✓</span>' : '下一页 <span>→</span>';
  $('#footerHint').textContent = page === 0 ? (revealed < 3 ? '前进以逐步揭示结构' : '结构已就绪 · 继续观察喷墨循环') : page === 1 ? '选中阶段，可暂停细看' : '概念示意 · 不作为调机依据';
}
function showPage(target, updateHash = true) {
  page = Math.max(0, Math.min(2, target));
  $$('.slide').forEach((slide, i) => { slide.hidden = i !== page; slide.classList.toggle('active', i === page); });
  $$('[data-page]').forEach((button, i) => {
    button.classList.toggle('current', i === page);
    if (i === page) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
  $('#pageNumber').textContent = `0${page + 1} / 03`;
  $('#status').textContent = `第 ${page + 1} 页，共 3 页：${['结构认识', '喷墨循环', '驱动波形'][page]}`;
  if (updateHash && location.hash !== `#${page + 1}`) history.replaceState(null, '', `#${page + 1}`);
  updateNavigation();
  renderAnimation();
  schedule();
}
function forward() {
  if (page === 0 && revealed < 3) choosePart(parts[revealed]);
  else if (page < 2) showPage(page + 1);
}
function backward() {
  if (page === 0 && revealed > 0) { revealed--; selected = revealed ? parts[revealed - 1] : null; renderReveal(); }
  else if (page > 0) showPage(page - 1);
}
$('#previous').addEventListener('click', backward);
$('#next').addEventListener('click', forward);
$$('[data-page]').forEach(button => button.addEventListener('click', () => showPage(Number(button.dataset.page))));
$('.brand').addEventListener('click', event => { event.preventDefault(); showPage(0); });
window.addEventListener('hashchange', () => { if (/^#[1-3]$/.test(location.hash)) showPage(Number(location.hash.slice(1)) - 1, false); });

function updatePlayback() {
  $$('[data-play]').forEach(button => {
    button.textContent = playing ? 'Ⅱ 暂停演示' : '▶ 播放演示';
    button.setAttribute('aria-label', playing ? '暂停喷墨循环及同步波形' : '播放喷墨循环及同步波形');
  });
  $$('.diagram-host').forEach(host => host.classList.toggle('moving', playing && !reducedMotion.matches && page !== 0 && !document.hidden && !$('#helpDialog').open));
}
function setPlaying(value) { playing = value; lastTime = 0; updatePlayback(); schedule(); }
$$('[data-play]').forEach(button => button.addEventListener('click', () => setPlaying(!playing)));
function selectStage(stage) {
  setPlaying(false);
  phase = (stage + .5) / 4;
  renderAnimation();
}
$$('[data-stage]').forEach(button => button.addEventListener('click', () => selectStage(Number(button.dataset.stage))));
$('#nextStage').addEventListener('click', () => selectStage((Math.floor(phase * 4) + 1) % 4));

const wavePoints = [[70,175],[105,175],[145,225],[225,225],[275,90],[340,90],[390,175],[470,175],[515,152],[555,175],[755,175]];
function waveY(x) {
  for (let i = 1; i < wavePoints.length; i++) {
    if (x <= wavePoints[i][0]) {
      const [a, b] = wavePoints[i - 1], [c, d] = wavePoints[i];
      return b + (d - b) * (x - a) / (c - a);
    }
  }
  return 175;
}
function renderAnimation() {
  const stageIndex = Math.min(3, Math.floor(phase * 4));
  const local = phase * 4 - stageIndex;
  // 正负仅描述本图腔壁的运动，不从驱动信号正负推断任何真实喷头极性。
  const displacement = stageIndex === 0 ? -10 * Math.sin(local * Math.PI / 2)
    : stageIndex === 1 ? -10 + 23 * Math.sin(local * Math.PI / 2)
      : stageIndex === 2 ? 13 * (1 - local)
        : -2 * Math.sin(local * 2 * Math.PI) * (1 - local);
  for (const host of [$('#cycleDiagram'), $('#waveDiagram')]) {
    $('.chamber-wall', host).setAttribute('d', `M265 205Q412 ${205 + displacement * 2} 560 205`);
    $('.ceramic', host).setAttribute('d', `M286 174Q415 ${174 + displacement * 1.8} 546 174L546 197Q415 ${197 + displacement * 1.8} 286 197Z`);
    $('.pressure-visual', host).setAttribute('opacity', stageIndex === 1 ? Math.sin(local * Math.PI) * .8 : 0);
    $('.pressure-visual', host).setAttribute('transform', `translate(0 ${stageIndex === 1 ? local * 35 : 0})`);
    const extending = stageIndex === 2 && local < .42;
    $('.ligament', host).setAttribute('opacity', extending ? 1 : 0);
    $('.meniscus', host).setAttribute('d', `M389 408Q400 ${stageIndex === 2 ? 416 : 410 + displacement * .2} 411 408`);
    const drop = $('.drop-motion', host);
    const detached = stageIndex === 2 && local >= .35;
    drop.setAttribute('opacity', detached ? Math.min(1, (1 - local) * 4) : 0);
    drop.setAttribute('transform', `translate(0 ${413 + Math.max(0, local - .35) * 65})`);
    // 改变壁面时同步改变青色腔体上边界，避免壁面与液体之间出现假空腔。
    $('.ink-path', host).setAttribute('d', `M75 105H265V205Q412 ${205 + displacement * 2} 560 205V330H425L411 380V408H389V380L375 330H230V130H75Z`);
  }
  const x = 70 + phase * 685;
  $('#waveCursor path').setAttribute('d', `M${x} 55V259`);
  $('#waveCursor circle').setAttribute('cx', x);
  $('#waveCursor circle').setAttribute('cy', waveY(x));
  if (lastStage !== stageIndex) {
    lastStage = stageIndex;
    $$('[data-stage]').forEach((button, i) => { button.classList.toggle('active', i === stageIndex); button.setAttribute('aria-pressed', String(i === stageIndex)); });
    $('#waveStageNumber').textContent = `0${stageIndex + 1} / 04 · ${stages[stageIndex].tag}`;
    $('#waveStageTitle').textContent = stages[stageIndex].title;
    $('#waveStageDescription').textContent = stages[stageIndex].description;
  }
  updatePlayback();
}
function canAnimate() { return playing && page > 0 && !document.hidden && !$('#helpDialog').open; }
function tick(now) {
  raf = null;
  if (!canAnimate()) { lastTime = 0; return; }
  if (lastTime) phase = (phase + Math.min(now - lastTime, 100) / 8000) % 1;
  lastTime = now;
  renderAnimation();
  raf = requestAnimationFrame(tick);
}
function schedule() {
  if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
  lastTime = 0;
  if (canAnimate()) raf = requestAnimationFrame(tick);
  updatePlayback();
}
document.addEventListener('visibilitychange', schedule);
reducedMotion.addEventListener('change', event => { if (event.matches) setPlaying(false); });

const help = $('#helpDialog');
function openHelp() { if (!help.open) help.showModal(); schedule(); }
$('#helpButton').addEventListener('click', openHelp);
help.addEventListener('close', schedule);
help.addEventListener('click', event => { if (event.target === help) { const r = help.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) help.close(); } });
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if ($('#deck').requestFullscreen) await $('#deck').requestFullscreen();
    else $('#status').textContent = '当前浏览器不支持全屏，请使用浏览器的全屏功能。';
  } catch { $('#status').textContent = '无法进入全屏，请允许全屏权限或使用浏览器全屏功能。'; }
}
$('#fullscreen').addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', () => {
  $('#fullscreen').setAttribute('aria-label', document.fullscreenElement ? '退出全屏' : '进入全屏');
  $('#fullscreen').setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
});
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (help.open) return;
  // 原生按钮保留 Space/Enter 激活语义，避免一次按键既点击又翻页。
  if ((event.key === ' ' || event.key === 'Enter') && event.target.closest('button, a, [role="button"]')) return;
  if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); if (!event.repeat) forward(); }
  else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); if (!event.repeat) backward(); }
  else if (event.key.toLowerCase() === 'f') { event.preventDefault(); if (!event.repeat) toggleFullscreen(); }
  else if (event.key === '?') { event.preventDefault(); openHelp(); }
});
renderReveal();
renderAnimation();
showPage(/^#[1-3]$/.test(location.hash) ? Number(location.hash.slice(1)) - 1 : 0);
