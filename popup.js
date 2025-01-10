document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const currentDomainOnly = document.getElementById('currentDomainOnly');
    const cookieList = document.getElementById('cookieList');
    const exportSelectedBtn = document.getElementById('exportSelectedBtn');
    const exportAllBtn = document.getElementById('exportAllBtn');
    const importBtn = document.getElementById('importBtn');
    const status = document.getElementById('status');

    let allCookies = [];

    // 显示状态信息
    function showStatus(message, type = 'success') {
        console.log('Showing status:', message, type);
        status.textContent = message;
        status.className = `status ${type} show`;
        setTimeout(() => {
            status.className = 'status';
        }, 3000);
    }

    // 加载Cookie列表
    async function loadCookies() {
        try {
            console.log('Loading cookies...');
            const response = await chrome.runtime.sendMessage({
                action: 'getAllCookies',
                currentDomainOnly: currentDomainOnly.checked
            });
            
            console.log('Load cookies response:', response);

            if (response.success) {
                allCookies = response.cookies;
                renderCookieList();
            } else if (response.error) {
                showStatus(response.error, 'error');
            }
        } catch (error) {
            console.error('Load cookies error:', error);
            showStatus(error.message || '加载Cookie失败', 'error');
        }
    }

    // 渲染Cookie列表
    function renderCookieList() {
        console.log('Rendering cookie list, total cookies:', allCookies.length);
        const searchTerm = searchInput.value.toLowerCase();
        const filteredCookies = allCookies.filter(cookie => {
            return cookie.name.toLowerCase().includes(searchTerm) ||
                   cookie.domain.toLowerCase().includes(searchTerm);
        });

        console.log('Filtered cookies:', filteredCookies.length);

        cookieList.innerHTML = filteredCookies.map(cookie => `
            <div class="cookie-item">
                <input type="checkbox" class="cookie-checkbox" value="${cookie.name}">
                <div class="cookie-info">
                    <div class="cookie-name">${cookie.name}</div>
                    <div class="cookie-domain">${cookie.domain}</div>
                </div>
            </div>
        `).join('');
    }

    // 获取选中的Cookie
    function getSelectedCookies() {
        const selectedNames = Array.from(document.querySelectorAll('.cookie-checkbox:checked'))
            .map(checkbox => checkbox.value);
        const selected = allCookies.filter(cookie => selectedNames.includes(cookie.name));
        console.log('Selected cookies:', selected.length);
        return selected;
    }

    // 导出选中的Cookie
    exportSelectedBtn.addEventListener('click', async () => {
        const selectedCookies = getSelectedCookies();
        if (selectedCookies.length === 0) {
            showStatus('请先选择要导出的Cookie', 'error');
            return;
        }

        try {
            console.log('Exporting selected cookies:', selectedCookies.length);
            exportSelectedBtn.disabled = true;
            const response = await chrome.runtime.sendMessage({
                action: 'exportCookies',
                cookies: selectedCookies
            });
            
            if (response.success) {
                showStatus(response.message, 'success');
            } else if (response.error) {
                showStatus(response.error, 'error');
            }
        } catch (error) {
            console.error('Export selected cookies error:', error);
            showStatus(error.message || '导出失败', 'error');
        } finally {
            exportSelectedBtn.disabled = false;
        }
    });

    // 导出所有Cookie
    exportAllBtn.addEventListener('click', async () => {
        if (allCookies.length === 0) {
            showStatus('没有可导出的Cookie', 'error');
            return;
        }

        try {
            console.log('Exporting all cookies:', allCookies.length);
            exportAllBtn.disabled = true;
            const response = await chrome.runtime.sendMessage({
                action: 'exportCookies',
                cookies: allCookies
            });
            
            if (response.success) {
                showStatus(response.message, 'success');
            } else if (response.error) {
                showStatus(response.error, 'error');
            }
        } catch (error) {
            console.error('Export all cookies error:', error);
            showStatus(error.message || '导出失败', 'error');
        } finally {
            exportAllBtn.disabled = false;
        }
    });

    // 导入Cookie
    importBtn.addEventListener('click', async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    console.log('Importing cookies from file');
                    importBtn.disabled = true;
                    const cookieData = JSON.parse(event.target.result);
                    const response = await chrome.runtime.sendMessage({ 
                        action: 'importCookies', 
                        cookies: cookieData 
                    });
                    
                    if (response.success) {
                        showStatus(response.message, 'success');
                        loadCookies(); // 重新加载Cookie列表
                    } else if (response.error) {
                        showStatus(response.error, 'error');
                    }
                } catch (error) {
                    console.error('Import cookies error:', error);
                    showStatus(error.message || '导入失败', 'error');
                } finally {
                    importBtn.disabled = false;
                }
            };

            reader.onerror = () => {
                console.error('File read error');
                showStatus('读取文件失败', 'error');
            };

            reader.readAsText(file);
        };

        input.click();
    });

    // 监听搜索输入
    searchInput.addEventListener('input', () => {
        console.log('Search term:', searchInput.value);
        renderCookieList();
    });

    // 监听域名筛选变化
    currentDomainOnly.addEventListener('change', () => {
        console.log('Domain filter changed:', currentDomainOnly.checked);
        loadCookies();
    });

    // 初始加载
    console.log('Initial load');
    loadCookies();
});
