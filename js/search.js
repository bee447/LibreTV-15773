 // 鎼滅储鍔熻兘
 let selectedAPIs = [];
 let apiCheckboxesInitialized = false;
 
 // 鍒濆鍖朅PI澶嶉€夋
 function initApiCheckboxes() {
     if (apiCheckboxesInitialized) return;
     apiCheckboxesInitialized = true;
     renderApiCheckboxes();
     loadSelectedAPIs();
 }
 
 // 娓叉煋API澶嶉€夋
 function renderApiCheckboxes() {
     const container = document.getElementById('apiCheckboxes');
     if (!container) return;
     container.innerHTML = '';
     const sources = Object.keys(API_SITES);
     sources.forEach(key => {
         const site = API_SITES[key];
         const label = document.createElement('label');
         label.className = 'flex items-center space-x-2 py-1 cursor-pointer group';
         const checkbox = document.createElement('input');
         checkbox.type = 'checkbox';
         checkbox.id = `api_${key}`;
         checkbox.className = 'form-checkbox h-4 w-4 text-blue-500 bg-[#222] border border-[#333] rounded cursor-pointer';
         checkbox.value = key;
         checkbox.addEventListener('change', updateSelectedAPIs);
         const span = document.createElement('span');
         span.className = 'text-sm text-gray-300 group-hover:text-white transition-colors';
         span.textContent = site.name || key;
         label.appendChild(checkbox);
         label.appendChild(span);
         container.appendChild(label);
     });
 }
 
 function selectAllAPIs(select, adultOnly) {
     const checkboxes = document.querySelectorAll('#apiCheckboxes input[type="checkbox"]');
     checkboxes.forEach(cb => {
         if (adultOnly) {
             const site = API_SITES[cb.value];
             cb.checked = select && (site && site.adult === true);
         } else {
             cb.checked = select;
         }
     });
     updateSelectedAPIs();
 }
 
 function updateSelectedAPIs() {
     const checkboxes = document.querySelectorAll('#apiCheckboxes input[type="checkbox"]:checked');
     selectedAPIs = Array.from(checkboxes).map(cb => cb.value);
     localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
     const countEl = document.getElementById('selectedApiCount');
     if (countEl) countEl.textContent = selectedAPIs.length;
 }
 
 function loadSelectedAPIs() {
     try {
         const saved = localStorage.getItem('selectedAPIs');
         if (saved) {
             selectedAPIs = JSON.parse(saved);
             selectedAPIs.forEach(key => {
                 const cb = document.getElementById(`api_${key}`);
                 if (cb) cb.checked = true;
             });
         } else {
             // 榛樿鍏ㄩ€?             selectAllAPIs(true);
         }
     } catch (e) {
         selectAllAPIs(true);
     }
     const countEl = document.getElementById('selectedApiCount');
     if (countEl) countEl.textContent = selectedAPIs.length;
 }
 
 async function searchByAPIAndKeyWord(apiId, query) {
     try {
         let apiUrl, apiName, apiBaseUrl;
         if (apiId.startsWith('custom_')) {
             const customIndex = apiId.replace('custom_', '');
             const customApi = getCustomApiInfo(customIndex);
             if (!customApi) return [];
             apiBaseUrl = customApi.url;
             apiUrl = apiBaseUrl + API_CONFIG.search.path + encodeURIComponent(query);
             apiName = customApi.name;
         } else {
             if (!API_SITES[apiId]) return [];
             apiBaseUrl = API_SITES[apiId].api;
             apiUrl = apiBaseUrl + API_CONFIG.search.path + encodeURIComponent(query);
             apiName = API_SITES[apiId].name;
         }
         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), 15000);
         const proxiedUrl = await window.ProxyAuth?.addAuthToProxyUrl ?
             await window.ProxyAuth.addAuthToProxyUrl(PROXY_URL + encodeURIComponent(apiUrl)) :
             PROXY_URL + encodeURIComponent(apiUrl);
         const response = await fetch(proxiedUrl, {
             headers: API_CONFIG.search.headers,
             signal: controller.signal
         });
         clearTimeout(timeoutId);
         if (!response.ok) return [];
         const data = await response.json();
         if (!data || !Array.isArray(data.list)) return [];
         return data.list.map(item => ({
             ...item,
             source_name: apiName,
             source_code: apiId,
             api_url: apiBaseUrl
         }));
     } catch (error) {
         console.warn(`${apiId}鎼滅储澶辫触:`, error);
         return [];
     }
 }
 
 // 鎼滅储鍑芥暟
 async function search() {
     const input = document.getElementById('searchInput');
     const query = input.value.trim();
     if (!query) {
         showToast('璇疯緭鍏ユ悳绱㈠叧閿瘝', 'warning');
         return;
     }
     saveSearchHistory(query);
     showLoading();
     const resultsArea = document.getElementById('resultsArea');
     const results = document.getElementById('results');
     const countEl = document.getElementById('searchResultsCount');
     const doubanArea = document.getElementById('doubanArea');
     results.innerHTML = '';
     resultsArea.classList.remove('hidden');
     if (doubanArea) doubanArea.classList.add('hidden');
 
     let allResults = [];
     if (AGGREGATED_SEARCH_CONFIG.enabled) {
         const promises = selectedAPIs.map(apiId => searchByAPIAndKeyWord(apiId, query));
         const resultsArray = await Promise.all(promises);
         resultsArray.forEach(r => { if (Array.isArray(r)) allResults = allResults.concat(r); });
         const seen = new Set();
         const unique = [];
         window.searchResultCache = window.searchResultCache || {};
allResults.forEach(function(item) {
  var cacheKey = item.vod_id + "_" + item.source_code;
  window.searchResultCache[cacheKey] = item.vod_play_url || "";
});
// Deduplicate
allResults.forEach(item => {
             const key = `${item.vod_id}_${item.source_code}`;
             if (!seen.has(key)) { seen.add(key); unique.push(item); }
         });
         allResults = unique;
     }
 
     hideLoading();
     countEl.textContent = allResults.length;
     if (allResults.length === 0) {
         results.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">鏈壘鍒扮浉鍏宠棰?/div>';
         return;
     }
     allResults.forEach(item => {
         const card = document.createElement('div');
         card.className = 'bg-[#111] hover:bg-[#222] transition-all duration-300 rounded-lg overflow-hidden flex flex-col transform hover:scale-105 shadow-md cursor-pointer';
         const safeTitle = (item.vod_name || '鏈煡').replace(/</g, '&lt;').replace(/>/g, '&gt;');
         const safeDesc = (item.vod_content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 100);
         const coverUrl = item.vod_pic || '';
         const sourceName = item.source_name || '';
         card.innerHTML = `
             <div class="relative w-full aspect-[2/3] overflow-hidden" onclick="showDetail('${item.vod_id}', '${item.source_code}', '${item.api_url || ''}')">
                 <img src="${coverUrl}" alt="${safeTitle}" class="w-full h-full object-cover"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22><rect fill=%22%23333%22 width=%22200%22 height=%22300%22/><text fill=%22%23666%22 font-size=%2216%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22>鏆傛棤娴锋姤</text></svg>'"
                     loading="lazy">
                 ${AGGREGATED_SEARCH_CONFIG.showSourceBadges ? `<div class="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">${sourceName}</div>` : ''}
             </div>
             <div class="p-2 flex flex-col flex-1">
                 <h3 class="text-sm font-medium text-white truncate" title="${safeTitle}">${safeTitle}</h3>
                 <p class="text-xs text-gray-400 mt-1 line-clamp-2">${safeDesc || '鏆傛棤绠€浠?}</p>
                 <button onclick="showDetail('${item.vod_id}', '${item.source_code}', '${item.api_url || ''}')" class="mt-auto text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 rounded transition-colors">鎾斁</button>
             </div>
         `;
         results.appendChild(card);
     });
 }
 
 window.search = search;
 window.searchByAPIAndKeyWord = searchByAPIAndKeyWord;
 window.selectAllAPIs = selectAllAPIs;
 window.updateSelectedAPIs = updateSelectedAPIs;
 window.selectedAPIs = selectedAPIs;
