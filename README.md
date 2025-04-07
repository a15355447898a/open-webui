# 介绍

这个仓库是我为尝试用 GitHub Action 构建美化后的 OpenWebUI Docker 镜像而创建的

美化的思路来自 L 站的一位佬友：

> https://linux.do/t/topic/440439

感谢这位佬友的思路和提供的代码，我仅仅只是修改了其中使用的字体（Misans 和 Maple Mono）和一点点微不足道的细节罢了

自己手动在本地构建完毕之后，看到有人也喜欢这位佬友的美化思路，但是更想要现成的，可以直接使用的版本，于是我便将镜像分享给了他们

但是手动构建不但不能及时与官方的更新同步，而且我的环境上传速度感人

我在本地构建完毕后，使用 docker push 命令推送的时候，总要等待一两个小时才能上传完毕……

所以当我看到有另一位佬友提出可以通过 GitHub Action 来自动完成这个流程的时候

我便开始了尝试

这个仓库因此而出现……

---

# GitHub Actions 自动构建说明

本项目使用 GitHub Actions 自动构建 Docker 镜像并推送到 Docker Hub。当你推送符合 `v*.*.*` 格式的标签时（例如 `v1.0.0`），会自动触发构建流程。

## 如何配置 GitHub Secrets

如果你 fork 了本项目并希望自动构建推送到自己的 Docker Hub 账号，需要在 GitHub 仓库中设置以下 Secrets：

1. `DOCKERHUB_USERNAME`: 你的 Docker Hub 用户名
2. `DOCKERHUB_TOKEN`: 你的 Docker Hub 访问令牌（不要使用密码，请在 Docker Hub 创建访问令牌）
3. `DOCKERHUB_REPO`: （可选）你希望推送到的仓库名称，默认为 "study"

### 创建 Docker Hub 访问令牌

1. 登录 Docker Hub
2. 点击右上角头像 → Account Settings → Security
3. 点击 "New Access Token"
4. 为令牌命名（例如 "GitHub Actions"）并选择适当的权限
5. 复制生成的令牌并保存到 GitHub Secrets

### 在 GitHub 中设置 Secrets

1. 在你 fork 的仓库中，点击 "Settings"
2. 在左侧菜单中选择 "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. 添加上述三个 secrets

完成这些设置后，当你推送新的版本标签时，GitHub Actions 将自动构建镜像并推送到你指定的 Docker Hub 仓库。

## 详细的 GitHub Secrets 设置指南

### 第一步：进入仓库设置

<img width="960" alt="image" src="https://github.com/user-attachments/assets/6d37b135-e454-455a-b0bd-4ad4f8002eaf" />

1. 进入你 fork 后的 GitHub 仓库
2. 点击顶部导航栏中的 "Settings" 选项卡

### 第二步：找到 Secrets 设置页面

<img width="356" alt="image" src="https://github.com/user-attachments/assets/5c97c9ba-7170-4697-9f43-bef7bee71584" />

1. 在左侧菜单中找到 "Secrets and variables"
2. 点击展开并选择 "Actions"

### 第三步：添加所需的 Secrets

<img width="797" alt="image" src="https://github.com/user-attachments/assets/1e4b80bb-977c-47ff-a63a-c727fdd2e824" />

对于每个 Secret，点击 "New repository secret" 按钮，然后填写以下信息：

#### 1. DOCKERHUB_USERNAME

- **名称**：DOCKERHUB_USERNAME
- **值**：你的 Docker Hub 用户名
- **示例**：如果你的 Docker Hub 账号是 "myusername"，则填写 "myusername"

#### 2. DOCKERHUB_TOKEN

- **名称**：DOCKERHUB_TOKEN
- **值**：你在 Docker Hub 创建的访问令牌（不是密码）
- **注意**：这是一个敏感信息，创建后将无法再次查看完整令牌，请妥善保存

#### 3. DOCKERHUB_REPO (可选)

- **名称**：DOCKERHUB_REPO
- **值**：你想推送镜像的仓库名称
- **示例**：如果你想推送到 "myusername/myapp"，则填写 "myapp"
- **默认值**：如果不设置此项，将默认使用 "study" 作为仓库名

### 完成设置

添加完所有 Secrets 后，页面将显示如下：

![Secrets List](https://docs.github.com/assets/cb-59829/mw-1440/images/help/repository/actions-secrets-list.webp)

所有这些 Secrets 都会被安全地存储，并且只会在工作流运行时使用，不会暴露在日志或其他可见的输出中。

## 使用示例

### 创建和推送版本标签

要触发自动构建，你需要创建并推送一个符合 `v*.*.*` 格式的Git标签。以下是完整的命令示例：

```bash
# 确保你的更改已提交
git add .
git commit -m "准备发布 v1.0.0"

# 创建标签
git tag v1.0.0

# 推送标签到GitHub（这将触发构建）
git push origin v1.0.0
```

### 构建过程

1. 推送标签后，在GitHub仓库页面点击"Actions"标签页查看构建进度
2. 你将看到一个名为"Build and Push Custom OpenWebUI Docker Image"的工作流正在运行
3. 构建完成后，状态会变为绿色的对勾标记

### 构建结果

成功构建后，将生成两个Docker镜像标签：

1. `你的用户名/你的仓库名:custom-openwebui-1.0.0` - 推送到Docker Hub
2. `custom-openwebui-1.0.0` - 本地标签

可以通过以下命令拉取和使用镜像：

```bash
# 拉取镜像
docker pull 你的用户名/你的仓库名:custom-openwebui-1.0.0

# 运行容器
docker run -d -p 8080:8080 你的用户名/你的仓库名:custom-openwebui-1.0.0
```

### 排查常见问题

1. **构建失败**：检查GitHub Actions日志获取详细错误信息
2. **推送失败**：确认Docker Hub凭据是否正确设置
3. **权限问题**：确保你的Docker Hub访问令牌有足够的权限

---

# 版权与许可 (License)

本项目使用了以下第三方字体，它们分别遵循各自的原始许可证：

*   **Maple Mono:** 基于 [SIL Open Font License 1.1] 授权。版权和完整的许可证文本可以在 [FONTLICENSE](FONTLICENSE) 文件中找到。
*   **MiSans:** 基于其特定的专有许可证授权。

使用本项目即表示您同意遵守所有相关许可证的条款。

---

以下信息摘录自小米官网，使用字体请遵守下文的许可协议

# MiSans 简介

![image](https://github.com/user-attachments/assets/568118db-32ce-4c04-82e9-d22d8b923554)

MiSans Global 是由小米主导，联合蒙纳字库、汉仪字库共同打造的全球语言字体定制项目。这是一个庞大的字体家族，涵盖 20 多种书写系统，支持 600 多种语言，字符数量超过 10 万个。作为 Xiaomi HyperOS 系统默认字体，我们以简约/清晰，人文/易读，统一的视觉风格为基本原则出发，构建多语言信息体验一致性，旨在帮助为 Xiaomi HyperOS 提供互联的通用体验。

# Misans 许可协议

本《MiSans 字体知识产权许可协议》（以下简称"协议"）是您与小米科技有限责任公司（以下简称"小米"或"许可方"）之间有关安装、使用 MiSans 字体（以下简称"MiSans"或"MiSans 字体"）的法律协议。您在使用 MiSans 的所有或任何部分前，应接受本协议中规定的所有条款和条件。安装、使用 MiSans 的行为表示您同意接受本协议所有条款的约束。否则，请不要安装或使用 MiSans，并应立即销毁和删除所有 MiSans 字体包。

根据本协议的条款和条件，许可方在此授予您一份不可转让的、非独占的、免版税的、可撤销的、全球性的版权许可，使您依照本协议约定使用 MiSans 字体，前提是符合下列条件：

您应在软件中特别注明使用了 MiSans 字体。
您不得对 MiSans 字体或其任何单独组件进行改编或二次开发。
您不得单独将 MiSans 字体或其组件对外租赁、再许可、给予、出借或进一步分发字体软件或其任何副本以及重新分发或售卖。此限制不适用于您使用 MiSans 字体创作的任何其他作品。如您使用 MiSans 字体创作宣传素材、logo、应用 App 等，您有权分发或出售该作品。
