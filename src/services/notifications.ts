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
