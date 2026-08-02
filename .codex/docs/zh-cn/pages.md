# 页面

简体中文 | [English](../en/pages.md)

## 路由外壳

`app/page.tsx` 仍然是一个轻量的 App Router 入口，用于渲染
`components/stitch-app.tsx` 中的单路由客户端工作区。这样，在工作区视图之间切换时，
上传内容、当前针脚状态以及未保存的编辑都能保持不变。

## 身份验证界面

`components/modals/auth-modal.tsx` 只包含一个 Google 登录操作，不提供注册标签页、
电子邮件输入框或密码输入框。Better Auth React 客户端负责提供会话加载、用户资料、
登录和退出登录状态。

受保护的导航会在 OAuth 回调 URL 中记录用户请求的视图。回调成功后，工作区会读取一次
`view` 参数，并继续执行用户请求的操作。页眉会显示 Google 头像或用户资料名称的首字母。
在检测会话期间，界面会显示禁用的加载状态。

匿名访客可以打开 `/?share=<id>` 链接。必须先使用共享的 Zod 校验验证其中嵌入的
`patternJson`，之后才会恢复只读的工作室状态。

## 视图模块

- `home-page.tsx` — 简介和精选图案预览。
- `gallery-page.tsx` — 图案搜索和选择。
- `upload-page.tsx` — 本地图像选择和转换入口。
- `projects-page.tsx` — 需要身份验证、由 D1 支持的项目卡片。
- `studio-page.tsx` — 针绣画布、进度控制和自动保存状态。

`components/layout/` 负责共享的页眉和页脚。`components/modals/` 负责 Google 身份验证
和分享对话框。`components/pattern/` 负责可复用的图案渲染。
