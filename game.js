(()=>{
'use strict';

/* -------------------------------------------------------------
   PPOLPPOL WORLD · Craft & Explore
   A standalone cozy-world prototype. No chat UI by design.
-------------------------------------------------------------- */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
const rnd=(a,b)=>a+Math.random()*(b-a);
const TAU=Math.PI*2;
const WORLD_W=3300, WORLD_H=2050, SHORE_Y=1690, PLAYER_LIMIT_Y=1648;
const canvas=$('#game'), ctx=canvas.getContext('2d');
const mini=$('#minimap'), mctx=mini.getContext('2d');
const creatorCanvas=$('#creatorCanvas'), cctx=creatorCanvas.getContext('2d');
let VW=1600,VH=1000,DPR=1;

const HEADS=[
{id:'h01',name:'데보라',hair:'#f07820'},{id:'h02',name:'루시아',hair:'#f8d028'},{id:'h03',name:'루시안',hair:'#f8d028'},
{id:'h04',name:'모세',hair:'#3060f8'},{id:'h05',name:'사라',hair:'#111111'},{id:'h06',name:'아리엘',hair:'#3060f8'},
{id:'h07',name:'아셔',hair:'#f058d0'},{id:'h08',name:'에덴',hair:'#30b058'},{id:'h09',name:'우리엘',hair:'#f07820'},
{id:'h10',name:'이브',hair:'#30b058'},{id:'h11',name:'크로스',hair:'#111111'},{id:'h12',name:'하나',hair:'#f058d0'}
].map(h=>({...h,front:`assets/heads/front/${h.id}.png`,left:`assets/heads/left/${h.id}.png`,back:`assets/heads/back/${h.id}.png`}));
const OUTFITS=[
{id:'mint',name:'민트',shirt:'#8dbd93',pants:'#5d7d6f',accent:'#e9f3dc'},
{id:'sky',name:'하늘',shirt:'#86bad3',pants:'#637da0',accent:'#e7f4f6'},
{id:'peach',name:'복숭아',shirt:'#e99c95',pants:'#9d6d69',accent:'#fff0df'},
{id:'lemon',name:'레몬',shirt:'#e9c663',pants:'#9b8550',accent:'#fff6c9'},
{id:'lilac',name:'라일락',shirt:'#b79bd2',pants:'#756c99',accent:'#f3eafa'},
{id:'charcoal',name:'차콜',shirt:'#677069',pants:'#454d49',accent:'#e8e9df'}
];
const imgCache=new Map();
function loadImage(src){
  if(imgCache.has(src)) return imgCache.get(src);
  const im=new Image(); im.src=src; imgCache.set(src,im); return im;
}
HEADS.forEach(h=>{loadImage(h.front);loadImage(h.left);loadImage(h.back)});

const HEAD_VISUAL_META={"h01":{"front":[13,51,243,204],"left":[68,61,226,187],"back":[13,51,243,204]},"h02":{"front":[52,24,203,232],"left":[66,25,216,199],"back":[52,24,203,232]},"h03":{"front":[20,24,236,232],"left":[68,66,206,182],"back":[20,24,236,232]},"h04":{"front":[22,24,234,232],"left":[49,48,226,211],"back":[22,24,234,232]},"h05":{"front":[49,24,207,232],"left":[53,32,193,218],"back":[49,24,207,232]},"h06":{"front":[13,33,243,222],"left":[64,50,212,205],"back":[13,33,243,222]},"h07":{"front":[13,28,243,228],"left":[51,45,228,198],"back":[13,28,243,228]},"h08":{"front":[13,26,243,230],"left":[54,64,223,183],"back":[13,26,243,230]},"h09":{"front":[13,38,243,218],"left":[47,46,227,190],"back":[13,38,243,218]},"h10":{"front":[25,24,230,232],"left":[54,61,228,195],"back":[25,24,230,232]},"h11":{"front":[13,29,243,226],"left":[47,46,232,209],"back":[13,29,243,226]},"h12":{"front":[49,24,206,232],"left":[26,49,240,206],"back":[49,24,206,232]}};
const LONG_HAIR=new Set(['h02','h05','h06','h10','h12']);
const HEAD_TARGET_H=96, HEAD_MAX_W=145;

const palette={
 grass0:'#e7edb3',grass1:'#dce7a6',grass2:'#d2df98',grass3:'#c7d68e',grassInk:'#92a86d',grassDeep:'#799660',
 treeA:'#8fc27f',treeB:'#77ae6c',treeC:'#5d9259',treeHi:'#abd39b',trunk:'#a87755',trunkDark:'#79523d',
 outline:'#5a574f',cream:'#fffaf0',water0:'#c1eaf1',water1:'#91d8e7',water2:'#6ec6df',sand:'#fff1cb',
 rock:'#a7acab',rock2:'#7f8684',rockHi:'#d0d3d0',pink:'#ee9ca1',yellow:'#edcb6b',purple:'#a98fce',soil:'#b99a6b'
};
const settings={ambient:true,shake:true,sound:false};

function resize(){
  const r=canvas.getBoundingClientRect(); DPR=Math.min(2,window.devicePixelRatio||1); VH=1000; VW=Math.round(clamp(VH*(r.width/Math.max(1,r.height)),620,2100));
  canvas.width=Math.round(VW*DPR);canvas.height=Math.round(VH*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize',resize);resize();

/* ---------- persistence ---------- */
const SAVE_KEY='ppolppol-craft-v4';
let saved={}; try{saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')||{}}catch(e){}
const defaultInv={wood:0,stone:0,berry:0,fish:0,coin:0,slimeGel:0,campfireKit:0};
const defaultGear={woodSword:false,stonePick:false,stoneAxe:false};
const defaultStats={trees:0,rocks:0,bushes:0,fishCaught:0,slimes:0,crafted:0,campfires:0};
const player={
 id:Math.random().toString(36).slice(2,10), name:saved.name||'Mongle', head:saved.head||'h08', outfit:saved.outfit||'mint',
 x:saved.x||1650,y:saved.y||990,vx:0,vy:0,r:21,speed:245,dir:saved.dir||'down', state:'idle',stateUntil:0,
 reaction:'',reactionUntil:0,actionTarget:null,actionKind:'',actionHit:false,
 selected:saved.selected||'hand', inv:{...defaultInv,...saved.inv}, gear:{...defaultGear,...saved.gear},stats:{...defaultStats,...saved.stats},
 xp:saved.xp||0,level:saved.level||1, discovered:{tree:true,rock:true,bush:false,fish:false,slime:false,campfire:false,butterfly:true,...saved.discovered},
 completed:{...saved.completed}, completedRewards:{...saved.completedRewards}, lastCollision:0
};
const placedCampfires=Array.isArray(saved.campfires)?saved.campfires:[];
function saveGame(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({name:player.name,head:player.head,outfit:player.outfit,x:Math.round(player.x),y:Math.round(player.y),dir:player.dir,selected:player.selected,inv:player.inv,gear:player.gear,stats:player.stats,xp:player.xp,level:player.level,discovered:player.discovered,completed:player.completed,completedRewards:player.completedRewards,campfires:placedCampfires.slice(-12)}))}catch(e){}
}
setInterval(saveGame,5000);window.addEventListener('beforeunload',saveGame);

/* ---------- world ---------- */
const world={trees:[],rocks:[],bushes:[],flowers:[],grass:[],daisies:[],mushrooms:[],signs:[],logs:[],slimes:[],butterflies:[],particles:[],ripples:[],leaves:[],peers:new Map(),workbench:{x:1420,y:880}};
function seeded(seed){let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296)}
const sr=seeded(84621);
const reserved=(x,y)=>dist(x,y,1650,990)<260 || dist(x,y,world.workbench.x,world.workbench.y)<150;
for(let i=0;i<23;i++){let x,y;do{x=150+sr()*(WORLD_W-300);y=150+sr()*1320}while(reserved(x,y));world.trees.push({id:'t'+i,x,y,r:58+sr()*20,hp:3,max:3,dead:false,respawn:0,shake:0,fall:0,phase:sr()*TAU,variant:i%3});}
for(let i=0;i<17;i++){let x,y;do{x=130+sr()*(WORLD_W-260);y=180+sr()*1330}while(reserved(x,y));world.rocks.push({id:'r'+i,x,y,r:27+sr()*12,hp:3,max:3,dead:false,respawn:0,shake:0,phase:sr()*TAU});}
for(let i=0;i<15;i++){let x=140+sr()*(WORLD_W-280),y=170+sr()*1320;world.bushes.push({id:'b'+i,x,y,r:36+sr()*12,ready:true,respawn:0,phase:sr()*TAU,berries:2+Math.floor(sr()*3)});}
for(let i=0;i<130;i++)world.grass.push({x:45+sr()*(WORLD_W-90),y:70+sr()*1510,s:.65+sr()*.7,phase:sr()*TAU});
for(let i=0;i<38;i++)world.flowers.push({x:70+sr()*(WORLD_W-140),y:95+sr()*1450,c:['#fff','#f5c2cb','#ffe7a5','#d9c7ef'][i%4],s:.75+sr()*.55,phase:sr()*TAU});
for(let i=0;i<22;i++)world.daisies.push({x:80+sr()*(WORLD_W-160),y:100+sr()*1430,phase:sr()*TAU});
for(let i=0;i<12;i++)world.mushrooms.push({x:100+sr()*(WORLD_W-200),y:140+sr()*1380,c:i%2?'#e9a798':'#efc96e'});
for(let i=0;i<12;i++)world.butterflies.push({x:200+sr()*(WORLD_W-400),y:180+sr()*1150,baseX:0,baseY:0,phase:sr()*TAU,speed:.25+sr()*.35,c:i%2?'#e9a9bc':'#efcf77'});
world.butterflies.forEach(b=>{b.baseX=b.x;b.baseY=b.y});
world.signs=[{x:1120,y:1010,dir:1},{x:2220,y:1280,dir:-1},{x:620,y:610,dir:1}];
world.logs=[{x:1880,y:650,rot:.18},{x:820,y:1210,rot:-.16},{x:2650,y:430,rot:.3}];
world.slimes=[
{id:'s0',x:2380,y:830,hp:2,max:2,phase:.3,vx:45,vy:25,dead:false,respawn:0,hit:0,c:'#b49ad3'},
{id:'s1',x:760,y:760,hp:2,max:2,phase:1.8,vx:-35,vy:38,dead:false,respawn:0,hit:0,c:'#9ec6a4'},
{id:'s2',x:2700,y:1220,hp:2,max:2,phase:3.1,vx:38,vy:-28,dead:false,respawn:0,hit:0,c:'#e7a3b0'},
{id:'s3',x:1100,y:360,hp:2,max:2,phase:4.7,vx:28,vy:44,dead:false,respawn:0,hit:0,c:'#9db9da'}
];

/* ---------- input ---------- */
const keys=new Set(), pressed=new Set();
window.addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();
  if(!keys.has(e.key.toLowerCase()))pressed.add(e.key.toLowerCase()); keys.add(e.key.toLowerCase());
},{passive:false});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function keyDown(...names){return names.some(n=>keys.has(n))} function keyPressed(...names){return names.some(n=>pressed.has(n))}
let joy={x:0,y:0,active:false,id:null};
const joyEl=$('#joystick'),joyKnob=$('#joyKnob');
function joyMove(clientX,clientY){const r=joyEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=clientX-cx,dy=clientY-cy,m=Math.hypot(dx,dy)||1,max=r.width*.3,s=Math.min(max,m);joy.x=dx/m*(s/max);joy.y=dy/m*(s/max);joyKnob.style.transform=`translate(${joy.x*32}px,${joy.y*32}px)`}
joyEl?.addEventListener('pointerdown',e=>{joy.active=true;joy.id=e.pointerId;joyEl.setPointerCapture(e.pointerId);joyMove(e.clientX,e.clientY)});
joyEl?.addEventListener('pointermove',e=>{if(joy.active&&e.pointerId===joy.id)joyMove(e.clientX,e.clientY)});
function joyEnd(e){if(joy.active&&(!e||e.pointerId===joy.id)){joy.active=false;joy.x=joy.y=0;joyKnob.style.transform=''}}joyEl?.addEventListener('pointerup',joyEnd);joyEl?.addEventListener('pointercancel',joyEnd);

/* ---------- UI helpers ---------- */
const ui={
 name:$('#playerNameLabel'),level:$('#levelText'),xp:$('#xpText'),xpFill:$('#xpFill'),peer:$('#peerText'),portrait:$('#portraitHead'),wood:$('#woodCount'),stone:$('#stoneCount'),berry:$('#berryCount'),fish:$('#fishCount'),coin:$('#coinCount'),
 invGrid:$('#inventoryGrid'),recipes:$('#recipeList'),quests:$('#questList'),guide:$('#guideGrid'),hotbar:$('#hotbar'),hotbarLabel:$('#hotbarLabel'),craftDot:$('#craftDot'),coord:$('#coordText'),
 context:$('#contextPill'),contextIcon:$('#contextIcon'),contextTitle:$('#contextTitle'),contextSub:$('#contextSub'),contextKey:$('#contextKey'),toast:$('#toastStack'),float:$('#floatLayer'),
 qTitle:$('#questPeekTitle'),qSub:$('#questPeekSub'),qFill:$('#questPeekFill'),fishUI:$('#fishingUi'),fishGood:$('#fishGood'),fishCursor:$('#fishCursor'),fishHint:$('#fishHint')
};
let openPanel=null, invTab='all', creatorOpen=false, previewDir='down', lastUIHash='';
function openPanelBy(name){
  $$('.panel').forEach(p=>p.classList.remove('show'));$$('.rail-btn[data-panel]').forEach(b=>b.classList.remove('active'));
  if(openPanel===name){openPanel=null;return}
  openPanel=name; $(`#panel-${name}`)?.classList.add('show'); $(`.rail-btn[data-panel="${name}"]`)?.classList.add('active');
  if(name==='inventory')renderInventory(); if(name==='craft')renderRecipes(); if(name==='quests')renderQuests(); if(name==='guide')renderGuide();
}
$$('.rail-btn[data-panel]').forEach(b=>b.addEventListener('click',()=>openPanelBy(b.dataset.panel)));$$('[data-close]').forEach(b=>b.addEventListener('click',()=>{if(openPanel)openPanelBy(openPanel)}));
$$('[data-invtab]').forEach(b=>b.addEventListener('click',()=>{invTab=b.dataset.invtab;$$('[data-invtab]').forEach(x=>x.classList.toggle('active',x===b));renderInventory()}));
function toast(title,sub='',icon='✦'){
  const el=document.createElement('div');el.className='toast';el.innerHTML=`<div class="toast-icon">${icon}</div><div><strong></strong><span></span></div>`;el.querySelector('strong').textContent=title;el.querySelector('span').textContent=sub;ui.toast.appendChild(el);setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),260)},2200);
}
function worldToScreen(x,y){return{x:x-camera.x+VW/2+camera.shakeX,y:y-camera.y+VH/2+camera.shakeY}}
function floatMsg(x,y,text){const p=worldToScreen(x,y),el=document.createElement('div');el.className='float-msg';el.textContent=text;el.style.left=(p.x/VW*100)+'%';el.style.top=(p.y/VH*100)+'%';ui.float.appendChild(el);setTimeout(()=>el.remove(),1150)}
function beep(freq=540,dur=.06,vol=.025,type='sine'){if(!settings.sound)return;try{const ac=beep.ac||(beep.ac=new(window.AudioContext||window.webkitAudioContext)());const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+dur)}catch(e){}}
function shake(str=7){if(!settings.shake)return;camera.shake=Math.max(camera.shake,str)}
function addXP(n){player.xp+=n;let need=xpNeed(player.level);while(player.xp>=need){player.xp-=need;player.level++;toast(`레벨 ${player.level}!`,'초원에서 할 수 있는 일이 조금 더 늘었어요.','★');beep(740,.14,.035);need=xpNeed(player.level)}syncUI()}
function xpNeed(l){return 80+(l-1)*45}
let swordReadyNotified=false;
function addInv(k,n){
  const before=player.inv[k]||0;
  player.inv[k]=Math.max(0,before+n);
  syncUI();
  if(openPanel==='craft')renderRecipes();
  if(k==='wood'&&!player.gear.woodSword&&before<6&&player.inv.wood>=6&&!swordReadyNotified){
    swordReadyNotified=true;toast('나무검을 만들 수 있어요!','제작 가방에서 반짝이는 나무검을 눌러 보세요.','✨');
  }
}

const ITEM_META={
 wood:{name:'나무',icon:'🪵',type:'materials',desc:'나무검과 도구의 기본 재료'},stone:{name:'돌',icon:'🪨',type:'materials',desc:'튼튼한 도구를 만드는 재료'},berry:{name:'베리',icon:'🍓',type:'materials',desc:'수풀에서 얻는 달콤한 열매'},fish:{name:'물고기',icon:'🐟',type:'materials',desc:'물가에서 낚을 수 있어요'},slimeGel:{name:'슬라임 젤',icon:'🫧',type:'materials',desc:'슬라임이 가끔 남기는 말랑한 재료'},coin:{name:'코인',icon:'🪙',type:'materials',desc:'모험 보상으로 얻는 코인'},
 woodSword:{name:'나무검',icon:'🗡️',type:'gear',desc:'슬라임과 놀기 위한 첫 무기'},stonePick:{name:'돌 곡괭이',icon:'⛏️',type:'gear',desc:'돌을 더 빠르게 캘 수 있어요'},stoneAxe:{name:'돌 도끼',icon:'🪓',type:'gear',desc:'나무를 두 배 빠르게 벨 수 있어요'},campfireKit:{name:'모닥불 키트',icon:'🔥',type:'gear',desc:'원하는 곳에 따뜻한 모닥불을 놓아요'}
};
const RECIPES=[
{id:'woodSword',name:'나무검',icon:'🗡️',desc:'나무 6개로 만드는 첫 무기. 슬라임을 퐁! 하고 밀어낼 수 있어요.',cost:{wood:6},once:true},
{id:'stonePick',name:'돌 곡괭이',icon:'⛏️',desc:'돌을 한 번에 더 많이 캘 수 있는 튼튼한 곡괭이.',cost:{wood:4,stone:6},once:true},
{id:'stoneAxe',name:'돌 도끼',icon:'🪓',desc:'나무를 두 배 빠르게 벨 수 있는 업그레이드 도끼.',cost:{wood:5,stone:5},once:true},
{id:'campfireKit',name:'모닥불 키트',icon:'🔥',desc:'초원 어디든 작은 휴식 장소를 만들어요.',cost:{wood:8,stone:6},once:false},
{id:'berryJam',name:'베리잼',icon:'🍯',desc:'베리를 달콤하게 가공해서 코인과 경험치를 얻어요.',cost:{berry:5},once:false},
{id:'fishSkewer',name:'생선 꼬치',icon:'🍢',desc:'잡은 물고기를 맛있게 구워 더 큰 보상을 받아요.',cost:{fish:2,wood:1},once:false}
];
function canCraft(r){return Object.entries(r.cost).every(([k,v])=>(player.inv[k]||0)>=v)}
function owns(r){return r.once && !!player.gear[r.id]}
function craft(r){
  if(owns(r)){toast('이미 가지고 있어요',`${r.name}은(는) 한 번만 만들면 돼요.`,r.icon);return}
  if(!canCraft(r)){
    const missing=Object.entries(r.cost).filter(([k,v])=>(player.inv[k]||0)<v).map(([k,v])=>`${ITEM_META[k]?.name||k} ${v-(player.inv[k]||0)}개`).join(' · ');
    toast('재료가 조금 부족해요',missing||'재료를 더 모아 주세요.','🧺');return;
  }
  for(const[k,v]of Object.entries(r.cost)){player.inv[k]=Math.max(0,(player.inv[k]||0)-v)}
  player.stats.crafted++;
  if(r.id==='berryJam'){addInv('coin',10);addXP(12);toast('베리잼 완성!','코인 +10 · XP +12','🍯')}
  else if(r.id==='fishSkewer'){addInv('coin',18);addXP(16);toast('생선 꼬치 완성!','코인 +18 · XP +16','🍢')}
  else if(r.id==='campfireKit'){addInv('campfireKit',1);addXP(14);toast('모닥불 키트 완성!','핫바에서 선택한 뒤 E로 설치해요.','🔥')}
  else{
    player.gear[r.id]=true;addXP(r.id==='woodSword'?24:30);
    toast(`${r.name} 완성!`,r.id==='woodSword'?'나무 향이 나는 조그만 검이에요. 이제 슬라임을 퐁!':'채집이 훨씬 가벼워졌어요.',r.icon);
    if(r.id==='woodSword'){player.selected='sword';swordReadyNotified=true;spawnBurst(player.x,player.y-56,'#f2ce78',18,'spark');floatMsg(player.x,player.y-92,'✨ 나무검 완성!')}
  }
  updateQuests();syncUI();renderRecipes();renderInventory();renderHotbar();saveGame();beep(720,.13,.038,'triangle')
}
function renderRecipes(){
  ui.recipes.innerHTML='';
  RECIPES.forEach((r,idx)=>{
    const ok=canCraft(r),owned=owns(r);const el=document.createElement('div');
    el.className='recipe'+(owned?' owned':'')+(ok&&!owned?' ready':'')+(r.id==='woodSword'?' starter-recipe':'');
    const costs=Object.entries(r.cost).map(([k,v])=>`<span class="cost ${(player.inv[k]||0)>=v?'ok':'bad'}">${ITEM_META[k]?.icon||''} ${player.inv[k]||0}/${v}</span>`).join('');
    const badge=r.id==='woodSword'&&!owned?'<span class="recipe-badge">첫 제작</span>':owned?'<span class="recipe-badge owned-badge">완성</span>':'';
    el.innerHTML=`<div class="recipe-art">${r.icon}${ok&&!owned?'<i class="recipe-spark">✦</i>':''}</div><div class="recipe-copy"><div class="recipe-title-row"><h3>${r.name}</h3>${badge}</div><p>${r.desc}</p><div class="costs">${costs}</div></div><button class="craft-btn" ${owned?'disabled':''}>${owned?'보유중':ok?'✨ 만들기':'재료 부족'}</button>`;
    el.querySelector('button').addEventListener('click',()=>craft(r));ui.recipes.appendChild(el)
  })
}
function renderInventory(){
  const rows=[['wood',player.inv.wood],['stone',player.inv.stone],['berry',player.inv.berry],['fish',player.inv.fish],['slimeGel',player.inv.slimeGel],['coin',player.inv.coin],['campfireKit',player.inv.campfireKit],['woodSword',player.gear.woodSword?1:0],['stonePick',player.gear.stonePick?1:0],['stoneAxe',player.gear.stoneAxe?1:0]];
  ui.invGrid.innerHTML='';let shown=0;rows.filter(([k])=>invTab==='all'||ITEM_META[k].type===invTab).forEach(([k,n])=>{const m=ITEM_META[k];const el=document.createElement('div');el.className='inv-item'+(n<=0?' empty':'')+(m.type==='gear'&&n?' rarity':'');el.title=m.desc;el.innerHTML=`<div class="item-art">${m.icon}</div><strong>${m.name}</strong><span class="count">${n}</span>`;ui.invGrid.appendChild(el);shown++});while(shown%4){const e=document.createElement('div');e.className='inv-item empty';ui.invGrid.appendChild(e);shown++}$('#bagUsage').textContent=`${rows.filter(([,n])=>n>0).length} / 24`;
}
const QUESTS=[
{id:'wood',title:'첫 장작',desc:'나무를 베어 나무 6개 모으기',goal:()=>player.inv.wood+spentWood()>=6,progress:()=>Math.min(6,player.stats.trees*3),max:6,reward:12},
{id:'sword',title:'나무검 장인',desc:'나무검을 하나 제작하기',goal:()=>player.gear.woodSword,progress:()=>player.gear.woodSword?1:0,max:1,reward:18},
{id:'stone',title:'반짝이는 돌',desc:'돌을 6개 이상 캐보기',goal:()=>player.stats.rocks>=2||player.inv.stone>=6,progress:()=>Math.min(6,player.stats.rocks*3),max:6,reward:14},
{id:'slime',title:'슬라임 퐁!',desc:'슬라임 2마리 쓰러뜨리기',goal:()=>player.stats.slimes>=2,progress:()=>Math.min(2,player.stats.slimes),max:2,reward:22},
{id:'fish',title:'물가의 친구',desc:'물고기 2마리 낚기',goal:()=>player.stats.fishCaught>=2,progress:()=>Math.min(2,player.stats.fishCaught),max:2,reward:18},
{id:'campfire',title:'작은 캠프',desc:'초원에 모닥불 하나 설치하기',goal:()=>player.stats.campfires>=1,progress:()=>Math.min(1,player.stats.campfires),max:1,reward:25}
];
function spentWood(){return player.gear.woodSword?6:0}
function updateQuests(){
  QUESTS.forEach(q=>{const done=q.goal();player.completed[q.id]=done;if(done&&!player.completedRewards[q.id]){player.completedRewards[q.id]=true;addInv('coin',q.reward);addXP(q.reward);toast(`완료 · ${q.title}`,`코인 +${q.reward} · XP +${q.reward}`,'✓')}});renderQuestPeek();if(openPanel==='quests')renderQuests();
}
function renderQuests(){ui.quests.innerHTML='';QUESTS.forEach(q=>{const p=q.progress(),done=q.goal();const el=document.createElement('div');el.className='quest-row'+(done?' done':'');el.innerHTML=`<div class="quest-check">${done?'✓':'✦'}</div><div><h3>${q.title}</h3><p>${q.desc}</p><div class="qprogress"><i style="width:${clamp(p/q.max*100,0,100)}%"></i></div></div><div class="quest-reward">🪙 ${q.reward}</div>`;ui.quests.appendChild(el)})}
function renderQuestPeek(){const q=QUESTS.find(q=>!q.goal())||QUESTS[QUESTS.length-1],p=q.progress();ui.qTitle.textContent=q.goal()?'오늘의 목표 완료!':q.title;ui.qSub.textContent=q.goal()?'초원을 마음껏 돌아다녀 보세요':`${q.desc} · ${p}/${q.max}`;ui.qFill.style.width=(q.goal()?100:clamp(p/q.max*100,0,100))+'%'}
function renderGuide(){const guides=[['tree','🌳','나무','나무를 얻어요'],['rock','🪨','바위','돌을 얻어요'],['bush','🍓','베리 수풀','베리를 따요'],['fish','🐟','물고기','물가에서 낚아요'],['slime','🫧','슬라임','나무검으로 퐁!'],['campfire','🔥','모닥불','직접 제작해 설치'],['butterfly','🦋','나비','초원의 작은 친구']];ui.guide.innerHTML='';guides.forEach(([k,art,name,sub])=>{const open=!!player.discovered[k];const el=document.createElement('div');el.className='guide-card'+(open?'':' locked');el.innerHTML=`<div class="guide-art">${open?art:'?'}</div><b>${open?name:'???'}</b><small>${open?sub:'아직 발견하지 못했어요'}</small>`;ui.guide.appendChild(el)})}

const HOTBAR=[
{id:'hand',key:'1',label:'맨손',icon:'👋',available:()=>true},
{id:'axe',key:'2',label:()=>player.gear.stoneAxe?'돌 도끼':'기본 도끼',icon:'🪓',available:()=>true},
{id:'pick',key:'3',label:()=>player.gear.stonePick?'돌 곡괭이':'기본 곡괭이',icon:'⛏️',available:()=>true},
{id:'rod',key:'4',label:'낚싯대',icon:'🎣',available:()=>true},
{id:'sword',key:'5',label:'나무검',icon:'🗡️',available:()=>player.gear.woodSword},
{id:'campfire',key:'6',label:'모닥불 키트',icon:'🔥',available:()=>player.inv.campfireKit>0}
];
function hotbarLabel(h){return typeof h.label==='function'?h.label():h.label}
function selectTool(id){const h=HOTBAR.find(x=>x.id===id);if(!h||!h.available())return;player.selected=id;renderHotbar();syncUI();beep(430,.035,.012)}
function renderHotbar(){ui.hotbar.innerHTML='';HOTBAR.forEach(h=>{const ok=h.available(),b=document.createElement('button');b.className='slot'+(player.selected===h.id?' active':'')+(ok?'':' locked');b.innerHTML=`<kbd>${h.key}</kbd><span class="slot-art">${h.icon}</span>${h.id==='campfire'&&ok?`<span class="durability"><i style="width:${Math.min(100,player.inv.campfireKit*25)}%"></i></span>`:''}`;b.title=hotbarLabel(h);b.addEventListener('click',()=>selectTool(h.id));ui.hotbar.appendChild(b)});const cur=HOTBAR.find(h=>h.id===player.selected);ui.hotbarLabel.textContent=cur?hotbarLabel(cur):'맨손'}

function syncUI(){
  ui.name.textContent=player.name;ui.level.textContent=player.level;const need=xpNeed(player.level);ui.xp.textContent=`${player.xp} / ${need}`;ui.xpFill.style.width=clamp(player.xp/need*100,0,100)+'%';
  ui.wood.textContent=player.inv.wood;ui.stone.textContent=player.inv.stone;ui.berry.textContent=player.inv.berry;ui.fish.textContent=player.inv.fish;ui.coin.textContent=player.inv.coin;
  const h=HEADS.find(x=>x.id===player.head)||HEADS[0];ui.portrait.style.backgroundImage=`url("${h.front}")`;const pb=HEAD_VISUAL_META[h.id].front,pbw=pb[2]-pb[0],pbh=pb[3]-pb[1],psz=Math.min(145,Math.min(118*256/Math.max(1,pbw),112*256/Math.max(1,pbh)));ui.portrait.style.backgroundSize=`${psz}% auto`;ui.portrait.style.backgroundPosition='center 43%';
  const craftable=RECIPES.some(r=>canCraft(r)&&!owns(r));ui.craftDot.classList.toggle('show',craftable);
  renderQuestPeek();
}

/* ---------- creator ---------- */
let draft={head:player.head,outfit:player.outfit,name:player.name};
function buildCreator(){
  const grid=$('#headGrid');grid.innerHTML='';HEADS.forEach(h=>{const b=document.createElement('button');b.className='head-option'+(draft.head===h.id?' active':'');const box=HEAD_VISUAL_META[h.id].front,bw=box[2]-box[0],bh=box[3]-box[1],thumb=Math.min(1.55,Math.min(210/Math.max(1,bw),190/Math.max(1,bh)));b.innerHTML=`<img src="${h.front}" alt="${h.name}" style="transform:scale(${thumb.toFixed(3)})"><span>${h.name}</span>`;b.addEventListener('click',()=>{draft.head=h.id;refreshCreatorSelections()});grid.appendChild(b)});
  const og=$('#outfitGrid');og.innerHTML='';OUTFITS.forEach(o=>{const b=document.createElement('button');b.className='outfit-option'+(draft.outfit===o.id?' active':'');b.style.setProperty('--shirt',o.shirt);b.style.setProperty('--pants',o.pants);b.title=o.name;b.addEventListener('click',()=>{draft.outfit=o.id;refreshCreatorSelections()});og.appendChild(b)});
  $('#nameInput').value=draft.name;
}
function refreshCreatorSelections(){[...$('#headGrid').children].forEach((b,i)=>b.classList.toggle('active',HEADS[i].id===draft.head));[...$('#outfitGrid').children].forEach((b,i)=>b.classList.toggle('active',OUTFITS[i].id===draft.outfit))}
function showCreator(show=true){creatorOpen=show;$('#creatorBackdrop').classList.toggle('show',show);if(show){draft={head:player.head,outfit:player.outfit,name:player.name};buildCreator()}}
$('#customizerBtn').addEventListener('click',()=>showCreator(true));$('#openCustomizer').addEventListener('click',()=>showCreator(true));$('#creatorX').addEventListener('click',()=>{if(saved.head||localStorage.getItem(SAVE_KEY))showCreator(false)});
$('#nameInput').addEventListener('input',e=>draft.name=e.target.value.slice(0,12));
$$('[data-preview-dir]').forEach(b=>b.addEventListener('click',()=>{previewDir=b.dataset.previewDir;$$('[data-preview-dir]').forEach(x=>x.classList.toggle('active',x===b))}));
$('#randomizeChar').addEventListener('click',()=>{draft.head=HEADS[Math.floor(Math.random()*HEADS.length)].id;draft.outfit=OUTFITS[Math.floor(Math.random()*OUTFITS.length)].id;draft.name=['Mongle','Bori','Dubu','Kongi','Maru','Podo'][Math.floor(Math.random()*6)];$('#nameInput').value=draft.name;refreshCreatorSelections()});
$('#saveCharacter').addEventListener('click',()=>{player.head=draft.head;player.outfit=draft.outfit;player.name=(draft.name||'Mongle').trim().slice(0,12)||'Mongle';showCreator(false);syncUI();saveGame();toast('캐릭터 저장 완료','이 모습으로 초원을 돌아다녀 보세요.','✦')});

/* ---------- panels/settings ---------- */
$('#settingsBtn').addEventListener('click',()=>$('#settingsPanel').classList.toggle('show'));$('#settingsClose').addEventListener('click',()=>$('#settingsPanel').classList.remove('show'));
$$('.switch').forEach(sw=>sw.addEventListener('click',()=>{const k=sw.dataset.setting;settings[k]=!settings[k];sw.classList.toggle('on',settings[k]);if(k==='sound'&&settings.sound)beep(640,.06,.02)}));
$('#fullscreenBtn').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await $('#gameShell').requestFullscreen();else await document.exitFullscreen()}catch(e){}});
$('#resetSave').addEventListener('click',()=>{if(confirm('저장된 재료, 제작 상태, 캐릭터 설정을 모두 초기화할까요?')){localStorage.removeItem(SAVE_KEY);location.reload()}});
$$('[data-mobile-action]').forEach(b=>b.addEventListener('pointerdown',()=>{const a=b.dataset.mobileAction;if(a==='interact')interact();if(a==='attack')attack()}));

/* ---------- character/body drawing ---------- */
function headFor(id){return HEADS.find(h=>h.id===id)||HEADS[0]} function outfitFor(id){return OUTFITS.find(o=>o.id===id)||OUTFITS[0]}
function rr(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function capsule(c,x,y,w,h){rr(c,x,y,w,h,Math.min(w,h)/2)}

/* Chibi body: round knit top, tiny mitten hands, short legs and soft shoes. */
function drawBody(c,o,dir,state,t,scale=1){
  const walk=state==='walk'?Math.sin(t*12.5):0;
  const breathe=state==='idle'?Math.sin(t*2.25)*.55:0;
  const bob=(state==='walk'?Math.abs(Math.sin(t*12.5))*2.25:breathe)*scale;
  const skin='#f7ddd6', skinShade='#efc9c1', shoe='#5b5a55', outline='rgba(73,69,62,.16)';
  c.save();c.translate(0,bob);
  c.lineJoin='round';c.lineCap='round';
  const strokeShape=()=>{c.strokeStyle=outline;c.lineWidth=1.15*scale;c.stroke()};
  if(dir==='left'||dir==='right'){
    const side=dir==='left'?-1:1;c.scale(side,1);
    // back leg then front leg for a tiny toddling walk
    c.fillStyle=o.pants;capsule(c,-7*scale,-27*scale,12*scale,22*scale);c.fill();strokeShape();
    c.fillStyle=shoe;capsule(c,(-9+walk*2.3)*scale,-10*scale,17*scale,9*scale);c.fill();
    // oversized rounded sweater
    c.fillStyle=o.shirt;rr(c,-18*scale,-54*scale,37*scale,34*scale,15*scale);c.fill();strokeShape();
    c.fillStyle=o.accent;rr(c,-7*scale,-52*scale,15*scale,6*scale,3*scale);c.fill();
    c.globalAlpha=.32;c.fillStyle='#fff';c.beginPath();c.ellipse(-5*scale,-45*scale,8*scale,4*scale,-.45,0,TAU);c.fill();c.globalAlpha=1;
    // puffy sleeve + mitten
    const armLift=state==='dance'?-18:walk*3.4;
    c.fillStyle=o.shirt;c.beginPath();c.arc(-18*scale,(-38-armLift)*scale,9*scale,0,TAU);c.fill();strokeShape();
    c.fillStyle=skin;c.beginPath();c.arc(-23*scale,(-35-armLift)*scale,6.3*scale,0,TAU);c.fill();
    // tiny collar button
    c.fillStyle=o.accent;c.beginPath();c.arc(9*scale,-44*scale,2.2*scale,0,TAU);c.fill();
  }else{
    const step=walk*3.0*scale;
    // legs tucked close together
    c.fillStyle=o.pants;capsule(c,-15*scale,-29*scale,13*scale,22*scale);c.fill();capsule(c,2*scale,-29*scale,13*scale,22*scale);c.fill();
    c.fillStyle=shoe;capsule(c,-18*scale+step,-10*scale,17*scale,9*scale);c.fill();capsule(c,1*scale-step,-10*scale,17*scale,9*scale);c.fill();
    // plush sweatshirt silhouette
    c.fillStyle=o.shirt;rr(c,-24*scale,-56*scale,48*scale,37*scale,16*scale);c.fill();strokeShape();
    // cream collar and tiny center detail
    c.fillStyle=o.accent;rr(c,-10*scale,-54*scale,20*scale,7*scale,4*scale);c.fill();
    c.globalAlpha=.28;c.fillStyle='#fff';c.beginPath();c.ellipse(-8*scale,-44*scale,10*scale,4.5*scale,-.4,0,TAU);c.fill();c.globalAlpha=1;
    c.fillStyle=o.pants;rr(c,-18*scale,-25*scale,36*scale,7*scale,3.5*scale);c.fill();
    // sleeves move opposite each other when walking; both pop up for dance
    const dancing=state==='dance';
    const armY1=(dancing?-60:-39-walk*2.4)*scale,armY2=(dancing?-60:-39+walk*2.4)*scale;
    const armX=(dancing?30:25)*scale;
    c.fillStyle=o.shirt;c.beginPath();c.arc(-armX,armY1,8.5*scale,0,TAU);c.fill();strokeShape();c.beginPath();c.arc(armX,armY2,8.5*scale,0,TAU);c.fill();strokeShape();
    c.fillStyle=skin;c.beginPath();c.arc(-armX-(dancing?2:1)*scale,armY1+5*scale,6.1*scale,0,TAU);c.fill();c.beginPath();c.arc(armX+(dancing?2:1)*scale,armY2+5*scale,6.1*scale,0,TAU);c.fill();
    if(dir==='up'){
      // subtle back seam makes the rear view read as clothing rather than a flat block
      c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1.2*scale;c.beginPath();c.moveTo(0,-48*scale);c.lineTo(0,-25*scale);c.stroke();
    }
  }
  c.restore();
}
function drawTool(c,dir,state,tool,t,scale=1){
  if(!['chop','mine','attack','fish'].includes(state))return;
  const side=dir==='left'?-1:1, ang=state==='attack'?Math.sin(clamp((performance.now()-player.actionStart)/280,0,1)*Math.PI)*1.8-1.1:Math.sin(clamp((performance.now()-player.actionStart)/360,0,1)*Math.PI)*1.7-1.0;
  c.save();c.translate(side*19*scale,-35*scale);c.rotate((dir==='left'?-1:1)*ang*.55);
  c.strokeStyle='#7d6047';c.lineWidth=5*scale;c.lineCap='round';c.beginPath();c.moveTo(0,0);c.lineTo(25*scale,-28*scale);c.stroke();
  if(state==='chop'){c.fillStyle='#8e9592';c.beginPath();c.moveTo(17*scale,-34*scale);c.lineTo(32*scale,-29*scale);c.lineTo(28*scale,-18*scale);c.lineTo(18*scale,-24*scale);c.closePath();c.fill()}
  if(state==='mine'){c.strokeStyle='#858c89';c.lineWidth=6*scale;c.beginPath();c.moveTo(10*scale,-34*scale);c.quadraticCurveTo(27*scale,-41*scale,39*scale,-29*scale);c.stroke()}
  if(state==='attack'){
    // warm toy-like wooden sword with a tiny rounded guard
    c.strokeStyle='#b98b51';c.lineWidth=7*scale;c.beginPath();c.moveTo(13*scale,-31*scale);c.lineTo(43*scale,-52*scale);c.stroke();
    c.strokeStyle='#d1aa69';c.lineWidth=2.2*scale;c.beginPath();c.moveTo(20*scale,-36*scale);c.lineTo(42*scale,-51*scale);c.stroke();
    c.strokeStyle='#7e6245';c.lineWidth=5*scale;c.beginPath();c.moveTo(7*scale,-28*scale);c.lineTo(20*scale,-17*scale);c.stroke();
    c.fillStyle='#e6c47f';c.beginPath();c.arc(12*scale,-26*scale,3.2*scale,0,TAU);c.fill();
  }
  c.restore();
}
function drawFishingRod(c,dir,scale=1){const side=dir==='left'?-1:1;c.save();c.strokeStyle='#80644a';c.lineWidth=3*scale;c.lineCap='round';c.beginPath();c.moveTo(side*16*scale,-34*scale);c.quadraticCurveTo(side*45*scale,-75*scale,side*70*scale,-84*scale);c.stroke();c.strokeStyle='rgba(80,92,86,.55)';c.lineWidth=1*scale;c.beginPath();c.moveTo(side*70*scale,-84*scale);c.quadraticCurveTo(side*95*scale,-20*scale,side*84*scale,22*scale);c.stroke();c.restore()}

/* Every hairstyle/orientation is normalized from its actual visible alpha bounds.
   This removes the former front/side/back size jump while keeping each hairstyle's silhouette. */
function getHeadLayout(head,dir,scale=1){
  const key=dir==='up'?'back':(dir==='left'||dir==='right'?'left':'front');
  const box=HEAD_VISUAL_META[head.id]?.[key]||[0,0,256,256];
  const bw=box[2]-box[0],bh=box[3]-box[1];
  const sf=Math.min((HEAD_TARGET_H*scale)/Math.max(1,bh),(HEAD_MAX_W*scale)/Math.max(1,bw));
  const bottom=-37*scale;
  return{key,box,sf,dx:-128*sf,dy:bottom-box[3]*sf,im:loadImage(head[key])};
}
function drawHead(c,head,dir,scale=1,layer='full'){
  const L=getHeadLayout(head,dir,scale),im=L.im;if(!im.complete)return;
  c.save();if(dir==='right')c.scale(-1,1);
  if(layer==='face'){
    if(dir==='up'){c.restore();return}
    c.beginPath();c.rect(-48*scale,-136*scale,96*scale,105*scale);c.clip();
  }
  c.drawImage(im,L.dx,L.dy,256*L.sf,256*L.sf);c.restore();
}
function drawCharacter(c,who,t,scale=1,showName=false){
  const o=outfitFor(who.outfit),head=headFor(who.head),dir=who.dir||'down',state=who.state||'idle';let rot=0,squashX=1,squashY=1;
  if(state==='dance'){rot=Math.sin(t*7)*.11;squashY=1+Math.sin(t*14)*.03}
  c.save();c.rotate(rot);c.scale(squashX,squashY);
  const longHair=LONG_HAIR.has(head.id);
  if(longHair){
    // Long hair stays behind the outfit; a clipped face/bangs pass restores facial detail on the front/side.
    drawHead(c,head,dir,scale,'full');
    drawBody(c,o,dir,state,t,scale);
    if(dir!=='up')drawHead(c,head,dir,scale,'face');
  }else{
    drawBody(c,o,dir,state,t,scale);drawHead(c,head,dir,scale,'full');
  }
  if(state==='fish')drawFishingRod(c,dir,scale);else drawTool(c,dir,state,who.actionKind||state,t,scale);
  if(who.reaction&&performance.now()<who.reactionUntil){c.font=`${18*scale}px sans-serif`;c.textAlign='center';c.fillText(who.reaction==='ouch'?'✦ ! ✦':'♡',0,-135*scale)}
  c.restore();
  if(showName){c.font=`700 ${9*scale}px Inter,sans-serif`;c.textAlign='center';c.fillStyle='rgba(69,76,65,.72)';c.fillText(who.name||'friend',0,12*scale)}
}

/* ---------- world drawing ---------- */
function drawGround(c,t){
  c.fillStyle=palette.grass0;c.fillRect(0,0,WORLD_W,WORLD_H);
  const blobs=[[620,420,620,330,palette.grass1],[2160,370,760,360,'#e1e9aa'],[1550,1050,820,430,palette.grass1],[2850,1080,550,400,'#d8e49f'],[520,1330,540,300,'#d9e49e']];
  blobs.forEach(([x,y,rx,ry,col])=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill()});
  // winding path
  c.strokeStyle='rgba(239,221,178,.58)';c.lineWidth=86;c.lineCap='round';c.beginPath();c.moveTo(250,1170);c.bezierCurveTo(820,1000,1160,1200,1510,1010);c.bezierCurveTo(1960,760,2210,950,3050,710);c.stroke();c.strokeStyle='rgba(255,247,216,.6)';c.lineWidth=60;c.stroke();
  // workbench patch
  c.fillStyle='rgba(187,155,103,.11)';c.beginPath();c.ellipse(world.workbench.x,world.workbench.y+17,130,76,0,0,TAU);c.fill();
  for(const g of world.grass){const sw=settings.ambient?Math.sin(t*1.8+g.phase)*2:0;c.strokeStyle='rgba(112,143,84,.58)';c.lineWidth=2*g.s;c.lineCap='round';c.beginPath();c.moveTo(g.x,g.y);c.quadraticCurveTo(g.x-3+sw,g.y-10*g.s,g.x-5+sw,g.y-14*g.s);c.moveTo(g.x,g.y);c.quadraticCurveTo(g.x+2+sw,g.y-10*g.s,g.x+6+sw,g.y-13*g.s);c.stroke()}
  for(const f of world.flowers)drawFlower(c,f.x,f.y,f.c,f.s,t+f.phase);
  for(const d of world.daisies)drawTinyDaisy(c,d.x,d.y,t+d.phase);
  for(const m of world.mushrooms)drawMushroom(c,m.x,m.y,m.c);
}
function drawFlower(c,x,y,col,s,t){const sway=settings.ambient?Math.sin(t*1.7)*1.5:0;c.strokeStyle='#7ca063';c.lineWidth=2*s;c.beginPath();c.moveTo(x,y+9*s);c.quadraticCurveTo(x+sway,y+2*s,x+sway,y-2*s);c.stroke();c.fillStyle=col;for(let i=0;i<5;i++){const a=i/5*TAU;c.beginPath();c.arc(x+sway+Math.cos(a)*4*s,y-5*s+Math.sin(a)*4*s,3.2*s,0,TAU);c.fill()}c.fillStyle='#e8c66b';c.beginPath();c.arc(x+sway,y-5*s,2.6*s,0,TAU);c.fill()}
function drawTinyDaisy(c,x,y,t){drawFlower(c,x,y,'#fff',.7,t)}
function drawMushroom(c,x,y,col){c.fillStyle='#eee5d5';rr(c,x-4,y-1,8,10,4);c.fill();c.fillStyle=col;c.beginPath();c.arc(x,y,9,Math.PI,TAU);c.lineTo(x+9,y);c.lineTo(x-9,y);c.closePath();c.fill()}
function drawShore(c,t){
  c.fillStyle=palette.sand;c.beginPath();c.moveTo(0,SHORE_Y-12);for(let x=0;x<=WORLD_W;x+=70)c.lineTo(x,SHORE_Y+Math.sin(x*.017)*10+Math.sin(x*.041)*4);c.lineTo(WORLD_W,WORLD_H);c.lineTo(0,WORLD_H);c.closePath();c.fill();
  c.fillStyle=palette.water0;c.beginPath();c.moveTo(0,SHORE_Y+34);for(let x=0;x<=WORLD_W;x+=60)c.lineTo(x,SHORE_Y+33+Math.sin(x*.02+t*.65)*9);c.lineTo(WORLD_W,WORLD_H);c.lineTo(0,WORLD_H);c.closePath();c.fill();
  c.fillStyle=palette.water1;c.globalAlpha=.48;c.beginPath();c.moveTo(0,SHORE_Y+72);for(let x=0;x<=WORLD_W;x+=50)c.lineTo(x,SHORE_Y+76+Math.sin(x*.015-t*.9)*12);c.lineTo(WORLD_W,WORLD_H);c.lineTo(0,WORLD_H);c.closePath();c.fill();c.globalAlpha=1;
  for(let i=0;i<13;i++){const x=120+i*250+Math.sin(t+i)*35,y=SHORE_Y+105+(i%3)*75;c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(x-14,y);c.quadraticCurveTo(x,y-9,x+14,y);c.stroke()}
  // little pier
  const px=1740,py=SHORE_Y-5;c.fillStyle='#a77d58';for(let i=0;i<5;i++){rr(c,px-58,py+i*22,116,18,4);c.fill()}c.fillStyle='#77563f';c.fillRect(px-48,py+92,9,38);c.fillRect(px+39,py+92,9,38);
}
function drawTree(c,tr,t){if(tr.dead){if(tr.fall>0){c.save();c.translate(tr.x,tr.y);c.rotate(tr.fall*1.35);drawTreeShape(c,0,0,tr.r,tr.phase,t,.45);c.restore()}return}c.save();const sh=tr.shake>0?Math.sin(performance.now()*.07)*tr.shake:0;c.translate(tr.x+sh,tr.y);drawTreeShape(c,0,0,tr.r,tr.phase,t,1);c.restore()}
function drawTreeShape(c,x,y,r,phase,t,alpha=1){c.globalAlpha=alpha;const sway=settings.ambient?Math.sin(t*1.2+phase)*2:0;c.fillStyle='rgba(91,111,73,.12)';c.beginPath();c.ellipse(x,y+17,r*.7,r*.25,0,0,TAU);c.fill();c.fillStyle=palette.trunkDark;rr(c,x-17,y-r*.32,34,r*.75,13);c.fill();c.fillStyle=palette.trunk;rr(c,x-12,y-r*.35,24,r*.7,10);c.fill();const cols=[palette.treeB,palette.treeA,palette.treeB,palette.treeC,palette.treeA];const pts=[[-.45,-.63,.48],[-.05,-.78,.55],[.42,-.58,.48],[-.5,-.35,.52],[.26,-.34,.58]];pts.forEach((p,i)=>{c.fillStyle=cols[i];c.beginPath();c.arc(x+(p[0]*r)+sway,y+p[1]*r,p[2]*r,0,TAU);c.fill()});c.fillStyle=palette.treeHi;c.globalAlpha=.28*alpha;c.beginPath();c.ellipse(x-r*.22+sway,y-r*.83,r*.28,r*.18,-.3,0,TAU);c.fill();c.globalAlpha=alpha}
function drawRock(c,r,t){if(r.dead)return;c.save();const sh=r.shake?Math.sin(performance.now()*.09)*r.shake:0;c.translate(r.x+sh,r.y);c.fillStyle='rgba(79,91,72,.12)';c.beginPath();c.ellipse(0,r.r*.55,r.r*.9,r.r*.3,0,0,TAU);c.fill();c.fillStyle=palette.rock2;c.beginPath();c.moveTo(-r.r*.8,r.r*.35);c.quadraticCurveTo(-r.r*.7,-r.r*.45,-r.r*.18,-r.r*.66);c.quadraticCurveTo(r.r*.5,-r.r*.65,r.r*.85,r.r*.18);c.quadraticCurveTo(r.r*.75,r.r*.62,0,r.r*.62);c.closePath();c.fill();c.fillStyle=palette.rock;c.beginPath();c.moveTo(-r.r*.7,r.r*.2);c.quadraticCurveTo(-r.r*.55,-r.r*.45,-r.r*.15,-r.r*.55);c.quadraticCurveTo(r.r*.45,-r.r*.58,r.r*.7,r.r*.14);c.quadraticCurveTo(r.r*.52,r.r*.48,-.05*r.r,r.r*.47);c.closePath();c.fill();c.fillStyle=palette.rockHi;c.globalAlpha=.55;c.beginPath();c.ellipse(-r.r*.18,-r.r*.25,r.r*.22,r.r*.12,-.4,0,TAU);c.fill();c.restore()}
function drawBush(c,b,t){c.save();c.translate(b.x,b.y);const sw=settings.ambient?Math.sin(t*1.6+b.phase)*1.5:0;c.translate(sw,0);c.fillStyle='rgba(76,91,64,.1)';c.beginPath();c.ellipse(0,20,b.r*.8,b.r*.24,0,0,TAU);c.fill();c.fillStyle='#70a46b';[-.5,0,.48].forEach((q,i)=>{c.beginPath();c.arc(q*b.r,-(i===1?8:0),b.r*.58,0,TAU);c.fill()});c.fillStyle='#8cbd7c';c.beginPath();c.arc(-b.r*.15,-b.r*.25,b.r*.38,0,TAU);c.fill();if(b.ready){for(let i=0;i<b.berries;i++){const a=(i/b.berries)*TAU+.4;c.fillStyle=i%2?'#e9878e':'#ef9da2';c.beginPath();c.arc(Math.cos(a)*b.r*.55,-8+Math.sin(a)*b.r*.38,5,0,TAU);c.fill()}}c.restore()}
function drawWorkbench(c,w){c.save();c.translate(w.x,w.y);c.fillStyle='rgba(70,79,62,.12)';c.beginPath();c.ellipse(0,24,72,18,0,0,TAU);c.fill();c.fillStyle='#8c6448';c.fillRect(-49,-1,11,52);c.fillRect(38,-1,11,52);c.fillStyle='#b18359';rr(c,-64,-20,128,30,8);c.fill();c.fillStyle='#cfaa76';rr(c,-59,-16,118,10,5);c.fill();c.strokeStyle='#6d6559';c.lineWidth=5;c.beginPath();c.moveTo(-20,-27);c.lineTo(4,-51);c.stroke();c.strokeStyle='#89908d';c.lineWidth=7;c.beginPath();c.moveTo(-4,-50);c.lineTo(22,-28);c.stroke();c.fillStyle='#f6edcf';rr(c,20,-30,32,20,5);c.fill();c.fillStyle='#7f9a69';c.font='900 10px Inter';c.textAlign='center';c.fillText('CRAFT',36,-16);c.restore()}
function drawSign(c,s){c.save();c.translate(s.x,s.y);c.scale(s.dir,1);c.fillStyle='#8e6648';rr(c,-4,8,8,37,4);c.fill();c.fillStyle='#c29769';rr(c,-40,-12,80,34,7);c.fill();c.fillStyle='#dec08f';rr(c,-36,-8,72,9,4);c.fill();c.strokeStyle='#74563f';c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(-8,1);c.lineTo(11,1);c.moveTo(11,1);c.lineTo(3,-6);c.moveTo(11,1);c.lineTo(3,8);c.stroke();c.restore()}
function drawLog(c,l){c.save();c.translate(l.x,l.y);c.rotate(l.rot);c.fillStyle='rgba(76,88,65,.1)';c.beginPath();c.ellipse(0,12,48,13,0,0,TAU);c.fill();c.fillStyle='#8d6248';rr(c,-45,-12,90,26,12);c.fill();c.fillStyle='#b37e56';c.beginPath();c.arc(43,1,12,0,TAU);c.fill();c.strokeStyle='#82573d';c.lineWidth=2;c.beginPath();c.arc(43,1,7,0,TAU);c.stroke();c.restore()}
function drawSlime(c,s,t){if(s.dead)return;c.save();c.translate(s.x,s.y);const hop=Math.max(0,Math.sin(t*3+s.phase))*6,hit=s.hit>0?Math.sin(performance.now()*.1)*5:0;c.translate(hit,-hop);c.fillStyle='rgba(75,88,66,.12)';c.beginPath();c.ellipse(0,18,32,10,0,0,TAU);c.fill();c.fillStyle=s.c;c.beginPath();c.moveTo(-30,14);c.bezierCurveTo(-30,-26,-15,-34,0,-34);c.bezierCurveTo(20,-34,32,-15,30,14);c.quadraticCurveTo(20,26,0,23);c.quadraticCurveTo(-20,26,-30,14);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(-10,-8,8,0,TAU);c.arc(11,-8,8,0,TAU);c.fill();c.fillStyle='#4f514e';c.beginPath();c.arc(-8,-7,3,0,TAU);c.arc(9,-7,3,0,TAU);c.fill();c.strokeStyle='#6c6375';c.lineWidth=2;c.beginPath();c.arc(0,5,5,0,Math.PI);c.stroke();if(s.hp<s.max){c.fillStyle='rgba(72,76,68,.16)';rr(c,-25,-45,50,5,3);c.fill();c.fillStyle='#e7878a';rr(c,-25,-45,50*(s.hp/s.max),5,3);c.fill()}c.restore()}
function drawCampfire(c,f,t){c.save();c.translate(f.x,f.y);c.fillStyle='rgba(72,80,64,.13)';c.beginPath();c.ellipse(0,16,38,12,0,0,TAU);c.fill();for(let i=0;i<7;i++){const a=i/7*TAU;c.fillStyle=i%2?palette.rock:palette.rock2;c.beginPath();c.arc(Math.cos(a)*24,8+Math.sin(a)*11,7,0,TAU);c.fill()}c.strokeStyle='#7d5740';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(-15,13);c.lineTo(15,-1);c.moveTo(-15,-1);c.lineTo(15,13);c.stroke();const flick=Math.sin(t*8+f.x)*3;c.fillStyle='#f2a84b';c.beginPath();c.moveTo(0,7);c.bezierCurveTo(-15,-6,-4,-26,0,-35-flick);c.bezierCurveTo(6,-22,17,-5,0,7);c.fill();c.fillStyle='#f5d66a';c.beginPath();c.moveTo(0,4);c.bezierCurveTo(-7,-5,-2,-16,1,-23);c.bezierCurveTo(7,-13,8,-2,0,4);c.fill();c.restore()}
function drawButterfly(c,b,t){const x=b.x+Math.sin(t*b.speed*2+b.phase)*24,y=b.y+Math.cos(t*b.speed*1.6+b.phase)*15,w=5+Math.abs(Math.sin(t*9+b.phase))*4;c.fillStyle=b.c;c.beginPath();c.ellipse(x-w,y,w,5,.3,0,TAU);c.ellipse(x+w,y,w,5,-.3,0,TAU);c.fill();c.fillStyle='#6e6a60';c.fillRect(x-1,y-4,2,8)}
function drawParticles(c,t){for(const p of world.particles){const a=clamp(1-p.age/p.life,0,1);c.globalAlpha=a;c.fillStyle=p.c;c.save();c.translate(p.x,p.y);c.rotate(p.rot||0);if(p.kind==='chip'){rr(c,-3,-2,7,4,2);c.fill()}else{c.beginPath();c.arc(0,0,p.r||3,0,TAU);c.fill()}c.restore()}c.globalAlpha=1;for(const r of world.ripples){const a=clamp(1-r.age/r.life,0,1);c.strokeStyle=`rgba(255,255,255,${a*.72})`;c.lineWidth=3;c.beginPath();c.ellipse(r.x,r.y,r.age*30+6,r.age*10+3,0,0,TAU);c.stroke()}}

/* ---------- gameplay ---------- */
const camera={x:player.x,y:player.y,shake:0,shakeX:0,shakeY:0};let contextAction=null, fishing=null, lastT=performance.now(), lastBroadcast=0, saveTick=0;
function nearest(arr,max,filter=()=>true){let best=null,bd=max;for(const o of arr){if(!filter(o))continue;const d=dist(player.x,player.y,o.x,o.y);if(d<bd){bd=d;best=o}}return best}
function updateContext(){
  contextAction=null;
  let title='',sub='',icon='✦',key='E';
  if(player.selected==='campfire'&&player.inv.campfireKit>0){
    contextAction={kind:'place'};title='모닥불 설치';sub='지금 서 있는 곳에 작은 모닥불을 놓아요';icon='🔥';
  }else if(dist(player.x,player.y,world.workbench.x,world.workbench.y)<100){
    contextAction={kind:'craft'};title='제작대 사용';sub='모은 재료로 장비와 아이템을 만들어요';icon='🛠️';
  }else{
    const sl=nearest(world.slimes,82,s=>!s.dead);
    const tr=nearest(world.trees,93,t=>!t.dead);
    const ro=nearest(world.rocks,78,r=>!r.dead);
    const bu=nearest(world.bushes,68,b=>b.ready);
    if(sl){
      contextAction={kind:'attack',target:sl};title=player.gear.woodSword?'슬라임 퐁!':'나무검이 필요해요';sub=player.gear.woodSword?'나무검으로 슬라임을 밀어내요':'나무 6개를 모아 제작소에서 만들 수 있어요';icon='🫧';
    }else if(tr){
      contextAction={kind:'chop',target:tr};title='나무 베기';sub=player.gear.stoneAxe?'돌 도끼 · 2배 채집':'나무를 모아 나무검을 만들어 보세요';icon='🪓';
    }else if(ro){
      contextAction={kind:'mine',target:ro};title='돌 캐기';sub=player.gear.stonePick?'돌 곡괭이 · 2배 채집':'돌을 모으면 도구를 업그레이드할 수 있어요';icon='⛏️';
    }else if(bu){
      contextAction={kind:'forage',target:bu};title='베리 따기';sub='달콤한 베리를 챙겨요';icon='🍓';
    }else if(player.y>1510){
      contextAction={kind:'fish'};title=fishing?'낚싯줄 당기기':'낚시하기';sub=fishing?'초록 영역에 맞춰 다시 눌러요':'물가에서 천천히 기다리면 물고기가 와요';icon='🎣';key=fishing?'F':'E';
    }
  }
  if(contextAction){ui.context.classList.add('show');ui.contextTitle.textContent=title;ui.contextSub.textContent=sub;ui.contextIcon.textContent=icon;ui.contextKey.textContent=key}else ui.context.classList.remove('show');
}
function faceToward(o){const dx=o.x-player.x,dy=o.y-player.y;if(Math.abs(dx)>Math.abs(dy))player.dir=dx<0?'left':'right';else player.dir=dy<0?'up':'down'}
function startAction(kind,target,duration=430){if(player.state==='fish')return false;player.state=kind;player.actionKind=kind;player.actionTarget=target;player.actionStart=performance.now();player.stateUntil=performance.now()+duration;player.actionHit=false;if(target)faceToward(target);return true}
function spawnBurst(x,y,c,n=9,kind='dot'){for(let i=0;i<n;i++)world.particles.push({x,y,vx:rnd(-75,75),vy:rnd(-120,-30),g:170,c,age:0,life:rnd(.45,.8),r:rnd(2,5),kind,rot:rnd(0,TAU),vr:rnd(-5,5)})}
function chop(tr){if(!startAction('chop',tr,440))return;setTimeout(()=>{if(player.actionTarget!==tr||tr.dead)return;const dmg=player.gear.stoneAxe?2:1;tr.hp-=dmg;tr.shake=7;shake(6);beep(250,.05,.02,'triangle');spawnBurst(tr.x,tr.y-25,'#aa7a50',10,'chip');floatMsg(tr.x,tr.y-70,`-${dmg}`);if(tr.hp<=0){tr.dead=true;tr.fall=.01;tr.respawn=performance.now()+30000;const gain=3+Math.floor(Math.random()*2);addInv('wood',gain);player.stats.trees++;player.discovered.tree=true;addXP(8);toast(`나무 +${gain}`,'제작 재료를 얻었어요.','🪵');spawnBurst(tr.x,tr.y-30,'#7da268',14);updateQuests()}},220)}
function mine(ro){if(!startAction('mine',ro,460))return;setTimeout(()=>{if(player.actionTarget!==ro||ro.dead)return;const dmg=player.gear.stonePick?2:1;ro.hp-=dmg;ro.shake=5;shake(6);beep(330,.045,.022,'square');spawnBurst(ro.x,ro.y-4,'#9da3a0',10,'chip');floatMsg(ro.x,ro.y-45,`-${dmg}`);if(ro.hp<=0){ro.dead=true;ro.respawn=performance.now()+26000;const gain=3+Math.floor(Math.random()*2);addInv('stone',gain);player.stats.rocks++;player.discovered.rock=true;addXP(9);toast(`돌 +${gain}`,'단단한 제작 재료를 얻었어요.','🪨');updateQuests()}},230)}
function forage(b){if(!b.ready||player.state!=='idle'&&player.state!=='walk')return;faceToward(b);player.state='forage';player.stateUntil=performance.now()+430;b.ready=false;b.respawn=performance.now()+20000;const gain=2+Math.floor(Math.random()*3);setTimeout(()=>{addInv('berry',gain);player.stats.bushes++;player.discovered.bush=true;addXP(5);spawnBurst(b.x,b.y-10,'#e9898f',8);toast(`베리 +${gain}`,'베리잼으로 만들 수도 있어요.','🍓');updateQuests()},210)}
function attack(target=contextAction?.target){if(!player.gear.woodSword){toast('나무검이 필요해요','나무 6개를 모아 제작소에서 먼저 만들어 보세요.','🪵');if(!openPanel)openPanelBy('craft');return}const sl=target||nearest(world.slimes,90,s=>!s.dead);if(!sl)return;startAction('attack',sl,350);setTimeout(()=>{if(sl.dead)return;sl.hp--;sl.hit=.28;shake(5);beep(410,.055,.023,'square');spawnBurst(sl.x,sl.y-10,sl.c,10);floatMsg(sl.x,sl.y-55,'퐁!');if(sl.hp<=0){sl.dead=true;sl.respawn=performance.now()+22000;player.stats.slimes++;player.discovered.slime=true;const coin=4+Math.floor(Math.random()*5);addInv('coin',coin);if(Math.random()<.65)addInv('slimeGel',1);addXP(16);toast('슬라임 퐁!','코인과 말랑한 젤을 발견했어요.','🫧');updateQuests()}},170)}
function startFishing(){if(player.y<1510){toast('물가로 가야 해요','아래쪽 바닷가나 나무 부두 근처에서 낚시할 수 있어요.','🎣');return}if(fishing){reelFishing();return}player.state='fish';player.actionKind='fish';player.stateUntil=Infinity;fishing={start:performance.now(),cursor:0,dir:1,goodStart:rnd(.38,.67),goodWidth:.18+rnd(0,.08),readyAt:performance.now()+800};ui.fishUI.classList.add('show');ui.fishHint.textContent='초록 영역에서 다시 눌러요!';beep(520,.04,.015);world.ripples.push({x:player.x+(player.dir==='left'?-80:player.dir==='right'?80:0),y:SHORE_Y+90,age:0,life:1.2})}
function reelFishing(){if(!fishing)return;const now=performance.now();if(now<fishing.readyAt){ui.fishHint.textContent='조금만 기다려요…';return}const good=fishing.cursor>=fishing.goodStart&&fishing.cursor<=fishing.goodStart+fishing.goodWidth;if(good){const gain=Math.random()<.16?2:1;addInv('fish',gain);player.stats.fishCaught+=gain;player.discovered.fish=true;addXP(12*gain);toast(gain===2?'쌍둥이 물고기!':'물고기를 낚았어요!',`물고기 +${gain}`,'🐟');spawnBurst(player.x,player.y-30,'#91d5e4',12);beep(760,.1,.03);shake(3);updateQuests()}else{toast('앗, 놓쳤어요','다음에는 초록 영역 안에서 눌러 보세요.','💦');beep(220,.08,.02)}fishing=null;ui.fishUI.classList.remove('show');player.state='idle';player.stateUntil=0}
function placeCampfire(){if(player.inv.campfireKit<=0)return;const tooClose=placedCampfires.some(f=>dist(f.x,f.y,player.x,player.y)<110);if(tooClose){toast('조금 떨어진 곳에 놓아 주세요','모닥불끼리는 약간의 간격이 필요해요.','🔥');return}placedCampfires.push({x:Math.round(player.x),y:Math.round(player.y+22),born:Date.now()});addInv('campfireKit',-1);player.stats.campfires++;player.discovered.campfire=true;player.selected='hand';addXP(18);toast('작은 캠프 완성!','밤이 오면 더 따뜻하게 빛나요.','🔥');spawnBurst(player.x,player.y,'#efc96b',15);updateQuests();renderHotbar();saveGame()}
function interact(){if(fishing){reelFishing();return}updateContext();if(!contextAction)return;const{kind,target}=contextAction;if(kind==='chop')chop(target);if(kind==='mine')mine(target);if(kind==='forage')forage(target);if(kind==='attack')attack(target);if(kind==='fish')startFishing();if(kind==='craft')openPanelBy('craft');if(kind==='place')placeCampfire()}
function dance(){if(['fish','chop','mine','attack'].includes(player.state))return;player.state='dance';player.stateUntil=performance.now()+1400;player.reaction='heart';player.reactionUntil=performance.now()+1000;for(let i=0;i<8;i++)world.particles.push({x:player.x+rnd(-25,25),y:player.y-80+rnd(-15,12),vx:rnd(-25,25),vy:rnd(-60,-20),g:10,c:i%2?'#ef9ea6':'#edc96d',age:0,life:1.1,r:4});beep(660,.08,.018);setTimeout(()=>beep(820,.08,.015),100)}
function collideWithCircle(o,r){let dx=player.x-o.x,dy=player.y-o.y,d=Math.hypot(dx,dy),min=player.r+r;if(d<min&&d>0){const push=min-d;player.x+=dx/d*push;player.y+=dy/d*push;if(performance.now()-player.lastCollision>400){player.reaction='ouch';player.reactionUntil=performance.now()+650;player.lastCollision=performance.now();beep(180,.04,.012);shake(2)}}}
function updateMovement(dt,now){
  let dx=(keyDown('d','arrowright')?1:0)-(keyDown('a','arrowleft')?1:0)+joy.x,dy=(keyDown('s','arrowdown')?1:0)-(keyDown('w','arrowup')?1:0)+joy.y;let l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}
  const busy=['chop','mine','attack','forage','fish','dance'].includes(player.state);
  if(!busy&&!creatorOpen){player.vx=lerp(player.vx,dx*player.speed,1-Math.pow(.0001,dt));player.vy=lerp(player.vy,dy*player.speed,1-Math.pow(.0001,dt));player.x+=player.vx*dt;player.y+=player.vy*dt;if(l>.15){player.state='walk';if(Math.abs(dx)>Math.abs(dy))player.dir=dx<0?'left':'right';else player.dir=dy<0?'up':'down'}else{player.vx*=Math.pow(.02,dt);player.vy*=Math.pow(.02,dt);if(now>player.stateUntil)player.state='idle'}}
  if(now>player.stateUntil&&player.state!=='fish'){player.state=(l>.15&&!creatorOpen)?'walk':'idle';player.actionTarget=null;player.actionKind=''}
  player.x=clamp(player.x,42,WORLD_W-42);player.y=clamp(player.y,50,PLAYER_LIMIT_Y);
  world.trees.forEach(t=>{if(!t.dead)collideWithCircle(t,t.r*.42)});world.rocks.forEach(r=>{if(!r.dead)collideWithCircle(r,r.r*.72)});collideWithCircle(world.workbench,65);placedCampfires.forEach(f=>collideWithCircle(f,25));
}
function updateResources(now,dt){
  for(const t of world.trees){t.shake=Math.max(0,t.shake-dt*22);if(t.dead){t.fall=Math.min(.92,t.fall+dt*1.8);if(now>t.respawn){t.dead=false;t.hp=t.max;t.fall=0;t.respawn=0}}}
  for(const r of world.rocks){r.shake=Math.max(0,r.shake-dt*18);if(r.dead&&now>r.respawn){r.dead=false;r.hp=r.max;r.respawn=0}}
  for(const b of world.bushes)if(!b.ready&&now>b.respawn){b.ready=true;b.berries=2+Math.floor(Math.random()*3)}
  for(const s of world.slimes){s.hit=Math.max(0,s.hit-dt);if(s.dead){if(now>s.respawn){s.dead=false;s.hp=s.max;s.x=clamp(s.x+rnd(-160,160),150,WORLD_W-150);s.y=clamp(s.y+rnd(-130,130),160,1430)}continue}s.phase+=dt*.5;s.x+=s.vx*dt;s.y+=s.vy*dt;if(s.x<120||s.x>WORLD_W-120)s.vx*=-1;if(s.y<120||s.y>1450)s.vy*=-1;if(Math.random()<dt*.28){const a=rnd(0,TAU),sp=rnd(25,55);s.vx=Math.cos(a)*sp;s.vy=Math.sin(a)*sp}if(dist(player.x,player.y,s.x,s.y)<48){let dx=player.x-s.x,dy=player.y-s.y,d=Math.hypot(dx,dy)||1;player.x+=dx/d*70*dt;player.y+=dy/d*70*dt;if(now-player.lastCollision>650){player.reaction='ouch';player.reactionUntil=now+700;player.lastCollision=now;shake(3);beep(150,.05,.014)}}}
  for(const p of world.particles){p.age+=dt;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot=(p.rot||0)+(p.vr||0)*dt}world.particles=world.particles.filter(p=>p.age<p.life);for(const r of world.ripples)r.age+=dt;world.ripples=world.ripples.filter(r=>r.age<r.life)
}
function updateFishing(dt,now){if(!fishing)return;fishing.cursor+=fishing.dir*dt*.9;if(fishing.cursor>1){fishing.cursor=1;fishing.dir=-1}if(fishing.cursor<0){fishing.cursor=0;fishing.dir=1}ui.fishCursor.style.left=`calc(${fishing.cursor*100}% - 3px)`;ui.fishGood.style.left=(fishing.goodStart*100)+'%';ui.fishGood.style.width=(fishing.goodWidth*100)+'%';if(now>fishing.readyAt)ui.fishHint.textContent='지금! 초록 영역에 맞춰 눌러요'}
function processKeys(){
  if(keyPressed('1','2','3','4','5','6')){for(let i=1;i<=6;i++)if(keyPressed(String(i)))selectTool(HOTBAR[i-1].id)}
  if(keyPressed('e','c'))interact();if(keyPressed('f','x')){if(fishing)reelFishing();else startFishing()}if(keyPressed('j'))attack();if(keyPressed('z','v'))dance();
}

/* ---------- peer ghosts (local tabs only, no chat) ---------- */
let channel=null;try{channel=new BroadcastChannel('ppolppol-craft-v4-room');channel.onmessage=e=>{const d=e.data;if(!d||d.id===player.id)return;if(d.type==='state'){world.peers.set(d.id,{...d,seen:performance.now()})}if(d.type==='bye')world.peers.delete(d.id)}}catch(e){}
window.addEventListener('beforeunload',()=>{try{channel?.postMessage({type:'bye',id:player.id})}catch(e){}});
function broadcast(now){if(!channel||now-lastBroadcast<120)return;lastBroadcast=now;channel.postMessage({type:'state',id:player.id,name:player.name,x:player.x,y:player.y,dir:player.dir,state:player.state,head:player.head,outfit:player.outfit,actionKind:player.actionKind})}

/* ---------- minimap ---------- */
function drawMini(){const w=mini.width,h=mini.height,sx=w/WORLD_W,sy=h/WORLD_H;mctx.clearRect(0,0,w,h);mctx.fillStyle='#dfe8ae';mctx.fillRect(0,0,w,h);mctx.fillStyle='#f7edc8';mctx.fillRect(0,SHORE_Y*sy,w,18);mctx.fillStyle='#94d8e5';mctx.fillRect(0,(SHORE_Y+18)*sy,w,h);mctx.fillStyle='#67915d';for(const t of world.trees)if(!t.dead){mctx.beginPath();mctx.arc(t.x*sx,t.y*sy,2.7,0,TAU);mctx.fill()}mctx.fillStyle='#89908d';for(const r of world.rocks)if(!r.dead){mctx.beginPath();mctx.arc(r.x*sx,r.y*sy,2.1,0,TAU);mctx.fill()}mctx.fillStyle='#a58cc8';for(const s of world.slimes)if(!s.dead){mctx.beginPath();mctx.arc(s.x*sx,s.y*sy,2.2,0,TAU);mctx.fill()}mctx.fillStyle='#ef9da0';mctx.beginPath();mctx.arc(player.x*sx,player.y*sy,3.4,0,TAU);mctx.fill();mctx.strokeStyle='rgba(255,255,255,.9)';mctx.lineWidth=1.5;mctx.stroke();mctx.strokeStyle='rgba(82,94,74,.12)';mctx.lineWidth=1;mctx.strokeRect((camera.x-VW/2)*sx,(camera.y-VH/2)*sy,VW*sx,VH*sy)}

/* ---------- rendering ---------- */
function drawScene(t){
  ctx.save();ctx.clearRect(0,0,VW,VH);ctx.translate(-camera.x+VW/2+camera.shakeX,-camera.y+VH/2+camera.shakeY);drawGround(ctx,t);drawShore(ctx,t);for(const l of world.logs)drawLog(ctx,l);for(const s of world.signs)drawSign(ctx,s);drawWorkbench(ctx,world.workbench);for(const b of world.butterflies)drawButterfly(ctx,b,t);
  const drawable=[];world.bushes.forEach(o=>drawable.push({y:o.y,fn:()=>drawBush(ctx,o,t)}));world.rocks.forEach(o=>drawable.push({y:o.y,fn:()=>drawRock(ctx,o,t)}));world.trees.forEach(o=>drawable.push({y:o.y+15,fn:()=>drawTree(ctx,o,t)}));world.slimes.forEach(o=>drawable.push({y:o.y+15,fn:()=>drawSlime(ctx,o,t)}));placedCampfires.forEach(o=>drawable.push({y:o.y+12,fn:()=>drawCampfire(ctx,o,t)}));
  for(const p of world.peers.values())drawable.push({y:p.y,fn:()=>{ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='rgba(74,88,65,.12)';ctx.beginPath();ctx.ellipse(0,3,31,10,0,0,TAU);ctx.fill();drawCharacter(ctx,p,t,.92,true);ctx.restore()}});drawable.push({y:player.y,fn:()=>{ctx.save();ctx.translate(player.x,player.y);ctx.fillStyle='rgba(74,88,65,.15)';ctx.beginPath();ctx.ellipse(0,3,34,11,0,0,TAU);ctx.fill();drawCharacter(ctx,player,t,1,false);ctx.restore()}});drawable.sort((a,b)=>a.y-b.y).forEach(d=>d.fn());drawParticles(ctx,t);ctx.restore();
}
function updateCamera(dt){camera.x=lerp(camera.x,clamp(player.x,VW/2,WORLD_W-VW/2),1-Math.pow(.0008,dt));camera.y=lerp(camera.y,clamp(player.y,VH/2,WORLD_H-VH/2),1-Math.pow(.0008,dt));if(camera.shake>0){camera.shakeX=rnd(-camera.shake,camera.shake);camera.shakeY=rnd(-camera.shake,camera.shake);camera.shake=Math.max(0,camera.shake-dt*30)}else camera.shakeX=camera.shakeY=0}
function drawCreatorPreview(t){cctx.clearRect(0,0,creatorCanvas.width,creatorCanvas.height);cctx.save();cctx.translate(210,342);const ghost={head:draft.head,outfit:draft.outfit,dir:previewDir,state:'idle',reaction:'',actionKind:''};drawCharacter(cctx,ghost,t,2.15,false);cctx.restore()}
const GAME_CLOCK_START=Date.now();
function updateClock(){const total=9*60+Math.floor((Date.now()-GAME_CLOCK_START)/1000);const day=1+Math.floor(total/1440),mins=total%1440,h=Math.floor(mins/60),m=String(mins%60).padStart(2,'0'),amp=h<12?'AM':'PM',hh=h%12||12;$('#clockText').textContent=`${hh}:${m} ${amp}`;$('#dayText').textContent=day}
updateClock();setInterval(updateClock,1000);

function loop(now){let dt=Math.min(.033,(now-lastT)/1000||.016);lastT=now;const t=now/1000;processKeys();updateMovement(dt,now);updateResources(now,dt);updateFishing(dt,now);updateCamera(dt);updateContext();broadcast(now);for(const [id,p]of world.peers)if(now-p.seen>2600)world.peers.delete(id);ui.peer.textContent=`${1+world.peers.size} player${world.peers.size?'s':''}`;ui.coord.textContent=`${Math.round(player.x)} · ${Math.round(player.y)}`;drawScene(t);drawMini();if(creatorOpen)drawCreatorPreview(t);pressed.clear();requestAnimationFrame(loop)}

/* ---------- boot ---------- */
function boot(){buildCreator();renderInventory();renderRecipes();renderQuests();renderGuide();renderHotbar();syncUI();updateQuests();setTimeout(()=>{$('#startCurtain').classList.add('hide');if(!saved.head)setTimeout(()=>showCreator(true),220)},650);toast('초원에 오신 걸 환영해요','나무와 돌을 모아 나무검부터 만들어 보세요.','🌿')}
boot();requestAnimationFrame(loop);

})();
