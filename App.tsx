import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import ChatList from './src/screens/ChatList';
import Chat from './src/screens/Chat';
import Login from './src/screens/Login';
import OrderList from './src/screens/OrderList';
import OrderDetail from './src/screens/OrderDetail';
import ProductList from './src/screens/ProductList';
import ProductDetail from './src/screens/ProductDetail';
// Removed expo-status-bar
import { registerForPushNotificationsAsync } from './src/services/notifications';
import { isLoggedIn, validateSession } from './src/services/auth';

export type RootStackParamList = {
  Login: undefined;
  ChatList: undefined;
  Chat: { chatId: string; title: string };
  OrderList: undefined;
  OrderDetail: { orderId: number };
  ProductList: undefined;
  ProductDetail: { productId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'Login' | 'ChatList' | null>(null);

  useEffect(() => {
    checkAuth();
    setupPushNotifications();
  }, []);

  const checkAuth = async () => {
    const loggedIn = await isLoggedIn();
    if (loggedIn) {
      // 验证 session 是否有效
      const valid = await validateSession();
      setInitialRoute(valid ? 'ChatList' : 'Login');
    } else {
      setInitialRoute('Login');
    }
  };

  const setupPushNotifications = async () => {
    const { token, granted } = await registerForPushNotificationsAsync();
    if (granted && token) {
      console.log('PushToken:', token);
      // TODO: 上报到后端
    }
  };

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen 
          name="Login" 
          component={Login} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ChatList" 
          component={ChatList} 
          options={{ 
            title: '会话列表',
            headerBackVisible: false,
          }} 
        />
        <Stack.Screen 
          name="Chat" 
          component={Chat} 
          options={({ route }) => ({ title: route.params.title })} 
        />
        <Stack.Screen 
          name="OrderList" 
          component={OrderList} 
          options={{ title: '订单列表' }} 
        />
        <Stack.Screen 
          name="OrderDetail" 
          component={OrderDetail} 
          options={{ title: '订单详情' }} 
        />
        <Stack.Screen 
          name="ProductList" 
          component={ProductList} 
          options={{ title: '商品列表' }} 
        />
        <Stack.Screen 
          name="ProductDetail" 
          component={ProductDetail} 
          options={{ title: '商品详情' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
