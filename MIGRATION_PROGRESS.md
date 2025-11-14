# Tanzanite Chat - 迁移进度

## ✅ 已完成
1. 创建新的 React Native 项目 (0.76.5)
2. 配置 package.json 依赖
3. 创建项目目录结构
4. 复制主题配置 (colors.ts)
5. 创建配置文件 (config.ts)
6. 复制 auth.ts 服务

## 🔄 进行中
- npm install 正在安装依赖

## ⏳ 待完成
1. 复制剩余服务文件：
   - agentApi.ts (需要修改，去除 Expo 依赖)
   - api.ts
   - orders.ts
   - products.ts
   - heartbeat.ts
   - notifications.ts (需要替换为 Notifee)

2. 复制 UI 组件：
   - MessageBubble.tsx
   - 所有 screens/*.tsx 文件

3. 创建 App.tsx (替换 Expo StatusBar)

4. 配置 Android 原生：
   - 图片选择器
   - 推送通知
   - 签名配置

5. 测试运行

## 📝 注意事项
- BASE_URL 需要在 src/config.ts 中配置
- 所有 Expo 依赖已移除
- 使用 react-native-image-picker 替代 expo-image-picker
- 使用 @notifee/react-native 替代 expo-notifications
- 使用 React Native 内置 StatusBar 替代 expo-status-bar

## 🚀 下一步
等待 npm install 完成后，继续复制剩余文件
