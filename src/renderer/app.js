const { ipcRenderer } = require("electron");

class ChineseConverter {
	constructor() {
		this.selectedPath = null;
		this.isConverting = false;
		this.currentDirection = 's2t'; // 默认简体转繁体
		this.initializeElements();
		this.bindEvents();
	}

	initializeElements() {
		// 文件转换相关元素
		this.dropZone = document.getElementById("dropZone");
		this.selectBtn = document.getElementById("selectBtn");
		this.convertBtn = document.getElementById("convertBtn");
		this.progressContainer = document.getElementById("progressContainer");
		this.progressText = document.getElementById("progressText");
		this.progressFill = document.getElementById("progressFill");
		this.fileList = document.getElementById("fileList");
		this.resultSummary = document.getElementById("resultSummary");
		this.totalFiles = document.getElementById("totalFiles");
		this.successFiles = document.getElementById("successFiles");
		this.errorFiles = document.getElementById("errorFiles");

		// 新增元素
		this.tabBtns = document.querySelectorAll(".tab-btn");
		this.tabContents = document.querySelectorAll(".tab-content");
		this.directionRadios = document.querySelectorAll('input[name="direction"]');
		
		// 文本转换相关元素
		this.inputText = document.getElementById("inputText");
		this.outputText = document.getElementById("outputText");
		this.convertTextBtn = document.getElementById("convertTextBtn");
		this.copyResultBtn = document.getElementById("copyResultBtn");
		this.clearTextBtn = document.getElementById("clearTextBtn");
	}

	bindEvents() {
		// 转换方向选择事件
		this.directionRadios.forEach(radio => {
			radio.addEventListener("change", (e) => {
				this.currentDirection = e.target.value;
				this.updateDirectionDisplay();
			});
		});

		// 标签页切换事件
		this.tabBtns.forEach(btn => {
			btn.addEventListener("click", (e) => {
				this.switchTab(e.target.dataset.tab);
			});
		});

		// 文件转换相关事件
		// 拖拽事件
		this.dropZone.addEventListener("dragover", (e) => {
			e.preventDefault();
			this.dropZone.classList.add("dragover");
		});

		this.dropZone.addEventListener("dragleave", (e) => {
			e.preventDefault();
			this.dropZone.classList.remove("dragover");
		});

		this.dropZone.addEventListener("drop", (e) => {
			e.preventDefault();
			this.dropZone.classList.remove("dragover");

			const files = Array.from(e.dataTransfer.files);
			if (files.length > 0 && files[0].path) {
				this.selectFolder(files[0].path);
			}
		});

		// 点击选择文件夹
		this.dropZone.addEventListener("click", () => {
			this.openFolderDialog();
		});

		this.selectBtn.addEventListener("click", () => {
			this.openFolderDialog();
		});

		// 开始转换
		this.convertBtn.addEventListener("click", () => {
			this.startConversion();
		});

		// 文本转换相关事件
		this.convertTextBtn.addEventListener("click", () => {
			this.convertText();
		});

		this.copyResultBtn.addEventListener("click", () => {
			this.copyResult();
		});

		this.clearTextBtn.addEventListener("click", () => {
			this.clearText();
		});

		// 输入文本变化时启用/禁用按钮
		this.inputText.addEventListener("input", () => {
			this.updateTextButtons();
		});

		// 监听转换进度
		ipcRenderer.on("conversion-progress", (event, data) => {
			this.handleProgress(data);
		});

		// 监听文本转换结果
		ipcRenderer.on("text-conversion-result", (event, data) => {
			this.handleTextConversionResult(data);
		});
	}

	async openFolderDialog() {
		if (this.isConverting) return;

		try {
			const folderPath = await ipcRenderer.invoke("select-folder");
			if (folderPath) {
				this.selectFolder(folderPath);
			}
		} catch (error) {
			console.error("选择文件夹失败:", error);
			alert("选择文件夹失败，请重试");
		}
	}

	selectFolder(folderPath) {
		if (this.isConverting) return;

		this.selectedPath = folderPath;
		this.updateDropZoneText(`已选择: ${folderPath}`);
		this.convertBtn.disabled = false;
		this.resetProgress();
	}

	updateDropZoneText(text) {
		const dropText = this.dropZone.querySelector(".drop-text");
		dropText.textContent = text;
	}

	resetProgress() {
		this.progressContainer.style.display = "none";
		this.resultSummary.classList.remove("show");
		this.progressFill.style.width = "0%";
		this.fileList.innerHTML = "";
	}

	// 更新转换方向显示
	updateDirectionDisplay() {
		// 可以在这里更新UI显示当前转换方向
		console.log(`转换方向已切换为: ${this.currentDirection}`);
	}

	// 标签页切换
	switchTab(tabName) {
		// 移除所有活动状态
		this.tabBtns.forEach(btn => btn.classList.remove("active"));
		this.tabContents.forEach(content => content.classList.remove("active"));

		// 激活选中的标签页
		const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
		const activeContent = document.getElementById(`${tabName}Tab`);
		
		if (activeBtn && activeContent) {
			activeBtn.classList.add("active");
			activeContent.classList.add("active");
		}
	}

	// 文本转换
	async convertText() {
		const inputText = this.inputText.value.trim();
		if (!inputText) {
			alert("请输入要转换的文本");
			return;
		}

		try {
			this.convertTextBtn.disabled = true;
			this.convertTextBtn.textContent = "转换中...";

			const result = await ipcRenderer.invoke("convert-text", {
				text: inputText,
				direction: this.currentDirection
			});

			if (result.success) {
				this.outputText.value = result.convertedText;
				this.copyResultBtn.disabled = false;
			} else {
				throw new Error(result.error || "转换失败");
			}
		} catch (error) {
			console.error("文本转换失败:", error);
			alert(`文本转换失败: ${error.message}`);
		} finally {
			this.convertTextBtn.disabled = false;
			this.convertTextBtn.textContent = "转换文本";
		}
	}

	// 复制结果
	async copyResult() {
		try {
			await navigator.clipboard.writeText(this.outputText.value);
			// 临时改变按钮文本提示复制成功
			const originalText = this.copyResultBtn.textContent;
			this.copyResultBtn.textContent = "已复制!";
			setTimeout(() => {
				this.copyResultBtn.textContent = originalText;
			}, 2000);
		} catch (error) {
			console.error("复制失败:", error);
			alert("复制失败，请手动复制");
		}
	}

	// 清空文本
	clearText() {
		this.inputText.value = "";
		this.outputText.value = "";
		this.updateTextButtons();
	}

	// 更新文本转换按钮状态
	updateTextButtons() {
		const hasInput = this.inputText.value.trim().length > 0;
		const hasOutput = this.outputText.value.trim().length > 0;
		
		this.convertTextBtn.disabled = !hasInput;
		this.copyResultBtn.disabled = !hasOutput;
	}

	// 处理文本转换结果
	handleTextConversionResult(data) {
		if (data.success) {
			this.outputText.value = data.convertedText;
			this.copyResultBtn.disabled = false;
		} else {
			alert(`转换失败: ${data.error}`);
		}
	}

	async startConversion() {
		if (!this.selectedPath || this.isConverting) return;

		this.isConverting = true;
		this.convertBtn.disabled = true;
		this.selectBtn.disabled = true;
		this.progressContainer.style.display = "block";
		this.resultSummary.classList.remove("show");

		try {
			const result = await ipcRenderer.invoke(
				"convert-project",
				{
					path: this.selectedPath,
					direction: this.currentDirection
				}
			);

			if (!result.success) {
				throw new Error(result.error || "转换失败");
			}
		} catch (error) {
			console.error("转换失败:", error);
			alert(`转换失败: ${error.message}`);
			this.resetConversionState();
		}
	}

	handleProgress(data) {
		switch (data.type) {
			case "start":
				this.progressText.textContent = `准备转换 ${data.total} 个文件...`;
				this.fileList.innerHTML = "";
				break;

			case "progress":
				const percentage = Math.round((data.current / data.total) * 100);
				this.progressFill.style.width = `${percentage}%`;
				this.progressText.textContent = `转换进度: ${data.current}/${data.total} (${percentage}%)`;

				// 添加文件到列表
				const fileItem = document.createElement("div");
				fileItem.className = `file-item ${data.success ? "success" : "error"}`;
				fileItem.textContent = `${data.success ? "✓" : "✗"} ${data.file}`;
				this.fileList.appendChild(fileItem);

				// 滚动到底部
				this.fileList.scrollTop = this.fileList.scrollHeight;
				break;

			case "complete":
				this.progressText.textContent = "转换完成！";
				this.showResults(data);
				this.resetConversionState();
				break;
		}
	}

	showResults(data) {
		this.totalFiles.textContent = data.total;
		this.successFiles.textContent = data.success;
		this.errorFiles.textContent = data.failed;
		this.resultSummary.classList.add("show");
	}

	resetConversionState() {
		this.isConverting = false;
		this.convertBtn.disabled = false;
		this.selectBtn.disabled = false;
	}
}

// 初始化应用
document.addEventListener("DOMContentLoaded", () => {
	new ChineseConverter();
});
