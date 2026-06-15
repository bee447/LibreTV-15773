 // 密码保护功能
 function isPasswordProtected() {
     const pwd = window.__ENV__ && window.__ENV__.PASSWORD;
     return typeof pwd === 'string' && pwd.length === 64 && !/^0+$/.test(pwd);
 }
 
 function isPasswordRequired() {
     return !isPasswordProtected();
 }
 
 function ensurePasswordProtection() {
     if (isPasswordRequired()) {
         showPasswordModal();
         throw new Error('Password protection is required');
     }
     if (isPasswordProtected() && !isPasswordVerified()) {
         showPasswordModal();
         throw new Error('Password verification required');
     }
     return true;
 }
 
 window.isPasswordProtected = isPasswordProtected;
 window.isPasswordRequired = isPasswordRequired;
 
 async function verifyPassword(password) {
     try {
         const pwd = window.__ENV__ && window.__ENV__.PASSWORD;
         if (!pwd) return false;
         const hash = await sha256(password);
         return hash === pwd;
     } catch (e) {
         console.error('密码验证失败:', e);
         return false;
     }
 }
 
 function isPasswordVerified() {
     return localStorage.getItem(PASSWORD_CONFIG.localStorageKey) === 'true';
 }
 
 window.isPasswordVerified = isPasswordVerified;
 
 function showPasswordModal() {
     const modal = document.getElementById('passwordModal');
     if (modal) {
         modal.style.display = 'flex';
         document.getElementById('passwordInput').value = '';
         document.getElementById('passwordError').classList.add('hidden');
         document.getElementById('passwordInput').focus();
     }
 }
 
 function hidePasswordModal() {
     const modal = document.getElementById('passwordModal');
     if (modal) modal.style.display = 'none';
 }
 
 async function handlePasswordSubmit() {
     const passwordInput = document.getElementById('passwordInput');
     const password = passwordInput.value;
     const errorEl = document.getElementById('passwordError');
     const submitBtn = document.getElementById('passwordSubmitBtn');
 
     submitBtn.disabled = true;
     submitBtn.textContent = '验证中...';
 
     try {
         const isValid = await verifyPassword(password);
         if (isValid) {
             localStorage.setItem(PASSWORD_CONFIG.localStorageKey, 'true');
             localStorage.setItem('passwordVerifiedTime', Date.now().toString());
             hidePasswordModal();
             document.body.style.overflow = '';
             if (typeof initDouban === 'function') initDouban();
         } else {
             errorEl.classList.remove('hidden');
             passwordInput.value = '';
             passwordInput.focus();
         }
     } catch (e) {
         errorEl.classList.remove('hidden');
         console.error('密码验证过程出错:', e);
     } finally {
         submitBtn.disabled = false;
         submitBtn.textContent = '提交';
     }
 }
 
 // 初始化密码验证
 document.addEventListener('DOMContentLoaded', function() {
     if (isPasswordProtected()) {
         if (!isPasswordVerified()) {
             setTimeout(showPasswordModal, 500);
         }
     }
 });
 
 window.showPasswordModal = showPasswordModal;
 window.hidePasswordModal = hidePasswordModal;
 window.handlePasswordSubmit = handlePasswordSubmit;
 window.verifyPassword = verifyPassword;
 
 async function sha256(message) {
     const msgBuffer = new TextEncoder().encode(message);
     const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
     const hashArray = Array.from(new Uint8Array(hashBuffer));
     return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
 }
 window.sha256 = sha256;
