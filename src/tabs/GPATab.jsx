import { useState, useEffect } from "react";
import { Bar, Btn, C, Card, MED_SCHOOLS, Ring, SectionLabel, TInput, Tag, UNIVERSITIES, YEARS, getScaleMax, gpaCol, letterFromPct, pctCol, ptsFromPct } from "../core.jsx";
import { calcGPA, calcPct } from "../lib/calc.js";

function GPATab(props){
  var state=props.state,update=props.update;
  var _y=useState(state.currentYear||"Year 1"),year=_y[0],setYear=_y[1];
  var _a=useState(false),adding=_a[0],setAdding=_a[1];
  var _n=useState(""),cname=_n[0],setCname=_n[1];
  var _p=useState(""),pct=_p[0],setPct=_p[1];
  var _c=useState("3"),cred=_c[0],setCred=_c[1];
  var _sp=useState(false),showPicker=_sp[0],setShowPicker=_sp[1];
  var _us=useState(""),uniSearch=_us[0],setUniSearch=_us[1];
  // Follow the saved year if it changes on another device.
  useEffect(function(){setYear(state.currentYear||"Year 1");},[state.currentYear,setYear]);

  var uniId=state.university||"usask";
  var uni=UNIVERSITIES.filter(function(u){return u.id===uniId;})[0]||UNIVERSITIES.filter(function(u){return u.id==="usask";})[0];
  var sm=getScaleMax(uniId);
  var allCourses=[];
  YEARS.forEach(function(y){allCourses=allCourses.concat(state.courses[y]||[]);});
  var yearCourses=state.courses[year]||[];
  var oGPA=calcGPA(allCourses,uniId);
  var oPct=calcPct(allCourses);
  var yGPA=calcGPA(yearCourses,uniId);
  var yPct=calcPct(yearCourses);
  var normGPA=oGPA!=null?(oGPA/sm*4):null;
  var gc=normGPA!=null?gpaCol(normGPA):C.muted;

  function addCourse(){
    var p=Number(pct);
    if(!cname.trim()||isNaN(p)||p<0||p>100)return;
    update(function(s){
      var newCourses=Object.assign({},s.courses);
      newCourses[year]=(s.courses[year]||[]).concat([{id:Date.now(),name:cname.trim(),pct:p,credits:Number(cred)>0?Number(cred):3}]);
      return Object.assign({},s,{courses:newCourses});
    });
    setCname("");setPct("");setCred("3");setAdding(false);
  }
  function removeCourse(yr,id){
    update(function(s){
      var newCourses=Object.assign({},s.courses);
      newCourses[yr]=(s.courses[yr]||[]).filter(function(c){return c.id!==id;});
      return Object.assign({},s,{courses:newCourses});
    });
  }
  function setUniversity(id){
    update(function(s){return Object.assign({},s,{university:id});});
    setShowPicker(false);setUniSearch("");
  }
  function setCurrentYear(y){
    setYear(y);
    update(function(s){return Object.assign({},s,{currentYear:y});});
  }

  var filteredUnis=uniSearch?UNIVERSITIES.filter(function(u){return u.name.toLowerCase().indexOf(uniSearch.toLowerCase())>-1;}):UNIVERSITIES;
  var scaleLabel={"4.0":"4.0 GPA","4.33":"4.33 GPA","4.3":"4.3 GPA","12pt":"12-pt","mcgill":"% Scale"}[uni.scale]||"4.0 GPA";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>

      <button onClick={function(){setShowPicker(function(o){return !o;});}} style={{background:C.surface,border:"none",borderRadius:16,padding:"13px 16px",cursor:"pointer",fontFamily:"inherit",display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",textAlign:"left"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>🎓</span>
          <div>
            <p style={{margin:0,fontSize:10,color:C.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Your University</p>
            <p style={{margin:"2px 0 0",fontWeight:700,fontSize:14,color:C.text}}>{uni.name}</p>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <p style={{margin:0,fontSize:10,color:C.sub}}>{uni.province} · {scaleLabel}</p>
          <p style={{margin:"2px 0 0",fontSize:11,color:C.blue,fontWeight:700}}>{showPicker?"Close":"Change"}</p>
        </div>
      </button>

      {showPicker&&(
        <div style={{background:C.surface,borderRadius:16,overflow:"hidden",maxHeight:280,overflowY:"auto"}}>
          <div style={{padding:"10px 14px"}}>
            <TInput value={uniSearch} onChange={setUniSearch} placeholder="Search..."/>
          </div>
          {filteredUnis.map(function(u,i){return (
            <div key={u.id} role="button" tabIndex={0} onKeyDown={function(e){if(e.key==="Enter")setUniversity(u.id);}} onClick={function(){setUniversity(u.id);}} style={{padding:"11px 16px",cursor:"pointer",background:u.id===uniId?C.blueBg:"transparent",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <p style={{margin:0,fontWeight:u.id===uniId?700:500,fontSize:13,color:u.id===uniId?C.blue:C.text}}>{u.name}</p>
                <p style={{margin:0,fontSize:10,color:C.sub}}>{u.province}</p>
              </div>
              <Tag color={u.id===uniId?C.blue:C.sub}>{u.scale}</Tag>
            </div>
          );})}
        </div>
      )}

      <Card style={{background:"linear-gradient(160deg,#16181F,#1A2235)"}}>
        <div style={{display:"flex",alignItems:"center",gap:18}}>
          <div style={{position:"relative",width:92,height:92,flexShrink:0}}>
            <Ring size={92} stroke={9} pct={oPct||0} color={gc}/>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <p style={{margin:0,fontWeight:900,fontSize:22,color:C.text,lineHeight:1}}>{oPct!=null?oPct.toFixed(1):"—"}</p>
              <p style={{margin:0,fontSize:10,color:C.sub}}>percent</p>
            </div>
          </div>
          <div style={{flex:1}}>
            <p style={{margin:"0 0 2px",fontSize:10,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>Cumulative Average</p>
            <p style={{margin:"0 0 6px",fontWeight:800,fontSize:15,color:C.text}}>{oGPA!=null?oGPA.toFixed(2)+" / "+sm+" GPA":"No courses yet"}</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <Tag color={C.sub}>{allCourses.length} courses</Tag>
              {normGPA!=null&&<Tag color={gc}>{normGPA>=3.7?"🏆 Excellent":normGPA>=3.3?"📈 Strong":normGPA>=3.0?"✓ Passing":"⚠️ Below min"}</Tag>}
            </div>
          </div>
        </div>
      </Card>

      <Card style={{padding:"16px 18px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <span style={{fontSize:16}}>🏥</span>
          <SectionLabel m="0">Med School GPA Eligibility</SectionLabel>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {/* Built from MED_SCHOOLS so it always matches the Schools tab (the old hard-coded list had USask at 3.0 although it publishes no minimum). */}
          {MED_SCHOOLS.filter(function(s){return s.minGPA;}).map(function(s){return {n:s.short,m:s.minGPA};}).map(function(s){
            var ok=normGPA!=null&&normGPA>=s.m;
            var col=normGPA==null?C.sub:ok?C.green:C.red;
            return (
              <div key={s.n} title={"Minimum "+s.m} style={{background:normGPA==null?C.hi:ok?C.greenBg:C.redBg,borderRadius:10,padding:"5px 10px",display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:10,color:col,fontWeight:700}}>{normGPA==null?"·":ok?"✓":"✗"}</span>
                <span style={{fontSize:11,fontWeight:700,color:col}}>{s.n} <span style={{opacity:0.7,fontWeight:600}}>{s.m}</span></span>
              </div>
            );
          })}
        </div>
        {normGPA==null&&<p style={{margin:"10px 0 0",fontSize:10,color:C.sub}}>Add courses to see which minimums you meet.</p>}
        {uni.scale!=="4.0"&&<p style={{margin:"10px 0 0",fontSize:10,color:C.amber}}>⚠️ GPA normalized to 4.0 scale for comparison</p>}
      </Card>

      <div style={{display:"flex",gap:8}}>
        {YEARS.map(function(y){
          var yc=state.courses[y]||[];
          var yp=calcPct(yc);
          return (
            <button key={y} onClick={function(){setCurrentYear(y);}} style={{flex:1,border:"none",borderRadius:14,background:year===y?C.blue:C.surface,color:year===y?"#fff":C.sub,fontFamily:"inherit",fontWeight:700,fontSize:11,padding:"10px 0",cursor:"pointer"}}>
              <span style={{display:"block",fontSize:9,marginBottom:3,opacity:0.85}}>{y}</span>
              <span style={{fontSize:15,fontWeight:900}}>{yp!=null?yp.toFixed(0)+"%":"—"}</span>
            </button>
          );
        })}
      </div>

      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <p style={{margin:0,fontWeight:800,fontSize:14,color:C.text}}>{year}</p>
            <p style={{margin:0,fontSize:11,color:C.sub}}>{yearCourses.length} course{yearCourses.length!==1?"s":""}{yPct!=null?" · "+yPct.toFixed(1)+"% avg":""}{yGPA!=null?" · "+yGPA.toFixed(2)+" GPA":""}</p>
          </div>
          <Btn small variant={adding?"muted":"ghost"} onClick={function(){setAdding(function(a){return !a;});setCname("");setPct("");setCred("3");}}>{adding?"Cancel":"+ Add"}</Btn>
        </div>
        {adding&&(
          <div style={{padding:"4px 18px 16px"}}>
            <TInput value={cname} onChange={setCname} placeholder="Course name (e.g. BIOL 301)" style={{marginBottom:8}}/>
            <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
              <div style={{flex:2}}>
                <p style={{margin:"0 0 4px",fontSize:11,color:C.sub}}>% Grade</p>
                <TInput value={pct} onChange={setPct} type="number" inputMode="decimal" min={0} max={100} step="any" placeholder="85" onKeyDown={function(e){if(e.key==="Enter")addCourse();}}/>
              </div>
              <div style={{flex:1}}>
                <p style={{margin:"0 0 4px",fontSize:11,color:C.sub}}>Credits</p>
                <TInput value={cred} onChange={setCred} type="number" inputMode="decimal" min={0.5} step="any" placeholder="3" onKeyDown={function(e){if(e.key==="Enter")addCourse();}}/>
              </div>
              <Btn variant="success" onClick={addCourse} disabled={!cname.trim()||pct===""}>Save</Btn>
            </div>
            {pct!==""&&!isNaN(Number(pct))&&Number(pct)>=0&&Number(pct)<=100&&(
              <p style={{margin:"7px 0 0",fontSize:11,color:pctCol(Number(pct))}}>{Number(pct)}% → {letterFromPct(Number(pct),uniId)} ({ptsFromPct(Number(pct),uniId).toFixed(2)} pts) — {uni.short} scale</p>
            )}
          </div>
        )}
        {yearCourses.length===0&&!adding&&<p style={{margin:0,padding:"26px 18px",fontSize:13,color:C.muted,textAlign:"center"}}>No courses yet — tap + Add</p>}
        {yearCourses.map(function(c,i){
          var ltr=letterFromPct(c.pct,uniId);
          var pts=ptsFromPct(c.pct,uniId);
          var col=pctCol(c.pct);
          return (
            <div key={c.id} style={{padding:"12px 18px",background:i%2===1?C.hi:"transparent"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:0,fontWeight:700,fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</p>
                  <p style={{margin:0,fontSize:11,color:C.sub}}>{c.credits} credit{c.credits!==1?"s":""}</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                  <div style={{textAlign:"right"}}>
                    <p style={{margin:0,fontWeight:900,fontSize:20,color:col,lineHeight:1}}>{c.pct}%</p>
                    <p style={{margin:0,fontSize:10,color:C.sub}}>{ltr} · {pts.toFixed(2)}</p>
                  </div>
                  <button aria-label={"Remove "+c.name} onClick={function(){if(window.confirm("Remove "+c.name+"?"))removeCourse(year,c.id);}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:18,lineHeight:1,padding:"2px 6px"}}>×</button>
                </div>
              </div>
              <Bar pct={c.pct} color={col} h={5}/>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

export default GPATab;
