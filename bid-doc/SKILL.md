---
name: bid-doc
description: "投标服务方案文档生成器。根据采购技术规范和评分标准，自动生成完整的投标服务方案文档（Word + 信息图）。当用户说\"生成投标方案\"、\"做标书\"、\"做服务方案\"、\"按技术规范出文档\"时使用此skill。"
---

# 投标服务方案文档生成器

根据采购技术规范和评分标准，自动生成完整的投标服务方案文档（Word + 信息图）。适用于培训类项目投标。

## 输入要求

用户需提供：
1. **技术规范文件**（.doc 或 .docx）— 采购技术规范
2. **评分标准**（图片或文字）— 评分项和分值（可选，默认按服务方案+工作进度评分）
3. **参考方案**（.docx）— 可选，作为格式和内容参考

## 工作流程

### Step 1: 解析技术规范

如果是 .doc 文件，先用 win32com 转换为 .docx：

```python
import win32com.client, pythoncom
pythoncom.CoInitialize()
word = win32com.client.Dispatch("Word.Application")
word.Visible = False
doc = word.Documents.Open(r"原始文件路径.doc")
doc.SaveAs2(r"转换后路径.docx", 16)
doc.Close()
del doc, word
pythoncom.CoUninitialize()
```

然后用 python-docx 读取所有段落和表格，提取：
- 项目名称、甲方单位全称
- 培训对象、人数、期数、天数
- 培训内容覆盖（从表格的"培训内容覆盖"行提取，这是最权威的内容列表）
- 培训方式、考核方式
- 师资要求（职称等级）
- 满意率要求
- 交付物要求
- 保密要求
- 后续服务要求

**关键**：项目概况中的"培训目标"和表格中的"培训内容覆盖"可能不完全一致，以表格中的"培训内容覆盖"为准设计课程。

### Step 2: 解析评分标准

如果提供了评分标准图片，用 Read 工具查看图片内容，提取：
- 服务方案评分维度（先进性、创新性、可操作性、技术性、经济性、风险等）
- 工作进度及保证措施评分维度
- 各档次分值区间

### Step 3: 生成 Word 文档

使用 docx-js（Node.js）生成 .docx 文件。运行时需要 `NODE_PATH="$(npm root -g)"`。

文档结构（严格按评分标准覆盖）：

```
封面（项目名称 + 应答人 + 日期）
目录

一、对项目的理解
  1.1 对[甲方单位]的理解
  1.2 对采购项目的理解
    - 项目定位与目标
    - 项目规模与实施要求
    - 服务敏感点分析
  1.3 项目重点与难点分析

二、服务方案（对应评分项"服务方案"）
  2.1 项目实施思路（五阶段闭环）
  2.2 培训课程体系设计
    - 课程模块总览（严格按技术规范"培训内容覆盖"）
    - N天课程安排表
    - 课程设计亮点
  2.3 培训方式与教学方法（6种教学法）
  2.4 师资配备方案
  2.5 实施组织形式与人员配置
    - 项目组织机构
    - 人员配置表（含人员清单和简介说明）
  2.6 培训效果评估体系（用技术规范中的考核方式术语）
  2.7 质量保障措施（三维品控）
  2.8 设备设施配置方案
  2.9 风险管理与应对（6类风险+应对表）

三、工作进度及保证措施（对应评分项"工作进度及保证措施"）
  3.1 项目进度计划（8阶段进度表 + 每期日程）
  3.2 进度保证措施（四维保障）

四、项目交付成果（技术规范要求的所有交付物）

五、售后服务承诺（含明确期限、范围、内容）
```

**编码要点**：
- 字体：SimHei 标题 + SimSun 正文
- 页面：A4（11906 x 16838 DXA）
- 页眉：项目名称
- 页脚：页码
- 表格：headerCell 用 D5E8F0 底色，边框 #999999
- 必须包含的表格：课程安排表、人员配置表、评估体系表、风险管理表、进度计划表
- 文中术语必须与技术规范保持一致（如"一级评估"而非"反应层评估"）

### Step 4: 生成信息图 HTML

创建一个包含所有信息图的 HTML 文件，风格要求：
- 配色：Navy(#0F172A) + Teal(#0e6b60/#1a8a7d) + Gold(#b8963e)
- 图标：Font Awesome 6（不用emoji）
- 字体：Noto Sans SC
- 交互：cursor-pointer + hover 动效（200ms）
- 圆角：统一 12px/8px

需要的信息图（共14张）：
1. 项目定位目标（箭头网格 arrow-grid）
2. 服务敏感点（六宫格 sens-grid）
3. 重点vs难点（VS对比图）
4. 五阶段闭环（流程图 flow-stages）
5. 课程模块（彩色卡片 modules-grid）
6. N天课程表（时间轴 timeline）
7. 教学方法（圆环图标 methods-grid）
8. 组织机构（层级图 org-chart）
9. 评估体系（指标卡片 assess-row）
10. 质量保障（三柱图 quality-row）
11. 风险管理（卡片网格 risk-grid）
12. 甘特图进度（gantt）
13. 保障措施（渐变卡片 guarantee-grid）
14. 交付成果（清单 deliver-grid）

每个信息图用唯一的 CSS class 命名，页面用 `.page` 容器包裹。

### Step 5: 截取信息图

使用 Playwright 截图：

```javascript
const { chromium } = require('playwright');
// 为每个信息图元素截取 PNG
// 选择器格式：'.page:nth-child(N) .class-name'
```

截图存放在 `screenshots/` 目录。

### Step 6: 插入图片到 Word

使用 python-docx 将截图插入对应段落后面：

```python
from docx import Document
from docx.shared import Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = Document('方案.docx')
# 找到目标段落 -> doc.add_paragraph() 创建新段 -> 添加图片 -> 移动到目标位置
# 关键：按段落索引倒序插入，避免索引偏移
```

图片插入位置映射（根据段落内容关键词定位）：
- 01_project_goals -> "三大培训目标" bullets 之后
- 02_sensitivity -> 敏感点 bullets 之后
- 03_vs_diagram -> 项目难点末段之后
- 04_five_stages -> 实施思路首段之后
- 05_modules -> 课程模块 bullets 之后
- 06_timeline -> 课程表说明之后
- 07_methods -> 教学方法首段之后
- 08_org_chart -> 组织机构描述之后
- 09_assessment -> 评估体系表之后
- 10_quality -> 质量保障首段之后
- 11_risk -> 风险管理首段之后
- 12_gantt -> 进度计划表之后
- 13_guarantees -> 进度保证措施标题之后
- 14_deliverables -> 交付成果首段之后

### Step 7: 验证

用 python-docx 验证最终文档：
1. 关键词覆盖检查（技术规范中所有培训内容、考核方式、交付物等术语）
2. 图片数量检查（应为14张）
3. 表格数量检查（应为5个）

## 输出文件

- `{项目名}_服务方案.docx` — 纯文字版
- `infographics_{项目名}.html` — 信息图网页版
- `{项目名}_服务方案_final.docx` — 带信息图的最终版

## 注意事项

- Windows 环境下 docx 全局安装需 `NODE_PATH="$(npm root -g)"`
- .doc 转 .docx 需要 win32com（仅 Windows）
- 如果 Word 正在打开文件会报 EBUSY，换文件名输出
- python-docx 的 sys.stdout 需要 `reconfigure(encoding='utf-8')`
- 截图需要网络加载 Font Awesome CDN，确保有网络连接
