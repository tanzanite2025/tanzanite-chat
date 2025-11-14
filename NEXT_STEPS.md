# Tanzanite Chat - 剩余步骤

## ✅ 已完成
1. ✅ 创建 React Native 0.76.5 项目
2. ✅ 配置 package.json 依赖
3. ✅ 复制所有源代码文件
4. ✅ 修改 App.tsx（去除 expo-status-bar）
5. ✅ 修改 Chat.tsx 的 ImagePicker 导入和使用
6. ✅ 配置 babel.config.js（路径别名）
7. ✅ npm install 完成

## 🔄 需要完成的修改

### 1. 修改所有服务文件中的 API_BASE

在以下文件中：
- `src/services/api.ts`
- `src/services/agentApi.ts`
- `src/services/orders.ts`
- `src/services/products.ts`
- `src/services/heartbeat.ts`

**查找并替换：**
```typescript
// 旧代码
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost';
const API_BASE = `${BASE_URL}/wp-json/tanzanite/v1`;

// 新代码
import { API_BASE } from '../config';
```

### 2. 修改 notifications.ts（替换为 Notifee）

**文件：** `src/services/notifications.ts`

**完整替换为：**
```typescript
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';

export async function registerForPushNotificationsAsync() {
  try {
    // Android 13+ 需要请求通知权限
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return { token: null, granted: false };
      }
    }

    // 创建通知渠道（Android）
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.DEFAULT,
      });
    }

    // 这里可以集成 FCM 获取 token
    // 暂时返回成功
    return { token: 'notifee-ready', granted: true };
  } catch (error) {
    console.error('通知权限请求失败:', error);
    return { token: null, granted: false };
  }
}

// 显示本地通知
export async function displayNotification(title: string, body: string) {
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: 'default',
      importance: AndroidImportance.DEFAULT,
    },
  });
}
```

### 3. 修改 tsconfig.json（配置路径别名）

**文件：** `tsconfig.json`

**添加 paths 配置：**
```json
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 4. 修改 agentApi.ts 中的 uploadFile 函数

**文件：** `src/services/agentApi.ts`

**查找 uploadFile 函数，确保参数正确：**
```typescript
export async function uploadFile(conversationId: string, file: {
  uri: string;
  type: string;
  name: string;
}): Promise<{ url: string }> {
  // ... 实现代码
}
```

## 🚀 Android 原生配置

### 1. 配置 react-native-image-picker

**文件：** `android/app/src/main/AndroidManifest.xml`

**添加权限：**
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CAMERA" />
```

### 2. 配置 Notifee

**文件：** `android/app/build.gradle`

**添加依赖（已自动链接）：**
```gradle
dependencies {
    implementation project(':notifee_react-native')
}
```

**文件：** `android/app/src/main/AndroidManifest.xml`

**添加权限：**
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### 3. 配置应用信息

**文件：** `android/app/src/main/res/values/strings.xml`

**修改应用名称：**
```xml
<resources>
    <string name="app_name">Tanzanite Chat</string>
</resources>
```

### 4. 配置签名（用于发布）

**文件：** `android/app/build.gradle`

**添加签名配置：**
```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## 📝 配置 API 地址

**文件：** `src/config.ts`

**修改为你的服务器地址：**
```typescript
export const BASE_URL = 'http://your-server.com'; // 改为你的地址
export const API_BASE = `${BASE_URL}/wp-json/tanzanite/v1`;
```

## 🧪 测试步骤

### 1. 清理并重新安装
```bash
cd C:\Users\P16V\Desktop\Wordpress\tanzanite-chat
npm install
```

### 2. 启动 Metro
```bash
npm start
```

### 3. 运行 Android
```bash
npm run android
```

## ⚠️ 可能遇到的问题

### 问题 1：找不到模块 @/xxx
**解决：** 确保 babel-plugin-module-resolver 已安装并配置

### 问题 2：TypeScript 路径错误
**解决：** 重启 VS Code 或 TypeScript 服务器

### 问题 3：Android 构建失败
**解决：** 
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### 问题 4：图片选择器权限问题
**解决：** 确保 AndroidManifest.xml 中添加了相应权限

## 📊 完成度

- [x] 项目创建
- [x] 依赖安装
- [x] 代码复制
- [x] App.tsx 修改
- [x] Chat.tsx ImagePicker 修改
- [ ] 服务文件 API_BASE 修改（需要批量替换）
- [ ] notifications.ts 替换为 Notifee
- [ ] tsconfig.json 配置
- [ ] Android 原生配置
- [ ] 测试运行

## 🎯 下一步行动

1. 按照上面的步骤修改服务文件
2. 替换 notifications.ts
3. 配置 tsconfig.json
4. 配置 Android 原生
5. 测试运行

**预计剩余时间：30-60 分钟**
