const SUPABASE_URL="https://eodryjdrdyloinkopple.supabase.co",SUPABASE_KEY="sb_publishable_m3aw3Vs3eE2QWrlE5K-zIQ_eTgBWY_q",CATEGORIES=["UHC","Vanilla","Dpot","Npot","Dsmp","Nsmp","Axe","Sword","Mace","Spearmace","Cart"],$=id=>document.getElementById(id);let DB=null,players=[],currentCategory="UHC";

try{DB=supabase.createClient(SUPABASE_URL,SUPABASE_KEY)}catch(e){console.error(e);alert("Supabase failed to initialize: "+e.message)}

function updateLiveClock(){
 let d=new Date();
 $("liveClock").textContent=d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"})
}
updateLiveClock();
setInterval(updateLiveClock,1000);

function escapeHTML(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function getPoints(v){let m=String(v??"").match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):0}

function tierClass(t){t=String(t??"").toUpperCase().replace(/\s/g,"");return["ST6","LT5","HT5"].includes(t)?"tier-purple":["LT4","HT4","LT3","HT3"].includes(t)?"tier-bronze":["LT2","HT2"].includes(t)?"tier-iron":["LT1","HT1"].includes(t)?"tier-gold":""}

function getTier(p,c){let d=p.xs_data||{},a={Dpot:["Dpot","Diamond_Pot"],Npot:["Npot","Netherite_Pot"],Dsmp:["Dsmp","Diamond_SMP"],Nsmp:["Nsmp","Netherite_SMP"],Spearmace:["Spearmace","Spear_Mace"]};for(let k of a[c]||[c])if(d[k]!=null)return String(d[k]).toUpperCase()==="X"?"Unidentified":String(d[k]);return"Unidentified"}

function updateLive(){let d=new Date(),t=d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"});$("dateDisplay").textContent=t}

updateLive();
setInterval(updateLive,1000);

async function loadPlayers(){
 if(!DB)return;
 let{data,error}=await DB.from("players").select("*");
 if(error){
  console.error(error);
  $("connectionStatus").textContent="● ERROR";
  $("connectionDetail").textContent=error.message;
  return
 }
 players=data||[];
 $("connectionStatus").textContent="● CONNECTED";
 $("connectionDetail").textContent="SUPABASE";
 renderTabs();
 renderPlayers()
}

async function savePlayer(p){
 let{error}=await DB.from("players").upsert(p,{onConflict:"id"});
 if(error)throw error
}

async function deletePlayer(id){
 let{error}=await DB.from("players").delete().eq("id",id);
 if(error)throw error
}

function renderTabs(){
 $("tabs").innerHTML=CATEGORIES.map(c=>`<button class="tab ${c===currentCategory?"active":""}" data-category="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join("");
 document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{currentCategory=b.dataset.category;renderTabs();renderPlayers()})
}

function renderPlayers(){
 $("tierTitle").textContent=currentCategory;
 $("currentStat").textContent=currentCategory;
 let s=[...players].sort((a,b)=>getPoints(b.points)-getPoints(a.points));
 $("totalPlayers").textContent=players.length;
 $("playerCount").textContent=`${s.length} Player${s.length===1?"":"s"}`;
 if(!s.length){
  $("players").innerHTML='<div class="empty"><strong>Empty Tierlist</strong><span>No players have been imported yet.</span></div>';
  return
 }
 $("players").innerHTML=s.map((p,i)=>{
  let t=getTier(p,currentCategory),q=i===0?"top1":i===1?"top2":i===2?"top3":"other";
  return`<div class="player ${q}"><div class="rank">#${i+1}</div><div><div class="playerName">${escapeHTML(p.name)}</div><span class="tierValue ${tierClass(t)}">${escapeHTML(t)}</span></div><div class="points">${getPoints(p.points)} pts</div><button class="profileToggle" data-id="${escapeHTML(p.id)}">⌄</button><div class="profileInfo hidden" id="profile-${escapeHTML(p.id)}"><div class="profileTitle">TIER LISTS</div><div class="profileTiers">${CATEGORIES.map(c=>`<div class="profileTier"><span>${escapeHTML(c)}</span><b class="${tierClass(getTier(p,c))}">${escapeHTML(getTier(p,c))}</b></div>`).join("")}</div><div class="profileAverage"><span>AVERAGE</span><b class="${tierClass(p.Average)}">${escapeHTML(p.Average||"Unidentified")}</b></div></div></div>`
 }).join("");
 document.querySelectorAll(".profileToggle").forEach(b=>b.onclick=()=>{
  let x=$("profile-"+b.dataset.id);
  if(!x)return;
  x.classList.toggle("hidden");
  b.textContent=x.classList.contains("hidden")?"⌄":"⌃"
 })
}

function openModal(c){$("modalContent").innerHTML=c;$("modal").classList.remove("hidden")}

function closeModal(){$("modal").classList.add("hidden");$("modalContent").innerHTML=""}

$("closeModal").onclick=closeModal;

$("modal").onclick=e=>{if(e.target===$("modal"))closeModal()};

$("menuBtn").onclick=e=>{e.stopPropagation();$("menu").classList.toggle("hidden")};

document.addEventListener("click",e=>{
 if(!$("menu").contains(e.target)&&e.target!==$("menuBtn"))$("menu").classList.add("hidden")
});

$("adminBtn").onclick=()=>{
 $("menu").classList.add("hidden");
 openModal(`<h2 class="modalTitle">Admin Config</h2><div class="info">Sign in with your Supabase Auth account.</div><div class="field"><label>EMAIL</label><input id="adminEmail" type="email" autocomplete="username"></div><div class="field"><label>PASSWORD</label><input id="adminPassword" type="password" autocomplete="current-password"></div><button id="adminLogin" class="action primary">Login</button>`);
 $("adminLogin").onclick=adminLogin
};

async function adminLogin(){
 if(!DB)return alert("Database unavailable.");
 let email=$("adminEmail").value.trim(),password=$("adminPassword").value;
 if(!email||!password)return alert("Enter your email and password.");
 let b=$("adminLogin");
 b.disabled=true;
 b.textContent="Logging in...";
 try{
  let{error}=await DB.auth.signInWithPassword({email,password});
  if(error)throw error;
  await openAdminPanel()
 }catch(e){alert("Login failed: "+e.message)}
 finally{
  if($("adminLogin")){
   $("adminLogin").disabled=false;
   $("adminLogin").textContent="Login"
  }
 }
}

async function openAdminPanel(){
 let{data,error}=await DB.auth.getUser();
 if(error)throw error;
 openModal(`<h2 class="modalTitle">Admin Panel</h2><div class="info">Signed in as <b>${escapeHTML(data.user?.email||"Admin")}</b><br>Import player .xs files.</div><button id="importXS" class="action primary">Import .xs Files</button><button id="managePlayers" class="action">Manage Players</button><button id="clearPlayers" class="action danger">Clear All Players</button><button id="logoutBtn" class="action">Logout</button>`);
 $("importXS").onclick=()=>{$("xsInput").value="";$("xsInput").click()};
 $("managePlayers").onclick=openManagePlayers;
 $("clearPlayers").onclick=async()=>{
  if(!players.length)return alert("There are no players.");
  if(!confirm("Delete ALL players?"))return;
  try{
   for(let p of [...players])await deletePlayer(p.id);
   players=[];
   renderPlayers();
   alert("All players deleted.");
   await openAdminPanel()
  }catch(e){alert("Delete failed: "+e.message)}
 };
 $("logoutBtn").onclick=async()=>{
  let{error}=await DB.auth.signOut();
  if(error)return alert(error.message);
  closeModal()
 }
}

$("xsInput").addEventListener("change",async e=>{
 let f=[...e.target.files];
 if(f.length)await importXSFiles(f);
 e.target.value=""
});

async function importXSFiles(files){
 let imported=0,failed=0,errors=[];
 for(let file of files){
  try{
   if(!file.name.toLowerCase().endsWith(".xs"))throw Error("File must end in .xs");
   let z=await JSZip.loadAsync(file),names=Object.keys(z.files),path=names.find(p=>!z.files[p].dir&&p.replace(/\\/g,"/").split("/").pop().toLowerCase()==="data.json");
   if(!path)throw Error("Missing data.json");
   let d=JSON.parse(await z.files[path].async("text"));
   if(!d.name)throw Error("Missing player name");
   let id=crypto.randomUUID(),p={
    id,
    name:String(d.name),
    points:d.points??"0pts",
    Average:d.Average??"Unidentified",
    xs_data:d.xs_data&&typeof d.xs_data==="object"?d.xs_data:{}
   };
   await savePlayer(p);
   players.push(p);
   imported++
  }catch(e){
   failed++;
   errors.push(file.name+": "+e.message)
  }
 }
 renderPlayers();
 let msg=`Imported: ${imported}\nFailed: ${failed}`;
 if(errors.length)msg+="\n\n"+errors.join("\n");
 alert(msg)
}

function openManagePlayers(){
 let s=[...players].sort((a,b)=>getPoints(b.points)-getPoints(a.points));
 openModal(`<h2 class="modalTitle">Manage Players</h2>${s.length?s.map((p,i)=>`<div class="result"><b>#${i+1} ${escapeHTML(p.name)}</b><span>${getPoints(p.points)} pts</span><button class="action danger deletePlayer" data-id="${escapeHTML(p.id)}">Delete</button></div>`).join(""):'<div class="empty"><strong>No Players</strong><span>Import an .xs file first.</span></div>'}`);
 document.querySelectorAll(".deletePlayer").forEach(b=>b.onclick=async()=>{
  if(!confirm("Delete this player?"))return;
  try{
   await deletePlayer(b.dataset.id);
   players=players.filter(p=>String(p.id)!==b.dataset.id);
   renderPlayers();
   openManagePlayers()
  }catch(e){alert("Delete failed: "+e.message)}
 })
}

$("searchBtn").onclick=()=>{
 $("menu").classList.add("hidden");
 openModal(`<h2 class="modalTitle">Search Players</h2><div class="searchBox"><input id="searchInput" placeholder="Search player..." autocomplete="off"></div><div id="searchResults"></div>`);
 $("searchInput").oninput=renderSearch;
 $("searchInput").focus();
 renderSearch()
};

function renderSearch(){
 let q=$("searchInput").value.trim().toLowerCase(),r=players.filter(p=>String(p.name).toLowerCase().includes(q));
 $("searchResults").innerHTML=r.length?r.map(p=>`<div class="result"><b>${escapeHTML(p.name)}</b><span>${getPoints(p.points)} pts</span></div>`).join(""):'<div class="empty"><strong>No Results</strong><span>No matching players.</span></div>'
}

$("categoryBtn").onclick=()=>{
 $("menu").classList.add("hidden");
 openModal(`<h2 class="modalTitle">Categories</h2><div class="info">${CATEGORIES.map(c=>`<div style="padding:5px 0">${escapeHTML(c)}</div>`).join("")}</div>`)
};

$("refreshBtn").onclick=async()=>{
 $("menu").classList.add("hidden");
 await loadPlayers();
 updateLive()
};

$("settingsBtn").onclick=()=>{
 $("menu").classList.add("hidden");
 openModal(`<h2 class="modalTitle">Settings</h2><div class="info"><b>OUTLAST TIERLIST</b><br><br>Shared Supabase storage: enabled<br>Imported players: ${players.length}<br>Live clock: enabled</div>`)
};

renderTabs();
renderPlayers();
loadPlayers();