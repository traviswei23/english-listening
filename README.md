<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Node.js-18%2B-brightgreen" alt="Node.js">
  <img src="https://img.shields.io/badge/TTS-Microsoft%20Neural-blue" alt="TTS">
  <img src="https://img.shields.io/badge/Free-100%25-success" alt="Free">
</p>

# 🎧 English Listening TTS Generator

> 专为中国英语听力教学设计的文字转语音工具 — 生成带教师级音色的听力音频 MP3

一个免费的英语听力音频生成器，输入文字即可生成接近中国英语听力考试标准的音频。支持**单人朗读**和**双人对话**两种模式，12 种微软神经网络发音人任选。

## ✨ 功能演示

```
输入文本 → 选择发音人 → 一键生成 → 播放或下载 MP3

对话模式示例：
  Woman: Good afternoon. Can I help you?
  Man: Yes, I'm looking for a pair of shoes.
  Woman: What size do you wear?
  Man: I wear size forty-two.
  
  → 自动识别说话人 → 女声/男声交替朗读 → 合并为单个 MP3 下载
```

## 🚀 在线使用

直接打开：**[https://english-listening.onrender.com](https://english-listening.onrender.com)**

打开即用，无需安装。推荐 Chrome 或 Edge 浏览器。

## 🔥 核心功能

- 🎙️ **微软神经网络语音** — 12 种发音人，音质接近真人
- 👫 **双人对话模式** — 自动识别 `Man:` `Woman:` 标记，男女声交替
- 💾 **MP3 下载** — 对话自动合并为单个文件
- ⚡ **语速可调** — 0.5x ~ 1.5x
- 📝 **内置模板** — 问候、课堂、购物、问路、点餐等 7 种场景
- 🆓 **完全免费** — 无限制使用

## 🏠 本地运行

```bash
git clone https://github.com/traviswei23/english-listening.git
cd english-listening
npm install
npm start
```

浏览器打开 `http://localhost:3000`

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生 HTML/CSS/JS，Web Speech API |
| 后端 | Node.js + Express |
| TTS 引擎 | Microsoft Edge TTS (node-edge-tts) |
| 部署 | Render.com (免费) |

## 📖 为什么做这个？

中国英语听力考试一直使用真人录制的音频，但教师制作听力练习材料时往往缺乏便利的工具。这个项目利用微软免费的神经网络 TTS，让任何人都能快速生成接近考试标准的英语听力音频。

## ⭐ 觉得有用？

给个 Star ⭐ 支持一下！也欢迎提 Issue 和 PR。

## 📄 License

MIT
