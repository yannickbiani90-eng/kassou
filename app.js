'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.round(n).toLocaleString('fr-FR')+' FCFA';
const today=()=>new Date().toISOString().slice(0,10), month=()=>today().slice(0,7);
const okPhone=p=>/^(235)?[679]\d{7}$/.test(p.replace(/\s/g,''));
const KEY='soukassou_v18';
const IN='flex-1 min-w-[120px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500';
const BTN='bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold px-4 py-2 rounded-xl text-sm transition';
const GH='text-xs bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded-lg';
const ROW='bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm flex flex-wrap items-center justify-between gap-2';
const ST=['En attente','En route','Livré'];
let db={products:[{n:'Licence Soukassou',p:10000},{n:'Livraison express',p:2000}],sales:[],deliveries:[],bills:[],subs:[],contracts:[],suppliers:[],ads:[],chat:[],cfg:{tva:18,phone:'23568212627',pin:''}};
try{const s=JSON.parse(localStorage.getItem(KEY));if(s)db={...db,...s,cfg:{...db.cfg,...s.cfg}}}catch(e){}
let cart=[];
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){alert('Stockage plein ou indisponible : exportez une sauvegarde.')}refresh()};
const late=s=>s.paid!==month()&&new Date().getDate()>Number(s.jour);
const b=(a,k,i,l)=>`<button data-a="${a}" data-k="${k}" data-i="${i}" class="${GH}">${l}</button>`;
const MODS={
 deliveries:{t:'Logistique & Livreurs',i:'fa-truck-fast text-amber-400',f:[['client','Client'],['adresse','Adresse'],['livreur','Livreur']],init:{statut:ST[0]},
  row:r=>`<span><b>${esc(r.client)}</b> · ${esc(r.adresse)} · ${esc(r.livreur)} · <em class="text-amber-300">${r.statut}</em></span>`,
  acts:(r,i)=>r.statut!==ST[2]?b('next','deliveries',i,'Avancer'):''},
 bills:{t:'Factures & Versements',i:'fa-file-invoice-dollar text-indigo-400',f:[['client','Client'],['montant','Montant FCFA','number']],init:{statut:'À payer'},
  row:r=>`<span><b>${esc(r.client)}</b> · ${fmt(r.montant)} · <em class="${r.statut==='Payé'?'text-emerald-400':'text-amber-300'}">${r.statut}</em></span>`,
  acts:(r,i)=>(r.statut!=='Payé'?b('pay','bills',i,'Marquer payé'):'')+b('pdf','bills',i,'PDF')},
 subscriptions:{key:'subs',t:'Mensualités & Abonnements',i:'fa-calendar-check text-teal-400',f:[['client','Client'],['montant','Mensualité FCFA','number'],['jour','Jour d’échéance (1-31)','number']],init:{paid:''},
  row:r=>`<span><b>${esc(r.client)}</b> · ${fmt(r.montant)} le ${esc(r.jour)} · ${r.paid===month()?'<em class="text-emerald-400">Payé ce mois</em>':late(r)?'<em class="text-rose-400">En retard</em>':'<em class="text-amber-300">À venir</em>'}</span>`,
  acts:(r,i)=>r.paid!==month()?b('pay','subs',i,'Encaisser'):''},
 contracts:{t:'Contrats PDF & Signature',i:'fa-file-contract text-indigo-400',f:[['client','Client'],['objet','Objet du contrat'],['montant','Montant FCFA','number']],init:{statut:'À signer'},
  row:r=>`<span><b>${esc(r.client)}</b> · ${esc(r.objet)} · ${fmt(r.montant)}</span>`,acts:(r,i)=>b('pdf','contracts',i,'PDF')},
 suppliers:{t:'Fournisseurs & Achats',i:'fa-boxes-stacked text-amber-400',f:[['nom','Fournisseur'],['produit','Produit'],['montant','Achat FCFA','number']],init:{},
  row:r=>`<span><b>${esc(r.nom)}</b> · ${esc(r.produit)} · ${fmt(r.montant)}</span>`,acts:()=>''}
};
const dbk=k=>MODS[k].key||k;
function renderMod(k){const m=MODS[k],d=db[dbk(k)];
 $('tab-'+k).innerHTML=`<h2 class="text-xl font-bold text-white"><i class="fa-solid ${m.i} mr-2"></i>${m.t}</h2>
 <form data-mod="${k}" class="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex flex-wrap gap-2">${m.f.map(([n,l,t])=>`<input name="${n}" required ${t?'min="0" step="any"':''} type="${t||'text'}" placeholder="${l}" aria-label="${l}" class="${IN}">`).join('')}<button class="${BTN}">Ajouter</button></form>
 <div class="space-y-2">${d.map((r,i)=>`<div class="${ROW}">${m.row(r)}<span class="flex gap-1.5">${m.acts(r,i)}${b('del',dbk(k),i,'Supprimer')}</span></div>`).join('')||'<p class="text-xs text-slate-500 text-center py-6">Rien pour l’instant. Remplissez le formulaire pour ajouter le premier élément.</p>'}</div>`}
function renderChat(){$('tab-chat').innerHTML=`<h2 class="text-xl font-bold text-white"><i class="fa-solid fa-comments text-teal-400 mr-2"></i>Négociation & Notes</h2>
 <p class="text-xs text-slate-400">Messagerie enregistrée sur cet appareil uniquement : elle n’envoie rien à vos clients.</p>
 <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2 max-h-[360px] overflow-y-auto">${db.chat.map(c=>`<p class="text-sm"><span class="text-slate-500 text-xs">${esc(c.time)}</span> ${esc(c.t)}</p>`).join('')||'<p class="text-xs text-slate-500">Aucun message.</p>'}</div>
 <form data-mod="chat" class="flex gap-2"><input name="t" required placeholder="Écrire une note ou une offre…" aria-label="Message" class="${IN}"><button class="${BTN}">Envoyer</button></form>`}
function renderSettings(){const c=db.cfg;$('tab-settings').innerHTML=`<h2 class="text-xl font-bold text-white"><i class="fa-solid fa-gear text-slate-300 mr-2"></i>Paramètres</h2>
 <form data-mod="cfg" class="bg-slate-800 border border-slate-700 p-4 rounded-2xl grid gap-3 max-w-md">
 <label class="text-xs text-slate-400">TVA (%)<input name="tva" type="number" min="0" max="100" step="any" value="${esc(c.tva)}" class="${IN} w-full mt-1"></label>
 <label class="text-xs text-slate-400">Numéro Mobile Money (avec 235)<input name="phone" value="${esc(c.phone)}" class="${IN} w-full mt-1"></label>
 <label class="text-xs text-slate-400">Code PIN du verrouillage<input name="pin" type="password" inputmode="numeric" value="${esc(c.pin)}" class="${IN} w-full mt-1"></label>
 <button class="${BTN}">Enregistrer</button></form>
 <p class="text-xs text-slate-500 max-w-md">Le verrouillage masque l’écran mais ne chiffre pas les données. SoukBot comprend des phrases simples (vente, chiffre d’affaires) ; ce n’est pas une IA en ligne.</p>
 <div class="flex flex-wrap gap-2"><button onclick="exportSoukassouBackup()" class="${GH}">Exporter la sauvegarde</button><label class="${GH} cursor-pointer">Importer<input type="file" accept="application/json" class="hidden" onchange="importBackup(this.files[0])"></label><button onclick="resetAll()" class="${GH} text-rose-400">Tout effacer</button></div>`}
function renderPos(){const q=($('posSearch').value||'').toLowerCase();
 $('posCatalogGrid').innerHTML=db.products.map((p,i)=>({p,i})).filter(({p})=>p.n.toLowerCase().includes(q)).map(({p,i})=>`<button data-a="cadd" data-k="products" data-i="${i}" class="bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl p-3 text-left"><span class="block text-sm font-semibold text-white">${esc(p.n)}</span><span class="text-xs text-emerald-400">${fmt(p.p)}</span></button>`).join('')||'<p class="text-xs text-slate-500 col-span-full text-center py-6">Aucun article. Touchez « Article » pour en créer un.</p>';
 const sub=cart.reduce((t,c)=>t+db.products[c.i].p*c.q,0),tax=sub*db.cfg.tva/100;
 $('cartItemsList').innerHTML=cart.map((c,j)=>`<div class="flex items-center justify-between text-sm"><span>${esc(db.products[c.i].n)} ×${c.q}</span><span class="flex gap-1">${b('cdel','cart',j,'−')}</span></div>`).join('')||'<p class="text-xs text-slate-500 text-center py-8">Votre panier est vide</p>';
 $('cartSubtotal').textContent=fmt(sub);$('cartTax').textContent=fmt(tax);$('cartTotal').textContent=fmt(sub+tax);
 document.querySelector('#cartTax').previousElementSibling.textContent=`Taxes / TVA (${db.cfg.tva}%) :`}
const filterPosCatalog=renderPos;
function refresh(){
 const sum=d=>db.sales.filter(s=>s.date===d).reduce((t,s)=>t+s.total,0),ca=sum(today()),y=sum(new Date(Date.now()-864e5).toISOString().slice(0,10));
 $('dashCA').textContent=fmt(ca);$('dashTrend').textContent=y>0?`${((ca-y)/y*100).toFixed(0)} % vs hier`:'Pas de ventes hier';
 $('dashCashflow').textContent=fmt(db.subs.reduce((t,s)=>t+Number(s.montant),0)+db.bills.filter(x=>x.statut!=='Payé').reduce((t,x)=>t+Number(x.montant),0));
 $('dashClientsCount').textContent=new Set([...db.sales,...db.subs,...db.bills].map(x=>x.client).filter(Boolean)).size;
 $('avgRiskScore').textContent=db.subs.length?Math.round(100-db.subs.filter(late).length/db.subs.length*100)+'%':'—';
 $('dashOrdersCount').textContent=db.deliveries.filter(d=>d.statut!==ST[2]).length;
 $('payPhone').innerHTML='<i class="fa-solid fa-mobile-screen-button mr-1"></i> '+esc(db.cfg.phone);
 document.querySelectorAll('#paymentMethod option').forEach(o=>{if(/Money/.test(o.value))o.textContent=`${o.value} (${db.cfg.phone})`});
 Object.keys(MODS).forEach(renderMod);renderChat();renderSettings();renderPos();renderAds()}
function renderAds(){$('marketplaceAdsFeed').innerHTML=db.ads.map((a,i)=>`<article class="bg-slate-800 border border-slate-700 rounded-2xl p-4"><h4 class="font-bold text-white">${esc(a.t)}</h4><p class="text-sm text-slate-300 mt-1">${esc(a.x)}</p><p class="text-xs text-slate-500 mt-2">${esc(a.d)} ${b('del','ads',i,'Retirer')}</p></article>`).join('')||'<p class="text-xs text-slate-500">Aucune annonce. Publiez la première avec le bouton ci-dessus.</p>'}
function switchTab(t){document.querySelectorAll('.tab-content').forEach(s=>s.classList.toggle('hidden',s.id!=='tab-'+t));document.querySelectorAll('.tab-btn').forEach(x=>{const on=x.dataset.tab===t;x.classList.toggle('bg-emerald-600',on);x.classList.toggle('text-white',on);x.classList.toggle('text-slate-300',!on)});scrollTo(0,0)}
function openAddProductModal(){const n=(prompt('Nom de l’article')||'').trim(),p=Number(prompt('Prix en FCFA'));if(n&&p>0){db.products.push({n,p});save()}else if(n)alert('Prix invalide.')}
function openPublishAdModal(){const t=(prompt('Titre de l’annonce')||'').trim(),x=(prompt('Texte')||'').trim();if(t&&x){db.ads.unshift({t,x,d:new Date().toLocaleDateString('fr-FR')});save()}}
function checkoutSale(){if(!cart.length)return alert('Le panier est vide.');
 const sub=cart.reduce((t,c)=>t+db.products[c.i].p*c.q,0),total=sub*(1+db.cfg.tva/100),method=$('paymentMethod').value,client=$('clientPhoneInput').value.trim();
 if(client&&!okPhone(client))return alert('Numéro invalide : 8 chiffres commençant par 6, 7 ou 9.');
 if(method.startsWith('Crédit')){if(!client)return alert('Indiquez le téléphone du client pour une vente à crédit.');db.bills.push({client,montant:Math.round(total),statut:'À payer'})}
 else db.sales.push({total,method,client,date:today()});
 cart=[];$('clientPhoneInput').value='';save()}
function processSoukBotCommand(){const inp=$('soukBotInput'),o=$('soukBotOutput'),t=inp.value.trim();if(!t)return;
 const ph=(t.match(/\b(?:235)?([679]\d{7})\b/)||[])[1],am=Number(((ph?t.replace(ph,''):t).match(/\d[\d ]*/)||[''])[0].replace(/\s/g,''));
 if(/vend|vente/i.test(t)&&am>0){db.sales.push({total:am,method:'Espèces',client:ph||'',date:today()});save();o.textContent=`Vente de ${fmt(am)} enregistrée${ph?' pour le client '+ph:''}.`}
 else if(/chiffre|\bca\b/i.test(t))o.textContent=`Chiffre d’affaires du jour : ${$('dashCA').textContent}.`;
 else o.textContent='Je n’ai pas compris. Essayez : « Enregistre une vente de 15000 FCFA » ou « Quel est le chiffre d’affaires ? ».';
 inp.value=''}
function startVoiceRecognition(){const R=window.SpeechRecognition||window.webkitSpeechRecognition,o=$('soukBotOutput');if(!R)return o.textContent='La dictée vocale n’est pas disponible sur ce navigateur.';
 const r=new R();r.lang='fr-FR';r.onresult=e=>{$('soukBotInput').value=e.results[0][0].transcript;processSoukBotCommand()};r.onerror=()=>o.textContent='Micro indisponible ou accès refusé.';r.start()}
function getCurrentGPSLocation(){if(!navigator.geolocation)return $('gpsCoordsText').textContent='GPS non pris en charge';
 navigator.geolocation.getCurrentPosition(p=>{$('gpsCoordsText').textContent=`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`;$('gpsAcc').textContent=`±${Math.round(p.coords.accuracy)} m`},()=>$('gpsCoordsText').textContent='Position refusée ou indisponible')}
function makePdf(k,r){if(!window.jspdf)return alert('jsPDF n’est pas chargé : connectez-vous une première fois.');
 const d=new window.jspdf.jsPDF();d.setFontSize(18);d.text(k==='contracts'?'CONTRAT':'FACTURE / QUITTANCE',20,25);d.setFontSize(11);
 const L=[`Soukassou Pro · ${today()}`,`Client : ${r.client}`];if(k==='contracts')L.push(`Objet : ${r.objet}`);
 L.push(`Montant : ${fmt(r.montant)}`);if(r.statut)L.push(`Statut : ${r.statut}`);L.push(`Paiement Mobile Money : ${db.cfg.phone}`);
 if(k==='contracts')L.push('','Signature du client : ______________','Signature Soukassou : ______________');
 L.forEach((t,j)=>d.text(t,20,45+j*9));d.save(`${k}-${Date.now()}.pdf`)}
function openPanicModal(){if(!db.cfg.pin)return alert('Définissez d’abord un code PIN dans Paramètres.');$('lock').classList.remove('hidden')}
function unlock(){if(prompt('Code PIN')===db.cfg.pin)$('lock').classList.add('hidden');else alert('Code incorrect.')}
function exportSoukassouBackup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db)],{type:'application/json'}));a.download=`soukassou-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function importBackup(f){if(!f)return;f.text().then(t=>{const o=JSON.parse(t);if(!o||!Array.isArray(o.sales))throw 0;db={...db,...o,cfg:{...db.cfg,...o.cfg}};save()}).catch(()=>alert('Fichier de sauvegarde invalide.'))}
function resetAll(){if(confirm('Effacer toutes les données de cet appareil ?')){try{localStorage.removeItem(KEY)}catch(e){}location.reload()}}
document.addEventListener('click',e=>{const x=e.target.closest('[data-a]');if(!x)return;const{a,k,i}=x.dataset,r=(db[k]||[])[i];
 if(a==='del'){if(confirm('Supprimer cet élément ?')){db[k].splice(i,1);save()}}
 else if(a==='next'){r.statut=ST[Math.min(2,ST.indexOf(r.statut)+1)];save()}
 else if(a==='pay'){if(k==='bills'){r.statut='Payé'}else r.paid=month();db.sales.push({total:Number(r.montant),method:k==='bills'?'Facture':'Mensualité',client:r.client,date:today()});save()}
 else if(a==='pdf')makePdf(k,r);
 else if(a==='cadd'){const c=cart.find(c=>c.i==i);c?c.q++:cart.push({i:+i,q:1});renderPos()}
 else if(a==='cdel'){cart[i].q>1?cart[i].q--:cart.splice(i,1);renderPos()}});
document.addEventListener('submit',e=>{const f=e.target.closest('form[data-mod]');if(!f)return;e.preventDefault();const k=f.dataset.mod,o=Object.fromEntries(new FormData(f));
 if(k==='chat'){db.chat.push({t:o.t,time:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})})}
 else if(k==='cfg'){if(!okPhone(o.phone))return alert('Numéro invalide.');db.cfg={tva:Number(o.tva)||0,phone:o.phone.replace(/\s/g,''),pin:o.pin}}
 else{for(const n of ['montant','jour'])if(n in o)o[n]=Number(o[n]);if('jour' in o&&(o.jour<1||o.jour>31))return alert('Le jour doit être entre 1 et 31.');db[dbk(k)].push({...o,...MODS[k].init})}
 save()});
const fitNav=()=>document.documentElement.style.setProperty('--hh',document.querySelector('header').offsetHeight+'px');
addEventListener('resize',fitNav);fitNav();refresh();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
