AFRAME.registerComponent('restoration-patch',{
  schema:{
    src:{type:'selector'},
    uMin:{type:'number'},uMax:{type:'number'},
    vMin:{type:'number'},vMax:{type:'number'}
  },
  init:function(){
    const data=this.data;
    const texture=new THREE.TextureLoader().load(data.src.getAttribute('src'));
    texture.colorSpace=THREE.SRGBColorSpace;
    this.el.getObject3D('mesh').material=new THREE.ShaderMaterial({
      uniforms:{map:{value:texture},crop:{value:new THREE.Vector4(data.uMin,data.vMin,data.uMax,data.vMax)}},
      vertexShader:'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform sampler2D map; uniform vec4 crop; varying vec2 vUv; void main(){vec2 sampleUv=mix(crop.xy,crop.zw,vUv); vec4 color=texture2D(map,sampleUv); float gray=dot(color.rgb,vec3(.299,.587,.114)); color.rgb=vec3(gray); float edge=min(min(vUv.x,1.0-vUv.x),min(vUv.y,1.0-vUv.y)); color.a*=smoothstep(0.0,.18,edge); gl_FragColor=color;}',
      transparent:true,
      depthTest:false,
      depthWrite:false
    });
  }
});

AFRAME.registerComponent('grayscale-sprite',{
  schema:{src:{type:'selector'}},
  init:function(){
    const texture=new THREE.TextureLoader().load(this.data.src.getAttribute('src'));
    texture.colorSpace=THREE.SRGBColorSpace;
    this.el.getObject3D('mesh').material=new THREE.ShaderMaterial({
      uniforms:{map:{value:texture}},
      vertexShader:'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform sampler2D map; varying vec2 vUv; void main(){vec4 color=texture2D(map,vUv); float gray=dot(color.rgb,vec3(.299,.587,.114)); gl_FragColor=vec4(vec3(gray),color.a);}',
      transparent:true,
      alphaTest:.025,
      depthTest:false,
      depthWrite:false,
      side:THREE.DoubleSide
    });
  }
});

AFRAME.registerComponent('office-ar-controller',{init:function(){
  const root=this.el;
  const sourceEls=[document.getElementById('paperOne'),document.getElementById('paperTwo')];
  const instructions=['Drag the paper ball into the photographed bin','Now drag the second paper ball into the bin','Desk cleared—the photograph remains the environment'];
  const confirmations=['Paper tossed into the bin','Both paper balls cleared'];
  const instruction=document.getElementById('instruction');
  const progressBar=document.getElementById('progressBar');
  const progressCount=document.getElementById('progressCount');
  const spatialHint=document.getElementById('spatialHint');
  const undo=document.getElementById('undoAr');
  const bin=document.getElementById('binTarget');
  const restorationPatches=[document.getElementById('paperOnePatch'),document.getElementById('paperTwoPatch')];
  const states=[
    // Coordinates measured from the 1448 x 1086 target. MindAR's target plane is 1 x .75.
    {position:'.149 -.196 .003',scale:'.064 .064 .064',pulse:'property: scale; from: .061 .061 .061; to: .067 .067 .067; dur: 900; dir: alternate; loop: true; easing: easeInOutSine'},
    {position:'.191 -.288 .003',scale:'.061 .061 .061',pulse:'property: scale; from: .058 .058 .058; to: .064 .064 .064; dur: 980; dir: alternate; loop: true; easing: easeInOutSine'}
  ];
  let step=0,tracking=false,busy=false,audioContext=null,drag=null;

  this.enableAudio=()=>{
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(AudioContext&&!audioContext)audioContext=new AudioContext();
    audioContext?.resume();
  };

  const setVisible=(el,value)=>el?.setAttribute('visible',value);
  const toast=message=>{
    const el=document.getElementById('toast');
    el.textContent=message;
    el.hidden=false;
    clearTimeout(this.toastTimer);
    this.toastTimer=setTimeout(()=>el.hidden=true,1500);
  };
  const render=()=>{
    sourceEls.forEach((el,index)=>{
      const active=index===step&&step<2;
      el.removeAttribute('animation__fly');
      el.removeAttribute('animation__shrink');
      el.removeAttribute('animation__spin');
      el.setAttribute('position',states[index].position);
      el.setAttribute('scale',states[index].scale);
      el.setAttribute('animation__pulse',states[index].pulse);
      el.removeAttribute('animation__hover');
      el.removeAttribute('animation__turn');
      setVisible(el,active);
      el.classList.toggle('clickable',active);
      setVisible(restorationPatches[index],step>index);
    });
    setVisible(bin,step<2);
    busy=false;
    instruction.textContent=tracking?instructions[step]:'Find the office poster to continue';
    spatialHint.textContent=step===2?'The AR enhanced objects that already existed in the image.':'Press the highlighted paper, move your finger to the real bin, then release.';
    progressBar.style.width=`${step*50}%`;
    progressCount.textContent=`${step} / 2`;
    undo.disabled=step===0;
  };
  const playSuccessSound=()=>{
    if(!audioContext)return;
    const now=audioContext.currentTime;
    [523.25,659.25].forEach((frequency,note)=>{
      const oscillator=audioContext.createOscillator();
      const gain=audioContext.createGain();
      oscillator.frequency.value=frequency;
      gain.gain.setValueAtTime(.0001,now+note*.09);
      gain.gain.exponentialRampToValueAtTime(.09,now+note*.09+.018);
      gain.gain.exponentialRampToValueAtTime(.0001,now+note*.09+.22);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now+note*.09);
      oscillator.stop(now+note*.09+.23);
    });
    navigator.vibrate?.(35);
  };
  const completeDrop=(el,index)=>{
    busy=true;
    el.classList.remove('clickable');
    el.removeAttribute('animation__pulse');
    playSuccessSound();
    toast(confirmations[index]);
    bin.setAttribute('animation__catch','property: scale; from: 1 1 1; to: 1.055 .94 1; dur: 180; dir: alternate; loop: 2; easing: easeOutQuad');

    // A short ballistic arc. Keeping rotation on the Z axis makes the flat,
    // photographic sprite visibly tumble instead of turning edge-on.
    const start=el.object3D.position.clone();
    const startScale=el.object3D.scale.x;
    const destination={x:.376,y:-.278,z:.012};
    const duration=820;
    const started=performance.now();
    const animateThrow=now=>{
      const t=Math.min((now-started)/duration,1);
      const eased=t*t*(3-2*t);
      const gravityArc=.115*4*t*(1-t);
      const cameraArc=.055*Math.sin(Math.PI*t);
      const x=start.x+(destination.x-start.x)*eased;
      const y=start.y+(destination.y-start.y)*eased+gravityArc;
      const z=start.z+(destination.z-start.z)*eased+cameraArc;
      const scale=startScale+(0.028-startScale)*eased;
      el.object3D.position.set(x,y,z);
      el.object3D.rotation.set(0,0,THREE.MathUtils.degToRad(720*t));
      el.object3D.scale.setScalar(scale);
      if(t<1)requestAnimationFrame(animateThrow);
      else{
        bin.removeAttribute('animation__catch');
        bin.setAttribute('scale','1 1 1');
        step++;
        render();
      }
    };
    requestAnimationFrame(animateThrow);
  };

  // Convert a screen touch into the tracked image's local coordinate system. This
  // keeps dragging registered even while the phone and target are both moving.
  const screenToTarget=(event)=>{
    const scene=root.sceneEl;
    if(!scene?.camera||!scene.canvas)return null;
    const rect=scene.canvas.getBoundingClientRect();
    const pointer=new THREE.Vector2(
      ((event.clientX-rect.left)/rect.width)*2-1,
      -((event.clientY-rect.top)/rect.height)*2+1
    );
    const raycaster=new THREE.Raycaster();
    raycaster.setFromCamera(pointer,scene.camera);
    const plane=new THREE.Plane();
    const normal=new THREE.Vector3(0,0,1).transformDirection(root.object3D.matrixWorld);
    const origin=new THREE.Vector3().setFromMatrixPosition(root.object3D.matrixWorld);
    plane.setFromNormalAndCoplanarPoint(normal,origin);
    const worldPoint=new THREE.Vector3();
    if(!raycaster.ray.intersectPlane(plane,worldPoint))return null;
    return root.object3D.worldToLocal(worldPoint);
  };
  const onPointerDown=event=>{
    if(!tracking||busy||step>1)return;
    const point=screenToTarget(event);
    const el=sourceEls[step];
    if(!point||point.distanceTo(el.object3D.position)>.095)return;
    event.preventDefault();
    this.enableAudio();
    el.removeAttribute('animation__pulse');
    el.setAttribute('scale','.072 .072 .072');
    bin.setAttribute('animation__ready','property: rotation; from: 0 0 -1.3; to: 0 0 1.3; dur: 190; dir: alternate; loop: true; easing: easeInOutSine');
    drag={pointerId:event.pointerId,el,index:step};
    scene.canvas?.setPointerCapture?.(event.pointerId);
    toast('Move to the bin and release');
  };
  const onPointerMove=event=>{
    if(!drag||event.pointerId!==drag.pointerId)return;
    event.preventDefault();
    const point=screenToTarget(event);
    if(point)drag.el.setAttribute('position',`${point.x} ${point.y} .055`);
  };
  const onPointerUp=event=>{
    if(!drag||event.pointerId!==drag.pointerId)return;
    const current=drag;
    drag=null;
    bin.removeAttribute('animation__ready');
    bin.setAttribute('rotation','0 0 0');
    const point=screenToTarget(event)||current.el.object3D.position;
    const inBin=Math.hypot(point.x-.376,point.y+.278)<.105;
    if(inBin)completeDrop(current.el,current.index);
    else{
      current.el.setAttribute('position',states[current.index].position);
      current.el.setAttribute('scale',states[current.index].scale);
      current.el.setAttribute('animation__pulse',states[current.index].pulse);
      toast('Drop it inside the glowing bin');
    }
  };
  const scene=root.sceneEl;
  scene.addEventListener('pointerdown',onPointerDown,{passive:false});
  scene.addEventListener('pointermove',onPointerMove,{passive:false});
  scene.addEventListener('pointerup',onPointerUp,{passive:false});
  scene.addEventListener('pointercancel',onPointerUp,{passive:false});
  root.addEventListener('targetFound',()=>{
    tracking=true;
    document.getElementById('trackingBadge').textContent='Objects aligned';
    document.getElementById('trackingBadge').className='tracking found';
    render();
  });
  root.addEventListener('targetLost',()=>{
    tracking=false;
    document.getElementById('trackingBadge').textContent='Move back to the poster…';
    document.getElementById('trackingBadge').className='tracking searching';
    instruction.textContent='Reacquiring the office poster…';
  });
  undo.addEventListener('click',()=>{if(step>0&&!busy){step--;render();toast('Last action undone');}});
  document.getElementById('resetAr').addEventListener('click',()=>{step=0;render();toast('Cleanup reset');});
  render();
}});

document.addEventListener('DOMContentLoaded',()=>{
  const scene=document.getElementById('arScene');
  const target=document.getElementById('officeTarget');
  const welcome=document.getElementById('welcome');
  const startStatus=document.getElementById('startStatus');
  let readyTimer;
  let resizeTimer;
  const isFilePage=location.protocol==='file:';
  if(isFilePage){
    const warning=document.getElementById('launchWarning');
    warning.hidden=false;
    startStatus.textContent='This page was opened directly from disk. Camera AR requires localhost or HTTPS.';
    document.getElementById('startAr').disabled=true;
    document.getElementById('startAr').textContent='Open through localhost to start AR';
  }
  target.setAttribute('office-ar-controller','');
  const makeCameraVisible=()=>{
    if(scene.renderer){
      scene.renderer.setClearColor(0x000000,0);
      scene.renderer.setClearAlpha(0);
      scene.canvas.style.background='transparent';
    }
    document.querySelectorAll('video').forEach(video=>{
      video.style.setProperty('display','block','important');
      video.style.setProperty('visibility','visible','important');
      video.style.setProperty('opacity','1','important');
      video.style.setProperty('z-index','0','important');
    });
  };
  const refreshOrientation=()=>{
    const landscape=window.innerWidth>window.innerHeight;
    document.body.classList.toggle('is-landscape',landscape);
    document.body.classList.toggle('is-portrait',!landscape);
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      scene.resize?.();
      if(scene.renderer&&scene.canvas){
        const ratio=Math.min(window.devicePixelRatio||1,2);
        scene.renderer.setPixelRatio(ratio);
        scene.renderer.setSize(window.innerWidth,window.innerHeight,false);
      }
      makeCameraVisible();
    },250);
  };
  refreshOrientation();
  window.addEventListener('resize',refreshOrientation,{passive:true});
  window.addEventListener('orientationchange',refreshOrientation,{passive:true});
  if(scene.hasLoaded)makeCameraVisible();else scene.addEventListener('renderstart',makeCameraVisible,{once:true});
  document.getElementById('showTarget').onclick=()=>document.getElementById('targetPreview').hidden=false;
  document.getElementById('openTargetDuringScan').onclick=()=>document.getElementById('targetPreview').hidden=false;
  document.getElementById('closeTarget').onclick=()=>document.getElementById('targetPreview').hidden=true;
  scene.addEventListener('arReady',()=>{
    clearTimeout(readyTimer);
    makeCameraVisible();
    document.body.classList.add('ar-started');
    welcome.hidden=true;
    document.getElementById('trackingBadge').textContent='Camera ready — find the poster';
  });
  scene.addEventListener('arError',event=>{
    clearTimeout(readyTimer);
    welcome.hidden=false;
    startStatus.textContent=`Camera could not start${event.detail?.error?`: ${event.detail.error}`:''}. Use HTTPS, allow camera access, and close other apps using the camera.`;
  });
  document.getElementById('startAr').onclick=()=>{
    if(isFilePage)return;
    target.components['office-ar-controller']?.enableAudio?.();
    startStatus.textContent='Starting camera and loading image recognition…';
    const start=()=>{
      try{
        scene.systems['mindar-image-system'].start();
        readyTimer=setTimeout(()=>{
          if(!welcome.hidden)startStatus.textContent='Camera startup is taking too long. Confirm this page uses HTTPS and camera permission is allowed, then retry.';
        },15000);
      }catch(error){
        welcome.hidden=false;
        startStatus.textContent=`Camera could not start: ${error.message}. Use HTTPS and allow camera access.`;
      }
    };
    if(scene.hasLoaded)start();else scene.addEventListener('loaded',start,{once:true});
  };
});
