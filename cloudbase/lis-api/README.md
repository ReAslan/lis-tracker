# Li's Tracker CloudBase API

这个目录是 `lis-tracker` 的国内后端。GitHub Pages 只托管静态前端；CloudBase 云函数负责登录鉴权，并使用服务端 GitHub Token 读写 Private Gist。

## CloudBase 环境变量

在 CloudBase 云函数中设置以下变量，**不要写入仓库源码**：

- `LIS_GITHUB_TOKEN`：重新生成的 GitHub Token，仅给读取/写入目标 Gist 所需权限。
- `LIS_GIST_ID`：保存 `lis-tracker-data.json` 的 Private Gist ID。
- `LIS_SESSION_SECRET`：至少 32 个字符的随机字符串，用于签名登录会话。建议 64 个以上随机字符。
- `LIS_ALLOWED_ORIGINS`：允许访问 API 的网页 Origin。正式站点填写 `https://reaslan.github.io`；本地调试可写成 `https://reaslan.github.io,http://localhost:3000`。

## CloudBase 函数建议

- Node.js 18 或更新运行时。
- 256 MB 内存即可。
- 免费体验版函数超时上限为 3 秒；如果 GitHub API 偶发超时导致请求失败，再考虑升级个人版或改用 CloudBase 数据库。
- 创建 HTTP 访问服务路由，将一个 HTTPS URL 指向此函数。
- CORS 允许 `https://reaslan.github.io`，方法允许 `POST, OPTIONS`，请求头允许 `Content-Type, Authorization`。

函数入口是：

```text
index.main
```

代码没有额外 npm 依赖，使用 Node.js 内置 `crypto` 和 Node 18 自带的 `fetch`。

## GitHub Pages 配置

CloudBase HTTP URL 创建后，在 GitHub 仓库：

`Settings → Secrets and variables → Actions → Variables → New repository variable`

新增：

```text
Name: LIS_API_URL
Value: https://你的-cloudbase-http-地址
```

`.github/workflows/deploy.yml` 会在构建时将它注入为 `NEXT_PUBLIC_LIS_API_URL`。

## 登录规则

- 新用户：名字 + 6 位数字 PIN + 头像。
- 原 Gist 中已有但没有 PIN 的旧 reader：第一次用相同名字“注册”时，会直接绑定 PIN，并保留原 reader ID 和原作品。
- 已绑定 PIN 的名字不能再次注册。
- PIN 使用 PBKDF2-SHA256 + 随机 salt 哈希保存，不保存明文。
- 连续输错 5 次会锁定 10 分钟。
- 登录会话默认有效 30 天。
- 后端不接受前端指定的 `readerId` 作为权限依据；所有作品和创作记录都以登录会话中的 reader ID 为准。

## 数据仍保存在 GitHub

Private Gist 中继续使用：

```json
{
  "readers": [],
  "works": [],
  "creativeEntries": []
}
```

绑定 PIN 后，reader 会新增 `pinSalt`、`pinHash`、`failedAttempts`、`lockedUntil` 等服务端字段。前端 API 不会返回这些字段。
