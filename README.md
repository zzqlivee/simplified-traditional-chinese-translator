# 简繁转换工具

一个基于 Electron 的桌面应用，用于将项目中的简体中文文件批量转换为繁体中文。

## 功能特性

- 🖱️ 支持拖拽文件夹操作
- 📁 自动遍历项目目录
- 🔄 批量转换文本文件
- 📊 实时显示转换进度
- ✅ 详细的转换结果报告
- 🚫 自动跳过二进制文件和系统目录

## 支持的文件类型

- JavaScript/TypeScript: `.js`, `.ts`, `.jsx`, `.tsx`
- Vue 组件: `.vue`
- 样式文件: `.css`, `.scss`, `.less`
- 标记语言: `.html`, `.xml`, `.md`
- 配置文件: `.json`, `.yaml`, `.yml`
- 文本文件: `.txt`

## 安装和运行

### 开发环境

1. 安装依赖：

```bash
pnpm install
```

2. 运行开发版本：

```bash
pnpm run dev
```

### 打包应用，现在是 github actions 自动构建

```bash
# 打包为 Windows 可执行文件
pnpm run build:win

# 打包为 macOS 应用
pnpm run build:mac

# 打包为 Linux AppImage
pnpm run build:linux
```

## 使用方法

1. 启动应用
2. 拖拽项目文件夹到应用窗口，或点击"选择文件夹"按钮
3. 点击"开始转换"按钮
4. 等待转换完成，查看转换结果

## 注意事项

- 转换前请备份重要文件
- 应用会跳过 `node_modules`、`.git`、`dist`、`build`、`.vscode` 等目录
- 只处理文本文件，二进制文件会被自动跳过
- 转换结果需要在提交代码时进行人工审核

## 技术栈

- Electron - 跨平台桌面应用框架
- Vue.js - 前端界面框架
- OpenCC - 简繁转换库
- Node.js - 后端逻辑处理

## 许可证

MIT License
