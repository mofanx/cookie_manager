# Cookie Local Manager

Cookie Local Manager 是一个Chrome扩展程序,用于管理、导出和导入浏览器Cookie。

## 功能

- 查看当前网站的Cookie
- 搜索特定的Cookie
- 选择性导出Cookie
- 导出所有Cookie
- 导入Cookie
- 支持仅显示当前域名的Cookie

## 安装

1. 下载此仓库或克隆到本地
2. 打开Chrome浏览器,进入 `chrome://extensions/`
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本项目的文件夹

## 使用方法

1. 点击Chrome工具栏中的扩展图标打开popup界面
2. 使用搜索框筛选Cookie
3. 勾选"仅当前域名"以只显示当前网站的Cookie
4. 选择要导出的Cookie,或直接导出全部
5. 使用导入功能可以恢复之前导出的Cookie

## 文件结构

- `manifest.json`: 扩展程序配置文件
- `popup.html`: 弹出窗口的HTML结构
- `popup.js`: 弹出窗口的交互逻辑
- `background.js`: 后台脚本,处理主要的Cookie操作
- `content.js`: 内容脚本,与页面交互
- [styles/popup.css](cci:7://file:///e:/protable/msys64/home/Yan/nodejs/CookieCloud-0.2.4/cookie_local/styles/popup.css:0:0-0:0): 弹出窗口的样式文件

## 贡献

欢迎提交问题和合并请求。对于重大更改,请先打开一个问题讨论您想要更改的内容。

## 许可证

[MIT](https://choosealicense.com/licenses/mit/)