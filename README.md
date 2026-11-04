# Home Shield 2.0｜雙模式網站架構

## 網站瀏覽方式
- 電腦版（寬度大於 700px）：首頁顯示主視覺與六個獨立頁面入口；導覽列進入獨立 HTML 頁面。
- 手機版（寬度 700px 以下）：首頁保留完整一頁式內容；導覽列連到首頁相對應區塊。
- 共用 styles.css、app.js、home-shield-logo.png、hero-building.png。

## 檔案
- index.html：首頁；手機版完整一頁式，電腦版為首頁總覽。
- about.html：品牌理念
- solutions.html：解決方案
- bn1000.html：BN-1000
- process.html：服務流程
- passport.html：房屋健康護照
- contact.html：合作洽詢
- styles.css / app.js：共用樣式與導覽互動
- hero-building.png / home-shield-logo.png：原有品牌素材，請勿改名或刪除。

## 部署
將 ZIP 解壓縮後的所有檔案放在 GitHub repository 根目錄。不要把整個資料夾再包一層上傳。
Cloudflare 靜態網站仍以 repository 根目錄為輸出目錄，不需要 build command。
