# 测试记录

测试日期：2026-11-15（UTC+8）。原型版本：0.1.0。

## 构建与逻辑

- TypeScript 严格类型检查通过；Vite 生产构建通过。
- 10 项单元测试通过：56 组词库、支持/不支持语法、模型输出验证、接口 URL 验证、缓存失效、仓库去重与链接验证、旧请求丢弃、重复请求合并、网络/超时/认证/限流/无效 JSON。
- npm 依赖审计报告为 0 个已知漏洞（仅针对此次安装时的依赖树）。

## 浏览器验证（准确区分测试方式）

| 项目 | 结果 |
|---|---|
| Edge 真实扩展加载 | 已通过，独立 headless profile，service worker 正常注册 |
| Edge 真实 GitHub 搜索页注入 | 已观察到面板、词库转换、原生列表保留；见 edge-live.png |
| Edge 完整交互 | 使用真实扩展＋模拟 HTTP，在受控页面通过 |
| Chrome 内容脚本交互 | 使用脚本注入＋模拟 messaging，在受控页面通过 |
| Chrome 完整扩展加载 | 未完成：当前品牌 Chrome 不接受自动测试的命令行加载方式，仍需在开发者模式手动安装验收 |
| 真实模型服务调用 | 未完成：没有用户提供的 API Key；用模拟接口覆盖成功、无效输出和 401 |

两种浏览器的受控场景覆盖：保留原结果、修改英文搜索、浅/深主题、SPA 切换到英文时移除面板、后退恢复、未配置密钥、拒绝不支持的范围语法、导航后的旧请求不回填。

Edge 额外验证：设置页填写并保存假密钥；默认仅 session 存储、local 无密钥；模型测试成功、无效响应、错误密钥提示；清除配置后 local/session 均无数据。没有使用任何真实密钥。截图带有 fixture 的都是测试数据，不代表线上搜索结果。

## 在线搜索质量

对 20 个中文需求分别调用 GitHub 仓库搜索 API，取默认相关性前 10 项；中文与英文各一次。最初遇到若干 403 限流，等待恢复后仅补测失败项，最终 40 份结果均已获得。原始项目名称、描述、URL、查询词及重试标记保存在 benchmark-results.json。

下面逐项检查“英文前十项是否有功能相关、含英文描述、且不在中文前十项中的项目”。按项目描述判断，20/20 有至少一项，超过 15/20 的基础目标；这不是盲测或全面的精确率测量，也不保证任意中文描述同样有效。

初始测试预设的是目标仓库关键词集合，**并非每项都预先锁定了完整 owner/repo**；下表是在取回结果后按描述复核的示例。因此严格的“预选固定仓库召回率”验收仍需另设独立测试集，不能把本表当成该指标。

| 中文查询 | 英文查询 | 新增相关英文项目示例 |
|---|---|---|
| 密码管理器 | password manager | PhilippC/keepass2android |
| 截图工具 | screenshot tool | ksnip/ksnip |
| 笔记软件 | note taking | streetwriters/notesnook |
| 文件同步 | file sync | syncthing/syncthing |
| 文件管理器 | file manager | files-community/Files |
| 下载工具 | download manager | agalwood/Motrix |
| 视频下载 | video downloader | yt-dlp/yt-dlp |
| 音乐播放器 | music player | naman14/Timber |
| 视频播放器 | video player | iina/iina |
| 图片压缩 | image compression | Lymphatus/caesium-image-compressor |
| 录屏工具 | screen recorder | NickeManarin/ScreenToGif |
| 剪贴板管理 | clipboard manager | hluk/CopyQ |
| 远程桌面 | remote desktop | rustdesk/rustdesk |
| 思维导图 | mind map | SSShooter/mind-elixir-core |
| 电子书阅读器 | ebook reader | koreader/koreader |
| 文字识别 | OCR | tesseract-ocr/tesseract |
| 语音识别 | speech recognition | openai/whisper |
| 向量数据库 | vector database | qdrant/qdrant |
| 浏览器自动化 | browser automation | SeleniumHQ/selenium |
| 终端模拟器 | terminal emulator | alacritty/alacritty |

唯一一次词库调优：将“截图工具”的英文从 screenshot 改为 screenshot tool，避免大量截图转代码或无关项目。旧结果也保存在同一 JSON 的 previousExpanded 中。其余查询未按结果反复调词。

## 发布前尚需验证

- 在用户常用 Chrome/Edge 有界面环境中手动加载，使用正常 GitHub 登录态检查兼容性。
- 配置实际模型，测试自由描述、服务商响应格式与费用。当前仅本地词库完成在线质量测试。
- 为固定仓库召回率建立独立、预先锁定完整仓库名称的测试集；确认不是只对现有词库有效。
- GitHub DOM 变化时需要维护锚点。中文零结果使用已观察到的搜索子标题作为备用锚点，该分支尚未完成真实零结果页验收。

本版本可用于小范围试用，不应宣传为已通过全部发布验收。
