
(() => {
  const $=id=>document.getElementById(id);
  const files=new Map(), basenames=new Map();
  let experiment=null, participantId="", state=null, runner=null, directoryHandle=null;

  function norm(s){return String(s||"").replaceAll("\\","/").replace(/^\/+/,"").toLowerCase()}
  function bn(s){const a=norm(s).split("/");return a[a.length-1]}
  function storageKey(){return `voiceRunner:v1:${experiment.experimentId}:${participantId}`}
  function saveState(){if(state) localStorage.setItem(storageKey(),JSON.stringify(state))}
  function loadState(){try{return JSON.parse(localStorage.getItem(storageKey())||"null")}catch{return null}}
  function clearState(){localStorage.removeItem(storageKey())}
  function status(html,kind=""){const e=$("status");e.className=`notice ${kind}`;e.innerHTML=html;e.classList.remove("hidden")}
  function resolveFile(path){
    const n=norm(path); if(files.has(n)) return files.get(n);
    const list=basenames.get(bn(n))||[]; return list.length===1?list[0]:null;
  }

  async function readDirHandle(handle, prefix=""){
    for await (const [name,h] of handle.entries()){
      const rel=prefix?`${prefix}/${name}`:name;
      if(h.kind==="directory") await readDirHandle(h,rel);
      else {
        const f=await h.getFile(); files.set(norm(rel),f);
        const b=bn(rel); if(!basenames.has(b)) basenames.set(b,[]); basenames.get(b).push(f);
      }
    }
  }

  async function chooseFolder(){
    files.clear();basenames.clear();
    if(window.showDirectoryPicker && window.isSecureContext){
      try{
        directoryHandle=await window.showDirectoryPicker({mode:"read"});
        await readDirHandle(directoryHandle);
        await finishFolderRead();
      }catch(e){ if(e.name!=="AbortError") status("폴더를 열 수 없습니다: "+e.message,"error"); }
    }else{
      $("fallbackFolder").value="";
      $("fallbackFolder").click();
    }
  }

  $("fallbackFolder").addEventListener("change", async e=>{
    files.clear();basenames.clear();
    for(const f of e.target.files){
      const rel=(f.webkitRelativePath||f.name).replaceAll("\\","/").split("/").slice(1).join("/")||f.name;
      files.set(norm(rel),f); const b=bn(rel); if(!basenames.has(b))basenames.set(b,[]);basenames.get(b).push(f);
    }
    await finishFolderRead();
  });

  async function finishFolderRead(){
    const candidates=[];
    for(const [name,list] of basenames.entries()){
      if(name === "experiment.json" || /_experiment\.json$/i.test(name)) candidates.push(...list);
    }
    if(!candidates.length){status("참가자용 실험 JSON(*_experiment.json)을 찾지 못했습니다.","error");return}
    if(candidates.length>1){status("참가자용 실험 JSON이 여러 개 있습니다. 프로젝트 폴더에는 하나만 두세요.","error");return}
    const expFile=candidates[0];
    try{experiment=JSON.parse(await expFile.text())}catch(e){status("experiment.json 오류: "+e.message,"error");return}
    const errs=VoiceExperimentUtil.validateParticipantExperiment(experiment);
    if(errs.length){status(errs.join("<br>"),"error");return}
    const missing=experiment.items.filter(x=>!resolveFile(x.audio)).map(x=>x.audio);
    if(missing.length){status(`음성파일 ${missing.length}개가 없습니다.<br>${missing.slice(0,10).join("<br>")}`,"error");return}
    participantId=$("participantId").value.trim();
    if(!participantId){status(`✓ ${experiment.title}<br>✓ 문항 ${experiment.items.length}개<br>✓ 음성파일 확인 완료<br><b>참가자 번호를 입력하세요.</b>`,"ok");return}
    status(`✓ ${experiment.title}<br>✓ 문항 ${experiment.items.length}개<br>✓ 음성파일 확인 완료<br>✓ 음성은 서버로 전송되지 않습니다.`,"ok");
    renderActions();
  }

  $("participantId").addEventListener("input",()=>{participantId=$("participantId").value.trim();if(experiment&&participantId)renderActions()});
  function renderActions(){
    const a=$("actions");a.innerHTML="";a.classList.remove("hidden");
    const saved=loadState();
    if(saved){
      const r=document.createElement("button");r.className="primary";r.textContent=`이어서 하기 (${Math.min(saved.currentIndex+1,saved.order.length)} / ${saved.order.length})`;r.onclick=()=>startWithState(saved);
      const n=document.createElement("button");n.className="danger";n.textContent="처음부터 다시 시작";n.onclick=restart;
      a.append(r,n);
    }else{
      const s=document.createElement("button");s.className="primary";s.textContent="음성 하나 듣기";s.onclick=startNew;a.append(s);
    }
  }
  function startNew(){state=VoiceExperimentUtil.createState(experiment,participantId);saveState();startWithState(state,true)}
  function startWithState(s,play=false){
    state=s;$("setup").classList.add("hidden");$("complete").classList.add("hidden");$("runnerCard").classList.remove("hidden");
    runner=new VoiceExperimentRunner($("runnerRoot"),{
      mode:"participant",audioResolver:async p=>resolveFile(p),onStateChange:st=>{state=st;saveState()},
      onComplete:st=>{state=st;saveState();$("runnerCard").classList.add("hidden");$("complete").classList.remove("hidden")},
      onRestart:restart
    });
    runner.load(experiment,state); if(play)runner.playCurrent(false);
  }
  function restart(){
    if(!confirm("현재까지의 응답을 삭제하고 새로운 순서로 처음부터 다시 시작하시겠습니까?"))return;
    clearState(); startNew();
  }
  function resultObj(){
    return {
      schemaVersion:1,resultType:"voice-experiment-result",experimentId:experiment.experimentId,experimentTitle:experiment.title,
      participantId,stateStartedAt:state.startedAt,completedAt:state.completedAt||new Date().toISOString(),
      responses:state.order.map((id,i)=>{const it=experiment.items.find(x=>x.id===id),r=state.responses[id]||{};return{
        trial:i+1,itemId:id,audio:it.audio,selectedValue:r.selectedValue??null,selectedLabel:r.selectedLabel??null,
        replayCount:r.replayCount??0,responseTimeMs:r.responseTimeMs??null,revisionCount:r.revisionCount??0
      }})
    }
  }
  $("saveResult").onclick=()=>{
    const blob=new Blob([JSON.stringify(resultObj(),null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${experiment.experimentId}_${participantId}_result.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
  };
  $("restartDone").onclick=restart;
  $("openFolderBtn").onclick=chooseFolder;
})();
