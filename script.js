const faceTransforms=["rotateY(0deg) translateZ(29px)","rotateY(180deg) translateZ(29px)","rotateY(90deg) translateZ(29px)","rotateY(-90deg) translateZ(29px)","rotateX(90deg) translateZ(29px)","rotateX(-90deg) translateZ(29px)"];
const endRotation={1:"rotateX(0deg) rotateY(0deg)",2:"rotateX(0deg) rotateY(180deg)",3:"rotateX(0deg) rotateY(-90deg)",4:"rotateX(0deg) rotateY(90deg)",5:"rotateX(-90deg) rotateY(0deg)",6:"rotateX(90deg) rotateY(0deg)"};
let dice=[4,2,6,1,3,5],rolling=false,resetting=false,topView=false;
const game=document.querySelector("#game"),stage=document.querySelector("#dice-stage"),result=document.querySelector("#result"),button=document.querySelector("#roll"),moon=document.querySelector("#moon");

const diceFlipSound=new Audio("./dice-flip-user.mp3?v=20260916-15");
diceFlipSound.preload="auto";
function playDiceSound(){
  diceFlipSound.pause();diceFlipSound.currentTime=0;
  diceFlipSound.volume=1;diceFlipSound.playbackRate=1.12;
  diceFlipSound.play().catch(()=>{});
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
  stage.innerHTML=dice.map((value,index)=>`<div class="die-slot die-${index+1}"><div class="die ${rolling?"rolling":""}" style="--end:${endRotation[value]};--delay:${index*70}ms" aria-label="${value}点">${faceTransforms.map((transform,face)=>`<div class="face face-${face+1}" style="transform:${transform}">${dots(face+1)}</div>`).join("")}</div></div>`).join("");
}
function updateState(){
  game.className=`game ${topView?"top-view":""} ${rolling?"tossing":""}`;
  moon.className=`moon ${rolling?"glow":""}`;
  button.disabled=rolling||resetting;
  button.innerHTML=`<span>${resetting?"镜头转换中":rolling?"好彩翻滚中":"开始博饼"}</span><b>${rolling||resetting?"···":"掷"}</b>`;
  renderDice();
}
function finish(){
  window.setTimeout(()=>{dice=Array.from({length:6},()=>Math.floor(Math.random()*6)+1);const prize=scoreDice(dice);rolling=false;result.className="result show";result.innerHTML=`<span>本局彩头</span><strong>${prize[0]}</strong><p>${prize[1]}</p>`;updateState()},2800);
}
function roll(){
  if(rolling||resetting)return;
  playDiceSound();
  result.className="result";result.innerHTML="<span>静候开博</span><strong>月圆 · 人团圆</strong><p>按下按钮，让骰子替你问一程好运</p>";
  if(topView){rolling=true;updateState();finish();return}
  resetting=true;updateState();
  window.setTimeout(()=>{resetting=false;rolling=true;topView=true;updateState();finish()},80);
}
function miniDie(value){return `<i class="mini-die mini-${value}">${Array.from({length:value},()=>"<b></b>").join("")}</i>`}
const rules=[
  ["一秀","一个红四",[4,1,2,3,5,6]],["二举","两个红四",[4,4,1,2,3,6]],["三红","三个红四",[4,4,4,1,2,6]],
  ["四进","四颗相同点数",[2,2,2,2,3,5]],["对堂","一至六各一点",[1,2,3,4,5,6]],["状元","四个红四",[4,4,4,4,1,6]]
];
document.querySelector("#rule-grid").innerHTML=rules.map(([name,desc,values])=>`<article><div class="rule-dice">${values.map(miniDie).join("")}</div><strong>${name}</strong><span>${desc}</span></article>`).join("");
button.addEventListener("click",roll);
window.addEventListener("keydown",event=>{if(event.code==="Space"){event.preventDefault();roll()}});
updateState();