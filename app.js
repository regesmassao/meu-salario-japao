const ids=['hourly','normal','overtime','night','nightDays','meal','days','other','nightFixed','bonus'];
const defaults={hourly:1230,normal:160,overtime:0,night:0,nightDays:0,meal:0,days:20,other:0,nightFixed:1500,bonus:0};
const $=id=>document.getElementById(id); const num=id=>Number($(id).value)||0;
function yen(v){return '¥'+Math.round(v).toLocaleString('ja-JP');}
function calculate(){
 const hourly=num('hourly'), normal=num('normal'), overtime=num('overtime'), night=num('night'), nightDays=num('nightDays');
 const normalPay=hourly*normal, overtimePay=hourly*1.25*overtime, nightPay=hourly*.25*night;
 const nightFixedPay=nightDays*num('nightFixed'), mealPay=num('meal')*num('days'), otherPay=num('other'), bonusPay=num('bonus');
 const total=normalPay+overtimePay+nightPay+nightFixedPay+mealPay+otherPay+bonusPay;
 $('normalPay').textContent=yen(normalPay); $('overtimePay').textContent=yen(overtimePay); $('nightPay').textContent=yen(nightPay); $('nightFixedPay').textContent=yen(nightFixedPay); $('mealPay').textContent=yen(mealPay); $('otherPay').textContent=yen(otherPay); $('bonusPay').textContent=yen(bonusPay); $('totalPay').textContent=yen(total);
 ids.forEach(id=>localStorage.setItem('msj35_'+id,$(id).value));
}
function load(){ids.forEach(id=>{const s=localStorage.getItem('msj35_'+id); if(s!==null)$(id).value=s; $(id).addEventListener('input',calculate)}); calculate();}
$('reset').addEventListener('click',()=>{ids.forEach(id=>{ $(id).value=defaults[id]; localStorage.removeItem('msj35_'+id);}); calculate();});
if('serviceWorker' in navigator) addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
load();
