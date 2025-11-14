import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert, Modal, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { colors } from '@/theme/colors';
import { fetchConversations, formatTime, logout, getAgent, updateAgentStatus, type Conversation } from '@/services/agentApi';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatList'>;

interface ChatItem {
  id: string;
  title: string;
  last: string;
  time: string;
  unread: number;
  online: boolean;
}

export default function ChatList({ navigation }: Props) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agentId, setAgentId] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<'online' | 'busy' | 'away' | 'offline'>('offline');
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    loadAgent();
    loadConversations();
    
    // 登录时设置为在线
    updateAgentStatus('online').then(() => {
      setCurrentStatus('online');
    }).catch(console.error);
    
    // 每 30 秒刷新一次
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  // 设置导航按钮
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setShowStatusModal(true)} style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 16 }}>
              {currentStatus === 'online' ? '🟢' : 
               currentStatus === 'busy' ? '🔴' : 
               currentStatus === 'away' ? '🟡' : '⚪'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('OrderList')} style={{ marginRight: 16 }}>
            <Text style={{ color: colors.primary, fontSize: 16 }}>📦 订单</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ProductList')} style={{ marginRight: 16 }}>
            <Text style={{ color: colors.primary, fontSize: 16 }}>🛍️ 商品</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 8 }}>
            <Text style={{ color: colors.primary, fontSize: 16 }}>登出</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, currentStatus]);

  const loadAgent = async () => {
    const agent = await getAgent();
    if (agent) {
      setAgentId(agent.agent_id);
    } else {
      navigation.replace('Login');
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetchConversations('all', 1);
      
      if (response.success && response.conversations) {
        const chatItems: ChatItem[] = response.conversations.map((conv: Conversation) => ({
          id: conv.id,
          title: conv.visitor_name || '访客',
          last: conv.last_message || '暂无消息',
          time: formatTime(conv.last_message_at || conv.created_at),
          unread: conv.unread_count || 0,
          online: false,
        }));
        setChats(chatItems);
      }
    } catch (error) {
      console.error('加载会话失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleStatusChange = async (status: 'online' | 'busy' | 'away' | 'offline') => {
    try {
      await updateAgentStatus(status);
      setCurrentStatus(status);
      setShowStatusModal(false);
      Alert.alert('成功', '状态已更新');
    } catch (error) {
      console.error('更新状态失败:', error);
      Alert.alert('错误', '状态更新失败');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '确认登出',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            // 登出时设置为离线
            await updateAgentStatus('offline').catch(console.error);
            await logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 状态切换弹窗 */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <Pressable style={styles.modalMask} onPress={() => setShowStatusModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>设置状态</Text>
            
            <TouchableOpacity
              style={[styles.statusOption, currentStatus === 'online' && styles.statusOptionActive]}
              onPress={() => handleStatusChange('online')}
            >
              <Text style={styles.statusEmoji}>🟢</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusLabel}>在线</Text>
                <Text style={styles.statusDesc}>可以接收新会话</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusOption, currentStatus === 'busy' && styles.statusOptionActive]}
              onPress={() => handleStatusChange('busy')}
            >
              <Text style={styles.statusEmoji}>🔴</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusLabel}>忙碌</Text>
                <Text style={styles.statusDesc}>正在处理其他事务</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusOption, currentStatus === 'away' && styles.statusOptionActive]}
              onPress={() => handleStatusChange('away')}
            >
              <Text style={styles.statusEmoji}>🟡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusLabel}>离开</Text>
                <Text style={styles.statusDesc}>暂时离开</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusOption, currentStatus === 'offline' && styles.statusOptionActive]}
              onPress={() => handleStatusChange('offline')}
            >
              <Text style={styles.statusEmoji}>⚪</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusLabel}>离线</Text>
                <Text style={styles.statusDesc}>不接收新会话</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无会话</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Chat', { chatId: item.id, title: item.title })}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.dot, item.online ? styles.dotOnline : styles.dotOffline]} />
                <Text style={styles.title}>{item.title}</Text>
              </View>
              <Text style={styles.subtitle} numberOfLines={1}>{item.last}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.time}>{item.time}</Text>
              {item.unread > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{item.unread}</Text></View>
              )}
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.muted },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: colors.muted },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: { fontSize: 16, color: colors.text, fontWeight: '600' },
  subtitle: { marginTop: 4, fontSize: 13, color: colors.muted },
  time: { marginLeft: 8, fontSize: 12, color: colors.muted },
  sep: { height: 1, backgroundColor: colors.border },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  dotOnline: { backgroundColor: '#22c55e' },
  dotOffline: { backgroundColor: '#9ca3af' },
  badge: {
    marginTop: 6,
    minWidth: 18,
    paddingHorizontal: 5,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  // 状态弹窗样式
  modalMask: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '80%', maxWidth: 320 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16, textAlign: 'center' },
  statusOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8, backgroundColor: '#f9fafb' },
  statusOptionActive: { backgroundColor: '#eff6ff', borderWidth: 2, borderColor: '#2563eb' },
  statusEmoji: { fontSize: 24, marginRight: 12 },
  statusLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  statusDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  modalCancel: { marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
});
