@echo off
echo.
echo 正在启动像素画生成器...
echo.

REM 检查是否安装了Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 检查是否安装了npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到npm，请先安装npm
    pause
    exit /b 1
)

REM 检查node_modules是否存在
if not exist "node_modules" (
    echo 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo 错误: 安装依赖失败
        pause
        exit /b 1
    )
    echo 依赖安装完成
)

echo.
echo 正在启动服务器...
echo 访问地址: http://localhost:4000
echo 按 Ctrl+C 可停止服务器
echo.

REM 启动服务器
node server.js

pause