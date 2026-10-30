# 把 Still Me 放到 GitHub 上

## 文件

- `index.html`：网站和 app 在同一个页面里。点 "Open the app" 就在页面内打开 app，不跳转。
- `worker/still-me-api.js`：一个小服务器，替网站保存你的 Anthropic API key。生成消耗的 token 都记在你的账号上。

## 一、网站上线（GitHub Pages）

1. 把 `index.html` 放到仓库根目录，替换原来的首页文件，然后提交。
2. 仓库 **Settings → Pages**：Source 选 **Deploy from a branch**，Branch 选 `main`，文件夹选 `/ (root)`，保存。
3. 等一两分钟，网址是 `https://shirleylii.github.io/still-me/`

这一步完成后，网站和 app 都能打开。但生成功能还不能用，会提示 "This copy isn't connected to Claude yet"。

## 二、准备 API key（费用算在你的账号上）

1. 登录 Claude Console（platform.claude.com）。
2. 新建一个只给 Still Me 用的 workspace，并给它**设置花费上限**。网站是公开的，这个上限是防止被人刷额度的最后一道保险。
3. 在这个 workspace 里创建 API key，复制下来。

**API key 只放进 Cloudflare，绝对不要放进任何 GitHub 文件。**

## 三、部署小服务器（Cloudflare Workers）

1. 登录 Cloudflare → **Workers & Pages** → **Create**，用 Hello World 模板新建一个 Worker，名字填 `still-me-api`。
2. 点 **Edit code**，把 `worker/still-me-api.js` 的全部内容粘贴进去，然后点 **Deploy**。
3. 进入 **Settings → Variables and Secrets**，添加两项：
   - `ANTHROPIC_API_KEY`，类型选 **Secret**，值填你的 key
   - `ALLOWED_ORIGINS`，类型选 Text，值填 `https://shirleylii.github.io`
4. 记下 Worker 的地址，格式类似 `https://still-me-api.你的子域名.workers.dev`

（Cloudflare 的按钮名称以后可能会有变化，意思一样就行。）

## 四、把网站和服务器连起来

打开 `index.html`，在开头附近找到这一行：

```html
<meta name="still-me-api" content="">
```

把 Worker 地址填进引号里，然后提交。整个设置就完成了。

## 五、检查是否成功

打开网站 → 点 **Open the app** → 选一个用户 → 写一句中文 → 点 **Compare English versions**。看到三个英文版本就说明成功了。

## 补充说明

- **安全**：API key 只存在 Cloudflare 里，网站只发送消息内容。模型和输出长度由服务器固定，网页无法修改；其他网站发来的请求会被拒绝。不过，有人刻意伪造请求的话，这一层是挡不住的，所以第二步的花费上限一定要设。
- **用户资料**：头像、名字、语言选择都保存在每个人自己的浏览器里，换一台设备就看不到。真正的账号登录需要另外做后台。
- **模型**：服务器默认用 `claude-sonnet-5-5`。想换模型，在 Worker 里加一个 `MODEL` 变量即可。
- **在 Claude 里测试**：在 Claude 预览里打开同一个 `index.html` 时，页面会自动改用 Claude 自带的调用，不需要服务器。
