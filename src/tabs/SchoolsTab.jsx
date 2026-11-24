import { useState } from "react";
import { Bar, C, CAT_COLOR, CAT_LABEL, Card, MED_SCHOOLS, PROVINCES, TIMELINE, TInput, Tag, YEARS, getScaleMax, gpaCol } from "../core.jsx";
import { calcGPA, daysUntil, fmtDate } from "../lib/calc.js";

function SchoolsTab(props){
  var state=props.state;
  var _view=useState("schools"),view=_view[0],setView=_view[1];
  var _f=useState("All"),filter=_f[0],setFilter=_f[1];
  var _s=useState(""),search=_s[0],setSearch=_s[1];
  var _sel=useState(null),sel=_sel[0],setSel=_sel[1];
  var _q=useState("all"),quick=_q[0],setQuick=_q[1];
  var _tf=useState("all"),tFilter=_tf[0],setTFilter=_tf[1];
  var _sp=useState(false),showPast=_sp[0],setShowPast=_sp[1];

  var allCourses=[];
  YEARS.forEach(function(y){allCourses=allCourses.concat(state.courses[y]||[]);});
  var uniId=state.university||"usask";
  var sm=getScaleMax(uniId);
  var raw=calcGPA(allCourses,uniId);
  var gpa=raw!=null?(raw/sm*4):null;

  var list=MED_SCHOOLS.filter(function(s){
    if(filter!=="All"&&s.province!==filter)return false;
    if(search&&s.name.toLowerCase().indexOf(search.toLowerCase())<0&&s.short.toLowerCase().indexOf(search.toLowerCase())<0)return false;
    if(quick==="eligible"&&gpa!=null&&s.minGPA&&gpa<s.minGPA)return false;
    if(quick==="nomcat"&&s.mcat)return false;
    if(quick==="nocasper"&&s.casper)return false;
    if(quick==="oop"&&!s.oop)return false;
    return true;
  });

  var eligCount=gpa!=null?MED_SCHOOLS.filter(function(s){return !s.minGPA||gpa>=s.minGPA;}).length:null;

  var cats=["all","prep","omsas","ubc","ab","sk","mb","atlantic","qc","interview","offers"];
  var events=TIMELINE.filter(function(e){return tFilter==="all"||e.cat===tFilter;}).filter(function(e){return showPast||daysUntil(e.date)>=-7;}).sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  var upcoming=TIMELINE.filter(function(e){return daysUntil(e.date)>=0;}).sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  var next=upcoming.length?upcoming[0]:null;
  var thisMonth=TIMELINE.filter(function(e){var d=daysUntil(e.date);return d>=0&&d<=30;}).length;
  var next90=TIMELINE.filter(function(e){var d=daysUntil(e.date);return d>=0&&d<=90;}).length;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>

      {/* Sub-nav switcher */}
      <div style={{display:"flex",background:C.surface,borderRadius:14,padding:4,gap:4}}>
        <button onClick={function(){setView("schools");}} style={{flex:1,border:"none",borderRadius:11,background:view==="schools"?C.blue:"transparent",color:view==="schools"?"#fff":C.sub,fontFamily:"inherit",fontWeight:700,fontSize:13,padding:"9px 0",cursor:"pointer"}}>🏥 Schools</button>
        <button onClick={function(){setView("timeline");}} style={{flex:1,border:"none",borderRadius:11,background:view==="timeline"?C.blue:"transparent",color:view==="timeline"?"#fff":C.sub,fontFamily:"inherit",fontWeight:700,fontSize:13,padding:"9px 0",cursor:"pointer"}}>📅 Timeline</button>
      </div>

      {view==="schools"&&(
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <p style={{margin:"0 0 2px",fontSize:10,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>Your GPA (normalized)</p>
            <p style={{margin:0,fontWeight:900,fontSize:34,color:gpa!=null?gpaCol(gpa):C.muted,lineHeight:1}}>{gpa!=null?gpa.toFixed(2):"—"}<span style={{fontSize:14,fontWeight:600,color:C.sub}}> / 4.0</span></p>
          </div>
          {eligCount!=null&&<div style={{textAlign:"right"}}><p style={{margin:0,fontWeight:900,fontSize:34,color:C.green,lineHeight:1}}>{eligCount}</p><p style={{margin:0,fontSize:11,color:C.sub}}>schools eligible</p></div>}
        </div>
        {gpa!=null&&<div style={{marginTop:12}}><Bar pct={(gpa/4)*100} color={gpaCol(gpa)} h={6}/></div>}
        {gpa==null&&<p style={{margin:"8px 0 0",fontSize:11,color:C.muted}}>Add courses in GPA tab to see eligibility</p>}
      </Card>

      <TInput value={search} onChange={setSearch} placeholder="Search schools..."/>

      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
        {PROVINCES.map(function(p){return (
          <button key={p} onClick={function(){setFilter(p);}} style={{border:"none",borderRadius:20,background:filter===p?C.blueBg:C.surface,color:filter===p?C.blue:C.sub,fontFamily:"inherit",fontWeight:700,fontSize:11,padding:"6px 13px",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{p}</button>
        );})}
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {[{v:"all",l:"All"},{v:"eligible",l:"Eligible"},{v:"nomcat",l:"No MCAT"},{v:"nocasper",l:"No CASPer"},{v:"oop",l:"OOP OK"}].map(function(f){return (
          <button key={f.v} onClick={function(){setQuick(f.v);}} style={{border:"none",borderRadius:20,background:quick===f.v?C.greenBg:C.surface,color:quick===f.v?C.green:C.sub,fontFamily:"inherit",fontWeight:700,fontSize:11,padding:"6px 13px",cursor:"pointer"}}>{f.l}</button>
        );})}
      </div>

      <p style={{margin:0,fontSize:11,color:C.sub}}>{list.length} school{list.length!==1?"s":""} — tap to expand</p>

      {list.map(function(s){
        var isOpen=sel&&sel.id===s.id;
        var elig=gpa!=null&&(!s.minGPA||gpa>=s.minGPA);
        var days=daysUntil(s.deadlineISO);
        var dc=days<0?C.muted:days<=60?C.red:days<=120?C.amber:C.blue;
        return (
          <div key={s.id} role="button" tabIndex={0} aria-expanded={isOpen} onKeyDown={function(e){if(e.key==="Enter"&&e.target===e.currentTarget)setSel(isOpen?null:s);}} onClick={function(){setSel(isOpen?null:s);}} style={{background:isOpen?C.hi:C.surface,border:isOpen?"1.5px solid "+C.blue:"none",borderRadius:18,overflow:"hidden",cursor:"pointer"}}>
            <div style={{padding:"13px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1,paddingRight:8}}>
                  <div style={{display:"flex",gap:5,marginBottom:5,flexWrap:"wrap"}}>
                    <span style={{background:C.hi,borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,color:C.sub}}>{s.province}</span>
                    {gpa!=null&&<span style={{borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,background:elig?C.greenBg:C.redBg,color:elig?C.green:C.red}}>{elig?"Eligible":"Below min"}</span>}
                    {s.fr&&<span style={{background:C.amberBg,borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,color:C.amber}}>FR</span>}
                  </div>
                  <p style={{margin:0,fontWeight:800,fontSize:14,color:isOpen?C.blue:C.text}}>{s.name}</p>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <p style={{margin:0,fontWeight:900,fontSize:20,color:C.blue,lineHeight:1}}>{s.seats}</p>
                  <p style={{margin:0,fontSize:9,color:C.sub}}>seats</p>
                </div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {s.minGPA&&<Tag color={C.blue}>Min {s.minGPA}</Tag>}
                {s.avgGPA&&<Tag color={C.green}>Avg {s.avgGPA}</Tag>}
                <Tag color={s.mcat?C.purple:C.amber}>{s.mcat?"MCAT":"No MCAT"}</Tag>
                <Tag color={s.casper?C.red:C.green}>{s.casper?"CASPer":"No CASPer"}</Tag>
                <Tag color={dc}>{days<0?"Closed · "+s.deadline:s.deadline}</Tag>
              </div>
            </div>
            {isOpen&&(
              <div style={{padding:"14px 16px",background:C.bg}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
                  {[
                    {l:"Min GPA",v:s.minGPA||"None",c:gpa!=null&&s.minGPA?elig?C.green:C.red:C.sub},
                    {l:"Avg GPA",v:s.avgGPA||"N/A",c:C.blue},
                    {l:"Avg MCAT",v:s.avgMCAT||"N/A",c:C.purple},
                    {l:"Seats",v:s.seats,c:C.amber},
                    {l:"Interview",v:s.interview,c:C.text},
                    {l:days<0?"Deadline (passed)":"Deadline",v:s.deadline.split(",")[0],c:dc}
                  ].map(function(x){return (
                    <div key={x.l} style={{background:C.surface,borderRadius:12,padding:"9px 8px",textAlign:"center"}}>
                      <p style={{margin:0,fontWeight:800,fontSize:12,color:x.c,lineHeight:1.3}}>{x.v}</p>
                      <p style={{margin:"3px 0 0",fontSize:9,color:C.muted}}>{x.l}</p>
                    </div>
                  );})}
                </div>
                <div style={{marginBottom:12}}>
                  <p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,color:C.mid}}>Prerequisites</p>
                  <div style={{background:C.surface,borderRadius:12,padding:"10px 12px"}}>
                    {s.prereqs.map(function(p,i){return (
                      <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",paddingBottom:i<s.prereqs.length-1?6:0,marginBottom:i<s.prereqs.length-1?6:0}}>
                        <span style={{color:C.blue,fontSize:12,flexShrink:0,marginTop:1}}>—</span>
                        <p style={{margin:0,fontSize:12,color:C.mid,lineHeight:1.5}}>{p}</p>
                      </div>
                    );})}
                  </div>
                </div>
                <div style={{background:C.purpleBg,borderRadius:12,padding:"10px 12px",marginBottom:10}}>
                  <p style={{margin:"0 0 3px",fontSize:10,fontWeight:700,color:C.purple}}>Test Requirements</p>
                  <p style={{margin:0,fontSize:12,color:C.mid,lineHeight:1.6}}>{s.testNote}</p>
                </div>
                <div style={{background:C.blueBg,borderRadius:12,padding:"10px 12px",marginBottom:10}}>
                  <p style={{margin:"0 0 3px",fontSize:10,fontWeight:700,color:C.blue}}>Key Info</p>
                  <p style={{margin:0,fontSize:12,color:C.mid,lineHeight:1.6}}>{s.notes}</p>
                </div>
                {gpa!=null&&s.minGPA&&(
                  <div style={{background:elig?C.greenBg:C.redBg,borderRadius:12,padding:"9px 12px",marginBottom:10}}>
                    <p style={{margin:0,fontSize:12,fontWeight:700,color:elig?C.green:C.red}}>
                      {elig?"Your GPA ("+gpa.toFixed(2)+") is "+(gpa-s.minGPA).toFixed(2)+" above the "+s.minGPA+" minimum":"You need "+(s.minGPA-gpa).toFixed(2)+" more GPA points to reach the "+s.minGPA+" minimum"}
                    </p>
                  </div>
                )}
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                  <Tag color={s.mcat?C.purple:C.green}>{s.mcat?"MCAT Required":"No MCAT"}</Tag>
                  <Tag color={s.casper?C.red:C.green}>{s.casper?"CASPer Required":"No CASPer"}</Tag>
                  <Tag color={s.oop?C.blue:C.amber}>{s.oop?"OOP Accepted":"In-Province Only"}</Tag>
                </div>
                <a href={s.url} target="_blank" rel="noopener noreferrer" onClick={function(e){e.stopPropagation();}} style={{display:"block",textAlign:"center",padding:"12px",background:C.blueBg,borderRadius:12,color:C.blue,fontSize:13,fontWeight:700,textDecoration:"none"}}>
                  Official Website
                </a>
              </div>
            )}
          </div>
        );
      })}
      {list.length===0&&<Card style={{textAlign:"center",padding:"28px"}}><p style={{margin:0,fontSize:13,color:C.muted}}>No schools match filters</p></Card>}
      <p style={{margin:"4px 0 8px",textAlign:"center",fontSize:10,color:C.muted}}>All dates verified June 2026 — confirm on official websites</p>
      </div>
      )}

      {view==="timeline"&&(
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {!next&&(
        <Card>
          <p style={{margin:"0 0 4px",fontWeight:800,fontSize:15,color:C.text}}>This cycle's dates have all passed</p>
          <p style={{margin:0,fontSize:12,color:C.sub}}>Tap "Show past" to review them. Check each school's website for the next cycle.</p>
        </Card>
      )}
      {next&&(
        <Card>
          <p style={{margin:"0 0 4px",fontSize:10,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>Next Deadline</p>
          <p style={{margin:"0 0 2px",fontWeight:800,fontSize:16,color:C.text}}>{next.title}</p>
          <p style={{margin:"0 0 10px",fontSize:12,color:C.sub}}>{next.school} — {fmtDate(next.date)}</p>
          <div style={{display:"flex",alignItems:"flex-end",gap:6}}>
            <p style={{margin:0,fontWeight:900,fontSize:40,color:daysUntil(next.date)<=14?C.red:daysUntil(next.date)<=60?C.amber:C.blue,lineHeight:1}}>{daysUntil(next.date)}</p>
            <p style={{margin:"0 0 4px",fontSize:14,color:C.sub}}>{daysUntil(next.date)===0?"today":daysUntil(next.date)===1?"day away":"days away"}</p>
          </div>
        </Card>
      )}

      <div style={{display:"flex",gap:8}}>
        {[{l:"This month",v:thisMonth,c:C.red},{l:"Next 90 days",v:next90,c:C.amber},{l:"Total events",v:TIMELINE.length,c:C.blue}].map(function(x){return (
          <div key={x.l} style={{flex:1,background:C.surface,borderRadius:12,padding:"10px 12px"}}>
            <p style={{margin:0,fontWeight:800,fontSize:22,color:x.c}}>{x.v}</p>
            <p style={{margin:0,fontSize:10,color:C.sub}}>{x.l}</p>
          </div>
        );})}
      </div>

      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
        {cats.map(function(cat){
          var col=CAT_COLOR[cat]||C.blue;
          return (
            <button key={cat} onClick={function(){setTFilter(cat);}} style={{border:"none",borderRadius:20,background:tFilter===cat?col+"22":C.surface,color:tFilter===cat?col:C.sub,fontFamily:"inherit",fontWeight:700,fontSize:11,padding:"6px 12px",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
              {cat==="all"?"All":CAT_LABEL[cat]}
            </button>
          );
        })}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <p style={{margin:0,fontSize:11,color:C.sub}}>{events.length} events — 2026/2027 cycle</p>
        <button onClick={function(){setShowPast(function(p){return !p;});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:C.blue,fontFamily:"inherit",fontWeight:600}}>{showPast?"Hide past":"Show past"}</button>
      </div>

      {events.map(function(e,i){
        var status=daysUntil(e.date)<0?"past":daysUntil(e.date)<=14?"urgent":daysUntil(e.date)<=60?"soon":"upcoming";
        var statusColor=status==="past"?C.muted:status==="urgent"?C.red:status==="soon"?C.amber:C.blue;
        var catCol=CAT_COLOR[e.cat]||C.blue;
        var days=daysUntil(e.date);
        return (
          <div key={e.id} style={{display:"flex",gap:10}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
              <div style={{width:11,height:11,borderRadius:"50%",background:status==="past"?C.border:catCol,marginTop:5,flexShrink:0}}/>
              {i<events.length-1&&<div style={{width:1,flex:1,background:C.border,marginTop:3,minHeight:16}}/>}
            </div>
            <div style={{flex:1,background:C.surface,borderRadius:16,padding:"12px 16px",marginBottom:4,opacity:status==="past"?0.45:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                <div style={{flex:1,paddingRight:8}}>
                  <p style={{margin:"0 0 4px",fontWeight:700,fontSize:13,color:status==="past"?C.sub:C.text}}>{e.title}</p>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    <span style={{background:catCol+"22",color:catCol,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>{CAT_LABEL[e.cat]}</span>
                    <span style={{background:C.hi,color:C.sub,fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20}}>{e.school}</span>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <p style={{margin:0,fontWeight:700,fontSize:11,color:statusColor}}>{fmtDate(e.date)}</p>
                  <p style={{margin:0,fontSize:10,color:statusColor,fontWeight:600}}>{status==="past"?Math.abs(days)+"d ago":days===0?"Today!":days===1?"Tomorrow":days+"d"}</p>
                </div>
              </div>
              <p style={{margin:0,fontSize:11,color:C.sub,lineHeight:1.6}}>{e.desc}</p>
            </div>
          </div>
        );
      })}
      <p style={{margin:"4px 0 8px",textAlign:"center",fontSize:10,color:C.muted}}>2026-2027 cycle — For Fall 2027 admission — Verify on official websites</p>
      </div>
      )}

    </div>
  );
}

export default SchoolsTab;
