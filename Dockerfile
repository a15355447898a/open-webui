# 使用官方镜像作为基础
FROM ghcr.io/open-webui/open-webui:main

# 将整个 assets 文件夹 (包含所有 css, js, fonts/) 复制到镜像中
COPY ./openwebui_css/assets /app/build/assets/

# 使用 sed 命令在 /app/build/index.html 中插入 <link> 和 <script> 标签
RUN sed -i \
    -e 's|</head>|<link rel="stylesheet" href="/assets/custom.css">\n</head>|' \
    -e 's|</head>|<link rel="stylesheet" href="/assets/editor.css">\n</head>|' \
    -e 's|</body>|<script src="/assets/custom.js"></script>\n</body>|' \
    -e 's|</body>|<script src="/assets/editor.js"></script>\n</body>|' \
    /app/build/index.html