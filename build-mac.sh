#!/bin/bash

# macOS 版本自动打包脚本
# 使用方法: ./build-mac.sh [选项]
# 选项:
#   --intel    只打包 Intel 版本
#   --arm64    只打包 Apple Silicon 版本
#   --all      打包所有版本 (默认)
#   --clean    清理之前的构建

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查系统
check_system() {
    print_info "检查系统环境..."
    
    # 检查是否在 macOS 上运行
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "此脚本只能在 macOS 系统上运行！"
        exit 1
    fi
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装！请从 https://nodejs.org/ 下载安装。"
        exit 1
    fi
    
    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm 未安装，正在安装..."
        npm install -g pnpm
    fi
    
    print_success "系统环境检查完成"
}

# 安装依赖
install_dependencies() {
    print_info "安装项目依赖..."
    
    if [ ! -d "node_modules" ]; then
        pnpm install
    else
        print_info "依赖已存在，跳过安装"
    fi
    
    print_success "依赖安装完成"
}

# 清理构建
clean_build() {
    print_info "清理之前的构建..."
    
    if [ -d "dist" ]; then
        rm -rf dist
        print_success "清理完成"
    else
        print_info "没有需要清理的文件"
    fi
}

# 打包函数
build_mac() {
    local arch=$1
    print_info "开始打包 macOS 版本 ($arch)..."
    
    if [ "$arch" = "all" ]; then
        pnpm run build:mac
    else
        pnpm run build:mac -- --$arch
    fi
    
    print_success "macOS 版本打包完成 ($arch)"
}

# 显示构建结果
show_results() {
    print_info "构建结果:"
    
    if [ -d "dist" ]; then
        echo ""
        echo "📦 生成的文件:"
        find dist -name "*.dmg" -o -name "*.app" | while read file; do
            size=$(du -h "$file" | cut -f1)
            echo "  📁 $file ($size)"
        done
        echo ""
        
        # 显示总大小
        total_size=$(du -sh dist | cut -f1)
        print_success "总构建大小: $total_size"
    else
        print_warning "未找到构建输出目录"
    fi
}

# 主函数
main() {
    local build_type="all"
    local clean_first=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --intel)
                build_type="x64"
                shift
                ;;
            --arm64)
                build_type="arm64"
                shift
                ;;
            --all)
                build_type="all"
                shift
                ;;
            --clean)
                clean_first=true
                shift
                ;;
            -h|--help)
                echo "使用方法: $0 [选项]"
                echo "选项:"
                echo "  --intel    只打包 Intel 版本"
                echo "  --arm64    只打包 Apple Silicon 版本"
                echo "  --all      打包所有版本 (默认)"
                echo "  --clean    清理之前的构建"
                echo "  -h, --help 显示此帮助信息"
                exit 0
                ;;
            *)
                print_error "未知选项: $1"
                echo "使用 $0 --help 查看帮助"
                exit 1
                ;;
        esac
    done
    
    print_info "开始 macOS 版本构建流程..."
    print_info "构建类型: $build_type"
    
    # 执行构建流程
    check_system
    
    if [ "$clean_first" = true ]; then
        clean_build
    fi
    
    install_dependencies
    build_mac "$build_type"
    show_results
    
    print_success "🎉 macOS 版本构建完成！"
    print_info "构建文件位于 dist/ 目录中"
}

# 运行主函数
main "$@"