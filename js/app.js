 // 主应用初始化
 function resetToHome() {
     const searchArea = document.getElementById('searchArea');
     const resultsArea = document.getElementById('resultsArea');
     const doubanArea = document.getElementById('doubanArea');
     if (resultsArea) resultsArea.classList.add('hidden');
     if (searchArea) {
         searchArea.classList.remove('hidden');
         searchArea.style.display = 'flex';
     }
     if (doubanArea && localStorage.getItem('doubanEnabled') === 'true') {
         doubanArea.classList.remove('hidden');
     } else if (doubanArea) {
         doubanArea.classList.add('hidden');
     }
     document.getElementById('searchInput').value = '';
     document.title = 'LibreTV - 免费在线视频搜索与观看平台';
 }
 
 function resetSearchArea() {
     const searchArea = document.getElementById('searchArea');
     const resultsArea = document.getElementById('resultsArea');
     if (searchArea) {
         searchArea.classList.remove('hidden');
         searchArea.style.display = 'flex';
     }
     if (resultsArea) resultsArea.classList.add('hidden');
     const doubanArea = document.getElementById('doubanArea');
     if (doubanArea && localStorage.getItem('doubanEnabled') === 'true') {
         doubanArea.classList.remove('hidden');
     } else if (doubanArea) {
         doubanArea.classList.add('hidden');
     }
 }
 
 // 键盘事件 - 回车搜索
 document.addEventListener('DOMContentLoaded', function() {
     const searchInput = document.getElementById('searchInput');
     if (searchInput) {
         searchInput.addEventListener('keydown', function(e) {
             if (e.key === 'Enter') {
                 e.preventDefault();
                 search();
             }
         });
     }
 });
 
 window.resetToHome = resetToHome;
 window.resetSearchArea = resetSearchArea;
