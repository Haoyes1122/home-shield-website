const menuToggle=document.getElementById("menuToggle");
const nav=document.getElementById("nav");
const dialog=document.getElementById("checkupDialog");
const start=document.getElementById("startCheckup");
const form=document.getElementById("checkupForm");
const result=document.getElementById("checkupResult");
document.getElementById("year").textContent=new Date().getFullYear();
menuToggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");menuToggle.setAttribute("aria-expanded",String(open));});
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menuToggle.setAttribute("aria-expanded","false");}));
start.addEventListener("click",()=>{if(dialog.showModal)dialog.showModal();else alert("請使用較新版本的瀏覽器開啟房屋健檢。");});
form.addEventListener("submit",e=>{
  e.preventDefault();
  const d=new FormData(form),location=d.get("location"),timing=d.get("timing"),age=d.get("age");
  let advice="建議先拍攝問題位置的遠景與近照，記錄發生時間、天候及近期用水情況，再評估是否需要現場檢查。";
  if(timing==="下雨時較明顯"||["外牆","屋頂","窗框／陽台"].includes(location)){
    advice="問題可能與雨水入侵、外牆接縫、窗框或屋頂防水細節有關。建議在安全情況下拍照記錄，並檢查外部接縫與排水路徑；不要只處理室內水痕。";
  }else if(location==="浴室／廚房"||timing==="洗澡或用水後"){
    advice="問題可能與用水區接縫、管線或防水層有關。建議記錄用水前後的變化，先確認是否持續漏水，再評估接縫修補或專業檢查。";
  }else if(timing==="只有水痕、壁癌或油漆剝落"){
    advice="水痕、壁癌或油漆剝落是表面現象，原因可能包含滲水、結露或潮氣。建議先釐清水分來源，不要在未確認原因前直接覆蓋或重新上漆。";
  }
  result.hidden=false;
  result.innerHTML=`<strong>初步整理結果</strong><p>問題位置：${esc(location)}<br>發生情況：${esc(timing)}<br>房屋屋齡：${esc(age)}</p><p>${advice}</p><p><b>建議下一步：</b>保存照片與紀錄。若漏水持續、範圍擴大或涉及電線／結構安全，請停止自行處理並尋求合格專業人員協助。</p><small>本結果為規則式示範，非真正 AI 診斷，不能確認實際漏水原因。</small>`;
});
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
