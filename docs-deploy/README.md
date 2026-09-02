# CR7 · 职业生涯比赛记录

纯静态网页，展示克里斯蒂亚诺·罗纳尔多逐场比赛数据（当前收录 485 场）。
黑金主题 + C罗照片，离线可运行，无外部依赖。

## 打开方式

### 方式一：直接双击（推荐）
双击打开 `index.html` 即可，无需安装任何东西（数据内嵌在 `data/data.js`，浏览器本地就能跑）。

### 方式二：本地服务
```powershell
python -m http.server 8765 --directory E:\CodexWord\ronaldo-career
# 浏览器访问 http://127.0.0.1:8765
```
或双击 `start.cmd`。

## 功能
- **总览**：照片版英雄区（葡萄牙 2025 背景 + 皇马头像）、赛场瞬间图集（皇马金球/尤文/利雅得胜利）、核心统计卡、效力俱乐部汇总（含俱乐部配色）、每赛季趋势图（SVG）、赛事分布、里程碑
- **逐场比赛**：全量表格 + 俱乐部/赛季/赛事/结果筛选 + 搜索 + 列排序 + 分页 + 点击行展开详情
- **数据说明**：数据范围、字段说明、照片授权（Wikimedia Commons）

## 目录结构
```
ronaldo-career/
├─ index.html          入口
├─ css/style.css       样式（深色黑金主题）
├─ js/app.js           页面逻辑
├─ assets/             favicon + 照片（img/*.jpg，CC 授权）
├─ data/
│  ├─ data.js          内嵌数据（页面读取）
│  ├─ matches.json     清洗后的数据（源）
│  └─ *.csv            原始数据集
├─ scripts/build_data.py   CSV → matches.json 的数据管道
└─ preview/            页面截图
```

## 照片授权
所有照片来自 Wikimedia Commons，版权归原作者所有：
- hero.jpg（葡萄牙 2025，YantsImages，CC BY-SA 4.0）
- avatar.jpg（皇马，Jan S0L0，CC BY-SA 2.0）
- madrid.jpg（2014 金球奖，Anish Morarji，CC BY 2.0）
- juve.jpg（尤文 2019/20，IamAlwaysHere，CC BY-SA 4.0）
- alnassr.jpg（利雅得胜利 2023，Mehrdad Esfahani/SNN，Attribution）
详见页面「数据说明 → 照片授权」。

## 数据范围与来源
- 来源：Kaggle「Football Data from Transfermarkt」（davidcariboo/player-scores，2026-08 版）
- 收录：2012/13–2022/23 皇马（294 场）/尤文（134 场）/曼联二期（54 场）主流赛事 + 葡萄牙 2026 世界杯 3 场
- 未收录（后续可补）：2002–2012 早期、利雅得胜利沙特联赛、其余国家队比赛
