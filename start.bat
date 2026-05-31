@echo off
cd /d "%~dp0"
echo.
echo ═══════════════════════════════════════════
echo   🎧  英语听力音频生成器
echo   English Listening TTS Generator
echo ═══════════════════════════════════════════
echo.
echo 正在启动服务器...
echo.
start "" http://localhost:3000
node server.js
pause
