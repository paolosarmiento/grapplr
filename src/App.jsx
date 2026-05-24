import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import AuthScreen from './AuthScreen';

const BASE = import.meta.env.BASE_URL;
const LOGO = BASE + 'logo-horizontal.png';

//  COLORS 
const LIME="#AAFF00",LIME_DK="#000",LIME_DIM="#AAFF0015",LIME_TXT="#2D6600",POS="#1D9E75",TAB_BG="#111";

//  CONSTANTS 
const SESSION_TYPES=["Gi","No-Gi","Open Mat","Drilling","Competition"];
const MOODS=["great","good","okay","rough"];
const MOOD_C={great:"#1D9E75",good:"#7F77DD",okay:"#EF9F27",rough:"#E24B4A"};
const SKILL_LABELS=["","Novice","Beginner","Intermediate","Advanced","Pro"];
const SKILL_COLORS=["","#636366","#378ADD","#7F77DD","#1D9E75","#EF9F27"];
const SKILL_DEFS=["","Learned the mechanics — can perform step by step with help","Can drill it correctly — executes with a cooperative partner","Landing it in positional sparring — hitting it in controlled rounds","Reliable in live rolling — works consistently vs resistant opponents","Competition-proven — landing it under tournament pressure"];
const CC=[LIME,"#1D9E75","#EF9F27","#E24B4A","#378ADD","#CC3D00"];
const CC_T=[LIME_DK,"#fff","#fff","#fff","#fff","#fff"];
const GOAL_CATS=["Technique","Competition","Fitness","Belt","Mental","Other"];
const INJURY_AREAS=["Neck","Shoulder","Elbow","Wrist","Fingers","Ribs","Hip","Knee","Ankle","Toes","Back","Other"];
const INJURY_STATUS=["Active","Recovering","Healed"];
const AGE_BRACKETS=["Adult","Master 1","Master 2","Master 3","Master 4","Master 5","Master 6","Juvenile"];
const COMP_BELTS=["White","Blue","Purple","Brown","Black"];
const MEDAL_OPTS=["None","Gold","Silver","Bronze"];
const MEDAL_COLORS={Gold:"#FFD700",Silver:"#C0C0C0",Bronze:"#CD7F32",None:"#2C2C2E"};
const WEIGHTS=["Rooster (-57.5kg)","Light Feather (-64kg)","Feather (-70kg)","Light (-76kg)","Middle (-82.3kg)","Medium Heavy (-88.3kg)","Heavy (-94.3kg)","Super Heavy (-100.5kg)","Ultra Heavy (+100.5kg)"];
const MOTIVATIONS=["A black belt is a white belt who never quit.","The mat is your mirror. Show up and reflect.","Roll hard. Tap. Learn. Repeat.","Every session is a deposit in your BJJ bank.","Embrace the grind. Trust the process.","Discomfort is the price of growth on the mat.","Your worst day training beats your best day on the couch."];
const BELTS=[{id:"white",color:"#E8E8E8",text:"#333",label:"White"},{id:"blue",color:"#1565C0",text:"#fff",label:"Blue"},{id:"purple",color:"#6A1B9A",text:"#fff",label:"Purple"},{id:"brown",color:"#5D4037",text:"#fff",label:"Brown"},{id:"black",color:"#222",text:"#fff",label:"Black"},{id:"coral",color:"#CC3D00",text:"#fff",label:"Coral"}];
const GAME_STYLES=["Guard Player","Passer","Submission Hunter","Wrestler","Balanced","Defensive"];
const FAV_POSITIONS=["Closed Guard","Half Guard","Butterfly Guard","De La Riva","X-Guard","Mount","Back Control","Side Control","Turtle","Leg Entanglements"];
const BJJ_MOBILITY=[
  {id:1,name:"Granby Roll",reps:"3 × 5 each side",cat:"Warm-up"},
  {id:2,name:"Hip Escape (Shrimping)",reps:"3 × length of mat",cat:"Warm-up"},
  {id:3,name:"Bridge & Roll",reps:"3 × 10 reps",cat:"Warm-up"},
  {id:4,name:"Technical Stand-up",reps:"3 × 5 each side",cat:"Warm-up"},
  {id:5,name:"Bear Crawl",reps:"2 × length of mat",cat:"Warm-up"},
  {id:6,name:"Penetration Step",reps:"3 × 10 each leg",cat:"Takedowns"},
  {id:7,name:"Deep Hip Squat Hold",reps:"3 × 45 sec",cat:"Hips"},
  {id:8,name:"Pigeon Pose",reps:"60 sec each side",cat:"Hips"},
  {id:9,name:"Butterfly Stretch",reps:"2 × 60 sec",cat:"Hips"},
  {id:10,name:"Seated Spinal Twist",reps:"30 sec each side",cat:"Spine"},
  {id:11,name:"Cat-Cow",reps:"2 × 10 reps",cat:"Spine"},
  {id:12,name:"Neck Circles",reps:"10 each direction",cat:"Neck"},
  {id:13,name:"Wrist Circles & Extensions",reps:"2 × 20 reps",cat:"Wrists"},
  {id:14,name:"Ankle Rotations",reps:"2 × 20 each",cat:"Ankles"},
  {id:15,name:"Guard Retention Drill",reps:"3 × 30 sec",cat:"Guard"},
];
const TECH_DEFAULT=[
  {id:1,name:"Armbar",cat:"Submissions",skill:3},
  {id:2,name:"Triangle Choke",cat:"Submissions",skill:2},
  {id:3,name:"Rear Naked Choke",cat:"Submissions",skill:4},
  {id:4,name:"Guillotine",cat:"Submissions",skill:3},
  {id:5,name:"Kimura",cat:"Submissions",skill:2},
  {id:6,name:"Darce Choke",cat:"Submissions",skill:1},
  {id:7,name:"Omo Plata",cat:"Submissions",skill:2},
  {id:8,name:"Heel Hook",cat:"Submissions",skill:2},
  {id:9,name:"Butterfly Guard",cat:"Guard",skill:3},
  {id:10,name:"Closed Guard",cat:"Guard",skill:4},
  {id:11,name:"Half Guard",cat:"Guard",skill:3},
  {id:12,name:"De La Riva",cat:"Guard",skill:2},
  {id:13,name:"X-Guard",cat:"Guard",skill:2},
  {id:14,name:"Single Leg",cat:"Takedowns",skill:3},
  {id:15,name:"Double Leg",cat:"Takedowns",skill:2},
  {id:16,name:"Ankle Pick",cat:"Takedowns",skill:2},
  {id:17,name:"Mount Escape (Elbow-Knee)",cat:"Escapes",skill:3},
  {id:18,name:"Back Escape",cat:"Escapes",skill:2},
  {id:19,name:"Scissor Sweep",cat:"Sweeps",skill:3},
  {id:20,name:"Hip Bump Sweep",cat:"Sweeps",skill:4},
  {id:21,name:"Berimbolo",cat:"Sweeps",skill:3},
  {id:22,name:"Flower Sweep",cat:"Sweeps",skill:3},
];
const WEEKLY_CHALLENGES=[
  {id:0,title:"Train 4x this week",desc:"Consistency is the #1 predictor of improvement.",type:"sessions",target:4},
  {id:1,title:"Land 5 submissions",desc:"Focus on finishing your attacks this week.",type:"subs",target:5},
  {id:2,title:"No-Gi session",desc:"Train without the gi at least once this week.",type:"type",target:"No-Gi"},
  {id:3,title:"60-min drilling session",desc:"Dedicate a full session to drilling only.",type:"duration",target:60},
  {id:4,title:"Journal every session",desc:"Write a debrief after every mat session this week.",type:"journals",target:3},
  {id:5,title:"Train with 3 different partners",desc:"Variety in training partners accelerates growth.",type:"partners",target:3},
  {id:6,title:"5 sessions this week",desc:"Push your limits. This is your strongest week.",type:"sessions",target:5},
];
const LEFT_TABS=[{id:"dashboard",icon:"ti-home",label:"Home"},{id:"sessions",icon:"ti-flame",label:"Train"}];
const RIGHT_TABS=[{id:"progress",icon:"ti-chart-line",label:"Progress"},{id:"library",icon:"ti-tournament",label:"Moves"}];

//  UTILS 
function calcStreak(s){if(!s.length)return 0;const dates=[...new Set(s.map(x=>x.date))].sort().reverse();let n=0,cur=new Date();cur.setHours(0,0,0,0);for(const d of dates){const sd=new Date(d);const diff=Math.round((cur-sd)/864e5);if(diff<=1){n++;cur=sd;}else break;}return n;}
function yearsTraining(d){if(!d)return null;const m=Math.floor((new Date()-new Date(d))/(864e5*30));return m<12?`${m}mo`:`${Math.floor(m/12)}yr ${m%12}mo`;}
function calcXP(sessions){return sessions.length*50+sessions.reduce((a,s)=>a+(s.taps_given||0)*10,0);}
function calcConsistency(sessions,goal){const w=4;let t=0;for(let i=0;i<w;i++){const s=new Date(Date.now()-(i+1)*7*864e5),e=new Date(Date.now()-i*7*864e5);const c=sessions.filter(x=>{const d=new Date(x.date);return d>=s&&d<e;}).length;t+=Math.min(1,c/(goal||4));}return Math.round(t/w*100);}
function getGreeting(){const h=new Date().getHours();return h<12?"Good morning":h<17?"Good afternoon":"Good evening";}
function getWeekNumber(){const d=new Date();return Math.ceil(((d-new Date(d.getFullYear(),0,1))/864e5+1)/7);}
function calcChallengeProgress(sessions,journal,challenge){
  const weekStart=new Date();weekStart.setDate(weekStart.getDate()-weekStart.getDay());weekStart.setHours(0,0,0,0);
  const wkSessions=sessions.filter(s=>new Date(s.date)>=weekStart);
  if(challenge.type==="sessions")return{current:wkSessions.length,target:challenge.target};
  if(challenge.type==="subs")return{current:wkSessions.reduce((a,s)=>a+(s.taps_given||0),0),target:challenge.target};
  if(challenge.type==="type")return{current:wkSessions.some(s=>s.type===challenge.target)?1:0,target:1};
  if(challenge.type==="duration")return{current:Math.max(0,...wkSessions.filter(s=>s.type==="Drilling").map(s=>s.duration||0)),target:challenge.target};
  if(challenge.type==="journals"){const wkJ=journal.filter(j=>new Date(j.date)>=weekStart);return{current:wkJ.length,target:challenge.target};}
  if(challenge.type==="partners"){const p=new Set(wkSessions.map(s=>s.partner).filter(Boolean));return{current:p.size,target:challenge.target};}
  return{current:0,target:1};
}
function calcPersonalBests(sessions){
  const weeks={};sessions.forEach(s=>{const d=new Date(s.date);const wk=`${d.getFullYear()}-W${Math.ceil((d-new Date(d.getFullYear(),0,1))/864e5/7)}`;weeks[wk]=(weeks[wk]||0)+1;});
  const bestWeek=Math.max(0,...Object.values(weeks));
  const bestSubs=Math.max(0,...sessions.map(s=>s.taps_given||0));
  const bestDuration=Math.max(0,...sessions.map(s=>s.duration||0));
  return{bestWeek,bestSubs,bestDuration};
}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function uid(){return `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;}
const MEDAL_EMOJI={Gold:"🥇",Silver:"🥈",Bronze:"🥉",None:"—"};
function getMedals(comp){const r=[];if(comp.joinedGi){if(comp.giWeightMedal&&comp.giWeightMedal!=="None")r.push({label:"Gi Weight",medal:comp.giWeightMedal,color:MEDAL_COLORS[comp.giWeightMedal]});if(comp.giAbsMedal&&comp.giAbsMedal!=="None")r.push({label:"Gi Abs",medal:comp.giAbsMedal,color:MEDAL_COLORS[comp.giAbsMedal]});}if(comp.joinedNogi){if(comp.nogiWeightMedal&&comp.nogiWeightMedal!=="None")r.push({label:"No-Gi Weight",medal:comp.nogiWeightMedal,color:MEDAL_COLORS[comp.nogiWeightMedal]});if(comp.nogiAbsMedal&&comp.nogiAbsMedal!=="None")r.push({label:"No-Gi Abs",medal:comp.nogiAbsMedal,color:MEDAL_COLORS[comp.nogiAbsMedal]});}return r;}

//  FIRESTORE HOOK 
function useFirestore(userId,key,value,loaded){
  useEffect(()=>{
    if(!loaded||!userId)return;
    const colName=key.replace('bjj:','');
    const t=setTimeout(async()=>{
      try{await setDoc(doc(db,'users',userId,'data',colName),{value:JSON.stringify(value),updatedAt:serverTimestamp()});}
      catch(e){console.error('Save error:',e);}
    },800);
    return()=>clearTimeout(t);
  },[userId,key,value,loaded]);
}

//  GLOBAL STYLES 
const GS=()=>(<style>{`
*{box-sizing:border-box;}html,body{overflow-x:hidden;max-width:100%;}
input,textarea,select{background:#2C2C2E!important;border:none!important;border-radius:12px!important;padding:14px 16px!important;font-size:15px!important;color:#fff!important;font-family:inherit!important;outline:none!important;width:100%;-webkit-appearance:none;appearance:none;}
input:focus,textarea:focus,select:focus{box-shadow:0 0 0 3px rgba(170,255,0,0.2)!important;}
textarea{resize:vertical;min-height:76px;}
::placeholder{color:#555!important;opacity:1!important;}
input[type=range]{padding:4px 0!important;background:transparent!important;border-radius:0!important;}
body{background:#000;margin:0;}
option{background:#1C1C1E;color:#fff;}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 24px rgba(170,255,0,0.4)}50%{box-shadow:0 0 48px rgba(170,255,0,0.65)}}
@keyframes streakPulse{0%,100%{text-shadow:0 0 20px rgba(255,160,0,0.5)}50%{text-shadow:0 0 40px rgba(255,160,0,0.9)}}
@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.fade-in{animation:fadeIn 0.4s ease forwards;}
.glow-btn{animation:glowPulse 2.5s ease-in-out infinite;}
.streak-num{animation:streakPulse 2s ease-in-out infinite;}
.tap{transition:transform 0.12s ease,opacity 0.12s ease;cursor:pointer;}
.tap:active{transform:scale(0.97);opacity:0.85;}
`}</style>);

//  SHARED UI 
const card={background:"#1C1C1E",borderRadius:20,padding:"16px 18px",marginBottom:12,border:"0.5px solid #2A2A2C"};
const mc={background:"#1C1C1E",borderRadius:16,padding:"14px 10px",border:"0.5px solid #2A2A2C"};
const tt={fontSize:12,background:"#1C1C1E",border:"0.5px solid #3A3A3C",borderRadius:8,color:"#fff"};
const Lbl=({c,children})=><p style={{margin:"0 0 8px",fontSize:13,fontWeight:500,color:c||"#8E8E93"}}>{children}</p>;
const SH=({children})=><p style={{margin:"24px 0 10px",fontSize:11,fontWeight:600,color:"#555",textTransform:"uppercase",letterSpacing:"1px"}}>{children}</p>;
const Pill=({children,active,onClick,color,s={}})=><button onClick={onClick} className="tap" style={{border:"none",borderRadius:50,cursor:"pointer",fontFamily:"inherit",fontWeight:active?600:400,fontSize:13,padding:"8px 18px",background:active?(color||LIME):"#2C2C2E",color:active?(color?"#fff":LIME_DK):"#8E8E93",transition:"all 0.15s",...s}}>{children}</button>;
const PBtn=({children,onClick,s={},glow=false,disabled=false})=><button onClick={onClick} disabled={disabled} className={glow?"glow-btn tap":"tap"} style={{border:"none",borderRadius:18,cursor:disabled?"not-allowed":"pointer",background:disabled?"#2C2C2E":LIME,color:disabled?"#555":LIME_DK,fontFamily:"inherit",fontWeight:800,fontSize:17,padding:"19px 28px",width:"100%",letterSpacing:"0.3px",opacity:disabled?0.5:1,...s}}>{children}</button>;
const SkillDots=({skill})=><div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:i<=skill?SKILL_COLORS[skill]:"#3A3A3C"}}/>)}</div>;
const SegCtrl=memo(function SegCtrl({opts,value,onChange}){return(<div style={{background:"#1C1C1E",borderRadius:50,padding:3,display:"flex",marginBottom:16,border:"0.5px solid #2A2A2C"}}>{opts.map(([id,label])=>(<button key={id} onClick={()=>onChange(id)} style={{flex:1,border:"none",borderRadius:50,padding:"9px 0",cursor:"pointer",background:value===id?"#2C2C2E":"transparent",color:value===id?"#fff":"#636366",fontWeight:value===id?600:400,fontSize:13,fontFamily:"inherit",transition:"all 0.2s"}}>{label}</button>))}</div>);});
const Stepper=memo(function Stepper({value,onChange,min=0,max=20,label}){return(<div>{label&&<Lbl>{label}</Lbl>}<div style={{display:"flex",alignItems:"center",background:"#2C2C2E",borderRadius:14,overflow:"hidden"}}><button onClick={()=>onChange(Math.max(min,value-1))} style={{width:52,height:52,border:"none",background:"transparent",cursor:"pointer",fontSize:24,color:"#8E8E93",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button><span style={{flex:1,textAlign:"center",fontSize:22,fontWeight:700,fontFamily:"inherit",color:"#fff"}}>{value}</span><button onClick={()=>onChange(Math.min(max,value+1))} style={{width:52,height:52,border:"none",background:"transparent",cursor:"pointer",fontSize:24,color:LIME_TXT,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button></div></div>);});

function BottomSheet({children,onClose,title,noPad=false}){return(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={onClose}><div style={{background:"#1C1C1E",borderRadius:"24px 24px 0 0",maxHeight:"92vh",overflowY:"auto",padding:noPad?"0":"0 22px 44px"}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"center",padding:"14px 0 8px"}}><div style={{width:36,height:5,borderRadius:3,background:"#3A3A3C"}}/></div>{!noPad&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:18,position:"sticky",top:0,background:"#1C1C1E",zIndex:1,padding:"0 0 18px"}}><h3 style={{margin:0,fontSize:19,fontWeight:700,color:"#fff"}}>{title}</h3><button onClick={onClose} style={{width:36,height:36,borderRadius:"50%",background:"#2C2C2E",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#8E8E93",fontSize:18}}>×</button></div>}{noPad&&<div style={{padding:"0 22px",display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:18}}><h3 style={{margin:0,fontSize:19,fontWeight:700,color:"#fff"}}>{title}</h3><button onClick={onClose} style={{width:36,height:36,borderRadius:"50%",background:"#2C2C2E",border:"none",cursor:"pointer",color:"#8E8E93",fontSize:18}}>×</button></div>}{noPad?<div style={{padding:"0 22px 44px"}}>{children}</div>:children}</div></div>);}

function ToastBar({toasts,dismiss}){if(!toasts.length)return null;return(<div style={{position:"fixed",bottom:88,left:0,right:0,display:"flex",flexDirection:"column",gap:8,alignItems:"center",zIndex:400,pointerEvents:"none",padding:"0 16px"}}>{toasts.map(t=>(<div key={t.id} style={{background:"#2C2C2E",color:"#fff",borderRadius:50,padding:"12px 16px 12px 20px",fontSize:14,fontWeight:500,display:"flex",alignItems:"center",gap:12,boxShadow:"0 4px 24px rgba(0,0,0,0.6)",pointerEvents:"auto",maxWidth:360,width:"100%"}}><span style={{flex:1}}>{t.msg}</span>{t.action&&<button onClick={()=>{t.action.fn();dismiss(t.id);}} style={{background:LIME,color:LIME_DK,border:"none",borderRadius:50,padding:"6px 14px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{t.action.label}</button>}<button onClick={()=>dismiss(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#636366",padding:4,fontSize:14}}>×</button></div>))}</div>);}

const BeltPicker=memo(function BeltPicker({value,onChange}){return(<div style={{display:"flex",justifyContent:"space-between",gap:4}}>{BELTS.map(b=>(<button key={b.id} onClick={()=>onChange(b.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:7,background:"none",border:"none",cursor:"pointer",padding:"4px 0"}}><div style={{width:44,height:44,borderRadius:"50%",background:b.color,display:"flex",alignItems:"center",justifyContent:"center",outline:value===b.id?`3px solid ${LIME}`:"3px solid transparent",outlineOffset:2,boxShadow:value===b.id?`0 0 14px ${LIME}60`:"none",transition:"all 0.2s"}}>{value===b.id&&<span style={{fontSize:16,color:b.text}}></span>}</div><span style={{fontSize:10,color:value===b.id?"#fff":"#636366",fontWeight:value===b.id?600:400,fontFamily:"inherit"}}>{b.label}</span></button>))}</div>);});

const StripePicker=memo(function StripePicker({value,onChange}){return(<div style={{background:"#2C2C2E",borderRadius:16,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>{[0,1,2,3,4].map(n=>(<button key={n} onClick={()=>onChange(n)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,background:"none",border:"none",cursor:"pointer",padding:"4px 8px",minWidth:44,minHeight:44,justifyContent:"center"}}><div style={{width:38,height:38,borderRadius:"50%",background:value===n?LIME:"#3A3A3C",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}><span style={{fontSize:15,fontWeight:700,color:value===n?LIME_DK:"#636366",fontFamily:"inherit"}}>{n}</span></div><span style={{fontSize:10,color:value===n?"#fff":"#636366",fontFamily:"inherit"}}>{n===0?"None":n===1?"Stripe":"Stripes"}</span></button>))}</div>);});

const SCard=memo(function SCard({s,onDelete}){
  const moodColor=MOOD_C[s.mood]||"#3A3A3C";
  return(<div className="tap" style={{...card,borderLeft:`3px solid ${moodColor}50`}}>
    <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
      <div style={{width:46,height:46,borderRadius:14,background:LIME_DIM,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0,border:`1px solid ${LIME}20`}}>
        <span style={{fontSize:10,fontWeight:700,color:LIME_TXT,lineHeight:1}}>{s.date.slice(5).replace("-","/")}</span>
        <span style={{fontSize:9,color:LIME_TXT,opacity:0.7,marginTop:2}}>{s.type}</span>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
          <p style={{margin:0,fontSize:15,fontWeight:600,color:"#fff"}}>{s.duration} min{s.partner?` · ${s.partner}`:""}</p>
          {onDelete&&<button onClick={()=>onDelete(s.id)} style={{width:36,height:36,background:"none",border:"none",cursor:"pointer",color:"#555",fontSize:14}}></button>}
        </div>
        {s.notes&&<p style={{margin:"0 0 6px",fontSize:13,color:"#8E8E93",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.notes}</p>}
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <span style={{fontSize:12,color:POS,fontWeight:600}}>{s.taps_given||0} subs</span>
          <span style={{fontSize:12,color:"#555"}}>tapped {s.taps_received||0}×</span>
          {s.rounds?.length>0&&<span style={{fontSize:12,color:"#636366"}}>{s.rounds.length} rounds</span>}
          {s.mood&&<span style={{marginLeft:"auto",fontSize:11,padding:"2px 10px",borderRadius:50,background:moodColor+"20",color:moodColor,fontWeight:600}}>{s.mood}</span>}
        </div>
      </div>
    </div>
  </div>);
});

const TabBtn=memo(function TabBtn({t,active,onTabClick}){return(<button onClick={()=>onTabClick(t.id)} style={{flex:1,minHeight:58,padding:"6px 0 8px",border:"none",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,fontFamily:"inherit"}}><i className={`ti ${t.icon}`} style={{fontSize:22,color:active?"#fff":"#444",transition:"color 0.2s"}}/><span style={{fontSize:11,fontWeight:active?700:400,color:active?"#fff":"#444",transition:"color 0.2s"}}>{t.label}</span>{active&&<div style={{width:4,height:4,borderRadius:"50%",background:LIME}}/>}</button>);});

//  ONBOARDING 
function Onboarding({onDone}){
  const [step,setStep]=useState(0);
  const [f,setF]=useState({name:"",belt:"white",stripes:0,gym:"",coach:"",startDate:"",weightClass:WEIGHTS[4],weeklyGoal:4,gameStyle:"Balanced",favPositions:[]});
  const sv=useCallback((k,v)=>setF(p=>({...p,[k]:v})),[]);
  const togglePos=useCallback(p=>setF(prev=>({...prev,favPositions:prev.favPositions.includes(p)?prev.favPositions.filter(x=>x!==p):[...prev.favPositions,p]})),[]);
  const steps=[
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",padding:"48px 0 32px"}} className="fade-in">
      <img src={LOGO} alt="Grapplr" style={{width:"80%",maxWidth:280,objectFit:"contain",marginBottom:36}}/>
      <h1 style={{fontSize:34,fontWeight:800,margin:"0 0 10px",color:"#fff",letterSpacing:"-0.5px"}}>Your BJJ OS</h1>
      <p style={{fontSize:16,color:"#8E8E93",margin:"0 0 52px",lineHeight:1.7,maxWidth:280}}>Track every session. Analyze your game. Evolve as a grappler.</p>
      <PBtn onClick={()=>setStep(1)} glow>Get started →</PBtn>
    </div>,
    <div style={{padding:"20px 0"}} className="fade-in">
      <h2 style={{fontSize:26,fontWeight:700,margin:"0 0 6px",color:"#fff"}}>What's your name?</h2>
      <p style={{fontSize:15,color:"#8E8E93",margin:"0 0 32px"}}>How should we address you on the mat?</p>
      <Lbl>Full name</Lbl>
      <input value={f.name} onChange={e=>sv("name",e.target.value)} placeholder="e.g. Paolo Santos" style={{marginBottom:32}}/>
      <PBtn onClick={()=>f.name.trim()&&setStep(2)} disabled={!f.name.trim()}>Continue →</PBtn>
    </div>,
    <div style={{padding:"20px 0"}} className="fade-in">
      <h2 style={{fontSize:26,fontWeight:700,margin:"0 0 6px",color:"#fff"}}>Current belt</h2>
      <p style={{fontSize:15,color:"#8E8E93",margin:"0 0 28px"}}>Where are you on your journey?</p>
      <BeltPicker value={f.belt} onChange={v=>sv("belt",v)}/>
      <SH>Stripes</SH>
      <StripePicker value={f.stripes} onChange={v=>sv("stripes",v)}/>
      <PBtn onClick={()=>setStep(3)} s={{marginTop:28}}>Continue →</PBtn>
    </div>,
    <div style={{padding:"20px 0"}} className="fade-in">
      <h2 style={{fontSize:26,fontWeight:700,margin:"0 0 6px",color:"#fff"}}>Your academy</h2>
      <p style={{fontSize:15,color:"#8E8E93",margin:"0 0 28px"}}>Tell us where you train.</p>
      <Lbl>Gym / Academy</Lbl>
      <input value={f.gym} onChange={e=>sv("gym",e.target.value)} placeholder="e.g. Flow Studio" style={{marginBottom:12}}/>
      <Lbl>Head coach</Lbl>
      <input value={f.coach} onChange={e=>sv("coach",e.target.value)} placeholder="e.g. Coach Marco" style={{marginBottom:12}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div><Lbl>Training since</Lbl><input type="date" max={todayISO()} value={f.startDate} onChange={e=>sv("startDate",e.target.value)}/></div>
        <div><Lbl>Weight class</Lbl><select value={f.weightClass} onChange={e=>sv("weightClass",e.target.value)}>{WEIGHTS.map(w=><option key={w}>{w}</option>)}</select></div>
      </div>
      <PBtn onClick={()=>setStep(4)} s={{marginTop:8}}>Continue →</PBtn>
    </div>,
    <div style={{padding:"20px 0"}} className="fade-in">
      <h2 style={{fontSize:26,fontWeight:700,margin:"0 0 6px",color:"#fff"}}>Your game</h2>
      <p style={{fontSize:15,color:"#8E8E93",margin:"0 0 24px"}}>This personalizes your coaching insights.</p>
      <Lbl>Playing style</Lbl>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:24}}>{GAME_STYLES.map(g=><Pill key={g} active={f.gameStyle===g} onClick={()=>sv("gameStyle",g)}>{g}</Pill>)}</div>
      <Lbl>Favorite positions <span style={{color:"#555",fontWeight:400}}>(up to 3)</span></Lbl>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:32}}>{FAV_POSITIONS.map(p=><Pill key={p} active={f.favPositions.includes(p)} onClick={()=>f.favPositions.length<3||f.favPositions.includes(p)?togglePos(p):null} s={{opacity:f.favPositions.length>=3&&!f.favPositions.includes(p)?0.35:1}}>{p}</Pill>)}</div>
      <PBtn onClick={()=>setStep(5)}>Continue →</PBtn>
    </div>,
    <div style={{padding:"20px 0"}} className="fade-in">
      <h2 style={{fontSize:26,fontWeight:700,margin:"0 0 6px",color:"#fff"}}>Weekly goal</h2>
      <p style={{fontSize:15,color:"#8E8E93",margin:"0 0 40px"}}>How many sessions per week are you targeting?</p>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:36,marginBottom:48}}>
        <button onClick={()=>sv("weeklyGoal",Math.max(1,f.weeklyGoal-1))} style={{width:56,height:56,borderRadius:"50%",background:"#2C2C2E",border:"none",cursor:"pointer",fontSize:28,color:"#fff",fontFamily:"inherit"}}>−</button>
        <div style={{textAlign:"center"}}><p style={{margin:0,fontSize:72,fontWeight:800,color:LIME,lineHeight:1}}>{f.weeklyGoal}</p><p style={{margin:"6px 0 0",fontSize:14,color:"#8E8E93"}}>sessions / week</p></div>
        <button onClick={()=>sv("weeklyGoal",Math.min(7,f.weeklyGoal+1))} style={{width:56,height:56,borderRadius:"50%",background:"#2C2C2E",border:"none",cursor:"pointer",fontSize:28,color:LIME_TXT,fontWeight:700,fontFamily:"inherit"}}>+</button>
      </div>
      <PBtn onClick={()=>onDone({...f,onboarded:true})} glow>Let's roll </PBtn>
    </div>
  ];
  return(
    <div style={{maxWidth:480,margin:"0 auto",padding:"0 24px",minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",justifyContent:"center"}}>
      {step>0&&<div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
        <button onClick={()=>setStep(s=>s-1)} style={{width:44,height:44,borderRadius:"50%",background:"#1C1C1E",border:"none",cursor:"pointer",color:"#fff",fontSize:18}}>←</button>
        <div style={{flex:1,display:"flex",gap:5}}>{[1,2,3,4,5].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:step>=i?LIME:"#2C2C2E",transition:"background 0.3s"}}/>)}</div>
      </div>}
      {steps[step]}
    </div>
  );
}

//  DASHBOARD 
const Dashboard=memo(function Dashboard({sessions,journal,profile,onLog,onQuickLog,onJournal}){
  const totalMins=useMemo(()=>sessions.reduce((a,s)=>a+(s.duration||0),0),[sessions]);
  const streak=useMemo(()=>calcStreak(sessions),[sessions]);
  const xp=useMemo(()=>calcXP(sessions),[sessions]);
  const consistency=useMemo(()=>calcConsistency(sessions,profile.weeklyGoal),[sessions,profile.weeklyGoal]);
  const pbs=useMemo(()=>calcPersonalBests(sessions),[sessions]);
  const beltIdx=BELTS.findIndex(b=>b.id===profile.belt);
  const nextBelt=BELTS[Math.min((beltIdx<0?1:beltIdx)+1,BELTS.length-1)];
  const xpToNext=Math.max(1,(beltIdx+1)*300);
  const xpPct=Math.min(100,Math.round(xp/xpToNext*100));
  const beltObj=BELTS.find(b=>b.id===profile.belt)||BELTS[1];
  const training=useMemo(()=>yearsTraining(profile.startDate),[profile.startDate]);
  const wkGoal=profile.weeklyGoal||4;
  const challenge=WEEKLY_CHALLENGES[getWeekNumber()%WEEKLY_CHALLENGES.length];
  const challengeProgress=useMemo(()=>calcChallengeProgress(sessions,journal,challenge),[sessions,journal,challenge]);
  const challengePct=Math.min(100,Math.round(challengeProgress.current/challengeProgress.target*100));
  const challengeDone=challengeProgress.current>=challengeProgress.target;

  const weekStart=new Date();weekStart.setDate(weekStart.getDate()-weekStart.getDay());weekStart.setHours(0,0,0,0);
  const wkSessions=sessions.filter(s=>new Date(s.date)>=weekStart);
  const weeklyDots=useMemo(()=>{const days=["S","M","T","W","T","F","S"];return[...Array(7)].map((_,i)=>{const d=new Date(Date.now()-(6-i)*864e5);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;const active=sessions.some(s=>s.date===key);return{day:days[d.getDay()],active};});},[sessions]);

  return(
    <div className="fade-in">
      {/* Greeting */}
      <div style={{marginBottom:24}}>
        <p style={{margin:"0 0 2px",fontSize:12,color:"#555",fontWeight:500,textTransform:"uppercase",letterSpacing:"1px"}}>{getGreeting()}{profile.gym?` · ${profile.gym}`:""}</p>
        <h1 style={{margin:0,fontSize:30,fontWeight:800,color:"#fff",letterSpacing:"-0.5px"}}>{profile.name||"Grappler"}</h1>
        {training&&<p style={{margin:"4px 0 0",fontSize:12,color:"#555"}}>{training} on the mat{profile.gameStyle?` · ${profile.gameStyle}`:""}</p>}
      </div>

      {/* STREAK HERO */}
      {streak>0?(
        <div style={{background:"linear-gradient(135deg,#1a0a00,#2a1500)",borderRadius:24,padding:"24px 20px",marginBottom:12,border:"0.5px solid #FF8C0030",textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"radial-gradient(circle at 50% 0%,rgba(255,140,0,0.08),transparent 70%)",pointerEvents:"none"}}/>
          <p style={{margin:"0 0 4px",fontSize:11,fontWeight:600,color:"#FF8C00",textTransform:"uppercase",letterSpacing:"1px"}}>Training Streak</p>
          <p className="streak-num" style={{margin:0,fontSize:80,fontWeight:900,color:"#FF8C00",lineHeight:1}}>{streak}</p>
          <p style={{margin:"4px 0 0",fontSize:14,color:"rgba(255,140,0,0.7)"}}>{streak===1?"day":"days"} in a row{streak>=7?" ":streak>=3?" ":""}</p>
          {streak>=3&&<p style={{margin:"8px 0 0",fontSize:12,color:"rgba(255,140,0,0.5)"}}>Personal best: {pbs.bestWeek} sessions in a week</p>}
        </div>
      ):(
        <div style={{...card,textAlign:"center",padding:"20px",marginBottom:12,borderStyle:"dashed"}}>
          <p style={{margin:"0 0 4px",fontSize:28}}></p>
          <p style={{margin:"0 0 4px",fontSize:15,fontWeight:600,color:"#fff"}}>Start your streak today</p>
          <p style={{margin:0,fontSize:13,color:"#555"}}>Log a session to begin your journey</p>
        </div>
      )}

      {/* XP Progress */}
      <div style={{...card,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:beltObj.color,boxShadow:`0 0 8px ${beltObj.color}`}}/>
            <span style={{fontSize:13,color:"#fff",fontWeight:600}}>{beltObj.label} Belt{profile.stripes>0?` · ${profile.stripes} stripe${profile.stripes>1?"s":""}`:""}</span>
          </div>
          <span style={{fontSize:11,color:"#555"}}>{xp} / {xpToNext} XP</span>
        </div>
        <div style={{height:6,background:"#2C2C2E",borderRadius:3,overflow:"hidden",marginBottom:6}}>
          <div style={{width:`${xpPct}%`,height:"100%",background:`linear-gradient(90deg,${LIME},#88CC00)`,borderRadius:3,transition:"width 1s ease"}}/>
        </div>
        <p style={{margin:0,fontSize:11,color:"#555"}}>{xpPct}% to {nextBelt?.label} · +50 XP/session · +10 XP/sub</p>
      </div>

      {/* Weekly Challenge */}
      <div style={{...card,marginBottom:12,borderLeft:`3px solid ${challengeDone?POS:LIME}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <p style={{margin:0,fontSize:11,fontWeight:700,color:challengeDone?POS:LIME,textTransform:"uppercase",letterSpacing:"0.8px"}}>{challengeDone?" Challenge complete!":"Weekly challenge"}</p>
          <span style={{fontSize:12,color:"#555"}}>{challengeProgress.current}/{challengeProgress.target}</span>
        </div>
        <p style={{margin:"0 0 4px",fontSize:15,fontWeight:700,color:"#fff"}}>{challenge.title}</p>
        <p style={{margin:"0 0 10px",fontSize:12,color:"#8E8E93"}}>{challenge.desc}</p>
        <div style={{height:5,background:"#2C2C2E",borderRadius:3}}>
          <div style={{width:`${challengePct}%`,height:"100%",background:challengeDone?POS:LIME,borderRadius:3,transition:"width 0.5s ease"}}/>
        </div>
      </div>

      {/* Quick Log + Full Log */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:8,marginBottom:12}}>
        <button onClick={onQuickLog} className="tap" style={{padding:"16px 8px",borderRadius:18,background:"#1C1C1E",border:"0.5px solid #2A2A2C",cursor:"pointer",fontFamily:"inherit",color:"#fff",fontWeight:600,fontSize:14,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
          <i className="ti ti-bolt" style={{fontSize:22,color:LIME}}/>
          <span>Quick Log</span>
        </button>
        <PBtn onClick={onLog} glow s={{fontSize:17,fontWeight:800,padding:"16px",borderRadius:18}}>+ Log Session</PBtn>
      </div>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
        {[{l:"Hours",v:Math.floor(totalMins/60)},{l:"Sessions",v:sessions.length},{l:"This week",v:wkSessions.length,u:`/${wkGoal}`},{l:"Consistency",v:consistency,u:"%"}].map(m=>(
          <div key={m.l} style={{...mc,textAlign:"center"}}>
            <p style={{margin:0,fontSize:20,fontWeight:800,color:"#fff"}}>{m.v}<span style={{fontSize:10,color:"#555"}}>{m.u||""}</span></p>
            <p style={{margin:"3px 0 0",fontSize:10,color:"#555",fontWeight:500}}>{m.l}</p>
          </div>
        ))}
      </div>

      {/* Weekly dots */}
      <div style={{...card,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{margin:0,fontSize:14,fontWeight:600,color:"#fff"}}>This week</p>
          <p style={{margin:0,fontSize:13,color:"#555"}}><span style={{color:"#fff",fontWeight:700}}>{wkSessions.length}</span> / {wkGoal}</p>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
          {weeklyDots.map((d,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:d.active?LIME:"#2C2C2E",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:d.active?`0 0 14px ${LIME}50`:"none",transition:"all 0.3s"}}>
                {d.active&&<i className="ti ti-check" style={{fontSize:14,color:LIME_DK}}/>}
              </div>
              <span style={{fontSize:10,color:d.active?"#fff":"#444"}}>{d.day}</span>
            </div>
          ))}
        </div>
        <div style={{height:4,background:"#2C2C2E",borderRadius:2}}><div style={{width:`${Math.min(100,wkSessions.length/wkGoal*100)}%`,height:"100%",background:LIME,borderRadius:2,transition:"width 0.5s"}}/></div>
      </div>

      {/* Journal CTA */}
      <button onClick={onJournal} className="tap" style={{width:"100%",padding:"15px 18px",borderRadius:16,background:"#1C1C1E",color:"#fff",border:"0.5px solid #2A2A2C",fontWeight:500,fontSize:15,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <span>Debrief today's session</span>
        <span style={{color:"#555",fontSize:18}}>›</span>
      </button>

      {/* Recent sessions */}
      <SH>Recent sessions</SH>
      {sessions.length===0?(
        <div style={{textAlign:"center",padding:"48px 20px",background:"#1C1C1E",borderRadius:20,border:"0.5px dashed #3A3A3C"}}>
          <p style={{margin:"0 0 8px",fontSize:44}}></p>
          <p style={{margin:"0 0 4px",fontSize:16,color:"#fff",fontWeight:600}}>No sessions yet</p>
          <p style={{margin:"0 0 20px",fontSize:13,color:"#555"}}>Every black belt started here</p>
          <button onClick={onLog} style={{padding:"12px 28px",borderRadius:50,background:LIME,color:LIME_DK,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"inherit"}}>Log your first session →</button>
        </div>
      ):sessions.slice(0,3).map(s=><SCard key={s.id} s={s}/>)}
    </div>
  );
});

//  SESSIONS 
const Sessions=memo(function Sessions({sessions,onDelete,onSelectSession}){
  const [typeFilter,setTypeFilter]=useState("All");
  const [search,setSearch]=useState("");
  
  const displayed=useMemo(()=>{const q=search.toLowerCase();return sessions.filter(s=>typeFilter==="All"||s.type===typeFilter).filter(s=>!q||(s.partner||"").toLowerCase().includes(q)||(s.notes||"").toLowerCase().includes(q));},[sessions,typeFilter,search]);
  return(<div className="fade-in">
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search partner or notes..." style={{marginBottom:10}}/>
    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:10,marginBottom:6}}>{["All",...SESSION_TYPES].map(t=><Pill key={t} active={typeFilter===t} onClick={()=>setTypeFilter(t)} s={{fontSize:12,padding:"7px 14px",flexShrink:0}}>{t}</Pill>)}</div>
    <p style={{margin:"0 0 12px",fontSize:13,color:"#555"}}>{displayed.length} of {sessions.length} sessions</p>
    {displayed.length===0&&<div style={{textAlign:"center",padding:"40px 20px",background:"#1C1C1E",borderRadius:20,border:"0.5px dashed #3A3A3C"}}><p style={{margin:0,fontSize:15,color:"#555"}}>{search||typeFilter!=="All"?"No sessions match your filter":"No sessions logged yet"}</p></div>}
    {displayed.map(s=><div key={s.id} onClick={()=>onSelectSession(s)} style={{cursor:"pointer"}}><SCard s={s} onDelete={onDelete}/></div>)}
  </div>);
});

//  JOURNAL 
const Journal=memo(function Journal({journal,onAdd}){return(<div className="fade-in">
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
    <p style={{margin:0,fontSize:13,color:"#555"}}>{journal.length} entries</p>
    <button onClick={onAdd} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:50,background:LIME,color:LIME_DK,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",minHeight:44}}>+ New entry</button>
  </div>
  {journal.length===0&&<div style={{textAlign:"center",padding:"60px 20px",background:"#1C1C1E",borderRadius:20,border:"0.5px dashed #3A3A3C"}}><p style={{margin:"0 0 8px",fontSize:32}}></p><p style={{margin:"0 0 4px",fontSize:15,color:"#fff",fontWeight:600}}>Your journal is empty</p><p style={{margin:0,fontSize:13,color:"#555"}}>After a session, write a quick debrief. It compounds.</p></div>}
  {journal.map(e=>(<div key={e.id} style={card}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <span style={{fontSize:13,fontWeight:500,color:"#fff"}}>{e.date}</span>
      <span style={{fontSize:12,padding:"4px 12px",borderRadius:50,background:MOOD_C[e.mood]+"1A",color:MOOD_C[e.mood],fontWeight:500}}>{e.mood}</span>
    </div>
    {e.worked&&<div style={{marginBottom:10,paddingLeft:12,borderLeft:"3px solid #1D9E75"}}><p style={{margin:"0 0 2px",fontSize:11,color:"#1D9E75",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>What worked</p><p style={{margin:0,fontSize:14,lineHeight:1.5,color:"#fff"}}>{e.worked}</p></div>}
    {e.gotMe&&<div style={{marginBottom:10,paddingLeft:12,borderLeft:"3px solid #E24B4A"}}><p style={{margin:"0 0 2px",fontSize:11,color:"#E24B4A",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>What got me</p><p style={{margin:0,fontSize:14,lineHeight:1.5,color:"#fff"}}>{e.gotMe}</p></div>}
    {e.focus&&<div style={{paddingLeft:12,borderLeft:"3px solid #EF9F27"}}><p style={{margin:"0 0 2px",fontSize:11,color:"#EF9F27",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>Focus next time</p><p style={{margin:0,fontSize:14,lineHeight:1.5,color:"#fff"}}>{e.focus}</p></div>}
  </div>))}
</div>);});

//  AI COACH 
function AICoach({sessions,profile}){
  const [insight,setInsight]=useState(null);
  const [loading,setLoading]=useState(false);
  const [apiKey,setApiKey]=useState(()=>localStorage.getItem("claude_key")||"");
  const [showKeyInput,setShowKeyInput]=useState(false);

  const ruleInsights=useMemo(()=>{
    if(!sessions.length)return[];
    const last20=sessions.slice(0,20);
    const insights=[];
    const totalSubs=last20.reduce((a,s)=>a+(s.taps_given||0),0);
    const totalTapped=last20.reduce((a,s)=>a+(s.taps_received||0),0);
    const subRate=last20.length>0?Math.round(totalSubs/last20.length*10)/10:0;
    if(totalTapped>totalSubs*1.5)insights.push({icon:"",title:"Defensive gaps detected",body:`You're being submitted ${totalTapped} times vs your ${totalSubs} submissions in your last ${last20.length} sessions. Your defense needs attention. Focus on positional escapes.`,priority:"high"});
    if(subRate>=1)insights.push({icon:"",title:"Submission machine",body:`You're averaging ${subRate} submissions per session. Elite efficiency. Keep hunting finishes — you're doing something right.`,priority:"good"});
    const giCount=last20.filter(s=>s.type==="Gi").length;
    const nogiCount=last20.filter(s=>s.type==="No-Gi").length;
    if(giCount>0&&nogiCount===0)insights.push({icon:"",title:"Try No-Gi",body:"You haven't trained No-Gi recently. Cross-training removes the gi grips and will expose weaknesses in your base game.",priority:"medium"});
    if(nogiCount>0&&giCount===0)insights.push({icon:"",title:"Get back in the gi",body:"Gi training builds patience, grips, and technical precision. Mix it in — the collar grips will tighten your whole game.",priority:"medium"});
    const drillCount=last20.filter(s=>s.type==="Drilling").length;
    if(drillCount===0)insights.push({icon:"",title:"Add drilling sessions",body:"You haven't logged any drilling sessions recently. Deliberate drilling is how techniques become automatic under pressure.",priority:"medium"});
    const streak=calcStreak(sessions);
    if(streak>=7)insights.push({icon:"",title:`${streak}-day streak!`,body:"Consistency is the single greatest predictor of improvement in BJJ. You're building something real right now.",priority:"good"});
    if(profile.favPositions?.length>0)insights.push({icon:"",title:`${profile.favPositions[0]} is your game`,body:`As a ${profile.gameStyle||"grappler"}, invest in your entries to ${profile.favPositions[0]}. Master the setups, not just the position itself.`,priority:"medium"});
    return insights.slice(0,4);
  },[sessions,profile]);

  const getAICoaching=async()=>{
    if(!apiKey.trim()){setShowKeyInput(true);return;}
    setLoading(true);setInsight(null);
    const last10=sessions.slice(0,10);
    const summary={name:profile.name,belt:profile.belt,gameStyle:profile.gameStyle,favPositions:profile.favPositions,totalSessions:sessions.length,last10Sessions:last10.map(s=>({date:s.date,type:s.type,duration:s.duration,subsGiven:s.taps_given||0,subsTaken:s.taps_received||0,mood:s.mood,notes:s.notes}))};
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:500,messages:[{role:"user",content:`You are an elite BJJ coach analyzing a student's training data. Be direct, specific, and actionable. No fluff. Student: ${JSON.stringify(summary)}. Give 3 specific, personalized coaching insights in 2-3 sentences each. Focus on their actual patterns, not generic advice. Format as plain text with each insight starting with an emoji.`}]})});
      const data=await res.json();
      if(data.content?.[0]?.text)setInsight(data.content[0].text);
      else setInsight("Unable to get AI coaching right now. Check your API key.");
    }catch(e){setInsight("Connection error. Make sure your Claude API key is correct.");}
    setLoading(false);
  };

  return(<div className="fade-in">
    {/* Rule-based insights */}
    {ruleInsights.length>0&&<div style={{marginBottom:20}}>
      <SH>Your coaching report</SH>
      {ruleInsights.map((ins,i)=>(<div key={i} style={{...card,borderLeft:`3px solid ${ins.priority==="high"?"#E24B4A":ins.priority==="good"?POS:LIME}`}}>
        <p style={{margin:"0 0 4px",fontSize:15,fontWeight:700,color:"#fff"}}>{ins.icon} {ins.title}</p>
        <p style={{margin:0,fontSize:13,color:"#8E8E93",lineHeight:1.65}}>{ins.body}</p>
      </div>))}
    </div>}

    {sessions.length===0&&<div style={{textAlign:"center",padding:"48px 20px",background:"#1C1C1E",borderRadius:20,border:"0.5px dashed #3A3A3C",marginBottom:20}}>
      <p style={{margin:"0 0 8px",fontSize:36}}></p>
      <p style={{margin:"0 0 4px",fontSize:15,color:"#fff",fontWeight:600}}>No data yet</p>
      <p style={{margin:0,fontSize:13,color:"#555"}}>Log 3+ sessions to unlock your coaching report</p>
    </div>}

    {/* AI Upgrade */}
    <div style={{background:"#1C1C1E",borderRadius:20,padding:"18px",border:`0.5px solid ${LIME}30`,marginTop:8}}>
      <p style={{margin:"0 0 4px",fontSize:11,fontWeight:700,color:LIME,textTransform:"uppercase",letterSpacing:"0.8px"}}>AI Coach powered by Claude</p>
      <p style={{margin:"0 0 12px",fontSize:15,fontWeight:700,color:"#fff"}}>Get personalized coaching</p>
      <p style={{margin:"0 0 14px",fontSize:13,color:"#8E8E93",lineHeight:1.6}}>Claude AI analyzes your training patterns and gives you specific, personalized advice — like having a coach review your training diary.</p>
      {showKeyInput&&<div style={{marginBottom:12}}><Lbl>Your Claude API key</Lbl><input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-ant-..." style={{marginBottom:8}}/><button onClick={()=>{localStorage.setItem("claude_key",apiKey);setShowKeyInput(false);}} style={{width:"100%",padding:"10px",borderRadius:12,background:"#2C2C2E",border:"none",cursor:"pointer",color:"#fff",fontFamily:"inherit",fontSize:13}}>Save key</button><p style={{margin:"8px 0 0",fontSize:11,color:"#555"}}>Your key is stored locally only. Get one free at console.anthropic.com</p></div>}
      {insight&&<div style={{background:"#0D1F0D",borderRadius:12,padding:"14px",marginBottom:12,border:`0.5px solid ${LIME}20`}}><p style={{margin:0,fontSize:13,color:"#ccc",lineHeight:1.7,whiteSpace:"pre-line"}}>{insight}</p></div>}
      <PBtn onClick={getAICoaching} s={{fontSize:15,padding:"15px"}} glow>{loading?"Analyzing your training…":"Get AI Coaching →"}</PBtn>
    </div>
  </div>);
}

//  PROGRESS 
const Progress=memo(function Progress({sessions,competitions,setCompetitions,goals,setGoals,journal,profile,onAddComp,onAddGoal,onEditComp,showToast}){
  const [sub,setSub]=useState("coach");
  const [confirmDel,setConfirmDel]=useState(null);
  const [selComp,setSelComp]=useState(null);
  const [editGoal,setEditGoal]=useState(null);
  const totals=useMemo(()=>({given:sessions.reduce((a,s)=>a+(s.taps_given||0),0),received:sessions.reduce((a,s)=>a+(s.taps_received||0),0),mins:sessions.reduce((a,s)=>a+(s.duration||0),0)}),[sessions]);
  const weeklyData=useMemo(()=>{const now=Date.now();return[...Array(6)].map((_,i)=>{const start=new Date(now-(5-i)*7*864e5),end=new Date(now-(4-i)*7*864e5);const mins=sessions.filter(s=>{const d=new Date(s.date);return d>=start&&d<end;}).reduce((a,s)=>a+(s.duration||0),0);return{week:`${start.getMonth()+1}/${start.getDate()}`,hours:Math.round(mins/60*10)/10};});},[sessions]);
  const compStats=useMemo(()=>{const w=competitions.reduce((a,c)=>a+(c.wins||0),0),l=competitions.reduce((a,c)=>a+(c.losses||0),0);return{wins:w,losses:l,rate:w+l>0?Math.round(w/(w+l)*100):0};},[competitions]);
  const pbs=useMemo(()=>calcPersonalBests(sessions),[sessions]);
  const toggleGoal=useCallback(id=>{setGoals(p=>{const g=p.find(x=>x.id===id);if(!g)return p;const done=!g.done;if(done)showToast(" Goal achieved! Keep pushing.");else showToast("Goal re-opened.");return p.map(x=>x.id===id?{...x,done}:x);});},[setGoals,showToast]);
  const deleteComp=id=>{setCompetitions(p=>p.filter(x=>x.id!==id));setConfirmDel(null);showToast("Competition removed");};

  return(<div className="fade-in">
    <SegCtrl opts={[["coach","Coach"],["stats","Stats"],["comp","Comp"],["goals","Goals"]]} value={sub} onChange={setSub}/>
    {sub==="coach"&&<AICoach sessions={sessions} profile={profile}/>}
    {sub==="stats"&&<div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
        {[{l:"Subs landed",v:totals.given,c:POS},{l:"Times tapped",v:totals.received,c:"#E24B4A"},{l:"Mat hours",v:Math.floor(totals.mins/60),c:"#fff"}].map(m=>(<div key={m.l} style={{...mc,textAlign:"center"}}><p style={{margin:0,fontSize:26,fontWeight:800,color:m.c}}>{m.v}</p><p style={{margin:"4px 0 0",fontSize:10,color:"#555",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.5px"}}>{m.l}</p></div>))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {[{l:"Best week",v:`${pbs.bestWeek} sessions`},{l:"Best session",v:`${pbs.bestSubs} subs`}].map(m=>(<div key={m.l} style={{...mc,textAlign:"center"}}><p style={{margin:0,fontSize:20,fontWeight:700,color:LIME}}>{m.v}</p><p style={{margin:"4px 0 0",fontSize:10,color:"#555"}}>{m.l}</p></div>))}
      </div>
      <div style={card}><p style={{margin:"0 0 14px",fontSize:14,fontWeight:600,color:"#fff"}}>Weekly mat time</p><div style={{height:160}}><ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyData} margin={{top:0,right:4,bottom:0,left:-28}}><XAxis dataKey="week" tick={{fontSize:10,fill:"#555"}}/><YAxis tick={{fontSize:10,fill:"#555"}}/><Tooltip contentStyle={tt} formatter={v=>`${v} hrs`}/><Bar dataKey="hours" fill={LIME} radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></div>
    </div>}
    {sub==="comp"&&<div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
        {[{l:"Win rate",v:`${compStats.rate}%`,c:compStats.rate>=50?POS:"#E24B4A"},{l:"Wins",v:compStats.wins,c:POS},{l:"Losses",v:compStats.losses,c:"#E24B4A"}].map(m=>(<div key={m.l} style={{...mc,textAlign:"center"}}><p style={{margin:0,fontSize:26,fontWeight:800,color:m.c}}>{m.v}</p><p style={{margin:"4px 0 0",fontSize:10,color:"#555",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.5px"}}>{m.l}</p></div>))}
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><button onClick={onAddComp} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:50,background:LIME,color:LIME_DK,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",minHeight:44}}>+ Add event</button></div>
      {competitions.length===0&&<div style={{textAlign:"center",padding:"40px 20px",background:"#1C1C1E",borderRadius:20,border:"0.5px dashed #3A3A3C"}}><p style={{margin:0,fontSize:15,color:"#555"}}>No competitions logged yet</p></div>}
      {competitions.map(comp=>{const medals=getMedals(comp);return(<div key={comp.id} style={{...card,cursor:"pointer",padding:"14px 16px"}} onClick={()=>setSelComp(comp)}><div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:4}}><p style={{margin:0,fontSize:15,fontWeight:600,color:"#fff",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:10}}>{comp.event}</p><div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}><span style={{fontSize:12,fontWeight:700,color:POS,background:POS+"18",padding:"3px 8px",borderRadius:6}}>{comp.wins}W</span><span style={{fontSize:12,fontWeight:700,color:"#E24B4A",background:"#E24B4A18",padding:"3px 8px",borderRadius:6}}>{comp.losses}L</span></div></div><p style={{margin:"0 0 8px",fontSize:11,color:"#555"}}>{comp.date}{comp.location?" · "+comp.location:""}</p>{medals.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>{medals.map((m,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:3,background:"#2C2C2E",borderRadius:50,padding:"2px 8px 2px 5px"}}><div style={{width:10,height:10,borderRadius:"50%",background:MEDAL_COLORS[m.medal],flexShrink:0}}/><span style={{fontSize:10,color:"#8E8E93"}}>{m.label}</span></div>)}</div>}{confirmDel===comp.id?(<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderTop:"0.5px solid #2A2A2C"}}><span style={{fontSize:13,color:"#E24B4A",flex:1}}>Delete this event?</span><button onClick={e=>{e.stopPropagation();deleteComp(comp.id);}} style={{padding:"8px 16px",borderRadius:50,background:"#E24B4A",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"}}>Delete</button><button onClick={e=>{e.stopPropagation();setConfirmDel(null);}} style={{padding:"8px 16px",borderRadius:50,background:"#2C2C2E",color:"#8E8E93",border:"none",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>Cancel</button></div>
      ):(<div style={{display:"flex",gap:8,borderTop:"0.5px solid #2A2A2C",paddingTop:10}}><button onClick={e=>{e.stopPropagation();onEditComp(comp);}} style={{flex:1,padding:"9px",borderRadius:50,background:"#2C2C2E",color:"#8E8E93",border:"none",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>Edit</button><button onClick={e=>{e.stopPropagation();setConfirmDel(comp.id);}} style={{flex:1,padding:"9px",borderRadius:50,background:"#E24B4A18",color:"#E24B4A",border:"none",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>Delete</button></div>)}</div>);})}
    </div>}
    {selComp&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={()=>setSelComp(null)}><div style={{background:"#1C1C1E",borderRadius:"24px 24px 0 0",maxHeight:"90vh",overflowY:"auto",padding:"20px 22px 44px"}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{margin:0,fontSize:19,fontWeight:700,color:"#fff"}}>{selComp.event}</h3><button onClick={()=>setSelComp(null)} style={{width:36,height:36,borderRadius:"50%",background:"#2C2C2E",border:"none",cursor:"pointer",color:"#8E8E93",fontSize:18}}>x</button></div>{selComp.photo&&<img src={selComp.photo} style={{width:"100%",borderRadius:14,maxHeight:220,objectFit:"cover",marginBottom:16}}/>}<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>{selComp.date&&<span style={{padding:"6px 14px",borderRadius:50,background:"#2C2C2E",fontSize:13,color:"#fff"}}>{selComp.date}</span>}{selComp.location&&<span style={{padding:"6px 14px",borderRadius:50,background:"#2C2C2E",fontSize:13,color:"#fff"}}>{selComp.location}</span>}{selComp.ageBracket&&<span style={{padding:"6px 14px",borderRadius:50,background:"#2C2C2E",fontSize:13,color:"#fff"}}>{selComp.ageBracket}</span>}{selComp.compBelt&&<span style={{padding:"6px 14px",borderRadius:50,background:"#2C2C2E",fontSize:13,color:"#fff"}}>{selComp.compBelt} Belt</span>}{selComp.weight&&<span style={{padding:"6px 14px",borderRadius:50,background:"#2C2C2E",fontSize:13,color:"#fff"}}>{selComp.weight}</span>}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}><div style={{background:"#2C2C2E",borderRadius:14,padding:"12px",textAlign:"center"}}><p style={{margin:0,fontSize:22,fontWeight:800,color:POS}}>{selComp.wins||0}</p><p style={{margin:"4px 0 0",fontSize:11,color:"#555"}}>Wins</p></div><div style={{background:"#2C2C2E",borderRadius:14,padding:"12px",textAlign:"center"}}><p style={{margin:0,fontSize:22,fontWeight:800,color:"#E24B4A"}}>{selComp.losses||0}</p><p style={{margin:"4px 0 0",fontSize:11,color:"#555"}}>Losses</p></div></div>{selComp.joinedGi&&<div style={{background:"#2C2C2E",borderRadius:14,padding:"14px 16px",marginBottom:10}}><p style={{margin:"0 0 10px",fontSize:13,fontWeight:600,color:"#fff"}}>Gi</p><div style={{display:"flex",gap:24}}><div><p style={{margin:"0 0 4px",fontSize:11,color:"#555"}}>Weight</p><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:14,height:14,borderRadius:"50%",background:MEDAL_COLORS[selComp.giWeightMedal||"None"]}}/><span style={{fontSize:13,color:"#fff"}}>{selComp.giWeightMedal||"None"}</span></div></div><div><p style={{margin:"0 0 4px",fontSize:11,color:"#555"}}>Absolute</p><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:14,height:14,borderRadius:"50%",background:MEDAL_COLORS[selComp.giAbsMedal||"None"]}}/><span style={{fontSize:13,color:"#fff"}}>{selComp.giAbsMedal||"None"}</span></div></div></div></div>}{selComp.joinedNogi&&<div style={{background:"#2C2C2E",borderRadius:14,padding:"14px 16px",marginBottom:10}}><p style={{margin:"0 0 10px",fontSize:13,fontWeight:600,color:"#fff"}}>No-Gi</p><div style={{display:"flex",gap:24}}><div><p style={{margin:"0 0 4px",fontSize:11,color:"#555"}}>Weight</p><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:14,height:14,borderRadius:"50%",background:MEDAL_COLORS[selComp.nogiWeightMedal||"None"]}}/><span style={{fontSize:13,color:"#fff"}}>{selComp.nogiWeightMedal||"None"}</span></div></div><div><p style={{margin:"0 0 4px",fontSize:11,color:"#555"}}>Absolute</p><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:14,height:14,borderRadius:"50%",background:MEDAL_COLORS[selComp.nogiAbsMedal||"None"]}}/><span style={{fontSize:13,color:"#fff"}}>{selComp.nogiAbsMedal||"None"}</span></div></div></div></div>}{selComp.notes&&<div style={{marginTop:12,marginBottom:16}}><p style={{margin:"0 0 4px",fontSize:11,color:"#555",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>Notes</p><p style={{margin:0,fontSize:14,color:"#fff",lineHeight:1.6}}>{selComp.notes}</p></div>}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:8}}><button onClick={()=>{onEditComp(selComp);setSelComp(null);}} style={{padding:"14px",borderRadius:14,background:"#2C2C2E",color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:14}}>Edit</button><button onClick={()=>{deleteComp(selComp.id);setSelComp(null);}} style={{padding:"14px",borderRadius:14,background:"#E24B4A18",color:"#E24B4A",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:14}}>Delete</button></div></div></div>}
    {sub==="goals"&&<div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><p style={{margin:0,fontSize:13,color:"#555"}}>{goals.filter(g=>!g.done).length} active</p><button onClick={onAddGoal} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:50,background:LIME,color:LIME_DK,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",minHeight:44}}>+ Add goal</button></div>
      {goals.filter(g=>!g.done).length===0&&<div style={{textAlign:"center",padding:"40px 20px",background:"#1C1C1E",borderRadius:20,border:"0.5px dashed #3A3A3C",marginBottom:12}}><p style={{margin:0,fontSize:15,color:"#555"}}>No active goals. Set one to stay focused.</p></div>}
      {goals.filter(g=>!g.done).map(g=>(<div key={g.id} style={card}><div style={{display:"flex",alignItems:"center",gap:12}}><button onClick={()=>toggleGoal(g.id)} style={{width:44,height:44,borderRadius:"50%",border:"2px solid #3A3A3C",background:"transparent",cursor:"pointer",flexShrink:0}}/><div style={{flex:1}}><p style={{margin:"0 0 5px",fontSize:14,fontWeight:500,color:"#fff"}}>{g.title}</p><div style={{display:"flex",gap:8}}><span style={{fontSize:11,padding:"2px 8px",borderRadius:50,background:LIME_DIM,color:LIME_TXT,fontWeight:700}}>{g.cat}</span>{g.deadline&&<span style={{fontSize:11,color:"#555"}}>Due {g.deadline}</span>}</div></div><div style={{display:"flex",gap:6}}><button onClick={()=>setEditGoal(g)} style={{width:36,height:36,borderRadius:"50%",background:"#2C2C2E",border:"none",cursor:"pointer",color:"#8E8E93",fontSize:13}}>✎</button><button onClick={()=>setGoals(p=>p.filter(x=>x.id!==g.id))} style={{width:36,height:36,borderRadius:"50%",background:"#E24B4A18",border:"none",cursor:"pointer",color:"#E24B4A",fontSize:13}}>✕</button></div></div></div>))}
    {editGoal&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={()=>setEditGoal(null)}><div style={{background:"#1C1C1E",borderRadius:"24px 24px 0 0",padding:"24px 22px 44px"}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h3 style={{margin:0,fontSize:19,fontWeight:700,color:"#fff"}}>Edit goal</h3><button onClick={()=>setEditGoal(null)} style={{width:36,height:36,borderRadius:"50%",background:"#2C2C2E",border:"none",cursor:"pointer",color:"#8E8E93",fontSize:18}}>×</button></div><p style={{margin:"0 0 8px",fontSize:13,color:"#8E8E93"}}>Goal</p><input value={editGoal.title} onChange={e=>setEditGoal(p=>({...p,title:e.target.value}))} style={{marginBottom:16}}/><p style={{margin:"0 0 8px",fontSize:13,color:"#8E8E93"}}>Category</p><div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>{GOAL_CATS.map(cat=><button key={cat} onClick={()=>setEditGoal(p=>({...p,cat}))} style={{padding:"8px 16px",borderRadius:50,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,background:editGoal.cat===cat?"#AAFF00":"#2C2C2E",color:editGoal.cat===cat?"#000":"#8E8E93",fontWeight:editGoal.cat===cat?700:400}}>{cat}</button>)}</div><p style={{margin:"0 0 8px",fontSize:13,color:"#8E8E93"}}>Target date</p><input type="date" value={editGoal.deadline||""} onChange={e=>setEditGoal(p=>({...p,deadline:e.target.value}))} style={{marginBottom:24}}/><button onClick={()=>{setGoals(p=>p.map(x=>x.id===editGoal.id?editGoal:x));setEditGoal(null);showToast("Goal updated!");}} style={{width:"100%",padding:"19px",borderRadius:18,background:"#AAFF00",color:"#000",border:"none",fontFamily:"inherit",fontWeight:800,fontSize:17,cursor:"pointer"}}>Save changes</button></div></div>}
    {goals.filter(g=>g.done).length>0&&<><SH>Completed</SH>{goals.filter(g=>g.done).map(g=>(<div key={g.id} style={{...card,opacity:0.5}}><div style={{display:"flex",alignItems:"center",gap:12}}><button onClick={()=>toggleGoal(g.id)} style={{width:44,height:44,borderRadius:"50%",background:LIME,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:LIME_DK,fontSize:18,border:"none",cursor:"pointer"}} title="Mark incomplete"></button><p style={{margin:0,fontSize:14,textDecoration:"line-through",color:"#636366",flex:1}}>{g.title}</p><button onClick={()=>setGoals(p=>p.filter(x=>x.id!==g.id))} style={{width:36,height:36,borderRadius:"50%",background:"#E24B4A18",border:"none",cursor:"pointer",color:"#E24B4A",fontSize:13}}>✕</button></div></div>))}</>}
    </div>}
  </div>);
});

function PartnerDetailModal({partner,sessions,onClose,onSave,onDelete}){
  const [en,setEn]=useState({name:partner.name,belt:partner.belt,gym:partner.gym||"",strengths:partner.strengths||"",weaknesses:partner.weaknesses||"",gameStyle:partner.gameStyle||"",notes:partner.notes||""});
  const sb=BELTS.find(x=>x.id===en.belt)||BELTS[0];
  const pSess=sessions.filter(s=>s.partner&&s.partner.toLowerCase()===partner.name.toLowerCase());
  const lastT=pSess.length>0?pSess[0].date:"—";
  const avgSubs=pSess.length>0?Math.round(pSess.reduce((a,s)=>a+(s.taps_given||0),0)/pSess.length*10)/10:0;
  const avgTapped=pSess.length>0?Math.round(pSess.reduce((a,s)=>a+(s.taps_received||0),0)/pSess.length*10)/10:0;
  return(<BottomSheet onClose={onClose} title="Edit Partner">
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"10px 12px",background:"#2C2C2E",borderRadius:14}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:sb.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:14,fontWeight:700,color:sb.text}}>{en.name.charAt(0)||"?"}</span></div>
      <div style={{flex:1,minWidth:0}}><p style={{margin:0,fontSize:13,fontWeight:600,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{en.name||"Partner"}</p><p style={{margin:0,fontSize:11,color:"#555"}}>{sb.label} belt{en.gym?" · "+en.gym:""}</p></div>
      <span style={{fontSize:12,color:POS,fontWeight:600,flexShrink:0}}>{pSess.length} sessions</span>
    </div>
    <div style={{marginBottom:12}}><Lbl>Name</Lbl><input value={en.name} onChange={e=>setEn(p=>({...p,name:e.target.value}))} placeholder="Partner name"/></div>
    <div style={{marginBottom:14}}><Lbl>Belt</Lbl><BeltPicker value={en.belt} onChange={v=>setEn(p=>({...p,belt:v}))}/></div>
    <div style={{marginBottom:14}}><Lbl>Gym</Lbl><input value={en.gym} onChange={e=>setEn(p=>({...p,gym:e.target.value}))} placeholder="e.g. Flow Studio"/></div>
    <SH>Scouting Notes</SH>
    <div style={{marginBottom:10}}><Lbl c={POS}>Strengths</Lbl><textarea value={en.strengths} onChange={e=>setEn(p=>({...p,strengths:e.target.value}))} placeholder="What are they dangerous at?" style={{minHeight:52}}/></div>
    <div style={{marginBottom:10}}><Lbl c="#E24B4A">Weaknesses</Lbl><textarea value={en.weaknesses} onChange={e=>setEn(p=>({...p,weaknesses:e.target.value}))} placeholder="Where can you attack?" style={{minHeight:52}}/></div>
    <div style={{marginBottom:10}}><Lbl>Game style</Lbl><input value={en.gameStyle} onChange={e=>setEn(p=>({...p,gameStyle:e.target.value}))} placeholder="e.g. Guard Player"/></div>
    <div style={{marginBottom:16}}><Lbl>Notes</Lbl><textarea value={en.notes} onChange={e=>setEn(p=>({...p,notes:e.target.value}))} placeholder="Anything else" style={{minHeight:52}}/></div>
    <SH>Training Stats</SH>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>{[{l:"Sessions",v:pSess.length,c:"#fff"},{l:"Last trained",v:lastT,c:"#fff"},{l:"Avg subs",v:avgSubs,c:POS},{l:"Avg tapped",v:avgTapped,c:"#E24B4A"}].map(m=><div key={m.l} style={{background:"#2C2C2E",borderRadius:12,padding:"10px",textAlign:"center"}}><p style={{margin:0,fontSize:m.l==="Last trained"?11:18,fontWeight:700,color:m.c}}>{m.v}</p><p style={{margin:"3px 0 0",fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:"0.5px"}}>{m.l}</p></div>)}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={onDelete} style={{padding:"14px",borderRadius:14,background:"#E24B4A18",color:"#E24B4A",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:14}}>Delete</button><PBtn onClick={()=>onSave(en)}>Save changes</PBtn></div>
  </BottomSheet>);
}

//  LIBRARY
const LibBackBtn=({label,right,onBack})=>(<div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}><button onClick={onBack} style={{width:44,height:44,borderRadius:"50%",background:"#1C1C1E",border:"none",cursor:"pointer",color:"#fff",fontSize:18}}>←</button><h2 style={{margin:0,fontSize:18,fontWeight:700,flex:1,color:"#fff"}}>{label}</h2>{right}</div>);

function Library({techniques,setTechniques,partners,setPartners,injuries,setInjuries,sessions=[],onAddPartner,onAddInjury,libSec,setLibSec}){
  const [techCat,setTechCat]=useState("All");
  const [mobility,setMobility]=useState(()=>BJJ_MOBILITY.map(m=>({...m,done:false})));
  const [showSkillDefs,setShowSkillDefs]=useState(false);
  const [addOpen,setAddOpen]=useState(false);
  const [addName,setAddName]=useState("");
  const [addCat,setAddCat]=useState("Submissions");
  const [selPartner,setSelPartner]=useState(null);
  const cats=useMemo(()=>["All",...new Set(techniques.map(t=>t.cat))],[techniques]);
  const filtered=useMemo(()=>techCat==="All"?techniques:techniques.filter(t=>t.cat===techCat),[techniques,techCat]);
  const mDone=useMemo(()=>mobility.filter(m=>m.done).length,[mobility]);
  const activeInjuries=injuries.filter(i=>i.status!=="Healed");
  const upSkill=useCallback(id=>setTechniques(p=>p.map(x=>x.id===id?{...x,skill:Math.min(5,(x.skill||1)+1)}:x)),[setTechniques]);
  const downSkill=useCallback(id=>setTechniques(p=>p.map(x=>x.id===id?{...x,skill:Math.max(1,(x.skill||1)-1)}:x)),[setTechniques]);

  if(libSec==="techniques")return(<div className="fade-in"><LibBackBtn onBack={()=>setLibSec(null)} label="Technique Library"/>
    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:10,marginBottom:14}}>{cats.map(c=><Pill key={c} active={techCat===c} onClick={()=>setTechCat(c)} s={{flexShrink:0}}>{c}</Pill>)}</div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><p style={{margin:0,fontSize:13,color:"#555"}}>{filtered.length} techniques</p><button onClick={()=>setShowSkillDefs(true)} style={{padding:"6px 14px",borderRadius:50,background:"#1C1C1E",border:"none",cursor:"pointer",fontSize:12,color:"#8E8E93",fontFamily:"inherit",minHeight:44}}>Skill levels</button><button onClick={()=>setAddOpen(true)} style={{padding:"6px 14px",borderRadius:50,background:"#AAFF00",color:"#000",border:"none",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",minHeight:44}}>+ Add</button></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>{filtered.map(t=>(<div key={t.id} style={{...card,position:"relative"}}><button onClick={()=>setTechniques(p=>p.filter(y=>y.id!==t.id))} style={{position:"absolute",top:8,right:8,width:28,height:28,borderRadius:"50%",border:"none",background:"#E24B4A18",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",color:"#E24B4A"}}>✕</button><p style={{margin:"0 0 2px",fontSize:13,fontWeight:500,color:"#fff",paddingRight:32}}>{t.name}</p><p style={{margin:"0 0 10px",fontSize:11,color:"#555"}}>{t.cat}</p><SkillDots skill={t.skill||1}/><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10}}><span style={{fontSize:11,color:SKILL_COLORS[t.skill||1],fontWeight:500}}>{SKILL_LABELS[t.skill||1]}</span><div style={{display:"flex",gap:6}}><button onClick={()=>downSkill(t.id)} style={{width:36,height:36,borderRadius:"50%",border:"none",background:"#2C2C2E",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>−</button><button onClick={()=>upSkill(t.id)} style={{width:36,height:36,borderRadius:"50%",border:"none",background:LIME_DIM,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",color:LIME_TXT,fontWeight:700}}>+</button></div></div></div>))}</div>
    {addOpen&&<BottomSheet onClose={()=>setAddOpen(false)} title="Add technique"><div style={{marginBottom:12}}><Lbl>Name</Lbl><input value={addName} onChange={e=>setAddName(e.target.value)} placeholder="e.g. Leg Lock" autoFocus/></div><div style={{marginBottom:20}}><Lbl>Category</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{["Submissions","Guard","Takedowns","Escapes","Sweeps","Other"].map(x=><Pill key={x} active={addCat===x} onClick={()=>setAddCat(x)} s={{fontSize:12}}>{x}</Pill>)}</div></div><PBtn onClick={()=>{if(addName.trim()){setTechniques(p=>[...p,{id:Date.now(),name:addName.trim(),cat:addCat,skill:1}]);setAddName("");setAddOpen(false);}}} disabled={!addName.trim()}>Add technique</PBtn></BottomSheet>}
    {showSkillDefs&&<BottomSheet onClose={()=>setShowSkillDefs(false)} title="Skill levels explained">{SKILL_DEFS.slice(1).map((def,i)=>(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:16}}><span style={{fontSize:12,color:SKILL_COLORS[i+1],fontWeight:700,minWidth:90}}>{SKILL_LABELS[i+1]}</span><p style={{margin:0,fontSize:13,color:"#8E8E93",lineHeight:1.6,flex:1}}>{def}</p></div>))}</BottomSheet>}
  </div>);

  if(libSec==="partners")return(<div className="fade-in"><LibBackBtn onBack={()=>setLibSec(null)} label="Training Partners" right={<button onClick={onAddPartner} style={{padding:"9px 18px",borderRadius:50,background:LIME,color:LIME_DK,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",minHeight:44}}>+ Add</button>}/>
    {partners.length===0&&<div style={{textAlign:"center",padding:"40px 20px",background:"#1C1C1E",borderRadius:20,border:"0.5px dashed #3A3A3C"}}><p style={{margin:0,fontSize:15,color:"#555"}}>No partners added yet</p></div>}
    {partners.map(p=>{const b=BELTS.find(x=>x.id===p.belt)||BELTS[0];const pSess=sessions.filter(s=>s.partner&&s.partner.toLowerCase()===p.name.toLowerCase());const lastT=pSess.length>0?pSess[0].date:null;const avgSubs=pSess.length>0?Math.round(pSess.reduce((a,s)=>a+(s.taps_given||0),0)/pSess.length*10)/10:0;const avgTapped=pSess.length>0?Math.round(pSess.reduce((a,s)=>a+(s.taps_received||0),0)/pSess.length*10)/10:0;return(<div key={p.id} style={{...card,cursor:"pointer"}} className="tap" onClick={()=>setSelPartner({...p,_avgSubs:avgSubs,_avgTapped:avgTapped,_sessCount:pSess.length,_lastT:lastT})}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:46,height:46,borderRadius:"50%",background:b.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:16,fontWeight:700,color:b.text}}>{p.name.charAt(0)}</span></div><div style={{flex:1}}><p style={{margin:"0 0 2px",fontSize:15,fontWeight:500,color:"#fff"}}>{p.name}</p><p style={{margin:0,fontSize:12,color:"#555"}}>{b.label} belt{p.gym?` · ${p.gym}`:""}</p>{pSess.length>0&&<p style={{margin:"3px 0 0",fontSize:11,color:"#555"}}>{pSess.length} sessions · last {lastT}</p>}</div><span style={{color:"#444",fontSize:18}}>›</span></div></div>);})}
    {selPartner&&<PartnerDetailModal partner={selPartner} sessions={sessions} onClose={()=>setSelPartner(null)} onSave={(en)=>{setPartners(prev=>prev.map(x=>x.id===selPartner.id?{...x,...en}:x));setSelPartner(null);}} onDelete={()=>{setPartners(prev=>prev.filter(x=>x.id!==selPartner.id));setSelPartner(null);}}/>}
  </div>);

  if(libSec==="mobility")return(<div className="fade-in"><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}><button onClick={()=>setLibSec(null)} style={{width:44,height:44,borderRadius:"50%",background:"#1C1C1E",border:"none",cursor:"pointer",color:"#fff",fontSize:18}}>←</button><h2 style={{margin:0,fontSize:18,fontWeight:700,flex:1,color:"#fff"}}>BJJ Warmup</h2><span style={{fontSize:13,color:"#555"}}>{mDone}/{mobility.length}</span></div>
    <button onClick={()=>setMobility(BJJ_MOBILITY.map(m=>({...m,done:false})))} style={{width:"100%",padding:"10px",border:"none",borderRadius:50,background:"#1C1C1E",cursor:"pointer",color:"#8E8E93",fontSize:13,marginBottom:16,fontFamily:"inherit"}}>Reset all</button>
    {["Warm-up","Guard","Hips","Spine","Neck","Wrists","Ankles","Takedowns"].map(cat=>{const exs=mobility.filter(m=>m.cat===cat);if(!exs.length)return null;return(<div key={cat}><SH>{cat}</SH><div style={{background:"#1C1C1E",borderRadius:16,overflow:"hidden",marginBottom:10}}>{exs.map((ex,i)=>(<div key={ex.id}><div style={{display:"flex",alignItems:"center",padding:"14px 16px",gap:14,opacity:ex.done?0.5:1}}><button onClick={()=>setMobility(p=>p.map(m=>m.id===ex.id?{...m,done:!m.done}:m))} style={{width:36,height:36,borderRadius:"50%",border:`2px solid ${ex.done?LIME:"#3A3A3C"}`,background:ex.done?LIME:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:LIME_DK,fontSize:14,transition:"all 0.2s"}}>{ex.done&&""}</button><div style={{flex:1}}><p style={{margin:"0 0 2px",fontSize:14,fontWeight:500,color:"#fff",textDecoration:ex.done?"line-through":"none"}}>{ex.name}</p><p style={{margin:0,fontSize:12,color:"#555"}}>{ex.reps}</p></div></div>{i<exs.length-1&&<div style={{height:"0.5px",background:"#2A2A2C",margin:"0 16px"}}/>}</div>))}</div></div>);})}
  </div>);

  if(libSec==="injuries")return(<div className="fade-in"><LibBackBtn onBack={()=>setLibSec(null)} label="Injury Tracker" right={<button onClick={onAddInjury} style={{padding:"9px 18px",borderRadius:50,background:LIME,color:LIME_DK,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",minHeight:44}}>+ Log injury</button>}/>
    {activeInjuries.length>0&&<><p style={{margin:"0 0 10px",fontSize:13,color:"#E24B4A",fontWeight:600}}>{activeInjuries.length} active {activeInjuries.length===1?"injury":"injuries"}</p>{activeInjuries.map(inj=>(<div key={inj.id} style={{...card,borderLeft:"3px solid #E24B4A50"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><p style={{margin:"0 0 2px",fontSize:15,fontWeight:600,color:"#fff"}}>{inj.area}</p><p style={{margin:"0 0 6px",fontSize:12,color:"#555"}}>{inj.date}{inj.mechanism?` · ${inj.mechanism}`:""}</p>{inj.notes&&<p style={{margin:0,fontSize:13,color:"#8E8E93"}}>{inj.notes}</p>}</div><div style={{display:"flex",gap:6}}>{["Active","Recovering","Healed"].map(s=><button key={s} onClick={()=>setInjuries(p=>p.map(x=>x.id===inj.id?{...x,status:s}:x))} style={{padding:"5px 10px",borderRadius:50,border:"none",cursor:"pointer",fontSize:11,fontFamily:"inherit",background:inj.status===s?(s==="Active"?"#E24B4A":s==="Recovering"?"#EF9F27":POS):"#2C2C2E",color:inj.status===s?"#fff":"#555",fontWeight:inj.status===s?600:400}}>{s}</button>)}</div></div></div>))}</>}
    {injuries.filter(i=>i.status==="Healed").length>0&&<><SH>Healed</SH>{injuries.filter(i=>i.status==="Healed").map(inj=>(<div key={inj.id} style={{...card,opacity:0.5}}><p style={{margin:0,fontSize:14,color:"#fff"}}>{inj.area} <span style={{color:POS,fontSize:12}}> healed</span></p></div>))}</>}
    {injuries.length===0&&<div style={{textAlign:"center",padding:"40px 20px",background:"#1C1C1E",borderRadius:20,border:"0.5px dashed #3A3A3C"}}><p style={{margin:"0 0 4px",fontSize:28}}></p><p style={{margin:0,fontSize:15,color:"#555"}}>No injuries logged. Stay healthy!</p></div>}
  </div>);

  const menu=[
    {id:"techniques",label:"Technique Library",sub:`${techniques.length} techniques`,icon:"ti-list-check",color:LIME},
    {id:"partners",label:"Training Partners",sub:`${partners.length} partners`,icon:"ti-users",color:POS},
    {id:"mobility",label:"BJJ Warmup",sub:`${BJJ_MOBILITY.length} exercises · ${mDone} done`,icon:"ti-run",color:"#7F77DD"},
    {id:"injuries",label:"Injury Tracker",sub:activeInjuries.length>0?`${activeInjuries.length} active injuries`:"Track and manage injuries",icon:"ti-first-aid-kit",color:"#E24B4A"},
  ];
  return(<div className="fade-in"><div style={{background:"#1C1C1E",borderRadius:20,overflow:"hidden",border:"0.5px solid #2A2A2C"}}>{menu.map((item,i)=>(<div key={item.id}><button onClick={()=>setLibSec(item.id)} className="tap" style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"18px 16px",border:"none",background:"transparent",cursor:"pointer",textAlign:"left",fontFamily:"inherit",minHeight:76}}><div style={{width:46,height:46,borderRadius:14,background:item.color+"18",border:`1px solid ${item.color}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className={`ti ${item.icon}`} style={{fontSize:22,color:item.color}}/></div><div style={{flex:1}}><p style={{margin:"0 0 2px",fontSize:15,fontWeight:600,color:"#fff"}}>{item.label}</p><p style={{margin:0,fontSize:12,color:"#555"}}>{item.sub}</p></div><span style={{color:"#444",fontSize:18}}>›</span></button>{i<menu.length-1&&<div style={{height:"0.5px",background:"#2A2A2C",margin:"0 16px"}}/>}</div>))}</div></div>);
}

//  MODALS 
function QuickLogModal({onClose,onSave}){
  const [type,setType]=useState("Gi");
  const [duration,setDuration]=useState(90);
  const [step,setStep]=useState(0);
  const steps=[
    <div style={{padding:"8px 0 20px"}}><p style={{margin:"0 0 20px",fontSize:22,fontWeight:700,color:"#fff"}}>What type of session?</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{SESSION_TYPES.map(t=><button key={t} onClick={()=>{setType(t);setStep(1);}} className="tap" style={{padding:"20px 10px",borderRadius:18,background:type===t?LIME:"#2C2C2E",color:type===t?LIME_DK:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:15}}>{t}</button>)}</div></div>,
    <div style={{padding:"8px 0 20px"}}><p style={{margin:"0 0 8px",fontSize:22,fontWeight:700,color:"#fff"}}>How long?</p><p style={{margin:"0 0 28px",fontSize:13,color:"#555"}}>{type} session</p><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:28,marginBottom:32}}><button onClick={()=>setDuration(d=>Math.max(15,d-15))} style={{width:52,height:52,borderRadius:"50%",background:"#2C2C2E",border:"none",cursor:"pointer",fontSize:24,color:"#fff",fontFamily:"inherit"}}>−</button><div style={{textAlign:"center"}}><p style={{margin:0,fontSize:64,fontWeight:800,color:LIME,lineHeight:1}}>{duration}</p><p style={{margin:"4px 0 0",fontSize:13,color:"#555"}}>minutes</p></div><button onClick={()=>setDuration(d=>Math.min(300,d+15))} style={{width:52,height:52,borderRadius:"50%",background:"#2C2C2E",border:"none",cursor:"pointer",fontSize:24,color:LIME_TXT,fontWeight:700,fontFamily:"inherit"}}>+</button></div><PBtn onClick={()=>onSave({date:todayISO(),type,duration,taps_given:0,taps_received:0,mood:"good",notes:"",techniques:[],id:uid()})} glow>Save session </PBtn></div>
  ];
  return(<BottomSheet onClose={onClose} title="Quick Log" noPad={false}><div style={{display:"flex",gap:5,marginBottom:20}}>{[0,1].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:step>=i?LIME:"#2C2C2E"}}/>)}</div>{steps[step]}</BottomSheet>);
}

function PostSessionPrompt({onClose,onSave,sessionDate}){
  const [f,setF]=useState({worked:"",gotMe:"",focus:"",mood:"good"});
  const sv=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<BottomSheet onClose={onClose} title="Quick debrief">
    <p style={{margin:"0 0 20px",fontSize:14,color:"#8E8E93"}}>30 seconds. This is how you improve faster.</p>
    <div style={{marginBottom:14}}><Lbl c="#1D9E75">What worked?</Lbl><textarea value={f.worked} onChange={e=>sv("worked",e.target.value)} placeholder="What clicked today?" style={{minHeight:60}}/></div>
    <div style={{marginBottom:14}}><Lbl c="#E24B4A">What got you?</Lbl><textarea value={f.gotMe} onChange={e=>sv("gotMe",e.target.value)} placeholder="What submitted you? What position felt wrong?" style={{minHeight:60}}/></div>
    <div style={{marginBottom:14}}><Lbl c="#EF9F27">Focus next time</Lbl><textarea value={f.focus} onChange={e=>sv("focus",e.target.value)} placeholder="One thing to drill or think about next session" style={{minHeight:60}}/></div>
    <div style={{marginBottom:20}}><Lbl>How did it feel?</Lbl><div style={{display:"flex",gap:8}}>{MOODS.map(m=><Pill key={m} active={f.mood===m} onClick={()=>sv("mood",m)} color={MOOD_C[m]} s={{flex:1,fontSize:12,padding:"9px 4px"}}>{m}</Pill>)}</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <button onClick={onClose} style={{padding:"16px",borderRadius:16,background:"#2C2C2E",color:"#8E8E93",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:15}}>Skip</button>
      <PBtn onClick={()=>onSave({...f,date:sessionDate||todayISO(),id:uid()})}>Save debrief</PBtn>
    </div>
  </BottomSheet>);
}

function SessionModal({onClose,onSave,techniques}){
  const [f,setF]=useState({date:todayISO(),type:"Gi",duration:90,partner:"",taps_given:0,taps_received:0,notes:"",techniques:[],mood:"good",coachNotes:"",rounds:[]});
  const sv=useCallback((k,v)=>setF(p=>({...p,[k]:v})),[]);
  const toggle=useCallback(name=>setF(p=>({...p,techniques:p.techniques.includes(name)?p.techniques.filter(t=>t!==name):[...p.techniques,name]})),[]);
  const addRound=()=>setF(p=>({...p,rounds:[...p.rounds,{id:uid(),partner:"",result:"neutral",notes:""}]}));
  const updateRound=(id,k,v)=>setF(p=>({...p,rounds:p.rounds.map(r=>r.id===id?{...r,[k]:v}:r)}));
  const removeRound=id=>setF(p=>({...p,rounds:p.rounds.filter(r=>r.id!==id)}));
  return(<BottomSheet onClose={onClose} title="Log session">
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><Lbl>Date</Lbl><input type="date" max={todayISO()} value={f.date} onChange={e=>sv("date",e.target.value)}/></div><div><Lbl>Type</Lbl><select value={f.type} onChange={e=>sv("type",e.target.value)}>{SESSION_TYPES.map(t=><option key={t}>{t}</option>)}</select></div></div>
    <div style={{marginBottom:12}}><Lbl>Duration — {f.duration} min</Lbl><input type="range" min={15} max={300} step={15} value={f.duration} onChange={e=>sv("duration",Number(e.target.value))}/></div>
    <div style={{marginBottom:14}}><Lbl>How did it feel?</Lbl><div style={{display:"flex",gap:8}}>{MOODS.map(m=><Pill key={m} active={f.mood===m} onClick={()=>sv("mood",m)} color={MOOD_C[m]} s={{flex:1,fontSize:12,padding:"9px 4px"}}>{m}</Pill>)}</div></div>
    <div style={{marginBottom:14}}><Lbl>Main training partner</Lbl><input value={f.partner} onChange={e=>sv("partner",e.target.value)} placeholder="Partner name"/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}><Stepper label="Subs landed" value={f.taps_given} onChange={v=>sv("taps_given",Math.min(20,v))}/><Stepper label="Times tapped" value={f.taps_received} onChange={v=>sv("taps_received",Math.min(20,v))}/></div>
    <SH>Rounds <span style={{color:"#555",fontWeight:400,textTransform:"none",letterSpacing:"0",fontSize:12}}>(optional)</span></SH>
    {f.rounds.map((r,i)=>(<div key={r.id} style={{...mc,marginBottom:8}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:13,color:"#fff",fontWeight:600}}>Round {i+1}</span><button onClick={()=>removeRound(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#555",fontSize:13,fontFamily:"inherit"}}>Remove</button></div><input value={r.partner} onChange={e=>updateRound(r.id,"partner",e.target.value)} placeholder="Partner" style={{marginBottom:8}}/><div style={{display:"flex",gap:6}}>{[["win","Win"],["loss","Loss"],["neutral","Draw"]].map(([v,l])=><Pill key={v} active={r.result===v} onClick={()=>updateRound(r.id,"result",v)} s={{flex:1,fontSize:12,padding:"8px 4px"}}>{l}</Pill>)}</div></div>))}
    <button onClick={addRound} style={{width:"100%",padding:"12px",borderRadius:14,background:"#2C2C2E",border:"0.5px dashed #3A3A3C",cursor:"pointer",color:"#8E8E93",fontSize:13,fontFamily:"inherit",marginBottom:14}}>+ Add round</button>
    <SH>Techniques practiced</SH>
    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>{techniques.slice(0,20).map(t=><Pill key={t.id} active={f.techniques.includes(t.name)} onClick={()=>toggle(t.name)} s={{flexShrink:0}}>{t.name}</Pill>)}</div>
    <div style={{marginBottom:12}}><Lbl>Coach notes</Lbl><input value={f.coachNotes} onChange={e=>sv("coachNotes",e.target.value)} placeholder="What did your coach tell you?"/></div>
    <Lbl>Session notes</Lbl><textarea value={f.notes} onChange={e=>sv("notes",e.target.value)} placeholder="What happened on the mat today?" style={{marginBottom:20}}/>
    <PBtn onClick={()=>onSave(f)} glow>Save session</PBtn>
  </BottomSheet>);
}

function JournalModal({onClose,onSave,initialDate}){
  const [f,setF]=useState({date:initialDate||todayISO(),worked:"",gotMe:"",focus:"",content:"",mood:"good"});
  const sv=useCallback((k,v)=>setF(p=>({...p,[k]:v})),[]);
  return(<BottomSheet onClose={onClose} title="New journal entry">
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}><div><Lbl>Date</Lbl><input type="date" max={todayISO()} value={f.date} onChange={e=>sv("date",e.target.value)}/></div><div><Lbl>Mood</Lbl><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{MOODS.map(m=><Pill key={m} active={f.mood===m} onClick={()=>sv("mood",m)} color={MOOD_C[m]} s={{padding:"8px 12px",fontSize:12}}>{m}</Pill>)}</div></div></div>
    <div style={{marginBottom:12}}><Lbl c="#1D9E75">What worked well?</Lbl><textarea value={f.worked} onChange={e=>sv("worked",e.target.value)} placeholder="What clicked today?"/></div>
    <div style={{marginBottom:12}}><Lbl c="#E24B4A">What got you?</Lbl><textarea value={f.gotMe} onChange={e=>sv("gotMe",e.target.value)} placeholder="What submitted you?"/></div>
    <div style={{marginBottom:12}}><Lbl c="#EF9F27">Focus next time</Lbl><textarea value={f.focus} onChange={e=>sv("focus",e.target.value)} placeholder="One thing to work on next session"/></div>
    <div style={{marginBottom:20}}><Lbl>Additional notes</Lbl><textarea value={f.content} onChange={e=>sv("content",e.target.value)} placeholder="Coach feedback, video links, anything else..."/></div>
    <PBtn onClick={()=>onSave(f)}>Save entry</PBtn>
  </BottomSheet>);
}

function ProfileModal({profile,setProfile,onClose}){
  const [f,setF]=useState({...profile});
  const beltObj=BELTS.find(b=>b.id===f.belt)||BELTS[1];
  const initials=useMemo(()=>f.name.trim().split(/\s+/).map(n=>n[0]||"").join("").slice(0,2).toUpperCase()||"BJJ",[f.name]);
  return(<BottomSheet onClose={onClose} title="Profile">
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingBottom:20,borderBottom:"0.5px solid #2A2A2C",marginBottom:20}}>
      <div style={{width:80,height:80,borderRadius:"50%",background:beltObj.color,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,boxShadow:`0 0 24px ${beltObj.color}50`}}><span style={{fontSize:26,fontWeight:700,color:beltObj.text}}>{initials}</span></div>
      <p style={{margin:"0 0 2px",fontSize:17,fontWeight:600,color:"#fff"}}>{f.name||"Your name"}</p>
      {f.gameStyle&&<p style={{margin:0,fontSize:12,color:"#555"}}>{f.gameStyle}</p>}
    </div>
    <Lbl>Name</Lbl><input value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} style={{marginBottom:12}}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><Lbl>Gym</Lbl><input value={f.gym||""} onChange={e=>setF(p=>({...p,gym:e.target.value}))} placeholder="e.g. Flow Studio"/></div><div><Lbl>Coach</Lbl><input value={f.coach||""} onChange={e=>setF(p=>({...p,coach:e.target.value}))} placeholder="e.g. Coach Marco"/></div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}><div><Lbl>Training since</Lbl><input type="date" max={todayISO()} value={f.startDate||""} onChange={e=>setF(p=>({...p,startDate:e.target.value}))}/></div><div><Lbl>Weekly goal</Lbl><input type="number" min={1} max={7} value={f.weeklyGoal||4} onChange={e=>setF(p=>({...p,weeklyGoal:Number(e.target.value)}))}/></div></div>
    <Lbl>Playing style</Lbl>
    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>{GAME_STYLES.map(g=><Pill key={g} active={f.gameStyle===g} onClick={()=>setF(p=>({...p,gameStyle:g}))} s={{fontSize:12}}>{g}</Pill>)}</div>
    <SH>Belt color</SH><BeltPicker value={f.belt} onChange={v=>setF(p=>({...p,belt:v}))}/>
    <SH>Stripes</SH><StripePicker value={f.stripes} onChange={v=>setF(p=>({...p,stripes:v}))}/>
    <PBtn onClick={()=>setProfile(f)} s={{marginTop:24}}>Save changes</PBtn>
  </BottomSheet>);
}

function MedalPicker({label,value,onChange}){return(<div style={{marginBottom:12}}><p style={{margin:"0 0 8px",fontSize:13,color:"#8E8E93"}}>{label}</p><div style={{display:"flex",gap:10}}>{MEDAL_OPTS.map(med=>(<button key={med} onClick={()=>onChange(med)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",padding:0}}><div style={{width:36,height:36,borderRadius:"50%",background:MEDAL_COLORS[med],border:value===med?"3px solid #AAFF00":"3px solid transparent",transition:"all 0.2s",opacity:med==="None"?0.4:1}}/><span style={{fontSize:10,color:value===med?"#fff":"#555",fontFamily:"inherit"}}>{med}</span></button>))}</div></div>);}

function CompetitionModal({onClose,onSave,editItem}){
  const [f,setF]=useState(editItem||{date:todayISO(),event:"",location:"",weight:WEIGHTS[4],wins:0,losses:0,notes:"",ageBracket:"Adult",compBelt:"Purple",joinedGi:true,joinedNogi:false,giWeightMedal:"None",giAbsMedal:"None",nogiWeightMedal:"None",nogiAbsMedal:"None",photo:""});
  const sv=useCallback((k,v)=>setF(p=>({...p,[k]:v})),[]);
  const handlePhoto=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{const img=new Image();img.onload=()=>{const canvas=document.createElement("canvas");const max=480;let w=img.width,h=img.height;if(w>max){h=Math.round(h*max/w);w=max;}if(h>max){w=Math.round(w*max/h);h=max;}canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);const data=canvas.toDataURL("image/jpeg",0.6);if(data.length>400000){alert("Photo is too large even after compression. Please choose a smaller image.");return;}sv("photo",data);};img.src=ev.target.result;};reader.readAsDataURL(file);};
  return(<BottomSheet onClose={onClose} title={editItem?"Edit competition":"Add competition"}>
    <div style={{marginBottom:12}}><Lbl>Event name <span style={{color:"#E24B4A"}}>*</span></Lbl><input value={f.event} onChange={e=>sv("event",e.target.value)} placeholder="e.g. Metro BJJ Open"/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><Lbl>Date</Lbl><input type="date" value={f.date} onChange={e=>sv("date",e.target.value)}/></div><div><Lbl>Location</Lbl><input value={f.location} onChange={e=>sv("location",e.target.value)} placeholder="e.g. Manila"/></div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><Lbl>Age bracket</Lbl><select value={f.ageBracket} onChange={e=>sv("ageBracket",e.target.value)}>{AGE_BRACKETS.map(a=><option key={a}>{a}</option>)}</select></div><div><Lbl>Weight class</Lbl><select value={f.weight} onChange={e=>sv("weight",e.target.value)}>{WEIGHTS.map(w=><option key={w}>{w}</option>)}</select></div></div>
    <div style={{marginBottom:12}}><Lbl>Belt level</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{COMP_BELTS.map(b=><button key={b} onClick={()=>sv("compBelt",b)} style={{padding:"7px 14px",borderRadius:50,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,background:f.compBelt===b?"#AAFF00":"#2C2C2E",color:f.compBelt===b?"#000":"#8E8E93",fontWeight:f.compBelt===b?700:400}}>{b}</button>)}</div></div>
    <div style={{marginBottom:12}}><Lbl>Divisions entered</Lbl><div style={{display:"flex",gap:8}}><button onClick={()=>sv("joinedGi",!f.joinedGi)} style={{padding:"9px 20px",borderRadius:50,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,background:f.joinedGi?"#AAFF00":"#2C2C2E",color:f.joinedGi?"#000":"#8E8E93",fontWeight:f.joinedGi?700:400}}>Gi</button><button onClick={()=>sv("joinedNogi",!f.joinedNogi)} style={{padding:"9px 20px",borderRadius:50,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,background:f.joinedNogi?"#AAFF00":"#2C2C2E",color:f.joinedNogi?"#000":"#8E8E93",fontWeight:f.joinedNogi?700:400}}>No-Gi</button></div></div>
    {f.joinedGi&&<div style={{background:"#2C2C2E",borderRadius:16,padding:"14px 16px",marginBottom:12}}><p style={{margin:"0 0 12px",fontSize:13,fontWeight:600,color:"#fff"}}>Gi</p><MedalPicker label="Weight division" value={f.giWeightMedal} onChange={v=>sv("giWeightMedal",v)}/><MedalPicker label="Absolute division" value={f.giAbsMedal} onChange={v=>sv("giAbsMedal",v)}/></div>}
    {f.joinedNogi&&<div style={{background:"#2C2C2E",borderRadius:16,padding:"14px 16px",marginBottom:12}}><p style={{margin:"0 0 12px",fontSize:13,fontWeight:600,color:"#fff"}}>No-Gi</p><MedalPicker label="Weight division" value={f.nogiWeightMedal} onChange={v=>sv("nogiWeightMedal",v)}/><MedalPicker label="Absolute division" value={f.nogiAbsMedal} onChange={v=>sv("nogiAbsMedal",v)}/></div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><Stepper label="Wins" value={f.wins} onChange={v=>sv("wins",Math.min(20,v))}/><Stepper label="Losses" value={f.losses} onChange={v=>sv("losses",Math.min(20,v))}/></div>
    <div style={{marginBottom:12}}><Lbl>Notes</Lbl><textarea value={f.notes} onChange={e=>sv("notes",e.target.value)} placeholder="How did it go?"/></div>
    <div style={{marginBottom:20}}><Lbl>Competition photo</Lbl>{f.photo?<div style={{position:"relative",marginBottom:8}}><img src={f.photo} style={{width:"100%",borderRadius:12,maxHeight:200,objectFit:"cover"}}/><button onClick={()=>sv("photo","")} style={{position:"absolute",top:8,right:8,width:28,height:28,borderRadius:"50%",background:"rgba(0,0,0,0.6)",border:"none",cursor:"pointer",color:"#fff",fontSize:14}}>x</button></div>:<label style={{display:"block",padding:"14px",borderRadius:14,background:"#1C1C1E",border:"0.5px dashed #3A3A3C",cursor:"pointer",textAlign:"center",color:"#555",fontSize:14}}><input type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>Tap to upload photo</label>}</div>
    <PBtn onClick={()=>f.event.trim()&&onSave(f)} disabled={!f.event.trim()}>{editItem?"Update event":"Save event"}</PBtn>
  </BottomSheet>);
}

function GoalModal({onClose,onSave}){
  const [f,setF]=useState({title:"",cat:"Technique",deadline:""});
  const sv=useCallback((k,v)=>setF(p=>({...p,[k]:v})),[]);
  return(<BottomSheet onClose={onClose} title="Add goal"><div style={{marginBottom:12}}><Lbl>Goal <span style={{color:"#E24B4A"}}>*</span></Lbl><input value={f.title} onChange={e=>sv("title",e.target.value)} placeholder="e.g. Master the single leg"/></div><div style={{marginBottom:12}}><Lbl>Category</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{GOAL_CATS.map(c=><Pill key={c} active={f.cat===c} onClick={()=>sv("cat",c)}>{c}</Pill>)}</div></div><div style={{marginBottom:20}}><Lbl>Target date</Lbl><input type="date" value={f.deadline} onChange={e=>sv("deadline",e.target.value)}/></div><PBtn onClick={()=>f.title.trim()&&onSave(f)} disabled={!f.title.trim()}>Add goal</PBtn></BottomSheet>);
}

function PartnerModal({onClose,onSave}){
  const [f,setF]=useState({name:"",belt:"blue",gym:"",strengths:"",weaknesses:"",gameStyle:"",notes:""});
  const sv=useCallback((k,v)=>setF(p=>({...p,[k]:v})),[]);
  return(<BottomSheet onClose={onClose} title="Add training partner"><div style={{marginBottom:12}}><Lbl>Name <span style={{color:"#E24B4A"}}>*</span></Lbl><input value={f.name} onChange={e=>sv("name",e.target.value)} placeholder="Partner name"/></div><div style={{marginBottom:16}}><Lbl>Belt</Lbl><BeltPicker value={f.belt} onChange={v=>sv("belt",v)}/></div><div style={{marginBottom:12}}><Lbl>Gym</Lbl><input value={f.gym} onChange={e=>sv("gym",e.target.value)} placeholder="e.g. Flow Studio"/></div><div style={{marginBottom:12}}><Lbl c={POS}>Strengths</Lbl><textarea value={f.strengths} onChange={e=>sv("strengths",e.target.value)} placeholder="What are they dangerous at?" style={{minHeight:60}}/></div><div style={{marginBottom:12}}><Lbl c="#E24B4A">Weaknesses</Lbl><textarea value={f.weaknesses} onChange={e=>sv("weaknesses",e.target.value)} placeholder="Where can you attack?" style={{minHeight:60}}/></div><div style={{marginBottom:20}}><Lbl>Notes</Lbl><textarea value={f.notes} onChange={e=>sv("notes",e.target.value)} placeholder="Training style, game..."/></div><PBtn onClick={()=>f.name.trim()&&onSave(f)} disabled={!f.name.trim()}>Add partner</PBtn></BottomSheet>);
}

function InjuryModal({onClose,onSave}){
  const [f,setF]=useState({area:"Knee",date:todayISO(),mechanism:"",notes:"",status:"Active"});
  const sv=useCallback((k,v)=>setF(p=>({...p,[k]:v})),[]);
  return(<BottomSheet onClose={onClose} title="Log injury"><div style={{marginBottom:12}}><Lbl>Body area</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{INJURY_AREAS.map(a=><Pill key={a} active={f.area===a} onClick={()=>sv("area",a)} s={{fontSize:12}}>{a}</Pill>)}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><Lbl>Date</Lbl><input type="date" max={todayISO()} value={f.date} onChange={e=>sv("date",e.target.value)}/></div><div><Lbl>Status</Lbl><select value={f.status} onChange={e=>sv("status",e.target.value)}>{INJURY_STATUS.map(s=><option key={s}>{s}</option>)}</select></div></div><div style={{marginBottom:12}}><Lbl>How did it happen?</Lbl><input value={f.mechanism} onChange={e=>sv("mechanism",e.target.value)} placeholder="e.g. Got caught in heel hook"/></div><div style={{marginBottom:20}}><Lbl>Notes</Lbl><textarea value={f.notes} onChange={e=>sv("notes",e.target.value)} placeholder="Pain level, what aggravates it, treatment..."/></div><PBtn onClick={()=>onSave(f)}>Log injury</PBtn></BottomSheet>);
}

//  MAIN APP 
export default function App(){
  const [tab,setTab]=useState("dashboard");
  const [sessions,setSessions]=useState([]);
  const [techniques,setTechniques]=useState(TECH_DEFAULT);
  const [journal,setJournal]=useState([]);
  const [competitions,setCompetitions]=useState([]);
  const [goals,setGoals]=useState([]);
  const [partners,setPartners]=useState([]);
  const [injuries,setInjuries]=useState([]);
  const [profile,setProfile]=useState({name:"",belt:"blue",stripes:0,gym:"",coach:"",startDate:"",weightClass:WEIGHTS[4],weeklyGoal:4,gameStyle:"Balanced",favPositions:[],onboarded:false});
  const [modal,setModal]=useState(null);
  const [selSession,setSelSession]=useState(null);
  const [toasts,setToasts]=useState([]);
  const [libSec,setLibSec]=useState(null);
  const [editComp,setEditComp]=useState(null);
  const [journalInitDate,setJournalInitDate]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [postSessionDate,setPostSessionDate]=useState(null);
  const undoRef=useRef({});

  useEffect(()=>{const unsub=onAuthStateChanged(auth,u=>{setUser(u);setAuthLoading(false);});return unsub;},[]);

  useEffect(()=>{
    if(!user)return;
    (async()=>{
      try{
        const keys=['sessions','techniques','journal','competitions','goals','partners','profile','injuries'];
        const results=await Promise.allSettled(keys.map(k=>getDoc(doc(db,'users',user.uid,'data',k))));
        const[s,t,j,c,g,p,pr,inj]=results.map(r=>r.value?.exists()?JSON.parse(r.value.data().value):null);
        if(s)setSessions(s);if(t)setTechniques(t);if(j)setJournal(j);
        if(c)setCompetitions(c);if(g)setGoals(g);if(p)setPartners(p);if(pr)setProfile(pr);if(inj)setInjuries(inj);
      }catch(e){console.error('Load error:',e);}
      setLoaded(true);
    })();
  },[user]);

  useFirestore(user?.uid,"bjj:sessions",sessions,loaded);
  useFirestore(user?.uid,"bjj:techniques",techniques,loaded);
  useFirestore(user?.uid,"bjj:journal",journal,loaded);
  useFirestore(user?.uid,"bjj:competitions",competitions,loaded);
  useFirestore(user?.uid,"bjj:goals",goals,loaded);
  useFirestore(user?.uid,"bjj:partners",partners,loaded);
  useFirestore(user?.uid,"bjj:profile",profile,loaded);
  useFirestore(user?.uid,"bjj:injuries",injuries,loaded);

  const showToast=useCallback((msg,action=null)=>{const id=Date.now();setToasts(p=>[...p,{id,msg,action}]);setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),action?5000:2500);},[]);
  const dismissToast=useCallback(id=>setToasts(p=>p.filter(t=>t.id!==id)),[]);

  const handleDeleteSession=useCallback((id)=>{
    const tId=uid();
    setSessions(prev=>{const s=prev.find(x=>x.id===id);if(!s)return prev;const timer=setTimeout(()=>{delete undoRef.current[id];setToasts(p=>p.filter(t=>t.id!==tId));},5000);undoRef.current[id]={s,timer};return prev.filter(x=>x.id!==id);});
    setToasts(prev=>[...prev,{id:tId,msg:"Session deleted",action:{label:"Undo",fn:()=>{const p=undoRef.current[id];if(p){clearTimeout(p.timer);delete undoRef.current[id];setSessions(q=>[p.s,...q].sort((a,b)=>b.date.localeCompare(a.date)));showToast("Session restored ");}setToasts(q=>q.filter(t=>t.id!==tId));}}}]);
  },[showToast]);

  const addSession=useCallback(s=>{
    const ns={...s,id:uid()};
    setSessions(p=>[ns,...p]);
    setModal(null);
    setPostSessionDate(ns.date);
    showToast(`Session saved  +${50+(ns.taps_given||0)*10} XP `);
  },[showToast]);

  const addQuickSession=useCallback(s=>{
    setSessions(p=>[s,...p]);
    setModal(null);
    setPostSessionDate(s.date);
    showToast("Quick session saved  +50 XP ");
  },[showToast]);

  const savePostSession=useCallback(e=>{
    setJournal(p=>[{...e,id:Date.now()},...p]);
    setPostSessionDate(null);
    showToast("Debrief saved ");
  },[showToast]);

  const addJournal=useCallback(e=>{setJournal(p=>[{...e,id:uid()},...p]);setModal(null);setJournalInitDate(null);showToast("Journal entry saved ");},[showToast]);
  const addGoal=useCallback(g=>{setGoals(p=>[{...g,id:uid(),done:false},...p]);setModal(null);showToast("Goal added");},[showToast]);
  const addPartner=useCallback(p=>{setPartners(prev=>[{...p,id:uid()},...prev]);setModal(null);showToast("Partner added");},[showToast]);
  const addInjury=useCallback(i=>{setInjuries(prev=>[{...i,id:uid()},...prev]);setModal(null);showToast("Injury logged");},[showToast]);
  const saveComp=useCallback(c=>{if(editComp){setCompetitions(p=>p.map(x=>x.id===editComp.id?{...c,id:editComp.id}:x));showToast("Competition updated ");}else{setCompetitions(p=>[{...c,id:uid()},...p]);showToast("Competition saved ");}setEditComp(null);setModal(null);},[editComp,showToast]);
  const handleEditComp=useCallback(c=>{setEditComp(c);setModal("comp");},[]);
  const handleTabClick=useCallback((id)=>{setTab(id);if(id!=="library")setLibSec(null);setSelSession(null);},[]);

  if(authLoading||(user&&!loaded))return(<div style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}><img src={LOGO} alt="Grapplr" style={{width:"60%",maxWidth:200,objectFit:"contain",opacity:0.8}}/><p style={{color:"#555",fontSize:13,margin:0}}>Loading…</p></div>);
  if(!user)return <AuthScreen/>;
  if(!profile.onboarded)return(<div style={{fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",background:"#000",minHeight:"100vh",overflowX:"clip",width:"100%"}}><GS/><Onboarding onDone={p=>setProfile(p)}/></div>);

  const beltObj=BELTS.find(b=>b.id===profile.belt)||BELTS[1];
  const tabTitle={sessions:"Train",journal:"Journal",progress:"Progress",library:"Moves"};

  return(
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",maxWidth:680,margin:"0 auto",background:"#000",minHeight:"100vh",overflowX:"clip",width:"100%"}}>
      <GS/>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",position:"sticky",top:0,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(12px)",zIndex:100,borderBottom:"0.5px solid #1A1A1A"}}>
        
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setModal("profile")} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
            <div style={{display:"flex",alignItems:"center",gap:7,padding:"6px 12px 6px 9px",background:"#1C1C1E",borderRadius:50,border:"0.5px solid #2A2A2C"}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:beltObj.color,flexShrink:0,boxShadow:`0 0 8px ${beltObj.color}70`}}/>
              <span style={{fontSize:13,fontWeight:600,color:"#fff"}}>{beltObj.label}</span>
              {profile.stripes>0&&<div style={{display:"flex",gap:2}}>{[...Array(profile.stripes)].map((_,i)=><div key={i} style={{width:3,height:8,borderRadius:1.5,background:"rgba(255,255,255,0.5)"}}/>)}</div>}
            </div>
          </button>
          <button onClick={()=>signOut(auth)} style={{width:36,height:36,background:"#1C1C1E",border:"0.5px solid #2A2A2C",borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <i className="ti ti-logout" style={{fontSize:16,color:"#555"}}/>
          </button>
        </div>
      </div>

      {tab!=="dashboard"&&<div style={{padding:"18px 20px 0"}}><h2 style={{margin:0,fontSize:24,fontWeight:800,color:"#fff",letterSpacing:"-0.3px"}}>{tabTitle[tab]}</h2></div>}

      {/* Content */}
      <div style={{padding:"16px 20px 100px"}}>
        {tab==="dashboard"&&<Dashboard sessions={sessions} journal={journal} profile={profile} onLog={()=>setModal("session")} onQuickLog={()=>setModal("quicklog")} onJournal={()=>setModal("journal")}/>}
        {tab==="sessions"&&<Sessions sessions={sessions} onDelete={handleDeleteSession} onSelectSession={setSelSession}/>}
        {tab==="journal"&&<Journal journal={journal} onAdd={()=>setModal("journal")}/>}
        {tab==="progress"&&<Progress sessions={sessions} competitions={competitions} setCompetitions={setCompetitions} goals={goals} setGoals={setGoals} journal={journal} profile={profile} onAddComp={()=>{setEditComp(null);setModal("comp");}} onAddGoal={()=>setModal("goal")} onEditComp={handleEditComp} showToast={showToast}/>}
        {tab==="library"&&<Library techniques={techniques} setTechniques={setTechniques} partners={partners} setPartners={setPartners} injuries={injuries} setInjuries={setInjuries} sessions={sessions} onAddPartner={()=>setModal("partner")} onAddInjury={()=>setModal("injury")} libSec={libSec} setLibSec={setLibSec}/>}
      </div>

      <ToastBar toasts={toasts} dismiss={dismissToast}/>

      {/* Tab bar */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:680,background:TAB_BG,display:"flex",alignItems:"flex-end",borderTop:"0.5px solid #1A1A1A",paddingBottom:8,paddingTop:4,zIndex:50}}>
        {LEFT_TABS.map(t=><TabBtn key={t.id} t={t} active={tab===t.id} onTabClick={handleTabClick}/>)}
        <div style={{flex:1,display:"flex",justifyContent:"center",alignItems:"flex-end",paddingBottom:2}}>
          <button onClick={()=>setModal("quicklog")} className="glow-btn" style={{width:64,height:64,borderRadius:"50%",background:LIME,border:`4px solid ${TAB_BG}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transform:"translateY(-16px)",fontSize:28,color:LIME_DK,fontWeight:800}} aria-label="Quick log">+</button>
        </div>
        {RIGHT_TABS.map(t=><TabBtn key={t.id} t={t} active={tab===t.id} onTabClick={handleTabClick}/>)}
      </div>

      {/* Modals */}
      {modal==="quicklog"&&<QuickLogModal onClose={()=>setModal(null)} onSave={addQuickSession}/>}
      {modal==="session"&&<SessionModal onClose={()=>setModal(null)} onSave={addSession} techniques={techniques}/>}
      {selSession&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={()=>setSelSession(null)}><div style={{background:"#1C1C1E",borderRadius:"24px 24px 0 0",maxHeight:"85vh",overflowY:"auto",padding:"20px 22px 44px"}} onClick={e=>e.stopPropagation()}><div style={{width:36,height:5,borderRadius:3,background:"#3A3A3C",margin:"0 auto 16px"}}/><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><h3 style={{margin:0,fontSize:19,fontWeight:700,color:"#fff"}}>Session details</h3><button onClick={()=>setSelSession(null)} style={{width:36,height:36,borderRadius:"50%",background:"#2C2C2E",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#8E8E93",fontSize:18,flexShrink:0}}>×</button></div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}><span style={{padding:"6px 14px",borderRadius:50,background:"#2C2C2E",fontSize:13,color:"#fff"}}>{selSession.date}</span><span style={{padding:"6px 14px",borderRadius:50,background:"#2C2C2E",fontSize:13,color:"#fff"}}>{selSession.type}</span><span style={{padding:"6px 14px",borderRadius:50,background:"#2C2C2E",fontSize:13,color:"#fff"}}>{selSession.duration} min</span>{selSession.mood&&<span style={{padding:"6px 14px",borderRadius:50,background:MOOD_C[selSession.mood]+"20",fontSize:13,color:MOOD_C[selSession.mood],fontWeight:600}}>{selSession.mood}</span>}</div>{selSession.partner&&<div style={{marginBottom:12}}><p style={{margin:"0 0 4px",fontSize:11,color:"#555",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>Partner</p><p style={{margin:0,fontSize:15,color:"#fff"}}>{selSession.partner}</p></div>}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}><div style={{background:"#2C2C2E",borderRadius:14,padding:"12px",textAlign:"center"}}><p style={{margin:0,fontSize:22,fontWeight:800,color:"#1D9E75"}}>{selSession.taps_given||0}</p><p style={{margin:"4px 0 0",fontSize:11,color:"#555"}}>Subs landed</p></div><div style={{background:"#2C2C2E",borderRadius:14,padding:"12px",textAlign:"center"}}><p style={{margin:0,fontSize:22,fontWeight:800,color:"#E24B4A"}}>{selSession.taps_received||0}</p><p style={{margin:"4px 0 0",fontSize:11,color:"#555"}}>Times tapped</p></div></div>{selSession.notes&&<div style={{marginBottom:12}}><p style={{margin:"0 0 4px",fontSize:11,color:"#555",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>Notes</p><p style={{margin:0,fontSize:14,color:"#fff",lineHeight:1.6}}>{selSession.notes}</p></div>}{selSession.techniques?.length>0&&<div style={{marginBottom:12}}><p style={{margin:"0 0 8px",fontSize:11,color:"#555",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>Techniques</p><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{selSession.techniques.map(t=><span key={t} style={{padding:"4px 12px",borderRadius:50,background:"#2C2C2E",fontSize:12,color:"#fff"}}>{t}</span>)}</div></div>}{selSession.rounds?.length>0&&<div style={{marginBottom:12}}><p style={{margin:"0 0 8px",fontSize:11,color:"#555",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>Rounds</p>{selSession.rounds.map((r,i)=><div key={r.id} style={{background:"#2C2C2E",borderRadius:12,padding:"10px 14px",marginBottom:6,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,color:"#fff"}}>Round {i+1}{r.partner?` · ${r.partner}`:""}</span><span style={{fontSize:12,fontWeight:600,color:r.result==="win"?"#1D9E75":r.result==="loss"?"#E24B4A":"#555"}}>{r.result}</span></div>)}</div>}<button onClick={()=>{handleDeleteSession(selSession.id);setSelSession(null);}} style={{width:"100%",padding:"14px",borderRadius:14,background:"#E24B4A18",color:"#E24B4A",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:14,marginTop:8}}>Delete session</button></div></div>}
      {modal==="journal"&&<JournalModal onClose={()=>{setModal(null);setJournalInitDate(null);}} onSave={addJournal} initialDate={journalInitDate}/>}
      {modal==="profile"&&<ProfileModal profile={profile} setProfile={p=>{setProfile(p);setModal(null);showToast("Profile updated ");}} onClose={()=>setModal(null)}/>}
      {modal==="comp"&&<CompetitionModal onClose={()=>{setModal(null);setEditComp(null);}} onSave={saveComp} editItem={editComp}/>}
      {modal==="goal"&&<GoalModal onClose={()=>setModal(null)} onSave={addGoal}/>}
      {modal==="partner"&&<PartnerModal onClose={()=>setModal(null)} onSave={addPartner}/>}
      {modal==="injury"&&<InjuryModal onClose={()=>setModal(null)} onSave={addInjury}/>}

      {/* Post-session auto debrief */}
      {postSessionDate&&<PostSessionPrompt onClose={()=>setPostSessionDate(null)} onSave={savePostSession} sessionDate={postSessionDate}/>}
    </div>
  );
}
