AFRAME.registerComponent('office-ar-controller',{init:function(){
  const root=this.el;
  const sourceEls=[document.getElementById('paperOne'),document.getElementById('paperTwo')];
  const instructions=['Tap the hovering paper ball on the desk','Now tap the paper ball beside the bin','Desk cleared—the photograph remains the environment'];
  const confirmations=['Paper tossed into the bin','Both paper balls cleared'];
  const instruction=document.getElementById('instruction');
  const progressBar=document.getElementById('progressBar');
  const progressCount=document.getElementById('progressCount');
  const spatialHint=document.getElementById('spatialHint');
  const undo=document.getElementById('undoAr');
  const bin=document.getElementById('binTarget');
  const states=[
    {position:'.18 -.195 .035',scale:'.09 .09 .09',hover:'property: position; from: .18 -.195 .035; to: .18 -.18 .05; dur: 1150; dir: alternate; loop: true; easing: easeInOutSine',turn:'property: rotation; from: -8 0 -6; to: 8 22 7; dur: 2300; dir: alternate; loop: true; easing: easeInOutSine'},
    {position:'.325 -.275 .035',scale:'.085 .085 .085',hover:'property: position; from: .325 -.275 .035; to: .325 -.26 .05; dur: 1250; dir: alternate; loop: true; easing: easeInOutSine',turn:'property: rotation; from: 5 -12 4; to: -9 18 -8; dur: 2500; dir: alternate; loop: true; easing: easeInOutSine'}
  ];
  let step=0,tracking=false,busy=false,audioContext=null;

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
      el.setAttribute('animation__hover',states[index].hover);
      el.setAttribute('animation__turn',states[index].turn);
      setVisible(el,active);
      el.classList.toggle('clickable',active);
    });
    setVisible(bin,step<2);
    busy=false;
    instruction.textContent=tracking?instructions[step]:'Find the office poster to continue';
    spatialHint.textContent=step===2?'The AR enhanced objects that already existed in the image.':'The digital paper is aligned with a paper ball in the photograph.';
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
  sourceEls.forEach((el,index)=>el.addEventListener('click',()=>{
    if(index!==step||busy)return;
    busy=true;
    el.classList.remove('clickable');
    el.removeAttribute('animation__hover');
    el.removeAttribute('animation__turn');
    const start=el.object3D.position;
    el.setAttribute('animation__fly',`property: position; from: ${start.x} ${start.y} ${start.z}; to: .415 -.255 .075; dur: 720; easing: easeInQuad`);
    el.setAttribute('animation__shrink','property: scale; to: .015 .015 .015; dur: 720; easing: easeInQuad');
    el.setAttribute('animation__spin','property: rotation; to: 210 360 160; dur: 720; easing: easeInQuad');
    playSuccessSound();
    toast(confirmations[index]);
    setTimeout(()=>{step++;render();},760);
  }));
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
