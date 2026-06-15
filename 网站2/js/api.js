 // API璇锋眰澶勭悊鍑芥暟
 async function handleApiRequest(url) {
     const customApi = url.searchParams.get('customApi') || '';
     const customDetail = url.searchParams.get('customDetail') || '';
     const source = url.searchParams.get('source') || 'heimuer';
 
     try {
         if (url.pathname === '/api/search') {
             const searchQuery = url.searchParams.get('wd');
             if (!searchQuery) {
                 throw new Error('缂哄皯鎼滅储鍙傛暟');
             }
             if (source === 'custom' && !customApi) {
                 throw new Error('浣跨敤鑷畾涔堿PI鏃跺繀椤绘彁渚汚PI鍦板潃');
             }
             if (!API_SITES[source] && source !== 'custom') {
                 throw new Error('鏃犳晥鐨凙PI鏉ユ簮');
             }
             const apiUrl = customApi
                 ? `${customApi}${API_CONFIG.search.path}${encodeURIComponent(searchQuery)}`
                 : `${API_SITES[source].api}${API_CONFIG.search.path}${encodeURIComponent(searchQuery)}`;
             const controller = new AbortController();
             const timeoutId = setTimeout(() => controller.abort(), 10000);
             try {
                 const proxiedUrl = await window.ProxyAuth?.addAuthToProxyUrl ?
                     await window.ProxyAuth.addAuthToProxyUrl(PROXY_URL + encodeURIComponent(apiUrl)) :
                     PROXY_URL + encodeURIComponent(apiUrl);
                 const response = await fetch(proxiedUrl, {
                     headers: API_CONFIG.search.headers,
                     signal: controller.signal
                 });
                 clearTimeout(timeoutId);
                 if (!response.ok) {
                     throw new Error(`API璇锋眰澶辫触: ${response.status}`);
                 }
                 const data = await response.json();
                 if (!data || !Array.isArray(data.list)) {
                     throw new Error('API杩斿洖鐨勬暟鎹牸寮忔棤鏁?);
                 }
                 data.list.forEach(item => {
                     item.source_name = source === 'custom' ? '鑷畾涔夋簮' : API_SITES[source].name;
                     item.source_code = source;
                     if (source === 'custom') {
                         item.api_url = customApi;
                     }
                 });
                 return JSON.stringify({ code: 200, list: data.list || [] });
             } catch (fetchError) {
                 clearTimeout(timeoutId);
                 throw fetchError;
             }
         }
 
         if (url.pathname === '/api/detail') {
             const id = url.searchParams.get('id');
             const sourceCode = url.searchParams.get('source') || 'heimuer';
             if (!id) throw new Error('缂哄皯瑙嗛ID鍙傛暟');
             if (!/^[\w-]+$/.test(id)) throw new Error('鏃犳晥鐨勮棰慖D鏍煎紡');
             if (sourceCode === 'custom' && !customApi) throw new Error('浣跨敤鑷畾涔堿PI鏃跺繀椤绘彁渚汚PI鍦板潃');
             if (!API_SITES[sourceCode] && sourceCode !== 'custom') throw new Error('鏃犳晥鐨凙PI鏉ユ簮');
 
             if (sourceCode !== 'custom' && API_SITES[sourceCode].detail) {
                 return await handleSpecialSourceDetail(id, sourceCode);
             }
             if (sourceCode === 'custom' && customDetail) {
                 return await handleCustomApiSpecialDetail(id, customDetail);
             }
 
             const detailUrl = customApi
                 ? `${customApi}${API_CONFIG.detail.path}${id}`
                 : `${API_SITES[sourceCode].api}${API_CONFIG.detail.path}${id}`;
             const controller = new AbortController();
             const timeoutId = setTimeout(() => controller.abort(), 10000);
             try {
                 const proxiedUrl = await window.ProxyAuth?.addAuthToProxyUrl ?
                     await window.ProxyAuth.addAuthToProxyUrl(PROXY_URL + encodeURIComponent(detailUrl)) :
                     PROXY_URL + encodeURIComponent(detailUrl);
                 const response = await fetch(proxiedUrl, {
                     headers: API_CONFIG.detail.headers,
                     signal: controller.signal
                 });
                 clearTimeout(timeoutId);
                 const data = await response.json();
                 if (!data || !data.list || !Array.isArray(data.list) || data.list.length === 0) {
                     throw new Error('鑾峰彇鍒扮殑璇︽儏鍐呭鏃犳晥');
                 }
                 const videoDetail = data.list[0];
                 let episodes = [];
                 if (videoDetail.vod_play_url) {
                     const playSources = videoDetail.vod_play_url.split('$$$');
                     if (playSources.length > 0) {
                         const mainSource = playSources[0];
                         const episodeList = mainSource.split('#');
                         episodes = episodeList.map(ep => {
                             const parts = ep.split('$');
                             return parts.length > 1 ? parts[1] : '';
                         }).filter(url => url && (url.startsWith('http://') || url.startsWith('https://')));
                     }
                 }
                 if (episodes.length === 0 && videoDetail.vod_content) {
                     const matches = videoDetail.vod_content.match(M3U8_PATTERN) || [];
                     episodes = matches.map(link => link.replace(/^\$/, ''));
                 }
                 return JSON.stringify({
                     code: 200, episodes: episodes, detailUrl: detailUrl,
                     videoInfo: {
                         title: videoDetail.vod_name, cover: videoDetail.vod_pic,
                         desc: videoDetail.vod_content, type: videoDetail.type_name,
                         year: videoDetail.vod_year, area: videoDetail.vod_area,
                         director: videoDetail.vod_director, actor: videoDetail.vod_actor,
                         remarks: videoDetail.vod_remarks,
                         source_name: sourceCode === 'custom' ? '鑷畾涔夋簮' : API_SITES[sourceCode].name,
                         source_code: sourceCode
                     }
                 });
             } catch (fetchError) {
                 clearTimeout(timeoutId);
                 throw fetchError;
             }
         }
         throw new Error('鏈煡鐨凙PI璺緞');
     } catch (error) {
         console.error('API澶勭悊閿欒:', error);
         return JSON.stringify({ code: 400, msg: error.message || '璇锋眰澶勭悊澶辫触', list: [], episodes: [] });
     }
 }
 
 async function handleCustomApiSpecialDetail(id, customApi) {
     try {
         const detailUrl = `${customApi}/index.php/vod/detail/id/${id}.html`;
         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), 10000);
         const proxiedUrl = await window.ProxyAuth?.addAuthToProxyUrl ?
             await window.ProxyAuth.addAuthToProxyUrl(PROXY_URL + encodeURIComponent(detailUrl)) :
             PROXY_URL + encodeURIComponent(detailUrl);
         const response = await fetch(proxiedUrl, {
             headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
             signal: controller.signal
         });
         clearTimeout(timeoutId);
         if (!response.ok) throw new Error(`鑷畾涔堿PI璇︽儏椤佃姹傚け璐? ${response.status}`);
         const html = await response.text();
         const generalPattern = /\$(https?:\/\/[^"'\s]+?\.m3u8)/g;
         let matches = html.match(generalPattern) || [];
         matches = matches.map(link => {
             link = link.substring(1);
             const parenIndex = link.indexOf('(');
             return parenIndex > 0 ? link.substring(0, parenIndex) : link;
         });
         const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
         const titleText = titleMatch ? titleMatch[1].trim() : '';
         const descMatch = html.match(/<div[^>]*class=["']sketch["'][^>]*>([\s\S]*?)<\/div>/);
         const descText = descMatch ? descMatch[1].replace(/<[^>]+>/g, ' ').trim() : '';
         return JSON.stringify({
             code: 200, episodes: matches, detailUrl: detailUrl,
             videoInfo: { title: titleText, desc: descText, source_name: '鑷畾涔夋簮', source_code: 'custom' }
         });
     } catch (error) {
         console.error(`鑷畾涔堿PI璇︽儏鑾峰彇澶辫触:`, error);
         throw error;
     }
 }
 
 async function handleSpecialSourceDetail(id, sourceCode) {
     try {
         const detailUrl = `${API_SITES[sourceCode].detail}/index.php/vod/detail/id/${id}.html`;
         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), 10000);
         const proxiedUrl = await window.ProxyAuth?.addAuthToProxyUrl ?
             await window.ProxyAuth.addAuthToProxyUrl(PROXY_URL + encodeURIComponent(detailUrl)) :
             PROXY_URL + encodeURIComponent(detailUrl);
         const response = await fetch(proxiedUrl, {
             headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
             signal: controller.signal
         });
         clearTimeout(timeoutId);
         if (!response.ok) throw new Error(`璇︽儏椤佃姹傚け璐? ${response.status}`);
         const html = await response.text();
         let matches = [];
         const generalPattern = /\$(https?:\/\/[^"'\s]+?\.m3u8)/g;
         matches = html.match(generalPattern) || [];
         matches = [...new Set(matches)];
         matches = matches.map(link => {
             link = link.substring(1);
             const parenIndex = link.indexOf('(');
             return parenIndex > 0 ? link.substring(0, parenIndex) : link;
         });
         const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
         const titleText = titleMatch ? titleMatch[1].trim() : '';
         const descMatch = html.match(/<div[^>]*class=["']sketch["'][^>]*>([\s\S]*?)<\/div>/);
         const descText = descMatch ? descMatch[1].replace(/<[^>]+>/g, ' ').trim() : '';
         return JSON.stringify({
             code: 200, episodes: matches, detailUrl: detailUrl,
             videoInfo: { title: titleText, desc: descText, source_name: API_SITES[sourceCode].name, source_code: sourceCode }
         });
     } catch (error) {
         console.error(`${API_SITES[sourceCode].name}璇︽儏鑾峰彇澶辫触:`, error);
         throw error;
     }
 }
 
 async function handleAggregatedSearch(searchQuery) {
     const availableSources = Object.keys(API_SITES).filter(key => key !== 'aggregated' && key !== 'custom');
     if (availableSources.length === 0) throw new Error('娌℃湁鍙敤鐨凙PI婧?);
     const searchPromises = availableSources.map(async (source) => {
         try {
             const apiUrl = `${API_SITES[source].api}${API_CONFIG.search.path}${encodeURIComponent(searchQuery)}`;
             const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error()), 8000));
             const proxiedUrl = await window.ProxyAuth?.addAuthToProxyUrl ?
                 await window.ProxyAuth.addAuthToProxyUrl(PROXY_URL + encodeURIComponent(apiUrl)) :
                 PROXY_URL + encodeURIComponent(apiUrl);
             const fetchPromise = fetch(proxiedUrl, { headers: API_CONFIG.search.headers });
             const response = await Promise.race([fetchPromise, timeoutPromise]);
             if (!response.ok) throw new Error();
             const data = await response.json();
             if (!data || !Array.isArray(data.list)) return [];
             return data.list.map(item => ({ ...item, source_name: API_SITES[source].name, source_code: source }));
         } catch (error) {
             return [];
         }
     });
     try {
         const resultsArray = await Promise.all(searchPromises);
         let allResults = [];
         resultsArray.forEach(results => { if (Array.isArray(results) && results.length > 0) allResults = allResults.concat(results); });
         if (allResults.length === 0) return JSON.stringify({ code: 200, list: [], msg: '鎵€鏈夋簮鍧囨棤鎼滅储缁撴灉' });
         const uniqueResults = [];
         const seen = new Set();
         allResults.forEach(item => {
             const key = `${item.source_code}_${item.vod_id}`;
             if (!seen.has(key)) { seen.add(key); uniqueResults.push(item); }
         });
         uniqueResults.sort((a, b) => (a.vod_name || '').localeCompare(b.vod_name || '') || (a.source_name || '').localeCompare(b.source_name || ''));
         return JSON.stringify({ code: 200, list: uniqueResults });
     } catch (error) {
         console.error('鑱氬悎鎼滅储澶勭悊閿欒:', error);
         return JSON.stringify({ code: 400, msg: '鑱氬悎鎼滅储澶勭悊澶辫触: ' + error.message, list: [] });
     }
 }
 
 // 鎷︽埅API璇锋眰
 (function() {
     const originalFetch = window.fetch;
     window.fetch = async function(input, init) {
         const requestUrl = typeof input === 'string' ? new URL(input, window.location.origin) : input.url;
         if (requestUrl.pathname.startsWith('/api/')) {
             try {
                 const data = await handleApiRequest(requestUrl);
                 return new Response(data, {
                     headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                 });
             } catch (error) {
                 return new Response(JSON.stringify({ code: 500, msg: '鏈嶅姟鍣ㄥ唴閮ㄩ敊璇? }), {
                     status: 500, headers: { 'Content-Type': 'application/json' }
                 });
             }
         }
         return originalFetch.apply(this, arguments);
     };
 })();
 
 async function testSiteAvailability(apiUrl) {
     try {
         const response = await fetch('/api/search?wd=test&customApi=' + encodeURIComponent(apiUrl), {
             signal: AbortSignal.timeout(5000)
         });
         if (!response.ok) return false;
         const data = await response.json();
         return data && data.code !== 400 && Array.isArray(data.list);
     } catch (error) {
         return false;
     }
 }
