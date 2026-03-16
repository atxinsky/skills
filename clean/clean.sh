#!/bin/bash
# C盘空间快速分析脚本
# 用法: bash ~/.claude/skills/clean/clean.sh [--fix]

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=== C盘空间概况 ===${NC}"
df -h /c | tail -1 | awk '{printf "总容量: %s | 已用: %s | 剩余: %s | 使用率: %s\n", $2, $3, $4, $5}'
echo ""

echo -e "${CYAN}=== 用户目录占用 TOP15 ===${NC}"
du -sh /c/Users/atxin/*/ 2>/dev/null | sort -rh | head -15
echo ""

echo -e "${CYAN}=== AppData/Local 占用 TOP10 ===${NC}"
du -sh /c/Users/atxin/AppData/Local/*/ 2>/dev/null | sort -rh | head -10
echo ""

echo -e "${CYAN}=== AppData/Roaming 占用 TOP10 ===${NC}"
du -sh /c/Users/atxin/AppData/Roaming/*/ 2>/dev/null | sort -rh | head -10
echo ""

# 可清理项检测
echo -e "${CYAN}=== 可清理项 ===${NC}"

PIP_CACHE=$(du -sh /c/Users/atxin/AppData/Local/pip/cache/ 2>/dev/null | awk '{print $1}')
NPM_CACHE=$(du -sh /c/Users/atxin/AppData/Local/npm-cache/ 2>/dev/null | awk '{print $1}')
TEMP_SIZE=$(du -sh /c/Users/atxin/AppData/Local/Temp/ 2>/dev/null | awk '{print $1}')

[ -n "$PIP_CACHE" ] && echo -e "${YELLOW}pip 缓存:${NC} ${PIP_CACHE} → pip cache purge"
[ -n "$NPM_CACHE" ] && echo -e "${YELLOW}npm 缓存:${NC} ${NPM_CACHE} → npm cache clean --force"
[ -n "$TEMP_SIZE" ] && echo -e "${YELLOW}Temp 临时:${NC} ${TEMP_SIZE} → 磁盘清理工具"

# Docker 检测
if command -v docker &> /dev/null; then
    echo ""
    echo -e "${CYAN}=== Docker 占用 ===${NC}"
    docker system df 2>/dev/null || echo "Docker 未运行"

    VHDX_SIZE=$(ls -lh /c/Users/atxin/AppData/Local/Docker/wsl/disk/docker_data.vhdx 2>/dev/null | awk '{print $5}')
    [ -n "$VHDX_SIZE" ] && echo -e "${RED}Docker vhdx 文件:${NC} ${VHDX_SIZE} (prune后需手动压缩)"
fi

# 自动清理模式
if [ "$1" = "--fix" ]; then
    echo ""
    echo -e "${GREEN}=== 开始自动清理(低风险项) ===${NC}"

    echo -e "${YELLOW}清理 pip 缓存...${NC}"
    pip cache purge 2>/dev/null && echo "  Done" || echo "  Skipped"

    echo -e "${YELLOW}清理 npm 缓存...${NC}"
    npm cache clean --force 2>/dev/null && echo "  Done" || echo "  Skipped"

    echo -e "${YELLOW}清理 Temp 大文件...${NC}"
    find /c/Users/atxin/AppData/Local/Temp/ -maxdepth 1 -type f -mtime +7 -delete 2>/dev/null
    find /c/Users/atxin/AppData/Local/Temp/ -maxdepth 1 -type d -mtime +7 -exec rm -rf {} + 2>/dev/null
    echo "  Done (清理7天前的临时文件)"

    echo -e "${YELLOW}清理 Docker...${NC}"
    docker system prune -a --volumes -f 2>/dev/null && echo "  Done" || echo "  Skipped (Docker未运行?)"

    echo ""
    echo -e "${GREEN}=== 清理后 C 盘空间 ===${NC}"
    df -h /c | tail -1 | awk '{printf "总容量: %s | 已用: %s | 剩余: %s | 使用率: %s\n", $2, $3, $4, $5}'
    echo ""
    echo -e "${RED}提醒: Docker vhdx 需手动压缩（见 SKILL.md）${NC}"
fi
