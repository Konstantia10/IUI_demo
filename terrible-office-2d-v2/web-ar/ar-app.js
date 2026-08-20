AFRAME.registerComponent('office-ar-controller',{init:function(){
  const root=this.el;
  const taskSources=['paperOne','paperTwo','tissue','mug','documents'];
  const destinations=['bin','bin','spill',null,'shelf'];
  const instructions=[
    'Drag Paper 1 into the glowing bin',
    'Drag Paper 2 into the glowing bin',
    'Drag the tissue across to the spill',
    'Tap the mug to stand it upright',
    'Drag the documents onto the shelf',
    'Office cleanup complete! Walk around the poster to inspect it.'
  ];
  const confirmations=['First paper binned','Both papers binned','Coffee spill cleaned','Mug placed upright','Documents shelved'];
  let step=0,selected=false,tracking=false,dragSource=null,dragMoved=false,suppressClick=false;

  const sourceEls=taskSources.map(id=>document.getElementById(id));
  const bin=document.getElementById('binTarget');
  const spill=document.getElementById('spillTarget');
  const shelf=document.getElementById('shelfTarget');
  const targetEls={bin,spill,shelf};
  const instruction=document.getElementById('instruction');
  const progressBar=document.getElementById('progressBar');
  const progressCount=document.getElementById('progressCount');
  const undo=document.getElementById('undoAr');
  const camera=document.querySelector('a-camera');
  const dragSurface=document.getElementById('dragSurface');
  const originalPositions=sourceEls.map(el=>el.object3D.position.clone());

  const setVisible=(el,value)=>el?.setAttribute('visible',value);
  const render=()=>{
    sourceEls.forEach((el,index)=>{setVisible(el,index===step&&step<5);el.object3D.position.copy(originalPositions[index]);});
    Object.values(targetEls).forEach(el=>setVisible(el,false));
    if(step<5&&destinations[step])setVisible(targetEls[destinations[step]],true);
    selected=false;
    dragSource=null;
    instruction.textContent=tracking?instructions[step]:'Find the office poster to continue';
    progressBar.style.width=`${step*20}%`;
    progressCount.textContent=`${step} / 5`;
    undo.disabled=step===0;
  };
  const toast=message=>{const el=document.getElementById('toast');el.textContent=message;el.hidden=false;clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.hidden=true,1500);};
  const burst=()=>{const el=document.getElementById('successBurst');el.removeAttribute('animation__fade');setVisible(el,true);el.setAttribute('animation__fade','property: components.material.material.opacity; from: 1; to: 0; dur: 700');setTimeout(()=>setVisible(el,false),720);};
  const complete=()=>{if(step>=5)return;toast(confirmations[step]);burst();step++;render();};

  const finishDrag=()=>{
    if(!dragSource)return;
    const destinationName=destinations[step];
    const destination=destinationName&&targetEls[destinationName];
    const sourceIndex=step;
    const closeEnough=destination&&dragSource.object3D.position.distanceTo(destination.object3D.position)<.13;
    suppressClick=dragMoved;
    dragSource=null;
    if(closeEnough)complete();else{
      sourceEls[sourceIndex].object3D.position.copy(originalPositions[sourceIndex]);
      if(dragMoved)toast(`Drop it inside the glowing ${destinationName}.`);
    }
    setTimeout(()=>suppressClick=false,80);
  };

  sourceEls.forEach((el,index)=>el.addEventListener('mousedown',()=>{
    if(index!==step||destinations[step]===null)return;
    dragSource=el;
    dragMoved=false;
    selected=true;
    targetEls[destinations[step]].setAttribute('material','opacity',.95);
  }));
  window.addEventListener('mouseup',finishDrag);
  window.addEventListener('pointerup',finishDrag);

  // Native canvas dragging for mouse/trackpad/touch. This avoids relying on
  // A-Frame's synthetic mousedown events, which vary between browsers.
  const attachNativeDrag=()=>{
    const canvas=root.sceneEl.canvas;
    if(!canvas||canvas.dataset.officeDragBound)return;
    canvas.dataset.officeDragBound='true';
    const nativeRaycaster=new THREE.Raycaster();
    const pointer=new THREE.Vector2();
    const cameraObject=camera.getObject3D('camera');
    const pointerToPoster=(event)=>{
      const rect=canvas.getBoundingClientRect();
      pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
      pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
      nativeRaycaster.setFromCamera(pointer,cameraObject);
      const hit=nativeRaycaster.intersectObject(dragSurface.object3D,true)[0];
      return hit?root.object3D.worldToLocal(hit.point.clone()):null;
    };
    const closeToActiveSource=(event)=>{
      if(step>=5||destinations[step]===null)return false;
      const rect=canvas.getBoundingClientRect();
      const world=new THREE.Vector3();
      sourceEls[step].object3D.getWorldPosition(world);
      world.project(cameraObject);
      const x=rect.left+(world.x+1)*rect.width/2;
      const y=rect.top+(-world.y+1)*rect.height/2;
      return Math.hypot(event.clientX-x,event.clientY-y)<=70;
    };
    canvas.addEventListener('pointerdown',event=>{
      if(!tracking||!closeToActiveSource(event))return;
      event.preventDefault();
      event.stopPropagation();
      canvas.setPointerCapture(event.pointerId);
      dragSource=sourceEls[step];
      dragMoved=false;
      selected=true;
      canvas.classList.add('drag-active');
      targetEls[destinations[step]].setAttribute('material','opacity',.95);
    },true);
    canvas.addEventListener('pointermove',event=>{
      if(!dragSource)return;
      event.preventDefault();
      const local=pointerToPoster(event);
      if(!local)return;
      const origin=originalPositions[step];
      dragMoved=dragMoved||Math.hypot(local.x-origin.x,local.y-origin.y)>.012;
      dragSource.object3D.position.set(local.x,local.y,.035);
    },true);
    const endNativeDrag=event=>{
      if(!dragSource)return;
      event.preventDefault();
      canvas.classList.remove('drag-active');
      finishDrag();
    };
    canvas.addEventListener('pointerup',endNativeDrag,true);
    canvas.addEventListener('pointercancel',endNativeDrag,true);
  };
  if(root.sceneEl.hasLoaded)attachNativeDrag();else root.sceneEl.addEventListener('renderstart',attachNativeDrag,{once:true});

  sourceEls.forEach((el,index)=>el.addEventListener('click',()=>{
    if(index!==step||suppressClick)return;
    if(destinations[step]===null){complete();return;}
    selected=true;
    el.setAttribute('material','color','#ffffff');
    targetEls[destinations[step]].setAttribute('material','color','#8bffb0');
    targetEls[destinations[step]].setAttribute('material','opacity',.95);
    toast(`Selected. Now tap the ${destinations[step]}.`);
  }));
  Object.entries(targetEls).forEach(([name,el])=>el.addEventListener('click',()=>{
    if(selected&&destinations[step]===name)complete();
    else toast('Select the highlighted object first.');
  }));
  root.addEventListener('targetFound',()=>{tracking=true;document.getElementById('trackingBadge').textContent='Poster locked';document.getElementById('trackingBadge').className='tracking found';render();});
  root.addEventListener('targetLost',()=>{tracking=false;document.getElementById('trackingBadge').textContent='Move back to the poster…';document.getElementById('trackingBadge').className='tracking searching';instruction.textContent='Reacquiring the office poster…';});
  undo.addEventListener('click',()=>{if(step>0){step--;render();toast('Last AR action undone');}});
  document.getElementById('resetAr').addEventListener('click',()=>{step=0;render();toast('Cleanup reset');});
  this.tickDrag=()=>{
    if(!dragSource||!camera.components.raycaster)return;
    const hit=camera.components.raycaster.intersections.find(intersection=>intersection.object?.el===dragSurface);
    if(!hit)return;
    const local=root.object3D.worldToLocal(hit.point.clone());
    const origin=originalPositions[step];
    dragMoved=dragMoved||Math.hypot(local.x-origin.x,local.y-origin.y)>.012;
    dragSource.object3D.position.set(local.x,local.y,.035);
  };
  render();
},tick:function(){this.tickDrag?.();}});

document.addEventListener('DOMContentLoaded',()=>{
  const scene=document.getElementById('arScene');
  const target=document.getElementById('officeTarget');
  const welcome=document.getElementById('welcome');
  const startStatus=document.getElementById('startStatus');
  let readyTimer;
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
  if(scene.hasLoaded)makeCameraVisible();else scene.addEventListener('renderstart',makeCameraVisible,{once:true});
  document.getElementById('showTarget').onclick=()=>document.getElementById('targetPreview').hidden=false;
  document.getElementById('openTargetDuringScan').onclick=()=>document.getElementById('targetPreview').hidden=false;
  document.getElementById('closeTarget').onclick=()=>document.getElementById('targetPreview').hidden=true;
  scene.addEventListener('arReady',()=>{
    clearTimeout(readyTimer);
    makeCameraVisible();
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
