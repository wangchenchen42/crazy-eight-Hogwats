# 霍格沃茨之疯狂八点 (Hogwarts Crazy Eights)

这是一个基于哈利波特元素的疯狂八点纸牌游戏，使用 React + Vite + Tailwind CSS 构建。

## 如何部署到 Vercel

1. **同步到 GitHub**:
   - 在 GitHub 上创建一个新的仓库。
   - 在本地终端运行以下命令（假设你已经下载了代码）：
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin <你的仓库URL>
     git push -u origin main
     ```

2. **在 Vercel 上部署**:
   - 登录 [Vercel](https://vercel.com)。
   - 点击 **"Add New"** -> **"Project"**。
   - 导入你刚刚创建的 GitHub 仓库。
   - Vercel 会自动识别这是一个 Vite 项目。
   - 点击 **"Deploy"**。

## 项目结构

- `src/App.tsx`: 游戏核心逻辑和 UI。
- `src/types.ts`: 游戏数据类型定义。
- `src/utils.ts`: 牌组生成和游戏规则逻辑。
- `vercel.json`: 确保单页应用（SPA）路由在 Vercel 上正常工作。

## 魔法元素

- **学院**: 狮子 (格兰芬多), 獾 (赫奇帕奇), 鹰 (拉文克劳), 蛇 (斯莱特林)。
- **特殊牌**: 邓布利多 (8) 是万能牌，可以改变当前学院。
- **对手**: 挑战伏地魔。
