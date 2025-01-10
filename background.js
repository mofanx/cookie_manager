// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    
    switch (request.action) {
        case 'getAllCookies':
            getAllCookies(request.currentDomainOnly)
                .then(response => {
                    console.log('getAllCookies response:', response);
                    sendResponse(response);
                })
                .catch(error => {
                    console.error('getAllCookies error:', error);
                    sendResponse({ success: false, error: error.message });
                });
            break;
            
        case 'exportCookies':
            exportCookies(request.cookies)
                .then(response => {
                    console.log('exportCookies response:', response);
                    sendResponse(response);
                })
                .catch(error => {
                    console.error('exportCookies error:', error);
                    sendResponse({ success: false, error: error.message });
                });
            break;
            
        case 'importCookies':
            importCookies(request.cookies)
                .then(response => {
                    console.log('importCookies response:', response);
                    sendResponse(response);
                })
                .catch(error => {
                    console.error('importCookies error:', error);
                    sendResponse({ success: false, error: error.message });
                });
            break;
    }
    
    return true; // 保持消息通道开放
});

// 获取所有Cookie
async function getAllCookies(currentDomainOnly = true) {
    try {
        console.log('Getting cookies, currentDomainOnly:', currentDomainOnly);
        let cookies = [];
        
        if (currentDomainOnly) {
            // 获取当前标签页
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('Active tab:', activeTab);
            
            if (!activeTab?.url) {
                throw new Error('无法获取当前页面URL');
            }
            
            const url = new URL(activeTab.url);
            
            // 获取包括子域名的所有cookie
            const domains = [
                url.hostname,                              // 完整域名
                url.hostname.replace(/^www\./, ''),       // 去除www的域名
                `.${url.hostname.replace(/^www\./, '')}`, // 带点的域名（用于匹配子域名）
            ];
            
            // 去重
            const uniqueDomains = [...new Set(domains)];
            console.log('Domains to fetch:', uniqueDomains);
            
            // 获取所有相关域名的cookie
            for (const domain of uniqueDomains) {
                const domainCookies = await chrome.cookies.getAll({
                    domain: domain
                });
                cookies = cookies.concat(domainCookies);
            }
            
            // 去重（可能有重复的cookie）
            cookies = Array.from(new Map(cookies.map(cookie => [cookie.name + cookie.domain, cookie])).values());
        } else {
            // 获取所有Cookie
            cookies = await chrome.cookies.getAll({});
        }
        
        console.log('Found cookies:', cookies.length);
        
        // 转换cookie格式，保留更多信息
        const processedCookies = cookies.map(cookie => ({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite,
            expirationDate: cookie.expirationDate,
            storeId: cookie.storeId,
            hostOnly: cookie.hostOnly
        }));

        return {
            success: true,
            cookies: processedCookies
        };
    } catch (error) {
        console.error('获取Cookie失败:', error);
        throw new Error(`获取Cookie失败: ${error.message}`);
    }
}

// 获取指定域名的所有Cookie
async function getCookiesForDomain(domain) {
    try {
        return await chrome.cookies.getAll({ domain });
    } catch (error) {
        console.error(`获取Cookie失败 (${domain}):`, error);
        return [];
    }
}

// 导出Cookie
async function exportCookies(cookies) {
    try {
        console.log('Exporting cookies:', cookies);
        
        if (!cookies || !Array.isArray(cookies)) {
            throw new Error('无效的Cookie数据');
        }

        // 准备导出数据
        const exportData = {
            timestamp: new Date().toISOString(),
            cookies: cookies,
            metadata: {
                version: "1.0",
                exportedFrom: "Cookie Local Manager",
                totalCount: cookies.length
            }
        };

        // 将数据转换为Base64
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                try {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const filename = `cookies_${timestamp}.json`;
                    
                    await chrome.downloads.download({
                        url: reader.result,
                        filename: filename,
                        saveAs: true
                    });
                    
                    resolve({ success: true, message: `成功导出 ${cookies.length} 个Cookie` });
                } catch (error) {
                    reject(new Error(`导出失败: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('读取文件数据失败'));
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('导出Cookie失败:', error);
        throw new Error(`导出失败: ${error.message}`);
    }
}

// 导出所有Cookie
async function exportAllCookies() {
    try {
        // 获取当前活动标签页
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!activeTab?.url) {
            throw new Error('无法获取当前页面URL');
        }

        const url = new URL(activeTab.url);
        const domain = url.hostname;
        
        // 获取当前域名的所有Cookie
        const cookies = await getCookiesForDomain(domain);
        
        if (cookies.length === 0) {
            throw new Error('当前网站没有可导出的Cookie');
        }

        // 准备导出数据
        const exportData = {
            domain,
            timestamp: new Date().toISOString(),
            cookies: cookies.map(cookie => ({
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                path: cookie.path,
                secure: cookie.secure,
                httpOnly: cookie.httpOnly,
                sameSite: cookie.sameSite,
                expirationDate: cookie.expirationDate
            }))
        };

        // 创建Blob并下载
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `cookies_${domain}_${timestamp}.json`;
        
        await chrome.downloads.download({
            url: URL.createObjectURL(blob),
            filename,
            saveAs: true
        });

        return { success: true, message: `成功导出 ${cookies.length} 个Cookie` };
    } catch (error) {
        console.error('导出Cookie失败:', error);
        throw new Error(`导出失败: ${error.message}`);
    }
}

// 导入Cookie
async function importCookies(cookieData) {
    try {
        console.log('Importing cookies:', cookieData);
        
        if (!cookieData || !cookieData.cookies || !Array.isArray(cookieData.cookies)) {
            throw new Error('无效的Cookie数据格式');
        }

        // 获取当前标签页
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!activeTab?.url) {
            throw new Error('无法获取当前页面URL');
        }

        const currentUrl = new URL(activeTab.url);
        const currentDomain = currentUrl.hostname;

        // 验证域名匹配
        if (cookieData.domain && cookieData.domain !== currentDomain) {
            throw new Error(`Cookie域名不匹配 (${cookieData.domain} != ${currentDomain})`);
        }

        let successCount = 0;
        let errorCount = 0;

        for (const cookie of cookieData.cookies) {
            try {
                // 构建cookie设置对象
                const cookieDetails = {
                    url: `http${cookie.secure ? 's' : ''}://${cookie.domain || currentDomain}${cookie.path || '/'}`,
                    name: cookie.name,
                    value: cookie.value,
                    path: cookie.path || '/',
                    secure: cookie.secure || false,
                    httpOnly: cookie.httpOnly || false,
                    sameSite: cookie.sameSite || 'Lax'
                };

                if (cookie.expirationDate) {
                    cookieDetails.expirationDate = cookie.expirationDate;
                }

                await chrome.cookies.set(cookieDetails);
                successCount++;
            } catch (err) {
                console.error(`设置Cookie失败 (${cookie.name}):`, err);
                errorCount++;
            }
        }

        if (successCount === 0) {
            throw new Error('没有成功导入任何Cookie');
        }

        return {
            success: true,
            message: `成功导入 ${successCount} 个Cookie${errorCount > 0 ? `，${errorCount} 个失败` : ''}`
        };
    } catch (error) {
        console.error('导入Cookie失败:', error);
        throw new Error(`导入失败: ${error.message}`);
    }
}
