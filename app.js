(function(){
'use strict';
const DEFAULT_TG_TOKEN='8649548651:AAGHVQBmpR8799iHpa-PJoxa5SYtqERwq7M';
const DEFAULT_TG_CHAT='-4991708179';
const K={P:'pg_personnel',R:'pg_reports',TT:'pg_tg_token',TC:'pg_tg_chat',TS:'pg_tg_sent',BD:'pg_blood'};
function ld(k){try{return JSON.parse(localStorage.getItem(k))||[];}catch{return[];}}
function sv(k,d){localStorage.setItem(k,JSON.stringify(d));}
function lv(k){const v=localStorage.getItem(k);if(v)return v;if(k===K.TT)return DEFAULT_TG_TOKEN;if(k===K.TC)return DEFAULT_TG_CHAT;return '';}
function svv(k,v){localStorage.setItem(k,v);}
if(!localStorage.getItem(K.TT))svv(K.TT,DEFAULT_TG_TOKEN);
if(!localStorage.getItem(K.TC))svv(K.TC,DEFAULT_TG_CHAT);

let personnel=ld(K.P),reports=ld(K.R),bloodRecords=ld(K.BD);
let tgSent=parseInt(lv(K.TS))||0,curReportId=null;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);

// === Nav ===
$$('.nav-item').forEach(n=>n.addEventListener('click',e=>{
    e.preventDefault();const p=n.dataset.page;
    $$('.nav-item').forEach(x=>x.classList.remove('active'));n.classList.add('active');
    $$('.page').forEach(x=>x.classList.remove('active'));$('#page-'+p).classList.add('active');
    if(p==='dashboard')refreshDash();if(p==='report')refreshReport();
    if(p==='personnel')refreshPers();if(p==='history')refreshHist();
    if(p==='blood')refreshBlood();if(p==='telegram')loadTG();
    if(innerWidth<=768)$('#sidebar').classList.remove('open');
}));

// === DateTime ===
function updTime(){const n=new Date();const el=$('#datetimeDisplay');if(el)el.innerHTML=n.toLocaleDateString('th-TH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})+'<br>'+n.toLocaleTimeString('th-TH');}
setInterval(updTime,1000);updTime();

// === Toast ===
function toast(m,t='info'){const ic={success:'✅',error:'❌',info:'ℹ️',warning:'⚠️'};const d=document.createElement('div');d.className='toast '+t;d.innerHTML=`<span>${ic[t]||''}</span> ${m}`;$('#toastContainer').appendChild(d);setTimeout(()=>{d.classList.add('removing');setTimeout(()=>d.remove(),300);},3500);}

// === Dashboard ===
function refreshDash(){
    $('#statTotalPersonnel').textContent=personnel.length;
    const today=new Date().toISOString().slice(0,10);
    const tr=reports.filter(r=>r.date===today);
    $('#statTodayReports').textContent=tr.length;
    $('#statOnDuty').textContent=tr.filter(r=>r.status!=='ฉุกเฉิน').length;
    $('#statTelegramSent').textContent=tgSent;
    const tk=lv(K.TT),ci=lv(K.TC),st=$('#telegramStatus');
    if(tk&&ci){st.textContent='🟢 Telegram เชื่อมต่อแล้ว';st.className='status-badge online';}
    else{st.textContent='🔴 Telegram ยังไม่เชื่อมต่อ';st.className='status-badge offline';}
    // schedule
    const sc=$('#dutySchedule');
    if(!tr.length){sc.innerHTML='<p class="empty-state">ยังไม่มีข้อมูลวันนี้</p>';} 
    else{sc.innerHTML=tr.map(r=>{const cl=r.status==='ปกติ'?'normal':r.status==='มีเหตุการณ์'?'event':'emergency';return `<div class="duty-item"><div class="duty-info"><span class="duty-time">${r.time||''}</span><div><div class="duty-name">${r.inspector||'-'}</div><div class="duty-location">📍 ${r.beachArea||'-'} | น้ำทะเล ${r.seaDistance||'-'} ม.</div></div></div><span class="duty-status-badge ${cl}">${r.status}</span></div>`;}).join('');}
    // recent
    const rc=$('#recentReports');const rec=[...reports].reverse().slice(0,5);
    if(!rec.length){rc.innerHTML='<p class="empty-state">ยังไม่มีรายงาน</p>';}
    else{rc.innerHTML=rec.map(r=>`<div class="report-item"><div class="report-item-info"><h4>${r.beachArea||'-'} | ${r.time||'-'}</h4><p>ผู้ตรวจ: ${r.inspector||'-'} | ท่องเที่ยว: ${r.hasTourists==='มี'?r.touristCount+' คน':'ไม่มี'}</p></div><div class="report-item-time">${r.date}<br>${r.telegramSent?'📨 ส่งแล้ว':''}</div></div>`).join('');}
}

// === Report Form ===
function refreshReport(){
    const today=new Date();$('#reportDate').value=today.toISOString().slice(0,10);
    $('#reportTime').value=today.toTimeString().slice(0,5);
    $('#reportInspector').value='';
}

// Autocomplete for inspector
const inspectorInput=$('#reportInspector');
const suggestBox=$('#inspectorSuggestions');
inspectorInput.addEventListener('input',()=>{
    const q=inspectorInput.value.toLowerCase().trim();
    if(!q){suggestBox.innerHTML='';suggestBox.style.display='none';return;}
    const matches=personnel.filter(p=>{
        const n=`${p.rank} ${p.firstName} ${p.lastName}`.toLowerCase();
        return n.includes(q)||p.firstName.toLowerCase().includes(q)||p.lastName.toLowerCase().includes(q);
    }).slice(0,8);
    if(!matches.length){suggestBox.innerHTML='';suggestBox.style.display='none';return;}
    suggestBox.innerHTML=matches.map(p=>{
        const n=`${p.rank} ${p.firstName} ${p.lastName}`;
        return `<div class="autocomplete-item" data-val="${n}"><strong>${n}</strong><span class="autocomplete-sub">${p.position||''}</span></div>`;
    }).join('');
    suggestBox.style.display='block';
});
suggestBox.addEventListener('click',e=>{
    const item=e.target.closest('.autocomplete-item');
    if(item){inspectorInput.value=item.dataset.val;suggestBox.style.display='none';}
});
document.addEventListener('click',e=>{if(!e.target.closest('.autocomplete-wrapper'))suggestBox.style.display='none';});

// Toggle fields
['hasTourists','hasFishermen','hasFishingBoat'].forEach(id=>{
    const el=$('#'+id);if(el)el.addEventListener('change',()=>{
        if(id==='hasTourists')$('#touristCountGroup').style.display=el.value==='มี'?'':'none';
        if(id==='hasFishermen')$('#fishermenCountGroup').style.display=el.value==='มี'?'':'none';
        if(id==='hasFishingBoat')$('#boatDistanceGroup').style.display=el.value==='มี'?'':'none';
    });
});

function submitReport(e,sendTG=false){
    e.preventDefault();
    const f=id=>($('#'+id)||{}).value||'';
    if(!f('reportDate')||!f('beachArea')){toast('กรุณากรอกข้อมูลให้ครบ','warning');return;}
    const r={id:Date.now().toString(),date:f('reportDate'),time:f('reportTime'),inspector:f('reportInspector'),
        beachArea:f('beachArea'),seaDistance:f('seaDistance'),
        hasTourists:f('hasTourists'),touristCount:f('touristCount'),
        hasFishermen:f('hasFishermen'),fishermenCount:f('fishermenCount'),
        hasFishingBoat:f('hasFishingBoat'),boatDistance:f('boatDistance'),
        status:f('reportStatus'),weather:f('weatherCondition'),note:f('reportNote'),
        createdAt:new Date().toISOString(),telegramSent:false};
    reports.push(r);sv(K.R,reports);toast('บันทึกรายงานสำเร็จ','success');
    if(sendTG)sendReportTG(r);
    $('#reportForm').reset();refreshReport();
}
$('#reportForm').addEventListener('submit',e=>submitReport(e,false));
$('#btnSubmitAndSend').addEventListener('click',e=>submitReport(e,true));

// === Personnel ===
const RANK_ORDER={'พล.อ.':1,'พล.ท.':2,'พล.ต.':3,'พ.อ.':4,'พ.ท.':5,'พ.ต.':6,'ร.อ.':7,'ร.ท.':8,'ร.ต.':9,'จ.ส.อ.':10,'จ.ส.ท.':11,'จ.ส.ต.':12,'ส.อ.':13,'ส.ท.':14,'ส.ต.':15,'พลฯ':16};
function rankVal(r){return RANK_ORDER[r]||99;}
function sortedPersonnel(){return[...personnel].sort((a,b)=>rankVal(a.rank)-rankVal(b.rank));}
function getCompany(p){
    const pos=(p.position||'').toLowerCase();const c=p.company||'';
    if(c)return c;
    if(pos.includes('สสก')||pos.includes('บก'))return 'ร้อย.สสก.';
    if(pos.includes('อวบ. 1')||pos.includes('อวบ.ที่ 1')||pos.includes('อวบ.1'))return 'ร้อย.อวบ.ที่ 1';
    if(pos.includes('อวบ. 2')||pos.includes('อวบ.ที่ 2')||pos.includes('อวบ.2'))return 'ร้อย.อวบ.ที่ 2';
    if(pos.includes('อวบ. 3')||pos.includes('อวบ.ที่ 3')||pos.includes('อวบ.3'))return 'ร้อย.อวบ.ที่ 3';
    if(pos.includes('สสช'))return 'ร้อย.สสช.';
    return p.company||'ไม่ระบุ';
}
function refreshPers(){
    const tb=$('#personnelTableBody');
    if(!personnel.length){tb.innerHTML='<tr><td colspan="7" class="empty-state">ยังไม่มีข้อมูลกำลังพล</td></tr>';return;}
    const sc={'พร้อมปฏิบัติ':'var(--accent-green)','ลา':'var(--accent-blue)','ป่วย':'var(--accent-orange)','ราชการอื่น':'var(--accent-purple)'};
    const search=($('#personnelSearch')||{}).value||""; const compF=($('#personnelCompanyFilter')||{}).value||""; const statF=($('#personnelStatusFilter')||{}).value||"";
    let filtered=sortedPersonnel();
    if(search){const s=search.toLowerCase();filtered=filtered.filter(p=>(p.firstName+p.lastName+p.rank+p.position).toLowerCase().includes(s));}
    if(compF)filtered=filtered.filter(p=>getCompany(p)===compF);
    if(statF)filtered=filtered.filter(p=>p.status===statF);
    const groups={};filtered.forEach(p=>{const c=getCompany(p);if(!groups[c])groups[c]=[];groups[c].push(p);});
    let html='',idx=0;
    for(const[comp,list]of Object.entries(groups)){
        html+=`<tr class="group-header"><td colspan="7">🏛️ ${comp} (${list.length} นาย)</td></tr>`;
        list.forEach(p=>{idx++;
            html+=`<tr><td>${idx}</td><td><strong>${p.rank} ${p.firstName} ${p.lastName}</strong></td><td>${getCompany(p)}</td><td>${p.position||'-'}</td><td>${p.phone||'-'}</td><td><span style="color:${sc[p.status]||''}">${p.status}</span></td><td><div class="table-actions"><button class="btn btn-sm btn-secondary" onclick="APP.editP('${p.id}')">✏️</button><button class="btn btn-sm btn-danger" onclick="APP.delP('${p.id}')">🗑️</button></div></td></tr>`;
        });
    }
    tb.innerHTML=html;
}
if($('#personnelSearch'))$('#personnelSearch').addEventListener('input',refreshPers);
if($('#personnelCompanyFilter'))$('#personnelCompanyFilter').addEventListener('change',refreshPers);
if($('#personnelStatusFilter'))$('#personnelStatusFilter').addEventListener('change',refreshPers);
function openPM(p=null){
    $('#personnelModal').classList.add('active');
    $('#modalTitle').textContent=p?'✏️ แก้ไขกำลังพล':'➕ เพิ่มกำลังพล';
    if(p){$('#personnelId').value=p.id;$('#personnelRank').value=p.rank;$('#personnelFirstName').value=p.firstName;$('#personnelLastName').value=p.lastName;$('#personnelCompany').value=p.company||getCompany(p);$('#personnelPosition').value=p.position||'';$('#personnelPhone').value=p.phone||'';$('#personnelStatus').value=p.status;}
    else{$('#personnelForm').reset();$('#personnelId').value='';}
}
$('#btnAddPersonnel').addEventListener('click',()=>openPM());
$('#modalClose').addEventListener('click',()=>$('#personnelModal').classList.remove('active'));
$('#btnCancelPersonnel').addEventListener('click',()=>$('#personnelModal').classList.remove('active'));
$('#personnelForm').addEventListener('submit',e=>{
    e.preventDefault();const id=$('#personnelId').value;
    const d={id:id||Date.now().toString(),rank:$('#personnelRank').value,firstName:$('#personnelFirstName').value,lastName:$('#personnelLastName').value,company:$('#personnelCompany').value,position:$('#personnelPosition').value,phone:$('#personnelPhone').value,status:$('#personnelStatus').value};
    if(id){const i=personnel.findIndex(p=>p.id===id);if(i!==-1)personnel[i]=d;toast('แก้ไขสำเร็จ','success');}
    else{personnel.push(d);toast('เพิ่มกำลังพลสำเร็จ','success');}
    sv(K.P,personnel);$('#personnelModal').classList.remove('active');refreshPers();
});

// Export personnel CSV
$('#btnExportPersonnel').addEventListener('click',()=>{
    if(!personnel.length){toast('ไม่มีข้อมูล','warning');return;}
    let csv='\uFEFF'+'ลำดับ,ยศ,ชื่อ,นามสกุล,กองร้อย,ตำแหน่ง,เบอร์โทร,สถานะ\n';
    sortedPersonnel().forEach((p,i)=>{csv+=`${i+1},${p.rank},${p.firstName},${p.lastName},${getCompany(p)},${p.position||''},${p.phone||''},${p.status}\n`;});
    const b=new Blob([csv],{type:'text/csv;charset=utf-8;'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`กำลังพล_${new Date().toISOString().slice(0,10)}.csv`;a.click();toast('ส่งออกสำเร็จ','success');
});

// Backup all data
$('#btnBackupData').addEventListener('click',()=>{
    const backup={personnel,reports,bloodRecords,exportDate:new Date().toISOString()};
    const b=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`สำรองข้อมูล_${new Date().toISOString().slice(0,10)}.json`;a.click();toast('สำรองข้อมูลสำเร็จ','success');
});

// Restore data
$('#btnRestoreData').addEventListener('click',()=>$('#restoreFileInput').click());
$('#restoreFileInput').addEventListener('change',e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();reader.onload=ev=>{
        try{
            const d=JSON.parse(ev.target.result);
            if(!confirm(`นำเข้าข้อมูลจะแทนที่ข้อมูลปัจจุบัน ยืนยัน?\nกำลังพล: ${(d.personnel||[]).length}\nรายงาน: ${(d.reports||[]).length}\nโลหิต: ${(d.bloodRecords||[]).length}`))return;
            if(d.personnel){personnel=d.personnel;sv(K.P,personnel);}
            if(d.reports){reports=d.reports;sv(K.R,reports);}
            if(d.bloodRecords){bloodRecords=d.bloodRecords;sv(K.BD,bloodRecords);}
            toast('นำเข้าข้อมูลสำเร็จ','success');refreshPers();refreshDash();
        }catch(err){toast('ไฟล์ไม่ถูกต้อง','error');}
    };reader.readAsText(file);e.target.value='';
});

// === History ===
function refreshHist(){
    const fd=$('#historyFilterDate').value;let f=[...reports].reverse();
    if(fd)f=f.filter(r=>r.date===fd);
    const tb=$('#historyTableBody');
    if(!f.length){tb.innerHTML='<tr><td colspan="6" class="empty-state">ไม่พบประวัติ</td></tr>';return;}
    tb.innerHTML=f.map(r=>`<tr><td>${r.date}</td><td>${r.time||'-'}</td><td>${r.beachArea||'-'}</td><td>${r.inspector||'-'}</td><td>${r.status}</td><td>${r.telegramSent?'✅':'⏳'}</td><td><div class="table-actions"><button class="btn btn-sm btn-secondary" onclick="APP.viewR('${r.id}')">👁️</button><button class="btn btn-sm btn-success" onclick="APP.resendR('${r.id}')">📨</button><button class="btn btn-sm btn-danger" onclick="APP.delR('${r.id}')">🗑️</button></div></td></tr>`).join('');
}
$('#historyFilterDate').addEventListener('change',refreshHist);

function viewReport(id){
    const r=reports.find(x=>x.id===id);if(!r)return;curReportId=id;
    $('#reportDetailContent').innerHTML=`<div class="detail-grid">
    <div class="detail-item"><label>วันที่</label><span>${r.date}</span></div>
    <div class="detail-item"><label>เวลาตรวจ</label><span>${r.time||'-'}</span></div>
    <div class="detail-item"><label>ผู้ตรวจ</label><span>${r.inspector||'-'}</span></div>
    <div class="detail-item"><label>ชายหาด</label><span>${r.beachArea||'-'}</span></div>
    <div class="detail-item"><label>ระยะน้ำทะเล</label><span>${r.seaDistance||'-'} เมตร</span></div>
    <div class="detail-item"><label>นักท่องเที่ยว</label><span>${r.hasTourists==='มี'?'✅ '+r.touristCount+' คน':'❌ ไม่มี'}</span></div>
    <div class="detail-item"><label>คนหาปลา</label><span>${r.hasFishermen==='มี'?'✅ '+r.fishermenCount+' คน':'❌ ไม่มี'}</span></div>
    <div class="detail-item"><label>เรือประมง</label><span>${r.hasFishingBoat==='มี'?'✅ ห่าง '+r.boatDistance+' ม.':'❌ ไม่มี'}</span></div>
    <div class="detail-item"><label>สถานะ</label><span>${r.status}</span></div>
    <div class="detail-item"><label>อากาศ</label><span>${r.weather||'-'}</span></div>
    <div class="detail-item"><label>Telegram</label><span>${r.telegramSent?'✅ ส่งแล้ว':'⏳'}</span></div>
    <div class="detail-item detail-full"><label>หมายเหตุ</label><span>${r.note||'-'}</span></div></div>`;
    $('#reportDetailModal').classList.add('active');
}

// === Blood Donation ===
function refreshBlood(){
    // year selector
    const ys=$('#bloodYear');const cy=new Date().getFullYear()+543;
    if(!ys.options.length){for(let y=cy;y>=cy-3;y--)ys.innerHTML+=`<option value="${y}">${y}</option>`;}
    const selYear=parseInt(ys.value)||cy;
    const tb=$('#bloodTableBody');
    if(!personnel.length){tb.innerHTML='<tr><td colspan="6" class="empty-state">กรุณาเพิ่มกำลังพลก่อน</td></tr>';return;}
    tb.innerHTML=personnel.map((p,i)=>{
        const name=`${p.rank} ${p.firstName} ${p.lastName}`;
        let cells='';
        for(let pd=1;pd<=4;pd++){
            const rec=bloodRecords.find(b=>b.personnelId===p.id&&b.period==pd&&b.year==selYear);
            if(rec){
                if(rec.canDonate==='ได้')cells+=`<td class="blood-cell donated"><span class="blood-status">✅ บริจาคได้</span><span class="blood-date">${rec.date}</span></td>`;
                else cells+=`<td class="blood-cell not-donated"><span class="blood-status">❌ ไม่ได้</span><span class="blood-reason">${rec.reason||'-'}</span><span class="blood-date">${rec.date}</span></td>`;
            }else{cells+=`<td class="blood-cell pending"><span class="blood-status">⏳ ยังไม่บันทึก</span></td>`;}
        }
        return `<tr><td>${i+1}</td><td>${name}</td>${cells}</tr>`;
    }).join('');
}
$('#bloodYear').addEventListener('change',refreshBlood);

function openBloodModal(){
    $('#bloodModal').classList.add('active');$('#bloodForm').reset();
    const sel=$('#bloodPersonnel');sel.innerHTML='<option value="">-- เลือกกำลังพล --</option>';
    personnel.forEach(p=>{sel.innerHTML+=`<option value="${p.id}">${p.rank} ${p.firstName} ${p.lastName}</option>`;});
    $('#bloodDate').value=new Date().toISOString().slice(0,10);
    // auto select period
    const m=new Date().getMonth();$('#bloodPeriod').value=m<3?'1':m<6?'2':m<9?'3':'4';
}
$('#btnAddBlood').addEventListener('click',openBloodModal);
$('#bloodModalClose').addEventListener('click',()=>$('#bloodModal').classList.remove('active'));
$('#btnCancelBlood').addEventListener('click',()=>$('#bloodModal').classList.remove('active'));

$('#bloodCanDonate').addEventListener('change',()=>{
    const v=$('#bloodCanDonate').value;
    $('#bloodReasonGroup').style.display=v==='ไม่ได้'?'':'none';
    if(v==='ได้')$('#bloodReasonOtherGroup').style.display='none';
});
$('#bloodReason').addEventListener('change',()=>{
    $('#bloodReasonOtherGroup').style.display=$('#bloodReason').value==='อื่นๆ'?'':'none';
});

$('#bloodForm').addEventListener('submit',e=>{
    e.preventDefault();const pid=$('#bloodPersonnel').value;
    if(!pid){toast('กรุณาเลือกกำลังพล','warning');return;}
    const yr=parseInt($('#bloodYear').value)||(new Date().getFullYear()+543);
    const pd=$('#bloodPeriod').value;
    const reason=$('#bloodReason').value==='อื่นๆ'?$('#bloodReasonOther').value:$('#bloodReason').value;
    // remove existing record for same person/period/year
    bloodRecords=bloodRecords.filter(b=>!(b.personnelId===pid&&b.period==pd&&b.year==yr));
    bloodRecords.push({id:Date.now().toString(),personnelId:pid,period:pd,year:yr,
        date:$('#bloodDate').value,canDonate:$('#bloodCanDonate').value,
        reason:$('#bloodCanDonate').value==='ไม่ได้'?reason:''});
    sv(K.BD,bloodRecords);$('#bloodModal').classList.remove('active');
    toast('บันทึกการบริจาคโลหิตสำเร็จ','success');refreshBlood();
});

// Export blood
$('#btnExportBlood').addEventListener('click',()=>{
    if(!bloodRecords.length){toast('ไม่มีข้อมูล','warning');return;}
    let csv='\uFEFF'+'ยศ-ชื่อ-สกุล,ห้วง,ปี,วันที่,บริจาคได้,สาเหตุ\n';
    bloodRecords.forEach(b=>{const p=personnel.find(x=>x.id===b.personnelId);const n=p?`${p.rank} ${p.firstName} ${p.lastName}`:'ไม่ทราบ';
    csv+=`${n},${b.period},${b.year},${b.date},${b.canDonate},${b.reason||''}\n`;});
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`บริจาคโลหิต_${new Date().toISOString().slice(0,10)}.csv`;a.click();toast('ส่งออกสำเร็จ','success');
});

// === Telegram ===
function loadTG(){$('#telegramBotToken').value=lv(K.TT);$('#telegramChatId').value=lv(K.TC);}
$('#btnSaveTelegram').addEventListener('click',()=>{svv(K.TT,$('#telegramBotToken').value.trim());svv(K.TC,$('#telegramChatId').value.trim());toast('บันทึก Telegram สำเร็จ','success');refreshDash();});

async function sendTG(text){
    const tk=lv(K.TT),ci=lv(K.TC);if(!tk||!ci){toast('ตั้งค่า Telegram ก่อน','warning');return false;}
    try{const r=await fetch(`https://api.telegram.org/bot${tk}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:ci,text,parse_mode:'HTML'})});
    const d=await r.json();if(d.ok){tgSent++;svv(K.TS,tgSent);return true;}toast('TG Error: '+d.description,'error');return false;}
    catch(e){toast('เชื่อมต่อ Telegram ไม่ได้','error');return false;}
}

function buildMsg(r){
    const se=r.status==='ปกติ'?'✅':r.status==='มีเหตุการณ์'?'⚠️':'🚨';
    return `🏛️ <b>รายงานตรวจชายหาด พระราชวังไกลกังวล</b>
━━━━━━━━━━━━━━━━━━
📅 <b>วันที่:</b> ${r.date}
🕐 <b>เวลาตรวจ:</b> ${r.time||'-'}
👨‍✈️ <b>ผู้ตรวจ:</b> ${r.inspector||'-'}
🏖️ <b>ชายหาด:</b> ${r.beachArea||'-'}
🌊 <b>ระยะน้ำทะเลจากฝั่ง:</b> ${r.seaDistance||'-'} เมตร
${se} <b>สถานะ:</b> ${r.status}
🌤️ <b>อากาศ:</b> ${r.weather||'-'}

👥 <b>นักท่องเที่ยว:</b> ${r.hasTourists==='มี'?'มี '+r.touristCount+' คน':'ไม่มี'}
🎣 <b>คนหาปลา:</b> ${r.hasFishermen==='มี'?'มี '+r.fishermenCount+' คน':'ไม่มี'}
🚢 <b>เรือประมงในเขต:</b> ${r.hasFishingBoat==='มี'?'มี (ห่าง '+r.boatDistance+' ม.)':'ไม่มี'}

📝 <b>หมายเหตุ:</b> ${r.note||'-'}
━━━━━━━━━━━━━━━━━━
⏰ ${new Date(r.createdAt).toLocaleString('th-TH')}`;
}

async function sendReportTG(r){const ok=await sendTG(buildMsg(r));if(ok){r.telegramSent=true;const i=reports.findIndex(x=>x.id===r.id);if(i!==-1)reports[i]=r;sv(K.R,reports);toast('ส่ง Telegram สำเร็จ','success');refreshDash();}}

$('#btnTestTelegram').addEventListener('click',async()=>{const ok=await sendTG(`🧪 <b>ทดสอบระบบ</b>\n✅ เชื่อมต่อสำเร็จ\n🏛️ ระบบรายงานเวรพระราชวังไกลกังวล\n⏰ ${new Date().toLocaleString('th-TH')}`);if(ok)toast('ทดสอบสำเร็จ','success');});
$('#btnSendQuickMsg').addEventListener('click',async()=>{const t=$('#quickMessage').value.trim();if(!t){toast('พิมพ์ข้อความ','warning');return;}const ok=await sendTG(`📨 <b>ข้อความด่วน</b>\n🏛️ พระราชวังไกลกังวล\n━━━━━━━━━━━━\n${t}\n━━━━━━━━━━━━\n⏰ ${new Date().toLocaleString('th-TH')}`);if(ok){toast('ส่งสำเร็จ','success');$('#quickMessage').value='';}});

// Export history
$('#btnExportHistory').addEventListener('click',()=>{
    if(!reports.length){toast('ไม่มีข้อมูล','warning');return;}
    let csv='\uFEFF'+'วันที่,เวลา,ผู้ตรวจ,ชายหาด,ระยะน้ำทะเล,นักท่องเที่ยว,จำนวน,คนหาปลา,จำนวน,เรือประมง,ระยะเรือ,สถานะ,อากาศ,หมายเหตุ,Telegram\n';
    reports.forEach(r=>{csv+=`${r.date},${r.time||''},${r.inspector||''},${r.beachArea||''},${r.seaDistance||''},${r.hasTourists||''},${r.touristCount||''},${r.hasFishermen||''},${r.fishermenCount||''},${r.hasFishingBoat||''},${r.boatDistance||''},${r.status},${r.weather||''},${(r.note||'').replace(/,/g,';')},${r.telegramSent?'ส่งแล้ว':'ยังไม่ส่ง'}\n`;});
    const b=new Blob([csv],{type:'text/csv;charset=utf-8;'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`รายงานเวร_${new Date().toISOString().slice(0,10)}.csv`;a.click();toast('ส่งออกสำเร็จ','success');
});

// Modals close on overlay
$$('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('active');}));
$('#reportDetailClose').addEventListener('click',()=>$('#reportDetailModal').classList.remove('active'));
$('#btnCloseDetail').addEventListener('click',()=>$('#reportDetailModal').classList.remove('active'));
$('#btnResendTelegram').addEventListener('click',()=>{if(curReportId){const r=reports.find(x=>x.id===curReportId);if(r)sendReportTG(r);$('#reportDetailModal').classList.remove('active');}});
$('#sidebarToggle').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));

// Global API
window.APP={
    editP(id){const p=personnel.find(x=>x.id===id);if(p)openPM(p);},
    delP(id){if(!confirm('ลบกำลังพลนี้?'))return;personnel=personnel.filter(x=>x.id!==id);sv(K.P,personnel);refreshPers();toast('ลบสำเร็จ','info');},
    viewR:viewReport,
    delR(id){if(!confirm('ลบรายงานนี้?'))return;reports=reports.filter(x=>x.id!==id);sv(K.R,reports);refreshHist();toast('ลบสำเร็จ','info');},
    async resendR(id){const r=reports.find(x=>x.id===id);if(r)await sendReportTG(r);refreshHist();}
};

// Init
refreshDash();refreshReport();
})();
