# GitHub 中英项目搜索 · 0.1.0

输入中文搜索公开 GitHub 仓库，原页面自动补充最多 10 个英文相关项目。保留原结果；支持编辑英文关键词、展开/折叠、查看原生英文搜索。

**下载：** [扩展安装包 v0.1.0](https://github.com/wmyshen/github-bilingual-search/raw/refs/heads/main/downloads/github-bilingual-search-extension.zip) · [测试记录](TEST-REPORT.md)

这是供小范围试用的原型。Edge 已验证真实扩展加载；Chrome 完整加载和真实模型服务仍需试用验证，详细限制见测试记录。

## 安装（无需构建）

1. 解压 `github-bilingual-search-extension.zip` 到一个固定文件夹，不要直接选择 ZIP。
2. Edge 打开 `edge://extensions`，Chrome 打开 `chrome://extensions`。
3. 打开「开发者模式」，点击「加载已解压的扩展程序」，选择包含 `manifest.json` 的文件夹。使用源码目录时选择 `dist`。
4. 打开或刷新 GitHub，在 Repositories 搜索中输入「密码管理器」「截图工具」「剪贴板管理」试用。这些词走本地词库，不需要密钥。
5. 若中文结果未出现补充区域，先确认搜索类型为 Repositories，刷新页面；GitHub 页面结构变化可能使扩展暂时停止注入。

Chrome 新版不支持本项目测试使用的命令行加载扩展方式，请从上述开发者模式手动加载。不要安装时关闭其他扩展或修改日常浏览器配置。

## 配置任意中文描述的翻译

点击浏览器工具栏的扩展图标，或结果面板中的「设置模型 / 清除缓存」。

- Base URL：填写服务商提供的 HTTPS API 根地址，例如 `https://你的服务/v1`；扩展自动追加 `/chat/completions`。
- 模型名称：填写服务商的模型 ID。接口需兼容 Chat Completions 的 messages、max_tokens 和 choices[0].message.content。
- API Key：填写自己的密钥，点击「授权并保存」，允许访问你填写的服务域名，再点击「测试连接」。测试的是已经保存的配置。
- 默认只保存在浏览器会话中，重启后需重新输入。选择「记住密钥」后存于扩展本机存储，不进行云同步，也不是加密密码保险库。
- 翻译服务费用由使用者的服务账户承担。可不配置接口，使用 56 组内置关键词或在面板手动填英文。

仅查询中的自然语言关键词会发往模型服务商；筛选条件保留在本机。扩展不发送页面正文、登录 cookie 或 GitHub token。英文搜索词发往 GitHub 公共搜索 API。无遥测、无公共后台。

## 支持与限制

- 仅公开仓库、中文查询。纯英文和代码/Issues 搜索不触发。
- 支持 `language:Python stars:>100 fork:false archived:false topic:rag` 等筛选。
- 不自动处理 `repo:`、`org:`、`user:`、引号、括号、布尔表达式和其他未支持语法，避免改变原搜索范围。
- 翻译缓存 30 天，搜索缓存 5 分钟，总缓存上限 300 条；设置页可清除。缓存可能包含你的查询词。
- 匿名 GitHub 搜索通常限额 10 次/分钟，网络出口可能共享额度。限流时显示恢复时间，不自动重试；可以使用「在 GitHub 打开英文搜索」链接。
- 只展示 API 最相关的前 10 项，英文查询不能保证覆盖全部相关项目。不同搜索词、GitHub 排序变化都会影响结果。
- 目前不提供 GitHub token 配置、私有仓库搜索、结果翻译、商店安装或移动浏览器支持。
- 结果渲染使用 textContent、GitHub 链接校验及 Shadow DOM；外部请求在后台处理，密钥存储不向内容脚本开放。

## 源码与验证

需要 Node.js 22+ 和 npm。在源码文件夹运行：

```sh
npm ci
npm test
npm run build
npm run test:browser
```

浏览器测试默认使用 Windows 标准安装路径的 Chrome/Edge，创建独立临时测试 profile，不使用日常 profile。Edge 加载真实扩展并模拟 HTTP，Chrome 若无法自动加载则注入内容脚本测试；`ui-test-results.json` 会明确区分两者。模拟数据不代表实时搜索质量。

```sh
npm run benchmark
```

在线基准以 7 秒间隔执行 40 次匿名查询（20 组中英文），约需 5 分钟或更长，写入 `benchmark-results.json`。可能遭遇共享 IP 限流。预选关键词命中只能提示候选项目，需要结合描述人工判断，不应直接把命中率当成相关性分数。

详细测试证据和未完成项见 `TEST-REPORT.md`。
