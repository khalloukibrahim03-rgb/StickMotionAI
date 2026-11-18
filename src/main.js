import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { parseScript, normalizeDuration } from "./story-director.js";
import { buildTimeline, updateScene, setAllDurations, getTimelineDuration, getSceneAtTime } from "./timeline.js";
import "./style.css";

const root = document.querySelector("#app");
root.innerHTML = '<header><div class="brand">STICKMOTION <b>AI</b><small>CINEMATIC 3D FILM STUDIO</small></div><span id="status">جاهز</span></header><main><aside><h1>من النص إلى الفيلم</h1><p>اكتب كل مشهد في سطر مستقل.</p><textarea id="script">المشهد 1: البطل يمشي في النفق المظلم ويفكر في أخته المريضة.\nالمشهد 2: يسمع صوتاً غريباً ويبدأ بالركض نحو المصعد السري.\nالمشهد 3: تنطفئ أضواء District 9 بالكامل، فيتوقف البطل مصدوماً.</textarea><button id="analyse">تحليل المشاهد</button><div id="scenes"></div><div id="sceneEditor" class="scene-editor"><h2>محرر المشهد المحدد</h2><p id="selectedSceneName">اختر مشهداً لتعديله</p><label for="sceneMotion">الحركة</label><select id="sceneMotion"><option value="idle">ثابت</option><option value="walk">مشي</option><option value="run">ركض</option><option value="shock">صدمة</option></select><label for="sceneCamera">الكاميرا</label><select id="sceneCamera"><option value="wide">لقطة واسعة</option><option value="tracking">تتبع الحركة</option><option value="close">لقطة قريبة</option></select><label for="sceneLighting">الإضاءة</label><select id="sceneLighting"><option value="cinematic">سينمائية</option><option value="warm">دافئة</option><option value="blackout">انقطاع الضوء</option></select><label for="sceneDuration">مدة المشهد المحدد <b id="sceneDurationText">6 ث</b></label><input id="sceneDuration" type="range" min="3" max="12" value="6"><label for="sceneSubtitle">نص الترجمة</label><textarea id="sceneSubtitle" rows="2"></textarea></div><label>المدة الافتراضية لكل مشهد <b id="seconds">6 ث</b></label><input id="duration" type="range" min="3" max="12" value="6"><button id="export" class="primary">إنشاء الفيلم وتصديره</button><div id="progress" hidden><span id="progressText">جاري التسجيل…</span><div class="bar"><i id="bar"></i></div></div><p class="note">تُسجّل المعاينة الحقيقية من WebGL. يتطلب MP4 تشغيل خادم FFmpeg.</p></aside><section><div class="camera" id="camera">CAM 01 · WIDE SHOT</div><div id="viewport"></div><div class="subtitle" id="subtitle">المدينة غارقة في الظلام…</div><div class="timeline"><i id="timeline"></i></div><div class="time" id="time">00:00</div></section></main><footer>STICKMOTION AI · DEVELOPMENT BUILD</footer>';

const $ = id => document.getElementById(id);
const viewport = $("viewport");
let scene, camera, renderer, controls, actor, arms=[], legs=[], light;
let clips=[], seconds=6, elapsed=0, total=0, playing=false, recorder, chunks=[], selectedSceneId=null, lastSceneId=null;
function makePivot(x,y,len,mat){
 const p=new THREE.Group();p.position.set(x,y,0);
 const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,len,14),mat);
 mesh.position.y=-len/2;mesh.castShadow=true;p.add(mesh);
 const joint=new THREE.Mesh(new THREE.SphereGeometry(.055,12,12),mat);joint.position.y=-len;p.add(joint);actor.add(p);return p;
}
function init(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x070a11);scene.fog=new THREE.FogExp2(0x070a11,.025);
 camera=new THREE.PerspectiveCamera(42,1,.1,150);camera.position.set(4,3,7);
 renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;viewport.appendChild(renderer.domElement);
 controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.2,0);controls.enableDamping=true;
 scene.add(new THREE.HemisphereLight(0xaabbd4,0x11131b,1.2));
 light=new THREE.DirectionalLight(0xffbd86,2.4);light.position.set(-4,9,5);light.castShadow=true;scene.add(light);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0x171b23,roughness:.9}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const concrete=new THREE.MeshStandardMaterial({color:0x252a33,roughness:.95});
 for(let i=0;i<32;i++){const h=5+Math.random()*12,w=2+Math.random()*3;const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),concrete);const a=i/32*Math.PI*2,r=10+Math.random()*15;b.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r);b.castShadow=true;b.receiveShadow=true;scene.add(b);}
 actor=new THREE.Group();const black=new THREE.MeshStandardMaterial({color:0x08090d,roughness:.45});const white=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.2});
 const head=new THREE.Mesh(new THREE.SphereGeometry(.34,32,32),white);head.position.y=2.2;head.castShadow=true;actor.add(head);
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,.95,18),black);body.position.y=1.43;body.castShadow=true;actor.add(body);
 arms=[makePivot(-.18,1.82,.78,black),makePivot(.18,1.82,.78,black)];
 legs=[makePivot(-.09,.98,.86,black),makePivot(.09,.98,.86,black)];scene.add(actor);
 resize();window.addEventListener("resize",resize);requestAnimationFrame(loop);
}
function resize(){if(!renderer)return;const w=viewport.clientWidth,h=viewport.clientHeight;camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();renderer.setSize(w,Math.max(1,h),false);}
function analyse(){
 seconds=normalizeDuration($("duration").value);
 clips=buildTimeline(parseScript($("script").value),seconds);
 total=getTimelineDuration(clips);
 selectedSceneId=clips[0]?.id ?? null;
 lastSceneId=null;
 renderSceneList();
 if(selectedSceneId!==null) selectScene(selectedSceneId);
 $("status").textContent=clips.length+" مشاهد جاهزة";
 $("time").textContent="00:00 / "+total+" sec";
 return clips.length>0;
}
function renderSceneList(){
 $("scenes").innerHTML=clips.map(scene=>'<button class="scene-card '+(scene.id===selectedSceneId?'active':'')+'" data-scene-id="'+scene.id+'"><b>SCENE '+scene.id+' · '+scene.duration+'s</b><span>'+escapeText(scene.text)+'</span></button>').join("");
}
function selectScene(id){
 const selected=clips.find(scene=>scene.id===id);
 if(!selected)return;
 selectedSceneId=id;
 $("selectedSceneName").textContent="المشهد "+id+" — "+selected.text;
 $("sceneMotion").value=selected.motion;
 $("sceneCamera").value=selected.camera;
 $("sceneLighting").value=selected.lighting;
 $("sceneDuration").value=selected.duration;
 $("sceneDurationText").textContent=selected.duration+" ث";
 $("sceneSubtitle").value=selected.subtitle;
 renderSceneList();
 applySceneCamera(selected);
 $("subtitle").textContent=selected.subtitle;
}
function updateSelectedScene(patch){
 if(selectedSceneId===null)return;
 clips=updateScene(clips,selectedSceneId,patch);
 total=getTimelineDuration(clips);
 renderSceneList();
 const selected=clips.find(scene=>scene.id===selectedSceneId);
 $("selectedSceneName").textContent="المشهد "+selected.id+" — "+selected.text;
 $("time").textContent="00:00 / "+total+" sec";
 $("subtitle").textContent=selected.subtitle;
 applySceneCamera(selected);
}
function applySceneCamera(sceneData){
 if(!camera||!controls)return;
 if(sceneData.camera==="close")camera.position.set(.4,2.6,3.4);
 else if(sceneData.camera==="tracking")camera.position.set(3,2.3,4.6);
 else camera.position.set(4,3,7);
 controls.target.set(0,1.2,0);
 controls.update();
}
function escapeText(s){return s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function animateScene(item,t){
 const run=item.motion==="run",walk=item.motion==="walk",shock=item.motion==="shock";
 const speed=run?13:walk?7:0,amount=run?1:walk?.48:0;
 arms[0].rotation.x=speed?Math.sin(t*speed)*amount:0;arms[1].rotation.x=-arms[0].rotation.x;
 legs[0].rotation.x=-arms[0].rotation.x*.8;legs[1].rotation.x=arms[0].rotation.x*.8;
 arms[0].rotation.z=shock?.9:.12;arms[1].rotation.z=shock?-.9:-.12;
 actor.position.y=run?Math.abs(Math.sin(t*13))*.08:0;
 actor.position.z=run?-Math.sin(t*13)*.18:walk?-Math.sin(t*7)*.08:0;
 if(item.lighting==="blackout"){light.intensity=.08;scene.background.set(0x010208);}
 else if(item.lighting==="warm"){light.intensity=2.8;light.color.set(0xffa65e);scene.background.set(0x17100c);}
 else{light.intensity=2.4;light.color.set(0xffbd86);scene.background.set(0x070a11);}
 const cameraName={wide:"WIDE SHOT",tracking:"ACTION TRACKING",close:"CLOSE-UP"}[item.camera];
 $("camera").textContent="CAM "+String(item.id).padStart(2,"0")+" · "+cameraName;
 $("subtitle").textContent=item.subtitle;
}
function loop(){
 requestAnimationFrame(loop);
 if(playing){
  elapsed+=1/60;
  const frame=getSceneAtTime(clips,elapsed);
  if(frame){if(frame.scene.id!==lastSceneId){lastSceneId=frame.scene.id;applySceneCamera(frame.scene);}animateScene(frame.scene,frame.localTime);}
  const pct=Math.min(100,elapsed/total*100);$("timeline").style.width=pct+"%";$("time").textContent=Math.floor(elapsed)+" / "+total+" sec";
  if(elapsed>=total){playing=false;if(recorder&&recorder.state!=="inactive")recorder.stop();}
 }
 controls.update();renderer.render(scene,camera);
}
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),30000);}
async function exportFilm(){
 if(!clips.length&&!analyse())return;
 if(!renderer.domElement.captureStream||!window.MediaRecorder){alert("المتصفح لا يدعم تسجيل Canvas. استخدم Chrome أو Edge.");return;}
 total=getTimelineDuration(clips);
 if(!Number.isFinite(total)||total<=0){$("progressText").textContent="أدخل مشهداً واحداً على الأقل.";return;}
 $("export").disabled=true;$("progress").hidden=false;$("progressText").textContent="جاري تسجيل المشاهد ثلاثية الأبعاد…";$("bar").style.width="0%";
 elapsed=0;lastSceneId=null;playing=true;chunks=[];
 const stream=renderer.domElement.captureStream(30);
 const mime=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm";
 try{
  recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8000000});
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onstop=async()=>{
   playing=false;stream.getTracks().forEach(t=>t.stop());const webm=new Blob(chunks,{type:"video/webm"});
   if(webm.size<10000){$("progressText").textContent="فشل التسجيل: الملف الناتج فارغ.";$("export").disabled=false;return;}
   $("progressText").textContent="جاري تحويل التسجيل إلى MP4 عبر FFmpeg…";
   try{const form=new FormData();form.append("video",webm,"film.webm");const response=await fetch("/api/render/mp4",{method:"POST",body:form});if(!response.ok)throw new Error("خادم FFmpeg غير متاح أو فشل التحويل");const mp4=await response.blob();if(mp4.type!=="video/mp4"||mp4.size<10000)throw new Error("ملف MP4 غير صالح");download(mp4,"StickMotion_Film.mp4");$("progressText").textContent="تم إنشاء وتنزيل MP4 حقيقي.";$("bar").style.width="100%";}
   catch(err){download(webm,"StickMotion_Preview.webm");$("progressText").textContent="تم تنزيل WebM فقط. "+err.message;}
   $("export").disabled=false;
  };
  recorder.start(250);
 }catch(err){playing=false;$("export").disabled=false;$("progressText").textContent="تعذر التسجيل: "+err.message;}
}
$("analyse").onclick=analyse;
$("duration").oninput=e=>{
 seconds=normalizeDuration(e.target.value);$("seconds").textContent=seconds+" ث";
 if(clips.length){clips=setAllDurations(clips,seconds);total=getTimelineDuration(clips);renderSceneList();if(selectedSceneId!==null)selectScene(selectedSceneId);$("time").textContent="00:00 / "+total+" sec";}
};
$("scenes").addEventListener("click",e=>{const card=e.target.closest("[data-scene-id]");if(card)selectScene(Number(card.dataset.sceneId));});
$("sceneMotion").onchange=e=>updateSelectedScene({motion:e.target.value});
$("sceneCamera").onchange=e=>updateSelectedScene({camera:e.target.value});
$("sceneLighting").onchange=e=>updateSelectedScene({lighting:e.target.value});
$("sceneDuration").oninput=e=>{const value=normalizeDuration(e.target.value);$("sceneDurationText").textContent=value+" ث";updateSelectedScene({duration:value});};
$("sceneSubtitle").oninput=e=>updateSelectedScene({subtitle:e.target.value});
$("export").onclick=exportFilm;
init();analyse();
