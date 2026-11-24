// ── COLOURS ──────────────────────────────────────────────────────────────────
var C={
  bg:"#0B0C10",surface:"#16181F",hi:"#1E212B",border:"#272B36",
  blue:"#0A84FF",blueBg:"#0A2540",
  green:"#30D158",greenBg:"#0B2818",
  amber:"#FF9F0A",amberBg:"#2E1B05",
  red:"#FF375F",redBg:"#330014",
  purple:"#BF5AF2",purpleBg:"#23103A",
  pink:"#FF2D55",pinkBg:"#330016",
  cyan:"#64D2FF",cyanBg:"#06303D",
  text:"#FFFFFF",mid:"#C7C9D1",sub:"#8E8E96",muted:"#54545C"
};

// ── GRADING SCALES ───────────────────────────────────────────────────────────
var SCALES={
  "4.0":[
    {letter:"A+",pts:4.0,lo:90,hi:100},{letter:"A",pts:4.0,lo:85,hi:89},
    {letter:"A-",pts:3.7,lo:80,hi:84},{letter:"B+",pts:3.3,lo:77,hi:79},
    {letter:"B",pts:3.0,lo:73,hi:76},{letter:"B-",pts:2.7,lo:70,hi:72},
    {letter:"C+",pts:2.3,lo:67,hi:69},{letter:"C",pts:2.0,lo:63,hi:66},
    {letter:"C-",pts:1.7,lo:60,hi:62},{letter:"D",pts:1.0,lo:50,hi:59},
    {letter:"F",pts:0.0,lo:0,hi:49}
  ],
  "4.33":[
    {letter:"A+",pts:4.33,lo:90,hi:100},{letter:"A",pts:4.0,lo:85,hi:89},
    {letter:"A-",pts:3.67,lo:80,hi:84},{letter:"B+",pts:3.33,lo:76,hi:79},
    {letter:"B",pts:3.0,lo:72,hi:75},{letter:"B-",pts:2.67,lo:68,hi:71},
    {letter:"C+",pts:2.33,lo:64,hi:67},{letter:"C",pts:2.0,lo:60,hi:63},
    {letter:"C-",pts:1.67,lo:55,hi:59},{letter:"D",pts:1.0,lo:50,hi:54},
    {letter:"F",pts:0.0,lo:0,hi:49}
  ],
  "4.3":[
    {letter:"A+",pts:4.3,lo:90,hi:100},{letter:"A",pts:4.0,lo:85,hi:89},
    {letter:"A-",pts:3.7,lo:80,hi:84},{letter:"B+",pts:3.3,lo:77,hi:79},
    {letter:"B",pts:3.0,lo:73,hi:76},{letter:"B-",pts:2.7,lo:70,hi:72},
    {letter:"C+",pts:2.3,lo:67,hi:69},{letter:"C",pts:2.0,lo:63,hi:66},
    {letter:"C-",pts:1.7,lo:60,hi:62},{letter:"D",pts:1.0,lo:50,hi:59},
    {letter:"F",pts:0.0,lo:0,hi:49}
  ],
  "12pt":[
    {letter:"A+",pts:12,lo:90,hi:100},{letter:"A",pts:11,lo:85,hi:89},
    {letter:"A-",pts:10,lo:80,hi:84},{letter:"B+",pts:9,lo:77,hi:79},
    {letter:"B",pts:8,lo:73,hi:76},{letter:"B-",pts:7,lo:70,hi:72},
    {letter:"C+",pts:6,lo:67,hi:69},{letter:"C",pts:5,lo:63,hi:66},
    {letter:"C-",pts:4,lo:60,hi:62},{letter:"D",pts:2,lo:50,hi:59},
    {letter:"F",pts:0,lo:0,hi:49}
  ],
  "mcgill":[
    {letter:"A",pts:4.0,lo:85,hi:100},{letter:"A-",pts:3.7,lo:80,hi:84},
    {letter:"B+",pts:3.3,lo:75,hi:79},{letter:"B",pts:3.0,lo:70,hi:74},
    {letter:"B-",pts:2.7,lo:65,hi:69},{letter:"C+",pts:2.3,lo:60,hi:64},
    {letter:"C",pts:2.0,lo:55,hi:59},{letter:"D",pts:1.0,lo:50,hi:54},
    {letter:"F",pts:0.0,lo:0,hi:49}
  ]
};
var SCALE_MAX={"4.0":4.0,"4.33":4.33,"4.3":4.3,"12pt":12.0,"mcgill":4.0};

function getScale(uid){
  var u=UNIVERSITIES.filter(function(x){return x.id===uid;})[0];
  if(!u)u=UNIVERSITIES.filter(function(x){return x.id==="usask";})[0];
  return SCALES[u.scale];
}
function getScaleMax(uid){
  var u=UNIVERSITIES.filter(function(x){return x.id===uid;})[0];
  if(!u)u=UNIVERSITIES.filter(function(x){return x.id==="usask";})[0];
  return SCALE_MAX[u.scale];
}
// Scales are listed highest band first; pick the first band whose lower bound we reach.
// (Matching lo<=p<=hi left gaps for decimals: 89.5% fell between A and A+ and became an F.)
function gradeFor(scale,p){
  for(var i=0;i<scale.length;i++){if(p>=scale[i].lo)return scale[i];}
  return scale[scale.length-1];
}
function letterFromPct(p,uid){
  var scale=getScale(uid||"usask");
  var found=gradeFor(scale,p);
  return found?found.letter:"F";
}
function ptsFromPct(p,uid){
  var scale=getScale(uid||"usask");
  var found=gradeFor(scale,p);
  return found?found.pts:0;
}
function pctCol(p){return p>=80?C.green:p>=65?C.amber:C.red;}
function gpaCol(g){return g>=3.7?C.green:g>=3.0?C.amber:C.red;}

// ── UNIVERSITIES ─────────────────────────────────────────────────────────────
var UNIVERSITIES=[
  {id:"uoft",name:"University of Toronto",short:"U of T",province:"ON",scale:"4.0"},
  {id:"western",name:"Western University",short:"Western",province:"ON",scale:"4.0"},
  {id:"queens",name:"Queen's University",short:"Queen's",province:"ON",scale:"4.3"},
  {id:"mcmaster",name:"McMaster University",short:"McMaster",province:"ON",scale:"12pt"},
  {id:"ottawa",name:"University of Ottawa",short:"Ottawa",province:"ON",scale:"4.0"},
  {id:"waterloo",name:"University of Waterloo",short:"Waterloo",province:"ON",scale:"4.0"},
  {id:"york",name:"York University",short:"York",province:"ON",scale:"4.0"},
  {id:"tmu",name:"Toronto Metropolitan University",short:"TMU",province:"ON",scale:"4.0"},
  {id:"guelph",name:"University of Guelph",short:"Guelph",province:"ON",scale:"4.0"},
  {id:"mcgill",name:"McGill University",short:"McGill",province:"QC",scale:"mcgill"},
  {id:"concordia",name:"Concordia University",short:"Concordia",province:"QC",scale:"4.3"},
  {id:"udem",name:"Universite de Montreal",short:"UdeM",province:"QC",scale:"4.3"},
  {id:"ubc",name:"University of British Columbia",short:"UBC",province:"BC",scale:"4.33"},
  {id:"sfu",name:"Simon Fraser University",short:"SFU",province:"BC",scale:"4.33"},
  {id:"uvic",name:"University of Victoria",short:"UVic",province:"BC",scale:"4.33"},
  {id:"ualberta",name:"University of Alberta",short:"U of A",province:"AB",scale:"4.0"},
  {id:"ucalgary",name:"University of Calgary",short:"UCalgary",province:"AB",scale:"4.0"},
  {id:"usask",name:"University of Saskatchewan",short:"USask",province:"SK",scale:"4.0"},
  {id:"uregina",name:"University of Regina",short:"URegina",province:"SK",scale:"4.0"},
  {id:"umanitoba",name:"University of Manitoba",short:"UManitoba",province:"MB",scale:"4.0"},
  {id:"dal",name:"Dalhousie University",short:"Dal",province:"NS",scale:"4.3"},
  {id:"memorial",name:"Memorial University",short:"MUN",province:"NL",scale:"4.3"},
  {id:"unb",name:"University of New Brunswick",short:"UNB",province:"NB",scale:"4.3"},
  {id:"upei",name:"University of PEI",short:"UPEI",province:"PE",scale:"4.3"},
  {id:"other",name:"Other University",short:"Other",province:"--",scale:"4.0"}
];

// ── MED SCHOOLS ───────────────────────────────────────────────────────────────
var MED_SCHOOLS=[
  {id:"uoft",name:"University of Toronto",short:"U of T",province:"ON",
   minGPA:3.6,avgGPA:3.95,avgMCAT:521,seats:305,mcat:true,casper:true,interview:"MMI",
   system:"OMSAS",deadline:"Oct 1, 2026",deadlineISO:"2026-10-01",oop:true,fr:false,
   prereqs:["No specific prerequisites - any undergraduate degree"],
   testNote:"No published MCAT cutoff. Avg admitted 521. Scores to OMSAS by Oct 21.",
   notes:"305 seats. St. George 244, Mississauga 59. 95% Ontario residents per 2026 law.",
   url:"https://applymd.utoronto.ca/apply"},
  {id:"western",name:"Western University (Schulich)",short:"Western",province:"ON",
   minGPA:3.7,avgGPA:3.93,avgMCAT:516,seats:171,mcat:true,casper:true,interview:"MMI",
   system:"OMSAS",deadline:"Oct 1, 2026",deadlineISO:"2026-10-01",oop:true,fr:false,
   prereqs:["No specific prerequisites - any undergraduate degree"],
   testNote:"CARS weighted heavily. Scores to OMSAS by Oct 21.",
   notes:"Includes Windsor campus. 95% Ontario residents per 2026 law.",
   url:"https://www.schulich.uwo.ca/med_dent_admissions/medicine/index.html"},
  {id:"queens",name:"Queen's University",short:"Queen's",province:"ON",
   minGPA:3.0,avgGPA:3.88,avgMCAT:515,seats:140,mcat:true,casper:true,interview:"MMI + Panel",
   system:"OMSAS",deadline:"Oct 1, 2026",deadlineISO:"2026-10-01",oop:true,fr:false,
   prereqs:["Minimum 15 full courses of undergraduate study"],
   testNote:"Used as cutoff screen. Must be within 5 years of deadline.",
   notes:"20 seats for MD-Family Medicine. Up to 6 MMTP seats.",
   url:"https://meds.queensu.ca/academics/mdprogram/admissions"},
  {id:"mcmaster",name:"McMaster University (DeGroote)",short:"McMaster",province:"ON",
   minGPA:3.0,avgGPA:3.95,avgMCAT:null,seats:217,mcat:true,casper:true,interview:"MMI",
   system:"OMSAS",deadline:"Oct 1, 2026",deadlineISO:"2026-10-01",oop:false,fr:false,
   prereqs:["Any discipline - minimum 3 years undergraduate"],
   testNote:"ONLY CARS section used. Min CARS 125, 127+ competitive. C/P, B/B, P/S ignored.",
   notes:"3-year program. Ontario residents ONLY. Pre-interview = 32% GPA + 32% CARS + 36% CASPer.",
   url:"https://mdprogram.mcmaster.ca"},
  {id:"ottawa",name:"University of Ottawa",short:"Ottawa",province:"ON",
   minGPA:3.5,avgGPA:3.93,avgMCAT:null,seats:183,mcat:false,casper:true,interview:"Panel",
   system:"OMSAS",deadline:"Oct 1, 2026",deadlineISO:"2026-10-01",oop:true,fr:true,
   prereqs:["Biology 6cu with lab","Chemistry 3cu with lab","Organic Chemistry 3cu","Biochemistry 3cu","Statistics 3cu","Humanities or Social Sciences 6cu"],
   testNote:"MCAT NOT required or considered.",
   notes:"128 English + 55 French seats. Prereqs need min 3.0/4.0.",
   url:"https://med.uottawa.ca"},
  {id:"nosm",name:"NOSM University",short:"NOSM",province:"ON",
   minGPA:3.0,avgGPA:null,avgMCAT:null,seats:88,mcat:false,casper:false,interview:"MMI",
   system:"OMSAS",deadline:"Oct 1, 2026",deadlineISO:"2026-10-01",oop:false,fr:true,
   prereqs:["Any undergraduate - minimum 4-year degree"],
   testNote:"MCAT NOT required. No CASPer - uses Community Context Score.",
   notes:"Mission-driven for rural, Northern, Indigenous Ontario. Essentially in-province only.",
   url:"https://www.nosm.ca"},
  {id:"tmu",name:"Toronto Metropolitan University",short:"TMU",province:"ON",
   minGPA:3.0,avgGPA:null,avgMCAT:null,seats:75,mcat:true,casper:true,interview:"MMI",
   system:"OMSAS",deadline:"Oct 1, 2026",deadlineISO:"2026-10-01",oop:false,fr:false,
   prereqs:["Any undergraduate degree"],
   testNote:"MCAT required. Details being finalized for inaugural cohort.",
   notes:"Newest Canadian med school. First cohort 2026/2027.",
   url:"https://www.torontomu.ca/school-of-medicine"},
  {id:"mcgill",name:"McGill University (MD-CM)",short:"McGill",province:"QC",
   minGPA:3.5,avgGPA:3.89,avgMCAT:518,seats:249,mcat:false,casper:true,interview:"MMI",
   system:"Direct",deadline:"Nov 1, 2026",deadlineISO:"2026-11-01",oop:true,fr:true,
   prereqs:["Biology 1 year with lab","Chemistry 1 year with lab","Physics 1 year with lab","Organic Chemistry 1 semester with lab"],
   testNote:"MCAT NOT for Canadian undergrads. Required for US/intl only (508+ recommended).",
   notes:"249 seats. 5 OOP Canadian, 1 international. Pre-interview: 70% GPA + 20% CASPer + 10% CV.",
   url:"https://www.mcgill.ca/medadmissions"},
  {id:"ulaval",name:"Universite Laval",short:"U Laval",province:"QC",
   minGPA:null,avgGPA:null,avgMCAT:null,seats:316,mcat:false,casper:true,interview:"MMI",
   system:"Direct (SRAM)",deadline:"Nov 1 (univ) / Mar 1 (CEGEP)",deadlineISO:"2026-11-01",oop:false,fr:true,
   prereqs:["CEGEP sciences OR university degree","Biology, Chemistry, Math, Physics"],
   testNote:"MCAT NOT required.",
   notes:"316 seats: 301 QC, 3 NB, 1 other Canadian, 1 international. French mandatory.",
   url:"https://www.fmed.ulaval.ca"},
  {id:"umontreal",name:"Universite de Montreal",short:"UdeM",province:"QC",
   minGPA:null,avgGPA:null,avgMCAT:null,seats:403,mcat:false,casper:true,interview:"MMI",
   system:"Direct",deadline:"Nov 15 (univ) / Mar 1 (CEGEP)",deadlineISO:"2026-11-15",oop:false,fr:true,
   prereqs:["CEGEP DEC in Sciences OR equivalent","Biology, Chemistry, Math, Physics"],
   testNote:"MCAT NOT required.",
   notes:"403 seats: 390 QC, 3 NB, 3 Indigenous, 2 international. French mandatory.",
   url:"https://medecine.umontreal.ca"},
  {id:"usherbrooke",name:"Universite de Sherbrooke",short:"Sherbrooke",province:"QC",
   minGPA:null,avgGPA:null,avgMCAT:null,seats:238,mcat:false,casper:true,interview:"MMI",
   system:"Direct",deadline:"Nov 1 (univ) / Mar 1 (CEGEP)",deadlineISO:"2026-11-01",oop:true,fr:true,
   prereqs:["CEGEP sciences: Organic Chemistry, Biology, Physics, Math OR equivalent"],
   testNote:"MCAT NOT required.",
   notes:"238 seats: 208 QC, 28 NB, 1 other Canadian, 1 international. French mandatory.",
   url:"https://www.usherbrooke.ca/medecine"},
  {id:"ubc",name:"University of British Columbia",short:"UBC",province:"BC",
   minGPA:3.5,avgGPA:3.83,avgMCAT:513,seats:288,mcat:true,casper:true,interview:"MMI",
   system:"Direct",deadline:"Sep 15, 2026",deadlineISO:"2026-09-15",oop:true,fr:false,
   prereqs:["English literature or composition - 1 course","Indigenous Studies OR second English - 1 course","Min 90 credits at time of application"],
   testNote:"Min overall MCAT 500. All 4 sections evaluated. Scores to UBC by Oct 15, 2026.",
   notes:"288 seats across 4 sites: Vancouver, Victoria, Prince George, Kelowna. NAQ score heavily weighted.",
   url:"https://mdprogram.med.ubc.ca"},
  {id:"ualberta",name:"University of Alberta",short:"U of A",province:"AB",
   minGPA:3.3,avgGPA:3.77,avgMCAT:512,seats:188,mcat:true,casper:true,interview:"MMI",
   system:"Direct (Launchpad)",deadline:"Oct 2, 2026",deadlineISO:"2026-10-02",oop:true,fr:false,
   prereqs:["Any undergraduate degree"],
   testNote:"Min 124 in EACH of 4 sections. OOP needs 128+ CARS. Deadline Oct 2 at 1:00 PM MT.",
   notes:"192 seats: 85% AB, 15% OOP. Opens July 1, 2026. Min GPA 3.3 IP / 3.5 OOP.",
   url:"https://www.ualberta.ca/en/medicine/programs/md/index.html"},
  {id:"ucalgary",name:"University of Calgary (Cumming)",short:"UCalgary",province:"AB",
   minGPA:3.3,avgGPA:3.78,avgMCAT:511,seats:162,mcat:true,casper:true,interview:"MMI",
   system:"Direct",deadline:"Oct 1, 2026",deadlineISO:"2026-10-01",oop:true,fr:false,
   prereqs:["Any undergraduate degree"],
   testNote:"All 4 sections evaluated. Scores released to UCalgary by Oct 1, 2026 at 4:00 PM MST.",
   notes:"162 seats. Strong Alberta preference. Opens July 2026.",
   url:"https://cumming.ucalgary.ca/mdprogram"},
  {id:"usask",name:"University of Saskatchewan",short:"USask",province:"SK",
   minGPA:null,avgGPA:3.77,avgMCAT:508,seats:108,mcat:true,casper:true,interview:"MMI + Panel",
   system:"Direct",deadline:"Oct 1, 2026",deadlineISO:"2026-10-01",oop:true,fr:false,
   prereqs:["Four-year bachelor's degree","Min UAA 80%","English 6cu","Biochemistry 3cu","Biology 6cu","Chemistry 6cu","Statistics 3cu","Indigenous Studies course or certificate"],
   testNote:"Min total MCAT 492 (min 123 each section). Scores released Aug 1 - Oct 1, 2026. Last test date Aug 28.",
   notes:"108 seats: Regina 40, Saskatoon 68. Opens August 2026. IAC, DSAAP, BSAP pathways available.",
   url:"https://medicine.usask.ca"},
  {id:"umanitoba",name:"University of Manitoba (Rady)",short:"UManitoba",province:"MB",
   minGPA:3.0,avgGPA:3.84,avgMCAT:508,seats:125,mcat:true,casper:true,interview:"MMI",
   system:"Direct",deadline:"Nov 1, 2026",deadlineISO:"2026-11-01",oop:false,fr:false,
   prereqs:["English 2 courses","Biochemistry 1 course","Biology 2 courses with lab","Chemistry 2 courses with lab","Statistics 1 course"],
   testNote:"MCAT required. No published minimum. Avg admitted 508.",
   notes:"Manitoba residents only. All prerequisites complete by deadline.",
   url:"https://umanitoba.ca/explore/programs-of-study/medicine-mdmsc"},
  {id:"dalhousie",name:"Dalhousie University",short:"Dal",province:"NS",
   minGPA:3.3,avgGPA:3.8,avgMCAT:509,seats:164,mcat:true,casper:true,interview:"MMI",
   system:"Direct",deadline:"Jul 31, 2026 (Sec 1)",deadlineISO:"2026-07-31",oop:true,fr:false,
   prereqs:["Full baccalaureate degree","Biology 2 courses","Chemistry 2 courses including Organic","English 2 courses"],
   testNote:"Pre-interview = 50% GPA + 25% MCAT + 25% CASPer. Last MCAT Aug 8. Scores to Dal by Sep 8.",
   notes:"Sec 1 opens Jun 15, closes Jul 31. Sec 2 fee $70 due Sep 3. OOP now limited to Indigenous/Black pathways.",
   url:"https://medicine.dal.ca"},
  {id:"memorial",name:"Memorial University of Newfoundland",short:"MUN",province:"NL",
   minGPA:null,avgGPA:3.5,avgMCAT:507,seats:110,mcat:true,casper:true,interview:"MMI",
   system:"Direct",deadline:"Aug 27, 2026",deadlineISO:"2026-08-27",oop:true,fr:false,
   prereqs:["Full bachelor's degree at time of admission"],
   testNote:"No minimum. 505+ recommended. Avg admitted 507.",
   notes:"Opens late June 2026. 83 NL, 1 Nunavut, 6 other Canadian. UPEI campus: 20 PEI seats.",
   url:"https://www.med.mun.ca/Medicine/Admissions.aspx"}
];

// ── TIMELINE ─────────────────────────────────────────────────────────────────
var TIMELINE=[
  {id:"t1",date:"2026-06-15",school:"All Schools",cat:"prep",title:"Contact your referees",
   desc:"Reach out now - give referees 8-10 weeks. Most schools need letters by Oct 1."},
  {id:"t2",date:"2026-06-15",school:"Dalhousie",cat:"atlantic",title:"Dal Section 1 opens",
   desc:"Available Jun 15 - Jul 31. Complete early to unlock Section 2 within 10 business days."},
  {id:"t3",date:"2026-07-01",school:"UAlberta",cat:"ab",title:"UAlberta application opens",
   desc:"Launchpad opens July 1 (tentative). Deadline Oct 2, 2026 at 1:00 PM MT."},
  {id:"t4",date:"2026-07-01",school:"UCalgary",cat:"ab",title:"UCalgary application opens",
   desc:"Cumming School opens. Confirmed deadline: October 1, 2026."},
  {id:"t5",date:"2026-07-10",school:"OMSAS (Ontario)",cat:"omsas",title:"OMSAS application opens",
   desc:"Opens for Fall 2027. Covers U of T, Western, McMaster, Queen's, Ottawa, NOSM, TMU. Deadline Oct 1 at 4:30 PM ET."},
  {id:"t6",date:"2026-07-31",school:"Dalhousie",cat:"atlantic",title:"DAL SECTION 1 DEADLINE",
   desc:"Hard deadline 11:59 PM AT. Section 2 access within 10 business days. No exceptions."},
  {id:"t7",date:"2026-08-01",school:"USask",cat:"sk",title:"USask application opens",
   desc:"Opens early August. Deadline Oct 1 at 11:59 PM CST. MCAT release window: Aug 1 - Oct 1."},
  {id:"t8",date:"2026-08-08",school:"Dalhousie",cat:"atlantic",title:"Dal last MCAT date",
   desc:"Last eligible MCAT for Dal cycle. Scores must reach Dal by Sept 8, 2026."},
  {id:"t9",date:"2026-08-27",school:"MUN",cat:"atlantic",title:"MUN APPLICATION DEADLINE",
   desc:"Memorial closes Aug 27 - one of earliest deadlines in Canada. Opens late June."},
  {id:"t10",date:"2026-08-28",school:"USask",cat:"sk",title:"USask last MCAT date",
   desc:"Last eligible MCAT for USask cycle. Scores released Aug 1 - Oct 1, 2026."},
  {id:"t11",date:"2026-09-03",school:"Dalhousie",cat:"atlantic",title:"Dal Section 2 fee deadline",
   desc:"$70 CAD fee due by 11:59 PM AT. Non-payment cancels application."},
  {id:"t12",date:"2026-09-08",school:"Dalhousie",cat:"atlantic",title:"Dal MCAT scores due",
   desc:"MCAT scores must be released to Dalhousie by September 8, 2026."},
  {id:"t13",date:"2026-09-15",school:"UBC",cat:"ubc",title:"UBC APPLICATION DEADLINE",
   desc:"Closes 11:59 PM PT. MCAT min 500 required. Scores to UBC by Oct 15, 2026."},
  {id:"t14",date:"2026-10-01",school:"OMSAS (Ontario)",cat:"omsas",title:"OMSAS DEADLINE - ALL ONTARIO",
   desc:"Hard deadline 4:30 PM ET for U of T, Western, McMaster, Queen's, Ottawa, NOSM, TMU. Zero exceptions."},
  {id:"t15",date:"2026-10-01",school:"UCalgary",cat:"ab",title:"UCalgary deadline",
   desc:"Confirmed Oct 1, 2026. Scores to UCalgary by 4:00 PM MST."},
  {id:"t16",date:"2026-10-01",school:"USask",cat:"sk",title:"USask deadline",
   desc:"Confirmed Oct 1, 2026 at 11:59 PM CST. Min MCAT 492."},
  {id:"t17",date:"2026-10-02",school:"UAlberta",cat:"ab",title:"UAlberta deadline",
   desc:"Confirmed Oct 2, 2026 at 1:00 PM MT. MCAT verified in Launchpad by this time."},
  {id:"t18",date:"2026-10-15",school:"UBC",cat:"ubc",title:"UBC MCAT scores deadline",
   desc:"Scores released to UBC by Oct 15, 2026 at 11:59 PM PT."},
  {id:"t19",date:"2026-10-21",school:"OMSAS (Ontario)",cat:"omsas",title:"OMSAS MCAT scores deadline",
   desc:"OMSAS receives scores by Oct 21. Request from AAMC by Oct 17 - takes 2-3 business days."},
  {id:"t20",date:"2026-11-01",school:"McGill",cat:"qc",title:"McGill MD-CM deadline",
   desc:"Closes Nov 1 for Canadian university applicants. Pre-interview: 70% GPA + 20% CASPer + 10% CV."},
  {id:"t21",date:"2026-11-01",school:"Sherbrooke",cat:"qc",title:"Sherbrooke university deadline",
   desc:"University-stream closes Nov 1. French required. Includes NB seats."},
  {id:"t22",date:"2026-11-01",school:"UManitoba",cat:"mb",title:"UMANITOBA DEADLINE",
   desc:"Rady Faculty closes Nov 1, 2026. Manitoba residents only. CASPer required."},
  {id:"t23",date:"2026-11-15",school:"UdeM",cat:"qc",title:"UdeM university deadline",
   desc:"University-stream closes Nov 15. French required. Montreal and Mauricie campuses."},
  {id:"t24",date:"2026-12-15",school:"SK / AB",cat:"sk",title:"Interview invitations (SK and AB)",
   desc:"USask sends MMI invitations December for January interviews. Alberta schools invite around same time."},
  {id:"t25",date:"2027-01-15",school:"Most Schools",cat:"interview",title:"MMI interview season begins",
   desc:"Most Canadian schools hold MMIs January - March 2027. Prepare with practice scenarios."},
  {id:"t26",date:"2027-03-01",school:"QC CEGEP stream",cat:"qc",title:"QC CEGEP stream deadline",
   desc:"Laval, UdeM, Sherbrooke CEGEP-stream close March 1, 2027 via SRAM. French only."},
  {id:"t27",date:"2027-05-12",school:"OMSAS (Ontario)",cat:"offers",title:"Ontario first-round offers",
   desc:"First-round offers May 12, 2027 (historical date). You may hold only 1 Ontario offer."},
  {id:"t28",date:"2027-05-15",school:"AB / BC / SK / MB",cat:"offers",title:"Western Canada offers",
   desc:"UBC, UAlberta, UCalgary, USask, UManitoba release first-round offers early-mid May 2027."},
  {id:"t29",date:"2027-06-30",school:"OMSAS (Ontario)",cat:"offers",title:"Final transcripts due (Ontario)",
   desc:"Final official transcripts must reach OMSAS by June 30, 2027."}
];

var CAT_COLOR={prep:"#C4B5FD",omsas:"#7EB8F7",ubc:"#5EEAD4",ab:"#FCD34D",sk:"#6EE7B7",mb:"#93C5FD",atlantic:"#FCA5A5",qc:"#86EFAC",interview:"#F9A8D4",offers:"#6EE7B7"};
var CAT_LABEL={prep:"Prep",omsas:"Ontario",ubc:"BC",ab:"Alberta",sk:"Saskatchewan",mb:"Manitoba",atlantic:"Atlantic",qc:"Quebec",interview:"Interviews",offers:"Offers"};
var PROVINCES=["All","AB","BC","MB","NL","NS","ON","QC","SK"];
var YEARS=["Year 1","Year 2","Year 3","Year 4"];
var YEAR_OPTIONS=["1st Year","2nd Year","3rd Year","4th Year","5th Year+","Grad Student"];
var TABS=[
  {id:"gpa",label:"GPA",icon:"🎓"},
  {id:"mcat",label:"MCAT",icon:"🧬"},
  {id:"schools",label:"Schools",icon:"🏥"},
  {id:"journal",label:"Journal",icon:"📓"},
  {id:"wellness",label:"Wellness",icon:"🌿"}
];
var MOODS=["Terrible","Bad","Okay","Good","Great"];
var MOOD_EMOJI=["😞","😕","😐","🙂","😄"];

// ── UI PRIMITIVES ─────────────────────────────────────────────────────────────
function Ring(props){
  var size=props.size||64,stroke=props.stroke||7,pct=Math.min(Math.max(props.pct,0),100);
  var r=(size-stroke)/2,circ=2*Math.PI*r,offset=circ-(pct/100)*circ;
  return (
    <svg width={size} height={size} viewBox={"0 0 "+size+" "+size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.hi} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={props.color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{transition:"stroke-dashoffset .6s ease"}}/>
    </svg>
  );
}
function Bar(props){
  var pct=props.pct,color=props.color,h=props.h||8;
  var w=Math.min(Math.max(pct,0),100);
  return (
    <div style={{height:h,background:C.hi,borderRadius:99,overflow:"hidden"}}>
      <div style={{height:"100%",width:w+"%",background:color,borderRadius:99,transition:"width .4s ease"}}/>
    </div>
  );
}
function Tag(props){
  return (
    <span style={{background:props.color+"24",color:props.color,fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,whiteSpace:"nowrap",letterSpacing:"0.01em"}}>{props.children}</span>
  );
}
function Btn(props){
  var bg=props.variant==="success"?C.green:props.variant==="ghost"?C.hi:props.variant==="muted"?C.hi:C.blue;
  var col=props.variant==="success"?"#fff":props.variant==="ghost"?C.text:props.variant==="muted"?C.sub:"#fff";
  return (
    <button type={props.type||"button"} onClick={props.onClick} disabled={props.disabled} aria-label={props["aria-label"]} style={Object.assign({border:"none",borderRadius:14,fontFamily:"inherit",fontWeight:700,cursor:props.disabled?"not-allowed":"pointer",fontSize:props.small?13:15,padding:props.small?"8px 16px":"13px 20px",opacity:props.disabled?0.35:1,background:bg,color:col,width:props.full?"100%":"auto",transition:"transform .1s, opacity .15s"},props.style||{})}>
      {props.children}
    </button>
  );
}
function TInput(props){
  return (
    <input type={props.type||"text"} value={props.value} placeholder={props.placeholder} onChange={function(e){props.onChange(e.target.value);}} onKeyDown={props.onKeyDown} autoComplete={props.autoComplete} inputMode={props.inputMode} min={props.min} max={props.max} step={props.step} aria-label={props["aria-label"]||props.placeholder} style={Object.assign({border:"none",borderRadius:12,padding:"11px 14px",fontSize:14,color:C.text,background:C.hi,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"},props.style||{})}/>
  );
}
function TArea(props){
  return (
    <textarea value={props.value} placeholder={props.placeholder} aria-label={props["aria-label"]||props.placeholder} maxLength={props.maxLength} rows={props.rows||3} onChange={function(e){props.onChange(e.target.value);}} style={{border:"none",borderRadius:12,padding:"11px 14px",fontSize:14,color:C.text,background:C.hi,outline:"none",resize:"vertical",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
  );
}
function Card(props){
  return (
    <div style={Object.assign({background:C.surface,borderRadius:20,padding:"18px 20px"},props.style||{})}>
      {props.children}
    </div>
  );
}
function Spinner(){
  return (
    <div style={{textAlign:"center",padding:"24px 0"}}>
      <div style={{width:30,height:30,border:"3px solid "+C.hi,borderTop:"3px solid "+C.blue,borderRadius:"50%",margin:"0 auto 10px",animation:"spin .8s linear infinite"}}/>
      <p style={{margin:0,fontSize:12,color:C.sub}}>Thinking...</p>
    </div>
  );
}
function Logo(props){
  var size=props.size||40;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{display:"block",flexShrink:0}}>
      <defs>
        <linearGradient id={"l2m-grad-"+size} x1="8%" y1="6%" x2="92%" y2="94%">
          <stop offset="0%" stopColor="#FF8159"/>
          <stop offset="48%" stopColor="#E0529C"/>
          <stop offset="100%" stopColor="#6B5EFF"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="30" fill={"url(#l2m-grad-"+size+")"}/>
      <g stroke="rgba(255,255,255,0.32)" strokeWidth="2.5" strokeLinecap="round">
        <line x1="60" y1="12" x2="60" y2="19"/>
        <line x1="60" y1="101" x2="60" y2="108"/>
        <line x1="12" y1="60" x2="19" y2="60"/>
      </g>
      <path d="M 20 64 L 34 64 L 41 50 L 50 84 L 60 40 L 67 64 L 84 64"
        fill="none" stroke="#FFFFFF" strokeWidth="8.5"
        strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 84 64 L 73 56.5 L 73 71.5 Z" fill="#FFFFFF"/>
    </svg>
  );
}

function SectionLabel(props){
  return <p style={{margin:props.m||"0 0 10px 2px",fontSize:13,fontWeight:800,color:C.text,letterSpacing:"-0.01em"}}>{props.children}</p>;
}
var AAMC_EXAMS=[
  {id:"sample",label:"Sample Test",sub:"Practice",scored:false,free:true,emoji:"🧪"},
  {id:"fl1",label:"Full Length 1",sub:"FL1",scored:true,free:true,emoji:"1️⃣"},
  {id:"fl2",label:"Full Length 2",sub:"FL2",scored:true,free:false,emoji:"2️⃣"},
  {id:"fl3",label:"Full Length 3",sub:"FL3",scored:true,free:false,emoji:"3️⃣"},
  {id:"fl4",label:"Full Length 4",sub:"FL4",scored:true,free:false,emoji:"4️⃣"},
  {id:"fl5",label:"Full Length 5",sub:"FL5",scored:true,free:false,emoji:"5️⃣"},
  {id:"fl6",label:"Full Length 6",sub:"FL6",scored:true,free:false,emoji:"6️⃣"}
];
var SECS=[
  {key:"cp",short:"C/P",full:"Chem & Phys",target:128,color:C.blue,emoji:"⚗️"},
  {key:"cars",short:"CARS",full:"Crit. Reasoning",target:128,color:C.purple,emoji:"📖"},
  {key:"bb",short:"B/B",full:"Bio & Biochem",target:128,color:C.green,emoji:"🧬"},
  {key:"ps",short:"P/S",full:"Psych & Soc",target:128,color:C.amber,emoji:"🧠"}
];
// Rough percentile lookup (118-132 scale, per-section AAMC percentile table approximation)
function sectionPercentile(score){
  var table=[[132,100],[130,98],[128,87],[127,79],[126,69],[125,58],[124,46],[123,35],[122,24],[121,15],[120,8],[119,3],[118,1]];
  for(var i=0;i<table.length;i++){if(score>=table[i][0])return table[i][1];}
  return 1;
}
function totalPercentile(total){
  if(total>=518)return 99;if(total>=514)return 95;if(total>=510)return 86;
  if(total>=508)return 80;if(total>=505)return 70;if(total>=502)return 58;
  if(total>=500)return 50;if(total>=498)return 42;if(total>=496)return 35;
  if(total>=494)return 28;if(total>=492)return 22;if(total>=490)return 17;
  return 10;
}
export { AAMC_EXAMS, Bar, Btn, C, CAT_COLOR, CAT_LABEL, Card, Logo, MED_SCHOOLS, MOODS, MOOD_EMOJI, PROVINCES, Ring, SCALES, SCALE_MAX, SECS, SectionLabel, Spinner, TABS, TArea, TIMELINE, TInput, Tag, UNIVERSITIES, YEARS, YEAR_OPTIONS, getScale, getScaleMax, gpaCol, letterFromPct, pctCol, ptsFromPct, sectionPercentile, totalPercentile };
