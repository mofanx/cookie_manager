// 与页面交互的内容脚本
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getDomainCookies') {
        // 获取当前域名的所有cookie
        const cookies = document.cookie.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=');
            return { name, value };
        });
        sendResponse({ cookies });
    }
    return true;
});
