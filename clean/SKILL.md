---
name: clean
description: "C盘空间清理。快速分析磁盘占用，一键清理缓存和临时文件。触发词：'/clean'、'清理C盘'、'磁盘空间不够'。"
---

# C盘空间清理 Skill

快速分析 + 清理 C 盘空间，不浪费 token。

## 流程

收到 `/clean` 后，直接执行脚本：

```bash
bash ~/.claude/skills/clean/clean.sh
```

脚本会自动：
1. 显示 C 盘空间概况
2. 扫描各大占用项（用户目录、AppData、Docker 等）
3. 列出可清理项和预估可释放空间

然后根据用户指令，执行对应清理命令：

### 可清理项速查

| 项目 | 命令 | 风险 |
|------|------|------|
| pip 缓存 | `pip cache purge` | 低 |
| npm 缓存 | `npm cache clean --force` | 低 |
| Temp 临时文件 | 脚本自动清理 | 低 |
| Docker 无用镜像/缓存 | `docker system prune -a --volumes -f` | 中 |
| Docker vhdx 压缩 | 需关闭 Docker 后手动执行 diskpart | 高 |
| Chrome 缓存 | 用户在 Chrome 设置中清除 | 低 |

### Docker vhdx 压缩（手动）

Docker prune 后 vhdx 不会自动缩小，需要：

1. 关闭 Docker Desktop
2. 打开 **管理员 PowerShell**，执行：
```powershell
wsl --shutdown
Optimize-VHD -Path "$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx" -Mode Full
```
如果没有 Hyper-V，用 diskpart：
```powershell
wsl --shutdown
diskpart
# 在 diskpart 中：
select vdisk file="C:\Users\atxin\AppData\Local\Docker\wsl\disk\docker_data.vhdx"
attach vdisk readonly
compact vdisk
detach vdisk
exit
```

## 注意

- 先展示分析结果，等用户确认再清理
- 不要删除用户项目文件，除非用户明确指定
- Docker vhdx 压缩风险较高，提醒用户手动操作
