import { useState } from "react";
import { AAMC_EXAMS, Bar, Btn, C, Card, Ring, SECS, SectionLabel, TArea, TInput, Tag, sectionPercentile, totalPercentile } from "../core.jsx";

function MCATTab(props){
  var state=props.state,update=props.update;
  var exams=state.exams||{};
  var _open=useState(null),openId=_open[0],setOpenId=_open[1];

  function saveExam(id,data){
    update(function(s){
      var newExams=Object.assign({},s.exams);
      newExams[id]=data;
      return Object.assign({},s,{exams:newExams});
    });
  }

  // Ignore exams saved by older versions with blank sections.
  function hasScores(d){return d&&d.completed&&SECS.every(function(s){var v=Number(d[s.key]);return v>=118&&v<=132;});}
  var scored=AAMC_EXAMS.filter(function(e){return e.scored&&hasScores(exams[e.id]);});
  var best=null;
  if(scored.length){
    best=scored.reduce(function(b,e){
      var t=SECS.reduce(function(a,s){return a+Number(exams[e.id][s.key]||0);},0);
      var bt=SECS.reduce(function(a,s){return a+Number(exams[b.id][s.key]||0);},0);
      return t>bt?e:b;
    },scored[0]);
  }
  var bestD=best?exams[best.id]:null;
  var bestT=bestD?SECS.reduce(function(a,s){return a+Number(bestD[s.key]||0);},0):null;

  // Weakest section across all completed exams (for "Areas to Improve" summary)
  var sectionAvg={};
  SECS.forEach(function(s){
    var vals=scored.map(function(e){return Number(exams[e.id][s.key]||0);}).filter(function(v){return v>0;});
    sectionAvg[s.key]=vals.length?(vals.reduce(function(a,b){return a+b;},0)/vals.length):null;
  });
  var weakest=null;
  SECS.forEach(function(s){
    if(sectionAvg[s.key]!=null&&(weakest==null||sectionAvg[s.key]<sectionAvg[weakest.key]))weakest=s;
  });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>

      {bestT?(
        <Card style={{background:"linear-gradient(160deg,#16181F,#1A1530)"}}>
          <div style={{display:"flex",alignItems:"center",gap:18}}>
            <div style={{position:"relative",width:88,height:88,flexShrink:0}}>
              <Ring size={88} stroke={8} pct={(bestT/528)*100} color={bestT>=510?C.green:bestT>=500?C.amber:C.red}/>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <p style={{margin:0,fontWeight:900,fontSize:22,color:C.text,lineHeight:1}}>{bestT}</p>
                <p style={{margin:0,fontSize:9,color:C.sub}}>/ 528</p>
              </div>
            </div>
            <div style={{flex:1}}>
              <p style={{margin:"0 0 2px",fontSize:10,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>Best Score</p>
              <p style={{margin:"0 0 6px",fontWeight:800,fontSize:15,color:C.text}}>{best.label}</p>
              <Tag color={C.purple}>{totalPercentile(bestT)}th percentile</Tag>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:16}}>
            {SECS.map(function(s){
              var v=Number(bestD[s.key]||0);
              var col=v>=s.target?C.green:v>=s.target-2?C.amber:C.red;
              return (
                <div key={s.key} style={{flex:1,background:C.surface,borderRadius:12,padding:"8px 6px",textAlign:"center"}}>
                  <p style={{margin:"0 0 2px",fontSize:13}}>{s.emoji}</p>
                  <p style={{margin:0,fontWeight:800,fontSize:16,color:col,lineHeight:1}}>{v}</p>
                  <p style={{margin:0,fontSize:9,color:C.muted}}>{s.short}</p>
                </div>
              );
            })}
          </div>
        </Card>
      ):(
        <Card style={{textAlign:"center",padding:"30px 20px"}}>
          <p style={{margin:"0 0 6px",fontSize:30}}>🧬</p>
          <p style={{margin:"0 0 4px",fontWeight:800,fontSize:15,color:C.text}}>No exams logged yet</p>
          <p style={{margin:0,fontSize:12,color:C.sub}}>Start with the free Sample Test or FL1</p>
        </Card>
      )}

      {weakest&&scored.length>1&&(
        <Card style={{background:C.amberBg}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>🎯</span>
            <div>
              <p style={{margin:0,fontWeight:800,fontSize:13,color:C.text}}>Focus area: {weakest.full}</p>
              <p style={{margin:0,fontSize:11,color:C.sub}}>Averaging {sectionAvg[weakest.key].toFixed(1)} across your exams — your lowest section</p>
            </div>
          </div>
        </Card>
      )}

      <SectionLabel>All Exams</SectionLabel>
      {AAMC_EXAMS.map(function(exam){
        var saved=exams[exam.id];
        var isOpen=openId===exam.id;
        return <ExamCard key={exam.id+":"+((saved&&saved.savedAt)||0)} exam={exam} saved={saved} isOpen={isOpen} onToggle={function(){setOpenId(isOpen?null:exam.id);}} onSave={saveExam}/>;
      })}
    </div>
  );
}

function ExamCard(props){
  var exam=props.exam,saved=props.saved,isOpen=props.isOpen;
  var _sc=useState(Object.assign({cp:"",cars:"",bb:"",ps:""},saved||{})),scores=_sc[0],setScores=_sc[1];
  var _n=useState(saved&&saved.notes?saved.notes:""),notes=_n[0],setNotes=_n[1];
  // concepts: {cp:[{id,text}], cars:[...], bb:[...], ps:[...]}
  var _cc=useState((saved&&saved.concepts)?saved.concepts:{cp:[],cars:[],bb:[],ps:[]}),concepts=_cc[0],setConcepts=_cc[1];
  var _ci=useState({cp:"",cars:"",bb:"",ps:""}),conceptInput=_ci[0],setConceptInput=_ci[1];

  // Each MCAT section is scored 118-132. Blank or out-of-range scores used to be saved
  // (Save Notes marked the exam "completed" with empty scores, which counted as a 0).
  function validSec(raw){var v=Number(raw);return raw!==""&&raw!=null&&!isNaN(v)&&v>=118&&v<=132;}
  var allValid=SECS.every(function(s){return validSec(scores[s.key]);});
  var total=allValid?SECS.reduce(function(a,s){return a+Number(scores[s.key]);},0):null;
  var savedT=exam.scored&&saved&&saved.completed&&SECS.every(function(s){var v=Number(saved[s.key]);return v>=118&&v<=132;})?SECS.reduce(function(a,s){return a+Number(saved[s.key]||0);},0):null;
  var tc=savedT?(savedT>=510?C.green:savedT>=500?C.amber:C.red):C.muted;

  // Areas to improve: sections below target, sorted weakest first
  var weakSections=[];
  if(savedT&&saved){
    SECS.forEach(function(s){
      var v=Number(saved[s.key]||0);
      if(v<s.target)weakSections.push({sec:s,val:v,gap:s.target-v});
    });
    weakSections.sort(function(a,b){return b.gap-a.gap;});
  }

  function addConcept(secKey){
    var text=conceptInput[secKey].trim();
    if(!text)return;
    setConcepts(function(p){
      var n=Object.assign({},p);
      n[secKey]=(n[secKey]||[]).concat([{id:Date.now(),text:text,done:false}]);
      return n;
    });
    setConceptInput(function(p){var n=Object.assign({},p);n[secKey]="";return n;});
  }
  function toggleConcept(secKey,id){
    setConcepts(function(p){
      var n=Object.assign({},p);
      n[secKey]=(n[secKey]||[]).map(function(c){return c.id===id?Object.assign({},c,{done:!c.done}):c;});
      return n;
    });
  }
  function removeConcept(secKey,id){
    setConcepts(function(p){
      var n=Object.assign({},p);
      n[secKey]=(n[secKey]||[]).filter(function(c){return c.id!==id;});
      return n;
    });
  }
  function saveAll(){
    props.onSave(exam.id,Object.assign({},scores,{notes:notes,concepts:concepts,completed:allValid,savedAt:Date.now()}));
  }

  var totalConceptCount=Object.keys(concepts).reduce(function(a,k){return a+(concepts[k]||[]).length;},0);
  var doneConceptCount=Object.keys(concepts).reduce(function(a,k){return a+(concepts[k]||[]).filter(function(c){return c.done;}).length;},0);

  return (
    <div style={{background:isOpen?C.hi:C.surface,borderRadius:18,overflow:"hidden",border:saved&&saved.completed?"1.5px solid "+(savedT==null?C.cyan:savedT>=510?C.green:savedT>=500?C.amber:C.red)+"40":"1.5px solid transparent"}}>
      <div role="button" tabIndex={0} aria-expanded={isOpen} onKeyDown={function(e){if(e.key==="Enter")props.onToggle();}} onClick={props.onToggle} style={{padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:22}}>{exam.emoji}</span>
          <div>
            <p style={{margin:"0 0 3px",fontWeight:700,fontSize:14,color:C.text}}>{exam.label}</p>
            <div style={{display:"flex",gap:5}}>
              {exam.free&&<Tag color={C.green}>Free</Tag>}
              {!exam.scored&&<Tag color={C.amber}>Unscored</Tag>}
              {saved&&saved.completed&&<Tag color={C.cyan}>Logged</Tag>}
              {totalConceptCount>0&&<Tag color={C.purple}>{doneConceptCount}/{totalConceptCount} reviewed</Tag>}
            </div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          {savedT!=null?(<div><p style={{margin:0,fontWeight:900,fontSize:24,color:tc,lineHeight:1}}>{savedT}</p><p style={{margin:0,fontSize:9,color:C.sub}}>{totalPercentile(savedT)}th %ile</p></div>):<p style={{margin:0,fontSize:12,color:C.muted}}>{saved?"Saved":"Not started"}</p>}
        </div>
      </div>
      {isOpen&&(
        <div style={{padding:"4px 18px 18px"}}>
          {exam.scored?(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {SECS.map(function(s){
                  var raw=scores[s.key];
                  var v=Number(raw);
                  var valid=validSec(raw);
                  var col=valid?(v>=s.target?C.green:v>=s.target-2?C.amber:C.red):(raw!==""&&raw!=null?C.red:C.muted);
                  return (
                    <div key={s.key} style={{background:C.bg,borderRadius:14,padding:"10px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
                        <span style={{fontSize:13}}>{s.emoji}</span>
                        <p style={{margin:0,fontSize:11,color:C.sub,fontWeight:600}}>{s.short}</p>
                      </div>
                      <TInput value={raw} onChange={function(val){setScores(function(p){var n=Object.assign({},p);n[s.key]=val;return n;});}} type="number" inputMode="numeric" min={118} max={132} aria-label={s.full+" score"} placeholder="118-132" style={{fontSize:20,fontWeight:800,color:col,textAlign:"center",padding:"8px 6px",background:C.surface}}/>
                    </div>
                  );
                })}
              </div>
              {total&&(
                <div style={{background:C.bg,borderRadius:14,padding:"12px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <p style={{margin:0,fontSize:12,color:C.sub,fontWeight:600}}>Total Score</p>
                  <p style={{margin:0,fontWeight:900,fontSize:22,color:total>=510?C.green:total>=500?C.amber:C.red}}>{total} <span style={{fontSize:12,color:C.sub,fontWeight:600}}>/ 528 · {totalPercentile(total)}th %ile</span></p>
                </div>
              )}
              {!allValid&&SECS.some(function(s){return scores[s.key]!==""&&scores[s.key]!=null;})&&<p style={{margin:"0 0 8px",fontSize:11,color:C.amber}}>Each section must be between 118 and 132.</p>}
              <Btn full variant="success" onClick={saveAll} disabled={!allValid}>Save Score</Btn>

              {weakSections.length>0&&(
                <div style={{marginTop:16}}>
                  <p style={{margin:"0 0 4px",fontSize:12,fontWeight:800,color:C.text}}>📌 Areas to Improve</p>
                  <p style={{margin:"0 0 10px",fontSize:10,color:C.sub}}>Sections below your 128 target, weakest first</p>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {weakSections.map(function(w){
                      var pct=sectionPercentile(w.val);
                      return (
                        <div key={w.sec.key} style={{background:C.bg,borderRadius:12,padding:"10px 12px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:13}}>{w.sec.emoji}</span>
                              <p style={{margin:0,fontSize:12,fontWeight:700,color:C.text}}>{w.sec.full}</p>
                            </div>
                            <p style={{margin:0,fontSize:11,fontWeight:700,color:C.amber}}>{w.val} / {w.sec.target}</p>
                          </div>
                          <Bar pct={(w.val-118)/(132-118)*100} color={C.amber} h={5}/>
                          <p style={{margin:"6px 0 10px",fontSize:10,color:C.sub}}>{pct}th percentile · {w.gap} points below target</p>

                          {/* AAMC-style concept jot list */}
                          <div style={{borderTop:"none",paddingTop:2}}>
                            {(concepts[w.sec.key]||[]).map(function(c){return (
                              <div key={c.id} onClick={function(){toggleConcept(w.sec.key,c.id);}} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"6px 0",cursor:"pointer"}}>
                                <span style={{fontSize:14,marginTop:-1,color:c.done?C.green:C.muted,flexShrink:0}}>{c.done?"✓":"○"}</span>
                                <p style={{margin:0,fontSize:12,color:c.done?C.sub:C.mid,textDecoration:c.done?"line-through":"none",flex:1,lineHeight:1.5}}>{c.text}</p>
                                <button aria-label="Remove note" onClick={function(ev){ev.stopPropagation();removeConcept(w.sec.key,c.id);}} style={{background:"none",border:"none",color:C.muted,fontSize:14,cursor:"pointer",padding:"0 2px",flexShrink:0}}>×</button>
                              </div>
                            );})}
                            <div style={{display:"flex",gap:6,marginTop:6}}>
                              <TInput value={conceptInput[w.sec.key]} onChange={function(val){setConceptInput(function(p){var n=Object.assign({},p);n[w.sec.key]=val;return n;});}} placeholder="e.g. Passage 6 Q4 — acid-base equilibrium" onKeyDown={function(e){if(e.key==="Enter")addConcept(w.sec.key);}} style={{fontSize:12,padding:"8px 10px",background:C.surface}}/>
                              <button aria-label="Add note" onClick={function(){addConcept(w.sec.key);}} style={{border:"none",borderRadius:10,background:C.purpleBg,color:C.purple,fontWeight:800,fontSize:16,width:36,flexShrink:0,cursor:"pointer"}}>+</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Btn full variant="ghost" small style={{marginTop:10}} onClick={saveAll}>Save Concepts</Btn>
                </div>
              )}

              <div style={{marginTop:14}}>
                <p style={{margin:"0 0 6px",fontSize:11,color:C.sub,fontWeight:600}}>Notes</p>
                <TArea value={notes} onChange={setNotes} placeholder="What went well? What would you do differently?" rows={2}/>
                <Btn full variant="ghost" small style={{marginTop:8}} onClick={saveAll}>Save Notes</Btn>
              </div>
            </div>
          ):(
            <div>
              <TArea value={notes} onChange={setNotes} placeholder="Notes on your performance..."/>
              <Btn full variant="success" style={{marginTop:10}} onClick={function(){props.onSave(exam.id,{notes:notes,completed:true,savedAt:Date.now()});}}>Save Notes</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MCATTab;
