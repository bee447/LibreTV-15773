 // 璞嗙摚鐑棬鎺ㄨ崘鍔熻兘
 let defaultMovieTags = ['鐑棬', '鏈€鏂?, '缁忓吀', '璞嗙摚楂樺垎', '鍐烽棬浣崇墖', '鍗庤', '娆х編', '闊╁浗', '鏃ユ湰', '鍔ㄤ綔', '鍠滃墽', '鐖辨儏', '绉戝够', '鎮枒', '鎭愭€?, '娌绘剤'];
 let defaultTvTags = ['鐑棬', '缇庡墽', '鑻卞墽', '闊╁墽', '鏃ュ墽', '鍥戒骇鍓?, '娓墽', '鏃ユ湰鍔ㄧ敾', '缁艰壓', '绾綍鐗?];
 let movieTags = [];
 let tvTags = [];
 let doubanMovieTvCurrentSwitch = 'movie';
 let doubanCurrentTag = '鐑棬';
 let doubanPageStart = 0;
 const doubanPageSize = 16;
 
 function loadUserTags() {
     try {
         const savedMovieTags = localStorage.getItem('userMovieTags');
         const savedTvTags = localStorage.getItem('userTvTags');
         movieTags = savedMovieTags ? JSON.parse(savedMovieTags) : [...defaultMovieTags];
         tvTags = savedTvTags ? JSON.parse(savedTvTags) : [...defaultTvTags];
     } catch (e) {
         movieTags = [...defaultMovieTags];
         tvTags = [...defaultTvTags];
     }
 }
 
 function saveUserTags() {
     try {
         localStorage.setItem('userMovieTags', JSON.stringify(movieTags));
         localStorage.setItem('userTvTags', JSON.stringify(tvTags));
     } catch (e) {}
 }
 
 function initDouban() {
     const doubanToggle = document.getElementById('doubanToggle');
     if (doubanToggle) {
         const isEnabled = localStorage.getItem('doubanEnabled') === 'true';
         doubanToggle.checked = isEnabled;
         const toggleBg = doubanToggle.nextElementSibling;
         const toggleDot = toggleBg.nextElementSibling;
         if (isEnabled) { toggleBg.classList.add('bg-pink-600'); toggleDot.classList.add('translate-x-6'); }
         doubanToggle.addEventListener('change', function(e) {
             const isChecked = e.target.checked;
             localStorage.setItem('doubanEnabled', isChecked);
             if (isChecked) { toggleBg.classList.add('bg-pink-600'); toggleDot.classList.add('translate-x-6'); }
             else { toggleBg.classList.remove('bg-pink-600'); toggleDot.classList.remove('translate-x-6'); }
             updateDoubanVisibility();
         });
         updateDoubanVisibility();
     }
     loadUserTags();
     renderDoubanMovieTvSwitch();
     renderDoubanTags();
     setupDoubanRefreshBtn();
     if (localStorage.getItem('doubanEnabled') === 'true') {
         renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
     }
 }
 
 function updateDoubanVisibility() {
     const doubanArea = document.getElementById('doubanArea');
     if (!doubanArea) return;
     const isEnabled = localStorage.getItem('doubanEnabled') === 'true';
     const resultsArea = document.getElementById('resultsArea');
     const isSearching = resultsArea && !resultsArea.classList.contains('hidden');
     if (isEnabled && !isSearching) {
         doubanArea.classList.remove('hidden');
     } else {
         doubanArea.classList.add('hidden');
     }
 }
 
 function fillAndSearchWithDouban(title) {
     if (!title) return;
     const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
     const input = document.getElementById('searchInput');
     if (input) {
         input.value = safeTitle;
         search();
     }
 }
 
 function renderDoubanMovieTvSwitch() {
     const movieToggle = document.getElementById('douban-movie-toggle');
     const tvToggle = document.getElementById('douban-tv-toggle');
     if (!movieToggle || !tvToggle) return;
     movieToggle.addEventListener('click', function() {
         if (doubanMovieTvCurrentSwitch !== 'movie') {
             movieToggle.classList.add('bg-pink-600', 'text-white');
             movieToggle.classList.remove('text-gray-300');
             tvToggle.classList.remove('bg-pink-600', 'text-white');
             tvToggle.classList.add('text-gray-300');
             doubanMovieTvCurrentSwitch = 'movie';
             doubanCurrentTag = '鐑棬';
             renderDoubanTags(movieTags);
             setupDoubanRefreshBtn();
             if (localStorage.getItem('doubanEnabled') === 'true') {
                 renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
             }
         }
     });
     tvToggle.addEventListener('click', function() {
         if (doubanMovieTvCurrentSwitch !== 'tv') {
             tvToggle.classList.add('bg-pink-600', 'text-white');
             tvToggle.classList.remove('text-gray-300');
             movieToggle.classList.remove('bg-pink-600', 'text-white');
             movieToggle.classList.add('text-gray-300');
             doubanMovieTvCurrentSwitch = 'tv';
             doubanCurrentTag = '鐑棬';
             renderDoubanTags(tvTags);
             setupDoubanRefreshBtn();
             if (localStorage.getItem('doubanEnabled') === 'true') {
                 renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
             }
         }
     });
 }
 
 function renderDoubanTags(tags) {
     const tagContainer = document.getElementById('douban-tags');
     if (!tagContainer) return;
     const currentTags = doubanMovieTvCurrentSwitch === 'movie' ? movieTags : tvTags;
     tagContainer.innerHTML = '';
     currentTags.forEach(tag => {
         const btn = document.createElement('button');
         let btnClass = 'py-1.5 px-3.5 rounded text-sm font-medium transition-all duration-300 border ';
         btnClass += tag === doubanCurrentTag ? 'bg-pink-600 text-white shadow-md border-white' : 'bg-[#1a1a1a] text-gray-300 hover:bg-pink-700 hover:text-white border-[#333] hover:border-white';
         btn.className = btnClass;
         btn.textContent = tag;
         btn.onclick = function() {
             if (doubanCurrentTag !== tag) {
                 doubanCurrentTag = tag;
                 doubanPageStart = 0;
                 renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
                 renderDoubanTags();
             }
         };
         tagContainer.appendChild(btn);
     });
 }
 
 function setupDoubanRefreshBtn() {
     const btn = document.getElementById('douban-refresh');
     if (!btn) return;
     btn.onclick = function() {
         doubanPageStart += doubanPageSize;
         if (doubanPageStart > 9 * doubanPageSize) doubanPageStart = 0;
         renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
     };
 }
 
 async function fetchDoubanData(url) {
     // 鍏堝皾璇曠洿杩烇紙涓嶈蛋浠ｇ悊锛?     try {
         const directResponse = await fetch(url, {
             signal: AbortSignal.timeout(4000),
             headers: {
                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                 'Referer': 'https://movie.douban.com/',
                 'Accept': 'application/json'
             }
         });
         if (directResponse.ok) {
             const data = await directResponse.json();
             if (data && data.subjects) return data;
         }
     } catch (e) {
         console.log('璞嗙摚鐩磋繛澶辫触:', e.message);
     }
     // 鐩磋繛澶辫触锛屼涪缁欎笂灞傚鐞嗭紙瑙﹀彂闄嶇骇灞曠ず锛?     throw new Error('鎵€鏈夋柟寮忓潎鏃犳硶璁块棶璞嗙摚');
 }
 
 function renderRecommend(tag, pageLimit, pageStart) {
     // 鍏堝皾璇曢€氳繃浠ｇ悊鑾峰彇璞嗙摚鏁版嵁
     // 濡傛灉澶辫触鍒欐樉绀虹儹闂ㄦ悳绱㈡帹鑽?     const container = document.getElementById('douban-results');
     if (!container) return;
     container.innerHTML = '<div class="col-span-full text-center py-8"><div class="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div><p class="text-gray-400 mt-2">鍔犺浇鐑棬鎺ㄨ崘...</p></div>';
     const target = 'https://movie.douban.com/j/search_subjects?type=' + doubanMovieTvCurrentSwitch + '&tag=' + encodeURIComponent(tag) + '&sort=recommend&page_limit=' + pageLimit + '&page_start=' + pageStart;
     fetchDoubanData(target)
         .then(data => {
             if (!data || !data.subjects || data.subjects.length === 0) {
                 showFallbackContent(container);
                 return;
             }
             const fragment = document.createDocumentFragment();
             data.subjects.forEach(item => {
                 const card = document.createElement('div');
                 card.className = 'bg-[#111] hover:bg-[#222] transition-all duration-300 rounded-lg overflow-hidden flex flex-col transform hover:scale-105 shadow-md cursor-pointer';
                 const safeTitle = (item.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                 const safeRate = (item.rate || '鏆傛棤').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                 card.innerHTML = '<div class="relative w-full aspect-[2/3] overflow-hidden" onclick="fillAndSearchWithDouban(\'' + safeTitle.replace(/'/g, "\\'") + '\')">' +
                     '<img src="' + (item.cover || '') + '" alt="' + safeTitle + '" class="w-full h-full object-cover" loading="lazy" referrerpolicy="no-referrer" onerror="this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22><rect fill=%22%23333%22 width=%22200%22 height=%22300%22/><text fill=%22%23666%22 font-size=%2216%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22>鏆傛棤娴锋姤</text></svg>\'">' +
                     '<div class="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>' +
                     '<div class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-sm"><span class="text-yellow-400">&#9733;</span> ' + safeRate + '</div>' +
                     '</div>' +
                     '<div class="p-2 text-center bg-[#111]"><button onclick="fillAndSearchWithDouban(\'' + safeTitle.replace(/'/g, "\\'") + '\')" class="text-sm font-medium text-white truncate w-full hover:text-pink-400 transition" title="' + safeTitle + '">' + safeTitle + '</button></div>';
                 fragment.appendChild(card);
             });
             container.innerHTML = '';
             container.appendChild(fragment);
         })
         .catch(error => {
             console.error('鑾峰彇璞嗙摚鏁版嵁澶辫触:', error);
             showFallbackContent(container);
         });
 }
 
 // 璞嗙摚涓嶅彲鐢ㄦ椂鐨勫閫夊唴瀹?- 鏄剧ず鐑棬鎼滅储鎺ㄨ崘
 function showFallbackContent(container) {
     var popularSearches = {
         movie: ['娴佹氮鍦扮悆2', '婊℃睙绾?, '鑲栫敵鍏嬬殑鏁戣祹', '杩欎釜鏉€鎵嬩笉澶喎', '鏄熼檯绌胯秺', '璁╁瓙寮归', '鍔熷か', '鏃犻棿閬?, '澶ц瘽瑗挎父', '鎸囩幆鐜?, '鐩楁ⅵ绌洪棿', '闃跨敇姝ｄ紶', '娉板潶灏煎厠鍙?, '鐤媯鍔ㄧ墿鍩?, '鍗冧笌鍗冨'],
         tv: ['鐙傞', '涓変綋', '婕暱鐨勫鑺?, '鏉冨姏鐨勬父鎴?, '缁濆懡姣掑笀', '鍘绘湁椋庣殑鍦版柟', '浜烘皯鐨勫悕涔?, '闅愮鐨勮钀?, '搴嗕綑骞?, '鐞呯悐姒?, '鐢勫瑳浼?, '姝︽灄澶栦紶', '瑗挎父璁?, '绾㈡ゼ姊?, '绻佽姳']
     };
     var items = doubanMovieTvCurrentSwitch === 'movie' ? popularSearches.movie : popularSearches.tv;
     var html = '<div class="col-span-full text-center py-2"><p class="text-gray-400 text-sm mb-4">璞嗙摚鏆傛椂鏃犳硶璁块棶锛岀湅鐪嬭繖浜涚儹闂ㄥ奖瑙嗗惂</p></div>';
     items.forEach(function(title) {
         var safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
         html += '<div class="bg-[#111] hover:bg-[#222] transition-all rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer border border-[#333] hover:border-pink-500 aspect-[2/3]" onclick="fillAndSearch(\'' + safeTitle.replace(/'/g, "\\'") + '\')">' +
             '<svg class="w-10 h-10 text-pink-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' +
             '<p class="text-white text-xs text-center truncate w-full">' + safeTitle + '</p>' +
             '</div>';
     });
     container.innerHTML = html;
 }
 
 function resetToHome() {
     resetSearchArea();
     updateDoubanVisibility();
 }
 
 document.addEventListener('DOMContentLoaded', initDouban);
 window.initDouban = initDouban;
 window.updateDoubanVisibility = updateDoubanVisibility;
 window.fillAndSearchWithDouban = fillAndSearchWithDouban;
 window.renderRecommend = renderRecommend;
 window.fetchDoubanData = fetchDoubanData;
 window.resetToHome = resetToHome;
