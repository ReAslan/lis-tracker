# Li's Tracker CloudBase API

这个目录是 `lis-tracker` 的国内后端。GitHub Pages 只托管静态前端；CloudBase **普通云函数 + HTTP 访问服务**负责登录鉴权，并使用服务端 GitHub Token 读写一个 **GitHub Private Repository**。

不要把用户数据放在 Secret Gist：Secret Gist 不是严格意义上的私有存储，知道链接的人仍可访问。

## 1. 创建私有数据仓库

在 GitHub 新建：

```text
Repository name: lis-tracker-data
Visibility: Private
```

建议勾选初始化 README，让仓库立即拥有默认分支。正式数据会自动创建在：

```text
data/lis-tracker-data.json
```

## 2. 创建新的 GitHub Token

请撤销此前暴露过的旧 Token，并新建一个只服务于此后端的 Fine-grained personal access token：

- Resource owner：`ReAslan`
- Repository access：Only select repositories → `lis-tracker-data`
- Repository permissions → Contents：Read and write

不要把新 Token 写进代码、GitHub Pages 变量或聊天消息。

## 3. 创建 CloudBase 普通云函数

在 CloudBase 控制台新建 **普通云函数**，不是 HTTP 云函数：

- 函数名：例如 `lis-api`
- 运行时：Node.js 18.x 或更新版本
- 内存：免费版固定 256 MB
- 入口：`index.main`
- 代码：上传或粘贴本目录的 `index.js`

本函数没有第三方 npm 依赖，不需要 `package.json`，也不需要 `scf_bootstrap`。

免费体验环境当前提供 3000 资源点/月；免费版云函数单次超时上限 3 秒。

## 4. CloudBase 环境变量

在函数配置中设置以下变量，**不要写入仓库源码**：

- `LIS_GITHUB_TOKEN`：上一步生成的新 Token。
- `LIS_GITHUB_REPO`：`ReAslan/lis-tracker-data`。
- `LIS_GITHUB_DATA_PATH`：可选；默认 `data/lis-tracker-data.json`。
- `LIS_SESSION_SECRET`：至少 32 个字符的随机字符串，用于签名登录会话；建议 64 个以上随机字符。
- `LIS_ALLOWED_ORIGINS`：正式站点填写 `https://reaslan.github.io`；本地调试可写 `https://reaslan.github.io,http://localhost:3000`。

## 5. 给普通云函数开启 HTTP 访问

在 CloudBase 的「HTTP 访问服务」中创建一条路由，指向 `lis-api` 普通云函数。

建议：

- 使用 HTTPS。
- 触发路径可设置为 `/lis-api`。
- 跨域允许 `https://reaslan.github.io`。
- 方法允许 `POST, OPTIONS`。
- 请求头允许 `Content-Type, Authorization`。

CloudBase 会把标准 HTTP 请求转换成普通云函数的 `event`：其中包含 `httpMethod`、`headers`、`body` 和 `isBase64Encoded`，正好与 `index.js` 的处理方式一致。

## 6. GitHub Pages 配置

取得 CloudBase HTTP URL 后，在前端仓库：

`Settings → Secrets and variables → Actions → Variables → New repository variable`

新增：

```text
Name: LIS_API_URL
Value: https://你的-cloudbase-http-地址/lis-api
```

`.github/workflows/deploy.yml` 会在构建时将它注入为 `NEXT_PUBLIC_LIS_API_URL`。这个 URL 不是密钥，可以公开。

## 登录与权限规则

- 新用户：名字 + 6 位数字 PIN + 头像。
- 如果从旧数据迁移过来的 reader 尚未绑定 PIN，第一次用相同名字“注册”时，会直接绑定 PIN，并保留原 reader ID 和作品。
- 已绑定 PIN 的名字不能再次注册。
- PIN 使用 PBKDF2-SHA256 + 随机 salt 哈希保存，不保存明文。
- 连续输错 5 次会锁定 10 分钟。
- 登录会话默认有效 30 天。
- 后端不接受浏览器指定的 `readerId` 作为权限依据；所有作品和创作记录都以登录会话中的 reader ID 为准。
- 写入 GitHub 时使用文件 SHA 做并发保护；如果两个人恰好同时修改，较晚的一次会提示重新操作，而不是静默覆盖新数据。

## 数据结构

私有仓库中的 `data/lis-tracker-data.json`：

```json
{
  "readers": [],
  "works": [],
  "creativeEntries": []
}
```

绑定 PIN 后，reader 会新增 `pinSalt`、`pinHash`、`failedAttempts`、`lockedUntil` 等服务端字段；前端 API 不会返回这些字段。

## 旧 Gist 数据迁移

如果旧站点已有数据，不要先删除旧 Gist。把旧 Gist 中 `lis-tracker-data.json` 的内容复制到新私有仓库的 `data/lis-tracker-data.json`。确认新站可以登录、读取和保存后，再删除旧 Gist。
