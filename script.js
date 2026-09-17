const faceTransforms=["rotateY(0deg) translateZ(29px)","rotateY(180deg) translateZ(29px)","rotateY(90deg) translateZ(29px)","rotateY(-90deg) translateZ(29px)","rotateX(90deg) translateZ(29px)","rotateX(-90deg) translateZ(29px)"];
const endRotation={1:"rotateX(0deg) rotateY(0deg)",2:"rotateX(0deg) rotateY(180deg)",3:"rotateX(0deg) rotateY(-90deg)",4:"rotateX(0deg) rotateY(90deg)",5:"rotateX(-90deg) rotateY(0deg)",6:"rotateX(90deg) rotateY(0deg)"};
let dice=[4,2,6,1,3,5],rolling=false,resetting=false,topView=false;
const game=document.querySelector("#game"),stage=document.querySelector("#dice-stage"),result=document.querySelector("#result"),button=document.querySelector("#roll"),moon=document.querySelector("#moon");
const nameModal=document.querySelector("#name-modal"),nameForm=document.querySelector("#name-form"),nameInput=document.querySelector("#nickname"),userChip=document.querySelector("#user-chip"),userName=document.querySelector("#user-name"),recordToast=document.querySelector("#record-toast");
const SUPABASE_URL="https://qemcatfhcmnrckufsjiz.supabase.co";
const SUPABASE_KEY="sb_publishable_g0IEeggLJZtytr-vHQALHg_WQKk31b_";
const PAGE_VERSION="20260917-19";
let currentNickname=(localStorage.getItem("bobing_nickname")||"").trim();
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
function openNameModal(){nameInput.value=currentNickname;nameModal.classList.add("open");setTimeout(()=>nameInput.focus(),80)}
function updateParticipant(){userName.textContent=currentNickname||"填写昵称";if(!currentNickname)openNameModal()}
async function saveResult(values,prize){
  try{
    const response=await fetch(`${SUPABASE_URL}/rest/v1/bobing_results`,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({nickname:currentNickname,device_id:deviceId,dice:values,prize:prize[0],message:prize[1],page_version:PAGE_VERSION})});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    showToast("本次博饼结果已记录");
  }catch(error){console.error("保存博饼结果失败",error);showToast("结果暂未上传，请检查网络")}
}

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
function finish(){
  window.setTimeout(()=>{const prize=scoreDice(dice);rolling=false;result.className="result show";result.innerHTML=`<span>${currentNickname} · 本局彩头</span><strong>${prize[0]}</strong><p>${prize[1]}</p>`;updateState();void saveResult([...dice],prize)},2120);
}
function beginToss(){dice=Array.from({length:6},()=>Math.floor(Math.random()*6)+1);rolling=true;updateState();finish()}
function roll(){
  if(rolling||resetting)return;
  if(!currentNickname){openNameModal();return}
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
nameForm.addEventListener("submit",event=>{event.preventDefault();const value=nameInput.value.trim();if(!value)return;currentNickname=value;localStorage.setItem("bobing_nickname",value);nameModal.classList.remove("open");updateParticipant();showToast(`欢迎你，${value}`)});
window.addEventListener("keydown",event=>{if(event.code==="Space"&&!/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)){event.preventDefault();roll()}});
updateState();
updateParticipant();