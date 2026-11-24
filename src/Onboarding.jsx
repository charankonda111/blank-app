import { useState } from "react";
import { C, Logo, TInput, Tag, UNIVERSITIES, YEAR_OPTIONS } from "./core.jsx";

function Onboarding(props){
  var _s=useState(0),step=_s[0],setStep=_s[1];
  var _n=useState(props.defaultName||""),name=_n[0],setName=_n[1];
  var _y=useState(""),year=_y[0],setYear=_y[1];
  var _us=useState(""),uniSearch=_us[0],setUniSearch=_us[1];

  function next(){setStep(function(s){return s+1;});}
  function selectUni(id){props.onComplete({name:name.trim(),year:year,university:id});}

  var filteredUnis=uniSearch?UNIVERSITIES.filter(function(u){return u.name.toLowerCase().indexOf(uniSearch.toLowerCase())>-1||u.province.toLowerCase().indexOf(uniSearch.toLowerCase())>-1;}):UNIVERSITIES;

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px",maxWidth:480,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{margin:"0 auto 14px",display:"flex",justifyContent:"center"}}><Logo size={64}/></div>
        <p style={{margin:0,fontWeight:900,fontSize:23,color:C.text,letterSpacing:"-0.02em"}}>Lost2Med</p>
        <p style={{margin:"4px 0 0",fontSize:13,color:C.sub}}>Your premed journey, tracked</p>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:32}}>
        {[0,1,2].map(function(i){return (
          <div key={i} style={{width:i===step?26:8,height:8,borderRadius:99,background:i===step?C.blue:i<step?C.blue+"60":C.border}}/>
        );})}
      </div>

      {step===0&&(
        <div style={{width:"100%"}}>
          <p style={{margin:"0 0 4px",fontWeight:800,fontSize:20,color:C.text}}>What is your name?</p>
          <p style={{margin:"0 0 18px",fontSize:13,color:C.sub}}>We will personalize your experience</p>
          <TInput value={name} onChange={setName} placeholder="e.g. Alex" style={{fontSize:17,fontWeight:600,padding:"13px 16px",marginBottom:12}} onKeyDown={function(e){if(e.key==="Enter"&&name.trim())next();}}/>
          <button onClick={next} disabled={!name.trim()} style={{width:"100%",border:"none",borderRadius:12,background:name.trim()?C.blue:C.hi,color:name.trim()?"#fff":C.muted,fontFamily:"inherit",fontWeight:800,fontSize:15,padding:"13px",cursor:name.trim()?"pointer":"default"}}>
            Continue
          </button>
        </div>
      )}

      {step===1&&(
        <div style={{width:"100%"}}>
          <p style={{margin:"0 0 4px",fontWeight:800,fontSize:20,color:C.text}}>What year are you in?</p>
          <p style={{margin:"0 0 18px",fontSize:13,color:C.sub}}>Helps us set up your GPA tracker</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {YEAR_OPTIONS.map(function(y){return (
              <button key={y} onClick={function(){setYear(y);next();}} style={{border:"none",background:C.surface,borderRadius:12,padding:"12px 16px",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14,color:C.text,textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>{y}</span>
                <span style={{color:C.muted}}>→</span>
              </button>
            );})}
          </div>
        </div>
      )}

      {step===2&&(
        <div style={{width:"100%"}}>
          <p style={{margin:"0 0 4px",fontWeight:800,fontSize:20,color:C.text}}>Which university?</p>
          <p style={{margin:"0 0 14px",fontSize:13,color:C.sub}}>For accurate GPA calculations</p>
          <TInput value={uniSearch} onChange={setUniSearch} placeholder="Search university..." style={{marginBottom:10}}/>
          <div style={{background:C.surface,borderRadius:14,overflow:"hidden",maxHeight:300,overflowY:"auto"}}>
            {filteredUnis.map(function(u,i){return (
              <div key={u.id} role="button" tabIndex={0} onKeyDown={function(e){if(e.key==="Enter")selectUni(u.id);}} onClick={function(){selectUni(u.id);}} style={{padding:"11px 16px",cursor:"pointer",borderBottom:i<filteredUnis.length-1?"1px solid "+C.border:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <p style={{margin:0,fontWeight:600,fontSize:13,color:C.text}}>{u.name}</p>
                  <p style={{margin:0,fontSize:10,color:C.sub}}>{u.province}</p>
                </div>
                <Tag color={C.sub}>{u.scale}</Tag>
              </div>
            );})}
          </div>
        </div>
      )}

      {step>0&&<button onClick={function(){setStep(function(s){return s-1;});}} style={{marginTop:18,background:"none",border:"none",color:C.sub,fontFamily:"inherit",fontSize:13,cursor:"pointer"}}>← Back</button>}
      <p style={{margin:"32px 0 0",fontSize:11,color:C.muted}}>Built by Charan Konda</p>
    </div>
  );
}

export default Onboarding;
