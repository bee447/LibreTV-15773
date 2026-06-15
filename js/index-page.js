 // 页面加载后初始化和URL参数处理
 document.addEventListener('DOMContentLoaded', function() {
     // 版权声明弹窗
     const hasSeenDisclaimer = localStorage.getItem('hasSeenDisclaimer');
     if (!hasSeenDisclaimer) {
         const disclaimerModal = document.getElementById('disclaimerModal');
         if (disclaimerModal) {
             disclaimerModal.style.display = 'flex';
             document.getElementById('acceptDisclaimerBtn').addEventListener('click', function() {
                 localStorage.setItem('hasSeenDisclaimer', 'true');
                 disclaimerModal.style.display = 'none';
             });
         }
     }
 
     // URL搜索参数处理
     if (window.location.pathname.startsWith('/watch')) return;
 
     const path = window.location.pathname;
     const searchPrefix = '/s=';
     if (path.startsWith(searchPrefix)) {
         const query = decodeURIComponent(path.substring(searchPrefix.length));
         if (query) {
             document.getElementById('searchInput').value = query;
             setTimeout(function() { search(); }, 500);
         }
     }
 
     // URL查询参数
     const params = new URLSearchParams(window.location.search);
     const searchParam = params.get('s');
     if (searchParam) {
         document.getElementById('searchInput').value = searchParam;
         setTimeout(function() { search(); }, 500);
     }
 });
