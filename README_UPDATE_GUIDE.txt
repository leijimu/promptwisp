
PromptWisp - 内容更新指南
==========================

您的网站已优化为"动态加载模式"。
在 GitHub Pages 上更新内容无需重新编译代码，只需直接修改文件即可。

如何添加新的图片生成实例：

1. 上传图片
   - 将您的新图片上传到 GitHub 仓库的 `images` 文件夹中。
   - 例如：`images/my-new-art.jpg`

2. 编辑数据文件
   - 打开 GitHub 仓库中的 `data/prompts.json` 文件。
   - 点击编辑（笔形图标）。
   - 在列表末尾添加新的配置项（注意 JSON 格式，上一项末尾需要加逗号）。
   
   示例格式：
   {
     "id": "unique-id-123",
     "title": "您的作品标题",
     "description": "简短描述",
     "image": "images/my-new-art.jpg",
     "prompt": "您的 AI 提示词内容...",
     "category": "Artistic", 
     "style": "Watercolor"
   }
   
   *注意：category 可选值建议为: "Photorealistic", "Anime", "3D Design", "Artistic"*

3. 提交更改
   - 提交 (Commit) 后，GitHub Pages 会自动部署更新。
   - 等待约 1-2 分钟，刷新您的网站即可看到新内容。

无需安装 Node.js，无需运行 npm build，全在线操作即可完成！
