 // UI核心功能
 function toggleHistory(e) {
     if (e) e.stopPropagation();
     const panel = document.getElementById('historyPanel');
     const isOpen = !panel.classList.contains('-translate-x-full');
     panel.classList.toggle('-translate-x-full');
     if (!isOpen) loadViewingHistory();
 }
 
 function toggleSettings(e) {
     if (e) e.stopPropagation();
     const panel = document.getElementById('settingsPanel');
     panel.classList.toggle('hidden');
 }
 
 function showToast(message, type) {
     const toast = document.getElementById('toast');
     const toastMsg = document.getElementById('toastMessage');
     if (!toast || !toastMsg) return;
     toastMsg.textContent = message;
     toast.classList.remove('opacity-0', '-translate-y-full');
     toast.classList.add('opacity-100', 'translate-y-0');
     setTimeout(() => {
         toast.classList.remove('opacity-100', 'translate-y-0');
         toast.classList.add('opacity-0', '-translate-y-full');
     }, 3000);
 }
 
 function showLoading() {
     const loading = document.getElementById('loading');
     if (loading) loading.classList.remove('hidden');
 }
 
 function hideLoading() {
     const loading = document.getElementById('loading');
     if (loading) loading.classList.add('hidden');
 }
 
 function closeModal() {
     const modal = document.getElementById('modal');
     if (modal) modal.classList.add('hidden');
 }
 
 function toggleClearButton() {
     const input = document.getElementById('searchInput');
     const btn = document.getElementById('clearSearchInput');
     if (input && btn) {
         btn.classList.toggle('hidden', !input.value);
     }
 }
 
 function clearSearchInput() {
     const input = document.getElementById('searchInput');
     if (input) {
         input.value = '';
         toggleClearButton();
         input.focus();
     }
 }
 
 // 观看历史
 function saveToViewingHistory(item) {
     try {
         let history = JSON.parse(localStorage.getItem('viewingHistory') || '[]');
         const key = item.vod_id + '_' + item.source_code;
         const existing = history.findIndex(h => (h.vod_id + '_' + h.source_code) === key);
         if (existing >= 0) history.splice(existing, 1);
         history.unshift({
             vod_id: item.vod_id,
             vod_name: item.vod_name,
             vod_pic: item.vod_pic,
             source_code: item.source_code,
             api_url: item.api_url || '',
             timestamp: Date.now()
         });
         if (history.length > 100) history = history.slice(0, 100);
         localStorage.setItem('viewingHistory', JSON.stringify(history));
     } catch (e) {
         console.error('保存观看历史失败:', e);
     }
 }
 
 function loadViewingHistory() {
     const list = document.getElementById('historyList');
     if (!list) return;
     try {
         const history = JSON.parse(localStorage.getItem('viewingHistory') || '[]');
         if (history.length === 0) {
             list.innerHTML = '<div class="text-center text-gray-500 py-8">暂无观看记录</div>';
             return;
         }
         let html = '';
         history.forEach(item => {
             const safeTitle = (item.vod_name || '未知').replace(/</g, '&lt;').replace(/>/g, '&gt;');
             const id = encodeURIComponent(item.vod_id || '');
             const src = encodeURIComponent(item.source_code || '');
             const api = encodeURIComponent(item.api_url || '');
             html += '<div class="flex items-center space-x-3 p-2 hover:bg-[#1a1a1a] rounded-lg cursor-pointer transition-colors" onclick="showDetail(\'' + id + '\',\'' + src + '\',\'' + api + '\')">';
             html += '<img src="' + (item.vod_pic || '') + '" alt="' + safeTitle + '" class="w-12 h-16 object-cover rounded" onerror="this.style.display=\'none\'">';
             html += '<div class="flex-1 min-w-0"><p class="text-sm text-white truncate">' + safeTitle + '</p><p class="text-xs text-gray-500">' + new Date(item.timestamp).toLocaleDateString() + '</p></div></div>';
         });
         list.innerHTML = html;
     } catch (e) {
         list.innerHTML = '<div class="text-center text-gray-500 py-8">暂无观看记录</div>';
     }
 }
 
 function clearViewingHistory() {
     localStorage.removeItem('viewingHistory');
     loadViewingHistory();
     showToast('已清空观看历史', 'info');
 }
 
 // 搜索历史
 function saveSearchHistory(query) {
     try {
         let history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
         const existing = history.indexOf(query);
         if (existing >= 0) history.splice(existing, 1);
         history.unshift(query);
         if (history.length > MAX_HISTORY_ITEMS) history = history.slice(0, MAX_HISTORY_ITEMS);
         localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
         updateRecentSearches();
     } catch (e) {
         console.error('保存搜索历史失败:', e);
     }
 }
 
 function updateRecentSearches() {
     const container = document.getElementById('recentSearches');
     if (!container) return;
     try {
         const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
         let html = '';
         history.forEach(query => {
             const safeQuery = query.replace(/</g, '&lt;').replace(/>/g, '&gt;');
             html += '<button onclick="fillAndSearch(\'' + safeQuery.replace(/'/g, '\\\'') + '\')" class="text-xs px-3 py-1.5 bg-[#1a1a1a] text-gray-400 hover:text-white rounded-full transition-colors border border-[#333] hover:border-white">' + safeQuery + '</button>';
         });
         container.innerHTML = html;
     } catch (e) {
         container.innerHTML = '';
     }
 }
 
 function fillAndSearch(query) {
     const input = document.getElementById('searchInput');
     if (input) {
         input.value = query;
         search();
     }
 }
 
 // 自定义API管理
 let customApis = [];
 
 function loadCustomApis() {
     try {
         const saved = localStorage.getItem('customApis');
         customApis = saved ? JSON.parse(saved) : [];
         renderCustomApisList();
     } catch (e) {
         customApis = [];
     }
 }
 
 function renderCustomApisList() {
     const list = document.getElementById('customApisList');
     if (!list) return;
     let html = '';
     customApis.forEach((api, index) => {
         const safeName = api.name.replace(/</g, '&lt;');
         const safeUrl = api.url.replace(/</g, '&lt;');
         html += '<div class="flex items-center justify-between p-2 bg-[#191919] rounded-lg mb-1">';
         html += '<div class="flex-1 min-w-0"><p class="text-sm text-white truncate">' + safeName + '</p><p class="text-xs text-gray-500 truncate">' + safeUrl + '</p></div>';
         html += '<button onclick="deleteCustomApi(' + index + ')" class="text-red-500 hover:text-red-400 ml-2">&times;</button></div>';
     });
     list.innerHTML = html || '<div class="text-center text-gray-500 text-xs py-2">暂无自定义API</div>';
 }
 
 function addCustomApi() {
     const nameInput = document.getElementById('customApiName');
     const urlInput = document.getElementById('customApiUrl');
     const detailInput = document.getElementById('customApiDetail');
     const adultCheckbox = document.getElementById('customApiIsAdult');
     const name = nameInput.value.trim();
     const url = urlInput.value.trim();
     const detail = detailInput.value.trim();
     if (!name || !url) {
         showToast('请填写API名称和地址', 'warning');
         return;
     }
     if (customApis.length >= CUSTOM_API_CONFIG.maxSources) {
         showToast('已达到最大自定义API数量', 'warning');
         return;
     }
     const newApi = { name: name, url: url, detail: detail || url, isAdult: adultCheckbox.checked };
     customApis.push(newApi);
     localStorage.setItem('customApis', JSON.stringify(customApis));
     renderCustomApisList();
     cancelAddCustomApi();
     showToast('自定义API添加成功', 'success');
 }
 
 function deleteCustomApi(index) {
     customApis.splice(index, 1);
     localStorage.setItem('customApis', JSON.stringify(customApis));
     renderCustomApisList();
 }
 
 function getCustomApiInfo(index) {
     return customApis[parseInt(index)] || null;
 }
 
 function showAddCustomApiForm() {
     document.getElementById('addCustomApiForm').classList.remove('hidden');
 }
 
 function cancelAddCustomApi() {
     document.getElementById('addCustomApiForm').classList.add('hidden');
     document.getElementById('customApiName').value = '';
     document.getElementById('customApiUrl').value = '';
     document.getElementById('customApiDetail').value = '';
     document.getElementById('customApiIsAdult').checked = false;
 }
 
 
// 从vod_play_url提取播放地址
function extractEpisodes(vodPlayUrl) {
  if (!vodPlayUrl) return [];
  var episodes = [];
  var groups = vodPlayUrl.split('$
 async function showDetail(vodId, sourceCode, apiUrl) {
     if (!vodId || !sourceCode) return;
     var cacheKey = vodId + '_' + sourceCode;
     var cachedPlayUrl = window.searchResultCache ? window.searchResultCache[cacheKey] : null;
     if (cachedPlayUrl) {
       var eps = extractEpisodes(cachedPlayUrl);
       if (eps.length > 0) {
         openPlayer(eps, {title: ''}, sourceCode);
         return;
       }
     }
     showLoading();
     try {
         let url = '/api/detail?id=' + encodeURIComponent(vodId) + '&source=' + encodeURIComponent(sourceCode);
         if (sourceCode === 'custom' && apiUrl) {
             const customApi = customApis.find(function(a) { return a.url === apiUrl; });
             if (customApi && customApi.detail && customApi.detail !== apiUrl) {
                 url += '&customDetail=' + encodeURIComponent(customApi.detail);
             }
             url += '&customApi=' + encodeURIComponent(apiUrl);
         }
         const response = await fetch(url);
         const data = await response.json();
         hideLoading();
         if (data.code !== 200 || !data.episodes || data.episodes.length === 0) {
             showToast('无法获取播放地址', 'error');
             return;
         }
         if (data.videoInfo) {
             saveToViewingHistory({
                 vod_id: vodId,
                 vod_name: data.videoInfo.title,
                 vod_pic: data.videoInfo.cover,
                 source_code: sourceCode,
                 api_url: apiUrl
             });
         }
         openPlayer(data.episodes, data.videoInfo, sourceCode);
     } catch (error) {
         hideLoading();
         showToast('获取详情失败: ' + error.message, 'error');
     }
 }
 
 function openPlayer(episodes, videoInfo, sourceCode) {
     if (!episodes || episodes.length === 0) {
         showToast('暂无可用播放地址', 'error');
         return;
     }
     const playUrl = episodes[0];
     if (!playUrl) {
         showToast('播放地址无效', 'error');
         return;
     }
     var params = new URLSearchParams();
     params.set('url', playUrl);
     params.set('title', videoInfo ? videoInfo.title : '');
     params.set('source', sourceCode || '');
     var playerUrl = CUSTOM_PLAYER_URL + '?' + params.toString();
     window.location.href = playerUrl;
 }
 
 // 导入导出配置
 function exportConfig() {
     var config = {
         selectedAPIs: typeof selectedAPIs !== 'undefined' ? selectedAPIs : [],
         customApis: customApis,
         yellowFilter: document.getElementById('yellowFilterToggle') ? document.getElementById('yellowFilterToggle').checked : false,
         adFilter: document.getElementById('adFilterToggle') ? document.getElementById('adFilterToggle').checked : true,
         doubanEnabled: localStorage.getItem('doubanEnabled') === 'true',
         version: 1
     };
     var blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
     var a = document.createElement('a');
     a.href = URL.createObjectURL(blob);
     a.download = 'libretv-config.json';
     a.click();
     showToast('配置已导出', 'success');
 }
 
 function importConfig() {
     var input = document.createElement('input');
     input.type = 'file';
     input.accept = '.json';
     input.onchange = function(e) {
         var file = e.target.files[0];
         if (!file) return;
         var reader = new FileReader();
         reader.onload = function(ev) {
             try {
                 var config = JSON.parse(ev.target.result);
                 if (config.selectedAPIs) {
                     selectedAPIs = config.selectedAPIs;
                     localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
                     document.querySelectorAll('#apiCheckboxes input[type="checkbox"]').forEach(function(cb) {
                         cb.checked = selectedAPIs.indexOf(cb.value) >= 0;
                     });
                 }
                 if (config.customApis) {
                     customApis = config.customApis;
                     localStorage.setItem('customApis', JSON.stringify(customApis));
                     renderCustomApisList();
                 }
                 showToast('配置已导入', 'success');
             } catch(err) {
                 showToast('配置文件格式错误', 'error');
             }
         };
         reader.readAsText(file);
     };
     input.click();
 }
 
 function clearLocalStorage() {
     if (confirm('确定要清除所有本地数据吗？')) {
         localStorage.clear();
         location.reload();
     }
 }
 
 // DOM加载完成后初始化
 document.addEventListener('DOMContentLoaded', function() {
     const yellowToggle = document.getElementById('yellowFilterToggle');
     if (yellowToggle) {
         const saved = localStorage.getItem('yellowFilterEnabled');
         yellowToggle.checked = saved !== 'false';
         const toggleBg = yellowToggle.nextElementSibling;
         const toggleDot = toggleBg.nextElementSibling;
         if (yellowToggle.checked) {
             toggleBg.classList.add('bg-pink-600');
             toggleDot.classList.add('translate-x-6');
         }
         yellowToggle.addEventListener('change', function() {
             localStorage.setItem('yellowFilterEnabled', this.checked);
             if (this.checked) { toggleBg.classList.add('bg-pink-600'); toggleDot.classList.add('translate-x-6'); }
             else { toggleBg.classList.remove('bg-pink-600'); toggleDot.classList.remove('translate-x-6'); }
         });
     }
     const adToggle = document.getElementById('adFilterToggle');
     if (adToggle) {
         const saved = localStorage.getItem('adFilteringEnabled');
         adToggle.checked = saved !== 'false';
         const toggleBg = adToggle.nextElementSibling;
         const toggleDot = toggleBg.nextElementSibling;
         if (adToggle.checked) { toggleBg.classList.add('bg-pink-600'); toggleDot.classList.add('translate-x-6'); }
         adToggle.addEventListener('change', function() {
             localStorage.setItem('adFilteringEnabled', this.checked);
             if (this.checked) { toggleBg.classList.add('bg-pink-600'); toggleDot.classList.add('translate-x-6'); }
             else { toggleBg.classList.remove('bg-pink-600'); toggleDot.classList.remove('translate-x-6'); }
         });
     }
     loadCustomApis();
     initApiCheckboxes();
     updateRecentSearches();
     document.addEventListener('click', function(e) {
         const panel = document.getElementById('settingsPanel');
         const btn = document.querySelector("[onclick*='toggleSettings']");
         if (panel && !panel.classList.contains('hidden') && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
             panel.classList.add('hidden');
         }
     });
 });
 
 // 暴露到全局
 window.toggleHistory = toggleHistory;
 window.toggleSettings = toggleSettings;
 window.showToast = showToast;
 window.showLoading = showLoading;
 window.hideLoading = hideLoading;
 window.closeModal = closeModal;
 window.toggleClearButton = toggleClearButton;
 window.clearSearchInput = clearSearchInput;
 window.saveToViewingHistory = saveToViewingHistory;
 window.clearViewingHistory = clearViewingHistory;
 window.saveSearchHistory = saveSearchHistory;
 window.updateRecentSearches = updateRecentSearches;
 window.fillAndSearch = fillAndSearch;
 window.showAddCustomApiForm = showAddCustomApiForm;
 window.cancelAddCustomApi = cancelAddCustomApi;
 window.addCustomApi = addCustomApi;
 window.deleteCustomApi = deleteCustomApi;
 window.getCustomApiInfo = getCustomApiInfo;
 window.showDetail = showDetail;
 window.exportConfig = exportConfig;
 window.importConfig = importConfig;
 window.clearLocalStorage = clearLocalStorage;
