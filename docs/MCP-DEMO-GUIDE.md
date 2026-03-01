# MCP Server 演示指南

## 🎯 演示场景

在平台上演示 MCP Server 时，可以展示以下场景：

### 场景 1: 浏览器内直接测试 MCP API

**操作步骤：**
1. 打开 `/ops-twin/mcp-demo` 页面
2. 切换到 "Playground" 标签
3. 点击 `create_session` → Run Tool
4. 复制返回的 sessionId
5. 点击 `run_simulation`，填入参数 → Run Tool
6. 查看 Activity Log 中的实时响应

**演示要点：**
- 零配置即可测试 MCP API
- 实时查看 JSON-RPC 请求/响应
- 自动捕获 sessionId 用于后续调用

---

### 场景 2: 展示与 Claude Desktop 的集成

**操作步骤：**
1. 在 Ops Twin Studio 页面，查看右侧 MCP Status Panel
2. 点击 "Copy" 按钮复制 MCP Endpoint URL
3. 展示 Claude Desktop 配置文件
4. 在 Claude 中对话：
   ```
   User: 创建一个 oncology phase II 的仿真
   Claude: [调用 create_session → run_simulation]
   ```

**演示要点：**
- 展示 "Copy Endpoint" 功能
- 说明外部 AI 工具可以直接调用
- 展示 AI 自动调用 Tools 的能力

---

### 场景 3: cURL 命令行演示

**操作步骤：**
1. 切换到 "cURL Examples" 标签
2. 复制 Quick Start Workflow
3. 在 Terminal 中执行：
   ```bash
   # Step 1: Create session
   curl -X POST http://localhost:3000/api/mcp/messages ...
   
   # Step 2: Run simulation
   curl -X POST http://localhost:3000/api/mcp/messages ...
   
   # Step 3: Get KPIs
   curl -X POST http://localhost:3000/api/mcp/messages ...
   ```

**演示要点：**
- 展示标准 HTTP API 接口
- 说明可以被任何语言/工具调用
- 展示 JSON-RPC 2.0 协议

---

### 场景 4: API 文档展示

**操作步骤：**
1. 切换到 "API Docs" 标签
2. 逐一介绍：
   - 8 个 Tools 的功能
   - 7 个 Resources 的数据
   - 4 个 Prompts 的用途
3. 展示 Claude Desktop 配置代码

**演示要点：**
- 完整的 API 文档内嵌在应用中
- 自文档化设计
- 易于开发者集成

---

## 📊 演示流程建议

### 快速演示 (2分钟)
1. 打开 `/ops-twin/mcp-demo`
2. 点击 `create_session` → Run Tool
3. 点击 `run_simulation` → Run Tool
4. 展示返回的 KPIs

### 完整演示 (5分钟)
1. 展示 Ops Twin Studio 页面 → MCP Status Panel
2. 切换到 `/ops-twin/mcp-demo`
3. 完整走一遍 Quick Start Workflow
4. 展示 cURL 示例
5. 展示 API 文档

### 技术深度演示 (10分钟)
1. 以上全部内容
2. 展示 MCP Server 代码架构 (`src/mcp/server.ts`)
3. 解释 Session 管理机制
4. 展示如何添加新的 Tool
5. 讨论生产环境扩展 (Redis, Auth, etc.)

---

## 🔗 演示入口

| 入口 | URL | 用途 |
|-----|-----|------|
| MCP Playground | `/en/ops-twin/mcp-demo` | 浏览器内测试 MCP |
| Ops Twin Studio | `/en/ops-twin` | 查看 MCP Status Panel |
| API Endpoint | `/api/mcp` | SSE 连接端点 |
| Messages API | `/api/mcp/messages` | JSON-RPC 端点 |

---

## 💡 演示话术

**开场：**
> "除了 Web 界面，Ops Twin 还暴露了一个完整的 MCP Server，可以被 Claude Desktop、Cursor、或者任何支持 MCP 的工具调用。"

**演示 Playground：**
> "我们在浏览器里集成了一个 MCP Playground，不需要安装任何工具就能测试所有 API。"

**演示 Claude 集成：**
> "配置好 MCP 后，Claude 可以直接调用我们的仿真引擎，用户用自然语言就能完成复杂的临床运营分析。"

**技术总结：**
> "MCP 是 Anthropic 推出的开放协议，我们实现它是为了让 Ops Twin 能无缝接入 AI 工具生态。"

---

## 🎨 演示截图占位

### 截图 1: MCP Playground 界面
```
[Playground 标签页截图]
- 左侧工具列表
- 中间参数编辑区
- 右侧 Activity Log
```

### 截图 2: API Docs 界面
```
[API Docs 标签页截图]
- Tools 列表
- Resources 列表
- Prompts 列表
```

### 截图 3: cURL Examples 界面
```
[cURL Examples 标签页截图]
- Quick Start Workflow
- Copy 按钮
```

### 截图 4: Ops Twin Studio 中的 MCP Panel
```
[Ops Twin Studio 截图]
- 右侧 MCP Status Panel
- 显示 Online 状态
- 显示可用工具数
```

---

## ⚡ 常见问题

**Q: MCP 是什么？**
A: Model Context Protocol，Anthropic 推出的开放协议，让 AI 工具能安全地访问外部数据和功能。

**Q: 需要安装 Claude Desktop 吗？**
A: 不需要！我们的 Playground 直接在浏览器里就能测试所有 MCP 功能。

**Q: 生产环境能用吗？**
A: 当前是内存存储，适合演示。生产环境建议接入 Redis 和添加认证。

**Q: 可以连接其他 MCP 客户端吗？**
A: 任何支持 MCP 协议的客户端都能连接，包括 Cursor、继续开发的自定义客户端等。
