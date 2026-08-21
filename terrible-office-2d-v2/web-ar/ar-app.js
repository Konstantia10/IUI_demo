AFRAME.registerComponent('office-ar-controller',{init:function(){
  const root=this.el;
  const taskSources=['chair','screen','books','storageBox','plant'];
  const destinations=['chairSpot','screenSpot','booksSpot','boxSpot','plantSpot'];
  const instructions=[
    'Select the office chair, then its place under the desk',
    'Place the monitor on the desktop',
    'Move the books onto the bookcase',
    'Store the open box beside the desk',
    'Finish the office by placing the plant on the desk',
    'Office assembled—move left and right to inspect the models'
  ];
  const confirmations=['Chair positioned','Monitor installed','Books shelved','Box stored','Plant placed'];
  const sourceEls=taskSources.map(id=>document.getElementById(id));
  const targetEls={
    chairSpot:document.getElementById('chairTarget'),
    screenSpot:document.getElementById('screenTarget'),
    booksSpot:document.getElementById('booksTarget'),
    boxSpot:document.getElementById('boxTarget'),
    plantSpot:document.getElementById('plantTarget')
  };
  const destinationLabels={chairSpot:'chair position',screenSpot:'desktop',booksSpot:'bookcase',boxSpot:'storage position',plantSpot:'plant position'};
  const instruction=document.getElementById('instruction');
  const progressBar=document.getElementById('progressBar');
  const progressCount=document.getElementById('progressCount');
  const spatialHint=document.getElementById('spatialHint');
  const undo=document.getElementById('undoAr');
  const successBurst=document.getElementById('successBurst');
  const cleanOfficeReveal=document.getElementById('cleanOfficeReveal');
  const originalPositions=sourceEls.map(el=>el.object3D.position.clone());
  const originalRotations=sourceEls.map(el=>el.object3D.rotation.clone());
  const placedPositions=[
    new THREE.Vector3(.015,.385,-.025),
    new THREE.Vector3(-.08,.575,.025),
    new THREE.Vector3(.145,.435,.015),
    new THREE.Vector3(-.29,.385,.075),
    new THREE.Vector3(.045,.575,.075)
  ];
  let step=0,selected=false,tracking=false,audioContext=null;

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
  const resetHalos=()=>{
    root.querySelectorAll('.ar-source a-ring').forEach(el=>el.setAttribute('material','color','#65d6ff'));
    Object.values(targetEls).forEach(el=>el.querySelector('a-ring')?.setAttribute('material','color','#8bffb0'));
  };
  const render=()=>{
    sourceEls.forEach((el,index)=>{
      const completed=index<step;
      const active=index===step&&step<5;
      setVisible(el,completed||active);
      el.object3D.position.copy(completed?placedPositions[index]:originalPositions[index]);
      el.object3D.rotation.copy(originalRotations[index]);
      el.classList.toggle('clickable',active);
      setVisible(el.querySelector('a-ring'),active);
    });
    Object.values(targetEls).forEach(el=>setVisible(el,false));
    if(step<5&&destinations[step])setVisible(targetEls[destinations[step]],true);
    setVisible(cleanOfficeReveal,step===5);
    selected=false;
    resetHalos();
    instruction.textContent=tracking?instructions[step]:'Find the office poster to continue';
    spatialHint.textContent=step===5
      ? 'Change viewpoint to inspect the completed 3D office.'
      : 'Move sideways to compare the foreground and background models.';
    progressBar.style.width=`${step*20}%`;
    progressCount.textContent=`${step} / 5`;
    undo.disabled=step===0;
  };
  const playSuccessSound=sourceIndex=>{
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
  const burst=position=>{
    successBurst.object3D.position.copy(position);
    const ring=successBurst.querySelector('a-ring');
    ring.removeAttribute('animation__expand');
    ring.removeAttribute('animation__fade');
    setVisible(successBurst,true);
    requestAnimationFrame(()=>{
      ring.setAttribute('animation__expand','property: scale; from: .2 .2 .2; to: 2 2 2; dur: 600; easing: easeOutCubic');
      ring.setAttribute('animation__fade','property: components.material.material.opacity; from: 1; to: 0; dur: 650');
    });
    setTimeout(()=>setVisible(successBurst,false),680);
  };
  const complete=()=>{
    if(step>=5)return;
    const completedStep=step;
    const destinationName=destinations[completedStep];
    const feedbackEl=destinationName?targetEls[destinationName]:sourceEls[completedStep];
    toast(confirmations[completedStep]);
    burst(feedbackEl.object3D.position);
    playSuccessSound(completedStep);
    step++;
    render();
  };

  sourceEls.forEach((el,index)=>el.addEventListener('click',()=>{
    if(index!==step)return;
    if(destinations[step]===null){complete();return;}
    selected=true;
    el.querySelector('a-ring')?.setAttribute('material','color','#ffffff');
    targetEls[destinations[step]].querySelector('a-ring')?.setAttribute('material','color','#ffffff');
    instruction.textContent=`Now tap the glowing ${destinationLabels[destinations[step]]}`;
    toast(`Selected—find the ${destinationLabels[destinations[step]]}.`);
  }));
  Object.entries(targetEls).forEach(([name,el])=>el.addEventListener('click',()=>{
    if(selected&&destinations[step]===name)complete();
    else toast('Tap the glowing object first.');
  }));
  root.addEventListener('targetFound',()=>{
    tracking=true;
    document.getElementById('trackingBadge').textContent='Portal anchored';
    document.getElementById('trackingBadge').className='tracking found';
    render();
  });
  root.addEventListener('targetLost',()=>{
    tracking=false;
    document.getElementById('trackingBadge').textContent='Move back to the poster…';
    document.getElementById('trackingBadge').className='tracking searching';
    instruction.textContent='Reacquiring the office poster…';
  });
  undo.addEventListener('click',()=>{if(step>0){step--;render();toast('Last action undone');}});
  document.getElementById('resetAr').addEventListener('click',()=>{step=0;render();toast('Cleanup reset');});
  render();
}});

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
