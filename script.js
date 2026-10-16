(function(){
 const $=id=>document.getElementById(id);
 const state={enabled:true,mode:'security',movement:false,alert:false,pending:false,alarm:false,ack:false,lock:'unverified',countdown:0,timer:null,events:0};
 const featureIds=['ledToggle','buzzerToggle','notifyToggle','vibrateToggle','flashToggle'];
 function now(){return new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});}
 function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2800);}
 function addEvent(title,detail,type='normal'){const row=document.createElement('div');row.className='event';const icon=document.createElement('div');icon.className='event-icon '+(type==='bad'?'bad':type==='warn'?'warn':'');icon.textContent=type==='bad'?'!':type==='warn'?'⚠':'✓';const body=document.createElement('div');body.className='event-body';const strong=document.createElement('strong');strong.textContent=title;const p=document.createElement('p');p.textContent=detail;body.append(strong,p);const time=document.createElement('div');time.className='event-time';time.textContent=now();row.append(icon,body,time);$('history').prepend(row);while($('history').children.length>8)$('history').lastElementChild.remove();}
 function effectiveSilent(){return state.mode==='silent';}

async function updateDeviceStatus() {
  try {
    const response = await fetch(
      'http://192.168.191.239/api/status',
      { cache: 'no-store' }
    );

    if (!response.ok) throw new Error('Device unavailable');

    const data = await response.json();

    $('wifiValue').textContent = data.wifi.connected ? 'Online' : 'Offline';
    $('wifiValue').className = 'stat-value ' +
      (data.wifi.connected ? 'status-green' : 'status-orange');
    $('wifiNote').textContent = 'NodeMCU · ' + data.wifi.ip;

  } catch (error) {
    $('wifiValue').textContent = 'Offline';
    $('wifiValue').className = 'stat-value status-orange';
    $('wifiNote').textContent = 'Unable to reach NodeMCU';
  }
}

updateDeviceStatus();
setInterval(updateDeviceStatus, 3000);



 function effectiveSecurity(){return state.enabled&&state.mode==='security';}
 function stopTimer(){if(state.timer){clearInterval(state.timer);state.timer=null;}state.countdown=0;state.pending=false;}
 function render(){
   $('masterSwitch').checked=state.enabled;$('masterText').textContent=state.enabled?'ON':'OFF';
   $('heroMode').textContent=state.mode==='security'?'⛨ Security Mode':state.mode==='silent'?'◌ Silent Mode':'○ Disarmed';
   document.querySelectorAll('.mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
   let status='Monitoring',icon='🛡️';
   if(!state.enabled||state.mode==='disarmed'){status='System Off';icon='⏻';}
   else if(state.alarm){status='Alert Triggered';icon='🚨';}
   else if(state.movement){status='Movement Detected';icon='⚠️';}
   $('heroState').textContent=status;$('heroStateIcon').textContent=icon;
   $('movementValue').textContent=state.movement?'Movement Detected':'Stable';$('movementValue').className='stat-value '+(state.movement?'status-orange':'status-green');
   $('movementNote').textContent='MPU6050 · simulated reading';$('movementPill').textContent=state.movement?'⚠ Movement Detected':'● Stable';$('movementPill').style.background=state.movement?'var(--orange-bg)':'var(--green-bg)';$('movementPill').style.color=state.movement?'var(--orange)':'var(--green)';
   $('sensorHealth').textContent='Sensor health: not verified';
   const locked=state.lock==='locked';$('lockValue').textContent=locked?'Locked':state.lock==='unlocked'?'Unlocked':'Unverified';$('lockValue').className='stat-value '+(locked?'status-green':'');
   $('lockNote').textContent=state.lock==='unverified'?'Hardware feedback unavailable':'Simulation only — not physically verified';
   $('lockPill').textContent=state.lock==='unverified'?'UNVERIFIED':state.lock.toUpperCase();$('lockSymbol').textContent=locked?'🔒':state.lock==='unlocked'?'🔓':'?';$('lockSymbol').className='lock-symbol '+(state.lock==='unverified'?'unknown':'');$('lockTitle').textContent=state.lock==='unverified'?'Lock state unverified':locked?'Simulated locked state':'Simulated unlocked state';$('lockDesc').textContent=state.lock==='unverified'?'No physical feedback is available in simulation.':'Command simulated only; actual lock is not confirmed.';
   $('ackBtn').disabled=!state.alert;
   $('alertCounter').textContent=state.alert?(state.alarm?'Alarm active':state.pending?'Alert pending':'Alert open'):'No active alert';
   $('countdownLabel').textContent=state.pending?'Buzzer countdown: '+state.countdown+' sec':state.alarm?'Buzzer state: simulated active':'Buzzer countdown: inactive';
   if(!state.alert){$('alertArea').innerHTML='<div class="alertbox green"><div>✓</div><div><strong>All quiet</strong><p>No suspicious movement is currently being simulated.</p></div></div>';}
   else if(state.alarm){$('alertArea').innerHTML='<div class="alertbox red"><div>!</div><div><strong>Security alert triggered</strong><p>Simulated alarm state. No physical buzzer or real notification was activated.</p></div></div>';}
   else{$('alertArea').innerHTML='<div class="alertbox"><div>⚠</div><div><strong>Suspicious movement detected</strong><p>'+(state.pending?'Acknowledge before the countdown ends.':'Movement event is open.')+'</p></div></div>';}
   $('ledToggle').disabled=!state.enabled||state.mode==='disarmed';$('buzzerToggle').disabled=!state.enabled||state.mode==='disarmed'||state.mode==='silent';
   featureIds.forEach(id=>{if(id==='notifyToggle'||id==='flashToggle')$(id).disabled=!state.enabled||state.mode==='disarmed';});
   $('unlockBtn').disabled=state.lock==='unlocked';$('lockBtn').disabled=state.lock==='locked';
 }
 function triggerMovement(){
   if(!state.enabled||state.mode==='disarmed'){toast('Monitoring is off; movement ignored.');return;}
   if(state.alert){toast('An alert is already active.');return;}
   state.movement=true;state.alert=true;state.ack=false;state.alarm=false;
   addEvent('Suspicious movement detected','Simulated MPU6050 movement event.','warn');
   if($('notifyToggle').checked)addEvent('Phone notification queued','Simulation only; no push notification sent.','warn');
   if($('vibrateToggle').checked)addEvent('Phone vibration requested','Phone-side support required; no real vibration triggered.','warn');
   if($('flashToggle').checked)addEvent('Phone flashlight requested','Phone-side support required; no flash activated.','warn');
   if(state.mode==='security'&&$('buzzerToggle').checked){
     state.countdown=Number($('delaySelect').value);
     if(state.countdown===0){state.alarm=true;addEvent('Security alert triggered','Simulated buzzer response.','bad');}
     else{state.pending=true;addEvent('Buzzer countdown started',state.countdown+' seconds to acknowledgement.','warn');state.timer=setInterval(()=>{if(!state.pending)return;state.countdown--;if(state.countdown<=0){stopTimer();state.alarm=true;addEvent('Security alert triggered','Countdown completed; simulated buzzer state active.','bad');render();}else render();},1000);}
   }else if(state.mode==='silent'){addEvent('Silent alert active','Audible alarm suppressed by Silent Mode.','warn');}
   else{addEvent('Movement warning','LED/buzzer responses depend on enabled settings.','warn');}
   render();toast('Movement simulated. Check Alert Centre.');
 }
 function acknowledge(){
   if(!state.alert){toast('There is no active alert to acknowledge.');return;}
   stopTimer();state.ack=true;state.alert=false;state.alarm=false;state.movement=false;
   addEvent('Owner acknowledged alert','Pending simulated buzzer cancelled; system remains in selected mode.','normal');
   render();toast('Alert acknowledged. Pending alarm cancelled.');
 }
 function setMode(mode){
   state.mode=mode;
   if(mode==='disarmed'){state.enabled=false;stopTimer();state.alert=false;state.alarm=false;state.movement=false;addEvent('System disarmed','Monitoring and pending security response stopped.');}
   else{state.enabled=true;addEvent('Mode changed',mode==='silent'?'Silent Mode enabled.':'Security Mode enabled.');if(mode==='silent'&&state.pending){stopTimer();state.alarm=false;addEvent('Buzzer suppressed','Silent Mode cancels the pending audible alarm.','warn');}}
   render();toast('Mode set to '+(mode==='security'?'Security Mode':mode==='silent'?'Silent Mode':'Disarmed')+'.');
 }
 $('masterSwitch').addEventListener('change',e=>{state.enabled=e.target.checked;if(!state.enabled){stopTimer();state.alert=false;state.alarm=false;state.movement=false;addEvent('System switched off','Monitoring and pending simulated response stopped.');}else{if(state.mode==='disarmed')state.mode='security';addEvent('System switched on','Simulation monitoring enabled.');}render();toast(state.enabled?'System enabled (simulation).':'System disabled (simulation).');});
 document.querySelectorAll('.mode').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
 $('sensitivity').addEventListener('input',e=>{$('sensitivityVal').textContent=e.target.value;});

featureIds.forEach(id => {
  $(id).addEventListener('change', async () => {
    const names = {
      ledToggle: 'LED warning',
      buzzerToggle: 'Smart buzzer',
      notifyToggle: 'Phone notifications',
      vibrateToggle: 'Phone vibration preference',
      flashToggle: 'Phone flashlight preference'
    };

    if (id === 'ledToggle' || id === 'buzzerToggle') {
      const enabled = $(id).checked;
      const control = id === 'ledToggle' ? 'led' : 'buzzer';

      try {
        const response = await fetch(
          'http://192.168.191.239/api/control/' + control,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'enabled=' + enabled
          }
        );

        if (!response.ok) {
          throw new Error('Device rejected the command');
        }

        addEvent(
          names[id] + (enabled ? ' enabled' : ' disabled'),
          'Command sent to the NodeMCU.'
        );
        toast(names[id] + (enabled ? ' enabled.' : ' disabled.'));
      } catch (error) {
        $(id).checked = !enabled;
        toast('Control failed. Check the browser console.');
        console.error('NodeMCU control error:', error);
      }

      return;
    }

    addEvent(
      names[id] + ' ' + ($(id).checked ? 'enabled' : 'disabled'),
      'Preference saved locally; phone action is not connected yet.'
    );
    toast(names[id] + ' preference updated.');
  });
});
 $('delaySelect').addEventListener('change',()=>{toast('Buzzer delay set to '+$('delaySelect').value+' seconds. Applies to the next alert.');});
 $('simulateBtn').addEventListener('click',triggerMovement);
 $('ackBtn').addEventListener('click',acknowledge);
 $('resetBtn').addEventListener('click',()=>{stopTimer();state.enabled=true;state.mode='security';state.movement=false;state.alert=false;state.alarm=false;state.ack=false;state.lock='unverified';$('sensitivity').value=62;$('sensitivityVal').textContent='62';$('ledToggle').checked=true;$('buzzerToggle').checked=true;$('notifyToggle').checked=true;$('vibrateToggle').checked=true;$('flashToggle').checked=false;$('delaySelect').value='5';$('history').innerHTML='';addEvent('Demo reset','Simulation state returned to defaults.');render();toast('Demo reset.');});
 $('clearHistory').addEventListener('click',()=>{$('history').innerHTML='';addEvent('History cleared','New events will appear here.');toast('Activity history cleared.');});
 $('unlockBtn').addEventListener('click',()=>{if(!confirm('Request simulated unlock? This does not move a real servo.'))return;state.lock='unlocked';addEvent('Unlock requested','Simulated state only; physical lock not verified.','warn');render();toast('Simulated unlock request completed.');});
 $('lockBtn').addEventListener('click',()=>{if(!confirm('Request simulated lock? This does not move a real servo.'))return;state.lock='locked';addEvent('Lock requested','Simulated state only; physical lock not verified.','warn');render();toast('Simulated lock request completed.');});
 render();
})();
