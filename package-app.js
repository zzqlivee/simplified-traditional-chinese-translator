const fs = require("fs");
const path = require("path");

// 创建打包目录
const distDir = path.join(
	__dirname,
	"dist",
	"simplified-traditional-chinese-translator-win32-x64"
);
const electronDir = path.join(__dirname, "node_modules", "electron", "dist");
const resourcesDir = path.join(distDir, "resources");
const appDir = path.join(resourcesDir, "app");

console.log("开始手动打包应用...");

// 创建目录结构
if (!fs.existsSync(path.join(__dirname, "dist"))) {
	fs.mkdirSync(path.join(__dirname, "dist"));
}
if (!fs.existsSync(distDir)) {
	fs.mkdirSync(distDir);
}
if (!fs.existsSync(resourcesDir)) {
	fs.mkdirSync(resourcesDir);
}
if (!fs.existsSync(appDir)) {
	fs.mkdirSync(appDir);
}

// 复制 Electron 文件
function copyFileSync(src, dest) {
	if (fs.existsSync(src)) {
		fs.copyFileSync(src, dest);
		console.log(`复制: ${path.basename(src)}`);
	}
}

function copyDirSync(src, dest) {
	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest, { recursive: true });
	}

	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (let entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			copyDirSync(srcPath, destPath);
		} else {
			copyFileSync(srcPath, destPath);
		}
	}
}

// 复制 Electron 核心文件
console.log("复制 Electron 核心文件...");
const electronFiles = [
	"electron.exe",
	"LICENSE",
	"LICENSES.chromium.html",
	"chrome_100_percent.pak",
	"chrome_200_percent.pak",
	"d3dcompiler_47.dll",
	"ffmpeg.dll",
	"icudtl.dat",
	"libEGL.dll",
	"libGLESv2.dll",
	"resources.pak",
	"snapshot_blob.bin",
	"v8_context_snapshot.bin",
	"version",
	"vk_swiftshader.dll",
	"vk_swiftshader_icd.json",
	"vulkan-1.dll",
];

electronFiles.forEach((file) => {
	const src = path.join(electronDir, file);
	const dest = path.join(distDir, file);
	copyFileSync(src, dest);
});

// 复制 locales 目录
console.log("复制语言文件...");
copyDirSync(path.join(electronDir, "locales"), path.join(distDir, "locales"));

// 复制应用文件
console.log("复制应用文件...");

// 复制 package.json 从根目录
copyFileSync(
	path.join(__dirname, "package.json"),
	path.join(appDir, "package.json")
);

// 复制 main.js
const mainSrc = path.join(__dirname, "src", "main", "main.js");
const mainDest = path.join(appDir, "main.js");
if (fs.existsSync(mainSrc)) {
	copyFileSync(mainSrc, mainDest);
} else {
	console.log(`警告: 文件不存在 ${mainSrc}`);
}

// 复制 renderer 文件
const rendererSrcDir = path.join(__dirname, "src", "renderer");
const rendererFiles = ["index.html", "app.js"];

rendererFiles.forEach((file) => {
	const src = path.join(rendererSrcDir, file);
	const dest = path.join(appDir, file);
	if (fs.existsSync(src)) {
		copyFileSync(src, dest);
	} else {
		console.log(`警告: 文件不存在 ${src}`);
	}
});

// 复制 node_modules 中的必要依赖
console.log("复制依赖...");
const dependencies = ["opencc-js"];
dependencies.forEach((dep) => {
	const src = path.join(__dirname, "node_modules", dep);
	const dest = path.join(appDir, "node_modules", dep);
	if (fs.existsSync(src)) {
		copyDirSync(src, dest);
	}
});

// 重命名 electron.exe 为应用名称
const appExe = path.join(
	distDir,
	"simplified-traditional-chinese-translator.exe"
);
if (fs.existsSync(path.join(distDir, "electron.exe"))) {
	fs.renameSync(path.join(distDir, "electron.exe"), appExe);
	console.log(
		"重命名可执行文件为: simplified-traditional-chinese-translator.exe"
	);
}

console.log("打包完成！");
console.log(`应用位置: ${distDir}`);
console.log(`可执行文件: ${appExe}`);
