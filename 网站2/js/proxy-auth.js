 // 代理鉴权模块
 window.ProxyAuth = window.ProxyAuth || {};
 
(function() {
    'use strict';

    // 代理索引，支持轮换
    var proxyIndex = 0;
    try {
        var saved = localStorage.getItem(PROXY_INDEX_KEY);
        if (saved !== null) proxyIndex = parseInt(saved) || 0;
    } catch(e) {}

    function getCurrentProxyUrl() {
        return PROXY_LIST[proxyIndex % PROXY_LIST.length] || PROXY_URL;
    }

    // 切换到下一个代理
    function rotateProxy() {
        proxyIndex = (proxyIndex + 1) % PROXY_LIST.length;
        try { localStorage.setItem(PROXY_INDEX_KEY, proxyIndex.toString()); } catch(e) {}
    }

    // 重置代理索引
    function resetProxy() {
        proxyIndex = 0;
        try { localStorage.setItem(PROXY_INDEX_KEY, '0'); } catch(e) {}
    }

    // 生成简单的鉴权参数
    function generateAuthParams() {
        const timestamp = Date.now();
         const rand = Math.random().toString(36).substring(2, 10);
         return `_t=${timestamp}&_r=${rand}`;
     }
 
    // 构建代理URL（使用当前代理）
    async function buildProxyUrl(targetUrl) {
        var proxyBase = getCurrentProxyUrl();
        var encoded = encodeURIComponent(targetUrl);
        var proxyUrl = proxyBase + encoded;
        var params = generateAuthParams();
        var separator = proxyUrl.includes('?') ? '&' : '?';
        return proxyUrl + separator + params;
    }

    // 带代理轮换的fetch
    async function proxiedFetch(targetUrl, options) {
        options = options || {};
        var lastError = null;
        var attempts = 0;
        var maxAttempts = Math.min(PROXY_LIST.length * 2, 6);

        while (attempts < maxAttempts) {
            attempts++;
            var proxyUrl = await buildProxyUrl(targetUrl);
            try {
                var controller = new AbortController();
                var timeoutId = setTimeout(function() { controller.abort(); }, options.timeout || 12000);
                var response = await fetch(proxyUrl, {
                    headers: options.headers || { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'application/json' },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (response.ok) {
                    // 重置代理索引（成功）
                    resetProxy();
                    return response;
                }
                lastError = new Error('HTTP ' + response.status);
            } catch(e) {
                lastError = e;
            }
            // 轮换代理重试
            rotateProxy();
        }
        throw lastError || new Error('所有代理均失败');
    }

    window.ProxyAuth.buildProxyUrl = buildProxyUrl;
    window.ProxyAuth.proxiedFetch = proxiedFetch;
    window.ProxyAuth.rotateProxy = rotateProxy;
    window.ProxyAuth.resetProxy = resetProxy;
    window.ProxyAuth.getCurrentProxyUrl = getCurrentProxyUrl;
})();
