import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import "./style.css";

const root = document.querySelector("#app");
root.innerHTML = '<header><div class="brand">STICKMOTION <b>AI</b><small>CINEMATIC 3D FILM STUDIO</small></div><span id="status">جاهز</span></header><main><aside><h1>من النص إلى الفيلم</h1><p>اكتب كل مشهد في سطر مستقل.</p><textarea id="script">المشهد 1: البطل يمشي في النفق المظلم ويفكر في أخته المريضة.\\nالمشهد 2: يسمع صوتاً غريباً ويبدأ بالركض نحو المصعد السري.\\nالمشهد 3: تنطفئ أضواء District 9 بالكامل، فيتوقف البطل مصدوماً.</textarea><button id="analyse">تحليل المشاهد</button><div id="scenes"></div><label>مدة المشهد <b id="seconds">6 ث</b></label><input id="duration" type="range" min="3" max="12" value="6"><button id="export" class="primary">إنشاء الفيلم وتصديره</button><div id="progress" hidden><span id="progressText">جاري التسجيل…</span><div class="bar"><i id="bar"></i></div></div><p class="note">تُسجّل المعاينة الحقيقية من WebGL. يتطلب MP4 تشغيل خادم FFmpeg.</p></aside><section><div class="camera" id="camera">CAM 01 · WIDE SHOT</div><div id="viewport"></div><div class="subtitle" id="subtitle">المدينة غارقة في الظلام…</div><div class="timeline"><i id="timeline"></i></div><div class="time" id="time">00:00</div></section></main><footer>STICKMOTION AI · DEVELOPMENT BUILD</footer>';

const $ = id => document.getElementById(id);
const viewport = $("viewport");
let scene, camera, renderer, controls, actor, arms=[], legs=[], light;
let clips=[], seconds=6, elapsed=0, total=0, playing=false, recorder, chunks=[];
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
 clips=$("script").value.split(/\\n+/).map(x=>x.trim()).filter(Boolean).slice(0,20).map((text,i)=>({text:text.replace(/^((scene|المشهد)\\s*\\d*\\s*[:：-]?\\s*)/i,""),id:i+1}));
 seconds=Number($("duration").value);total=clips.length*seconds;
 $("scenes").innerHTML=clips.map(s=>'<article><b>SCENE '+s.id+'</b><span>'+escapeText(s.text)+'</span></article>').join("");
 $("status").textContent=clips.length+" مشاهد جاهزة";
 $("time").textContent="00:00 / "+total+" sec";
 return clips.length>0;
}
function escapeText(s){return s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function animateScene(index,t){
 const text=clips[index].text.toLowerCase(),run=/run|running|يركض|يجري|الهروب/.test(text),shock=/shock|صدمة|مصدوم|خوف|انطف|انقطع/.test(text);
 const motion=run?1.0:shock?0:.48;
 arms[0].rotation.x=Math.sin(t*(run?13:7))*motion;arms[1].rotation.x=-arms[0].rotation.x;
 legs[0].rotation.x=-arms[0].rotation.x*.8;legs[1].rotation.x=arms[0].rotation.x*.8;
 arms[0].rotation.z=shock?.9:.12;arms[1].rotation.z=shock?-.9:-.12;
 actor.position.y=run?Math.abs(Math.sin(t*13))*.08:0;actor.position.z=run?-t*.25:0;
 light.intensity=shock?.12:2.4;
 $("camera").textContent="CAM "+String(index+1).padStart(2,"0")+" · "+(run?"ACTION TRACKING":shock?"EXTREME CLOSE-UP":"WIDE DOLLY SHOT");
 $("subtitle").textContent=clips[index].text;
}
function loop(){
 requestAnimationFrame(loop);
 if(playing){elapsed+=1/60;const idx=Math.min(clips.length-1,Math.floor(elapsed/seconds));animateScene(idx,elapsed-idx*seconds);
 const pct=Math.min(100,elapsed/total*100);$("timeline").style.width=pct+"%";$("time").textContent=Math.floor(elapsed)+" / "+total+" sec";
 if(elapsed>=total){playing=false;if(recorder&&recorder.state!=="inactive")recorder.stop();}
 }
 controls.update();renderer.render(scene,camera);
}
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),30000);}
async function exportFilm(){
 if(!clips.length&&!analyse())return;
 if(!renderer.domElement.captureStream||!window.MediaRecorder){alert("المتصفح لا يدعم تسجيل Canvas. استخدم Chrome أو Edge.");return;}
 seconds=Number($("duration").value);total=clips.length*seconds;
 if(!Number.isFinite(total)||total<=0){$("progressText").textContent="أدخل مشهداً واحداً على الأقل.";return;}
 $("export").disabled=true;$("progress").hidden=false;$("progressText").textContent="جاري تسجيل المشاهد ثلاثية الأبعاد…";$("bar").style.width="0%";
 elapsed=0;playing=true;chunks=[];
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
 seconds=Number(e.target.value);$("seconds").textContent=seconds+" ث";
 if(clips.length){total=clips.length*seconds;$("time").textContent="00:00 / "+total+" sec";}
};
$("export").onclick=exportFilm;
init();analyse();
