const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const OpenCC = require("opencc-js");

// 创建主窗口
function createWindow() {
	const mainWindow = new BrowserWindow({
		width: 1000,
		height: 700,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
		},
		icon: path.join(__dirname, "../../assets/icon.png"),
		title: "简繁转换工具",
		autoHideMenuBar: true, // 隐藏菜单栏
	});

	// 完全移除菜单栏
	mainWindow.setMenuBarVisibility(false);

	// 加载应用页面
	mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));

	// 开发环境下打开开发者工具
	if (process.env.NODE_ENV === "development") {
		mainWindow.webContents.openDevTools();
	}
}

// 应用准备就绪时创建窗口
app.whenReady().then(createWindow);

// 所有窗口关闭时退出应用（macOS 除外）
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// 初始化简繁转换器
const converters = {
	s2t: OpenCC.Converter({ from: "cn", to: "tw" }), // 简体转繁体
	t2s: OpenCC.Converter({ from: "tw", to: "cn" }), // 繁体转简体
};

// 获取转换器
function getConverter(direction) {
	return converters[direction] || converters.s2t;
}

// 支持的文件扩展名
const supportedExtensions = [
	// 前端文件
	".js",
	".ts",
	".vue",
	".jsx",
	".tsx",
	".html",
	".css",
	".scss",
	".less",

	// 后端文件
	".php", // PHP
	".java", // Java
	".go", // Go
	".py", // Python
	".rb", // Ruby
	".cs", // C#
	".cpp", // C++
	".c", // C
	".h", // C/C++ 头文件
	".hpp", // C++ 头文件
	".kt", // Kotlin
	".scala", // Scala
	".rs", // Rust
	".swift", // Swift
	".m", // Objective-C
	".mm", // Objective-C++
	".pl", // Perl
	".sh", // Shell 脚本
	".bat", // Windows 批处理
	".ps1", // PowerShell
	".sql", // SQL

	// 配置和数据文件
	".json",
	".xml",
	".yaml",
	".yml",
	".toml", // TOML 配置
	".ini", // INI 配置
	".conf", // 配置文件
	".config", // 配置文件
	".properties", // Java 属性文件
	".env", // 环境变量文件

	// 文档和标记文件
	".md", // Markdown
	".txt", // 纯文本
	".rst", // reStructuredText
	".adoc", // AsciiDoc

	// 模板文件
	".tpl", // 模板文件
	".tmpl", // 模板文件
	".mustache", // Mustache 模板
	".hbs", // Handlebars 模板
	".ejs", // EJS 模板
	".pug", // Pug 模板
	".jade", // Jade 模板

	// 其他常见文件
	".log", // 日志文件
	".csv", // CSV 数据
	".tsv", // TSV 数据
];

// 检查文件是否为文本文件
function isTextFile(filePath) {
	const ext = path.extname(filePath).toLowerCase();
	return supportedExtensions.includes(ext);
}

// 递归获取目录下所有文件
async function getAllFiles(dirPath) {
	const files = [];

	async function traverse(currentPath) {
		try {
			const items = await fs.readdir(currentPath);

			for (const item of items) {
				const fullPath = path.join(currentPath, item);
				const stat = await fs.stat(fullPath);

				if (stat.isDirectory()) {
					// 跳过 node_modules, .git 等目录
					if (
						!["node_modules", ".git", "dist", "build", ".vscode"].includes(item)
					) {
						await traverse(fullPath);
					}
				} else if (stat.isFile() && isTextFile(fullPath)) {
					files.push(fullPath);
				}
			}
		} catch (error) {
			console.error(`读取目录失败: ${currentPath}`, error);
		}
	}

	await traverse(dirPath);
	return files;
}

// 转换单个文件
async function convertFile(filePath, direction = "s2t") {
	try {
		const content = await fs.readFile(filePath, "utf8");
		const converter = getConverter(direction);
		const convertedContent = converter(content);
		await fs.writeFile(filePath, convertedContent, "utf8");
		return { success: true, file: filePath };
	} catch (error) {
		console.error(`转换文件失败: ${filePath}`, error);
		return { success: false, file: filePath, error: error.message };
	}
}

// IPC 处理程序
ipcMain.handle("select-folder", async () => {
	const result = await dialog.showOpenDialog({
		properties: ["openDirectory"],
		title: "选择要转换的项目文件夹",
	});

	if (!result.canceled && result.filePaths.length > 0) {
		return result.filePaths[0];
	}
	return null;
});

ipcMain.handle("convert-project", async (event, options) => {
	try {
		// 兼容旧版本调用方式
		const projectPath = typeof options === "string" ? options : options.path;
		const direction =
			typeof options === "string" ? "s2t" : options.direction || "s2t";

		// 获取所有文件
		const files = await getAllFiles(projectPath);
		const totalFiles = files.length;

		// 发送总文件数
		event.sender.send("conversion-progress", {
			type: "start",
			total: totalFiles,
		});

		const results = [];

		// 逐个转换文件
		for (let i = 0; i < files.length; i++) {
			const result = await convertFile(files[i], direction);
			results.push(result);

			// 发送进度更新
			event.sender.send("conversion-progress", {
				type: "progress",
				current: i + 1,
				total: totalFiles,
				file: files[i],
				success: result.success,
			});
		}

		// 发送完成信息
		const successCount = results.filter((r) => r.success).length;
		const failCount = results.filter((r) => !r.success).length;

		event.sender.send("conversion-progress", {
			type: "complete",
			total: totalFiles,
			success: successCount,
			failed: failCount,
		});

		return {
			success: true,
			total: totalFiles,
			successCount,
			failCount,
			results,
		};
	} catch (error) {
		console.error("转换项目失败:", error);
		return {
			success: false,
			error: error.message,
		};
	}
});

// 文本转换处理器
ipcMain.handle("convert-text", async (event, options) => {
	try {
		const { text, direction = "s2t" } = options;

		if (!text || typeof text !== "string") {
			return {
				success: false,
				error: "无效的文本输入",
			};
		}

		const converter = getConverter(direction);
		const convertedText = converter(text);

		return {
			success: true,
			convertedText: convertedText,
		};
	} catch (error) {
		console.error("文本转换失败:", error);
		return {
			success: false,
			error: error.message,
		};
	}
});
