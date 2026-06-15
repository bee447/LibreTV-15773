 // 版本检测
 (function() {
     const currentVersion = SITE_CONFIG.version || '1.0.0';
     console.log('LibreTV v' + currentVersion + ' 已加载');
 
     // 检查localStorage中的版本
     const storedVersion = localStorage.getItem('libretv_version');
     if (storedVersion && storedVersion !== currentVersion) {
         console.log('版本已更新: ' + storedVersion + ' -> ' + currentVersion);
         // 可以在这里执行版本升级逻辑
     }
     localStorage.setItem('libretv_version', currentVersion);
 })();
