const faceTransforms=["rotateY(0deg) translateZ(29px)","rotateY(180deg) translateZ(29px)","rotateY(90deg) translateZ(29px)","rotateY(-90deg) translateZ(29px)","rotateX(90deg) translateZ(29px)","rotateX(-90deg) translateZ(29px)"];
const endRotation={1:"rotateX(0deg) rotateY(0deg)",2:"rotateX(0deg) rotateY(180deg)",3:"rotateX(0deg) rotateY(-90deg)",4:"rotateX(0deg) rotateY(90deg)",5:"rotateX(-90deg) rotateY(0deg)",6:"rotateX(90deg) rotateY(0deg)"};
let dice=[4,2,6,1,3,5],rolling=false,resetting=false,topView=false;
const game=document.querySelector("#game"),stage=document.querySelector("#dice-stage"),result=document.querySelector("#result"),button=document.querySelector("#roll"),moon=document.querySelector("#moon");
const nameModal=document.querySelector("#name-modal"),nameForm=document.querySelector("#name-form"),nameInput=document.querySelector("#nickname"),shopCodeInput=document.querySelector("#shop-code"),userChip=document.querySelector("#user-chip"),userName=document.querySelector("#user-name"),recordToast=document.querySelector("#record-toast");
const winnerList=document.querySelector("#winner-list");
const SUPABASE_URL="https://qemcatfhcmnrckufsjiz.supabase.co";
const SUPABASE_KEY="sb_publishable_g0IEeggLJZtytr-vHQALHg_WQKk31b_";
const PAGE_VERSION="20260921-27";
let currentNickname=(localStorage.getItem("bobing_nickname")||"").trim();
let currentShopCode=(localStorage.getItem("bobing_shop_code")||"").trim();
let deviceId=localStorage.getItem("bobing_device_id");
function makeUuid(){return crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==="x"?r:(r&3|8)).toString(16)})}
if(!deviceId){deviceId=makeUuid();localStorage.setItem("bobing_device_id",deviceId)}

const diceFlipSound=new Audio("./dice-flip-trimmed.mp3?v=20260916-18");
diceFlipSound.preload="auto";
diceFlipSound.load();
function playDiceSound(){
  diceFlipSound.pause();diceFlipSound.currentTime=0;
  diceFlipSound.volume=1;diceFlipSound.playbackRate=1.15;
  diceFlipSound.play().catch(()=>{});
}
function showToast(text){recordToast.textContent=text;recordToast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>recordToast.classList.remove("show"),2200)}
function openNameModal(){nameInput.value=currentNickname;shopCodeInput.value=currentShopCode;nameModal.classList.add("open");setTimeout(()=>nameInput.focus(),80)}
function updateParticipant(){userName.textContent=currentNickname||"填写信息";if(!currentNickname||!currentShopCode)openNameModal()}
function safeText(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]))}
function renderWinners(rows){
  if(!rows.length){winnerList.className="winner-list";winnerList.innerHTML='<p class="winner-empty">等待第一份好彩</p>';return}
  const markup=rows.map(row=>{const time=new Date(row.created_at).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit",hour12:false});return `<div class="winner-row"><time>${time}</time><b>${safeText(row.nickname)}</b><strong>${safeText(row.prize)}</strong></div>`}).join("");
  winnerList.className=`winner-list ${rows.length>3?"scrolling":""}`;winnerList.style.setProperty("--scroll-time",`${Math.max(12,rows.length*2.4)}s`);winnerList.innerHTML=rows.length>3?markup+markup:markup;
}
async function loadWinners(){
  try{const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_recent_bobing_results`,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({p_limit:20})});if(!response.ok)throw new Error(`HTTP ${response.status}`);renderWinners(await response.json())}catch(error){console.error("读取中奖记录失败",error)}
}
async function requestPlay(){
  const isPhone=/^1[3-9]\d{9}$/.test(currentNickname),endpoint=isPhone?"play_bobing_v25":"play_bobing",payload={p_nickname:currentNickname,p_shop_code:currentShopCode,p_device_id:deviceId,p_page_version:PAGE_VERSION};
  if(isPhone)payload.p_phone=currentNickname;
  const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${endpoint}`,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  return response.json();
}
function shuffle(values){const copy=[...values];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}

function scoreDice(values){
  const counts=Array(7).fill(0);values.forEach(n=>counts[n]++);
  if(counts[4]===4&&counts[1]===2)return["状元插金花","花中魁首，鸿运登峰！"];
  if(counts[4]===6)return["六勃红","六六大顺，满堂鸿运！"];
  if(Math.max(...counts)===6)return["六勃黑","六星同聚，福运齐来！"];
  if(counts[4]===5)return["五红状元","月满人圆，鸿运当头！"];
  if(Math.max(...counts)===5)return["五子登科","五福临门，好彩连连！"];
  if([1,2,3,4,5,6].every(n=>counts[n]))return["对堂","步步高升，前程似锦！"];
  if(counts[4]===4)return["四点红 · 状元","独占鳌头，金榜题名！"];
  if(Math.max(...counts)===4)return["四进","四季顺遂，稳中有进！"];
  if(counts[4]===3)return["三红 · 探花","花好月圆，喜事将近！"];
  if(counts[4]===2)return["二举 · 举人","双喜临门，好运成双！"];
  if(counts[4]===1)return["一秀 · 秀才","小试牛刀，福气已到！"];
  return["再接再厉","好彩在下一把，继续博！"];
}
function dots(value){return Array.from({length:value},()=>"<i></i>").join("")}
function renderDice(){
  stage.innerHTML=dice.map((value,index)=>`<div class="die-slot die-${index+1}"><div class="die ${rolling?"rolling":""}" style="--end:${endRotation[value]};--delay:${index*45}ms" aria-label="${value}点">${faceTransforms.map((transform,face)=>`<div class="face face-${face+1}" style="transform:${transform}">${dots(face+1)}</div>`).join("")}</div></div>`).join("");
}
function updateState(){
  game.className=`game ${topView?"top-view":""} ${rolling?"tossing":""}`;
  moon.className=`moon ${rolling?"glow":""}`;
  button.disabled=rolling||resetting;
  button.innerHTML=`<span>${resetting?"镜头转换中":rolling?"好彩翻滚中":"开始博饼"}</span><b>${rolling||resetting?"···":"掷"}</b>`;
  renderDice();
}
function finish(play,delay){
  window.setTimeout(()=>{rolling=false;result.className="result show";const title=play.actual_prize==="未中奖"?"再接再厉":play.actual_prize;result.innerHTML=`<span>${currentNickname} · 本局彩头</span><strong>${safeText(title)}</strong><p>${safeText(play.message)}</p>`;updateState();showToast("本次博饼结果已记录");if(play.display_prize!=="再接再厉")void loadWinners()},delay);
}
async function beginToss(){
  const started=Date.now();dice=Array.from({length:6},()=>Math.floor(Math.random()*6)+1);rolling=true;updateState();
  try{const play=await requestPlay();dice=shuffle(play.dice);finish(play,Math.max(280,2120-(Date.now()-started)))}
  catch(error){console.error("博饼失败",error);rolling=false;updateState();result.className="result show";result.innerHTML="<span>网络提示</span><strong>暂未完成博饼</strong><p>请检查网络后重新尝试</p>";showToast("博饼失败，请稍后重试")}
}
function roll(){
  if(rolling||resetting)return;
  if(!currentNickname||!currentShopCode){openNameModal();return}
  playDiceSound();
  result.className="result";result.innerHTML="<span>静候开博</span><strong>月圆 · 人团圆</strong><p>按下按钮，让骰子替你问一程好运</p>";
  if(topView){beginToss();return}
  resetting=true;updateState();
  window.setTimeout(()=>{resetting=false;topView=true;beginToss()},80);
}
function miniDie(value){return `<i class="mini-die mini-${value}">${Array.from({length:value},()=>"<b></b>").join("")}</i>`}
const rules=[
  ["一秀","一个红四",[4,1,2,3,5,6]],["二举","两个红四",[4,4,1,2,3,6]],["三红","三个红四",[4,4,4,1,2,6]],
  ["四进","四颗相同点数",[2,2,2,2,3,5]],["对堂","一至六各一点",[1,2,3,4,5,6]],["状元","四个红四",[4,4,4,4,1,6]]
];
document.querySelector("#rule-grid").innerHTML=rules.map(([name,desc,values])=>`<article><div class="rule-dice">${values.map(miniDie).join("")}</div><strong>${name}</strong><span>${desc}</span></article>`).join("");
button.addEventListener("click",roll);
userChip.addEventListener("click",openNameModal);
nameForm.addEventListener("submit",event=>{event.preventDefault();const value=nameInput.value.trim(),shopCode=shopCodeInput.value.trim().toUpperCase();if(!value||!shopCode)return;currentNickname=value;currentShopCode=shopCode;localStorage.setItem("bobing_nickname",value);localStorage.removeItem("bobing_phone");localStorage.setItem("bobing_shop_code",shopCode);nameModal.classList.remove("open");updateParticipant();showToast(`欢迎你，${value}`)});
window.addEventListener("keydown",event=>{if(event.code==="Space"&&!/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)){event.preventDefault();roll()}});
updateState();
updateParticipant();
void loadWinners();
setInterval(loadWinners,30000);
