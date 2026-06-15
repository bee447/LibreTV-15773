 // LibreTV Video Sources
 // Some sources may be blocked locally - they work when deployed to Netlify
 
 const CUSTOMER_SITES = {
     hongniu: {
         api: 'http://www.hongniuzy2.com/api.php/provide/vod',
         name: '\u7ea2\u725b\u8d44\u6e90',
     },
     kuyun: {
         api: 'http://www.kuyunzy.com/api.php/provide/vod',
         name: '\u9177\u4e91\u8d44\u6e90',
     },
     guangsu: {
         api: 'http://www.guangsuzy.com/api.php/provide/vod',
         name: '\u5149\u901f\u8d44\u6e90',
     },
     qiqi: {
         api: 'https://www.qiqidys.com/api.php/provide/vod',
         name: '\u4e03\u4e03\u8d44\u6e90',
     },
 };
 
 if (window.extendAPISites) {
     window.extendAPISites(CUSTOMER_SITES);
 } else {
     console.error('Error: load config.js first');
 }
