import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Text, StyleSheet, Modal, Pressable, Alert, ActivityIndicator } from 'react-native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import MessageBubble from '@/components/MessageBubble';
import { colors } from '@/theme/colors';
import { fetchMessages, sendMessage, markAsRead, formatMessageTime, transferConversation, fetchAgents, fetchTransferHistory, updateAgentStatus, fetchOnlineAgents, uploadFile, type Message as ChatMessage } from '@/services/agentApi';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

interface Message {
  id: string;
  text: string;
  mine: boolean;
  time: string;
}

export default function Chat({ route }: Props) {
  const { chatId } = route.params;
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // 转接功能
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferring, setTransferring] = useState(false);
  
  // 转接历史
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadMessages();
    
    // 标记为已读
    markAsRead(chatId).catch(console.error);
    
    // 每 5 秒检查新消息
    const interval = setInterval(loadNewMessages, 5000);
    return () => clearInterval(interval);
  }, [chatId]);

  const loadMessages = async () => {
    try {
      const response = await fetchMessages(chatId);
      
      if (response.success && response.messages) {
        const messages: Message[] = response.messages.map((msg: ChatMessage) => ({
          id: msg.id.toString(),
          text: msg.message,
          mine: msg.sender_type === 'agent',
          time: formatMessageTime(msg.created_at),
        }));
        setMsgs(messages);
        
        // 滚动到底部
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error('加载消息失败:', error);
      Alert.alert('错误', '加载消息失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const loadNewMessages = async () => {
    try {
      const response = await fetchMessages(chatId, 1);
      
      if (response.success && response.messages && response.messages.length > 0) {
        const lastMsgId = msgs.length > 0 ? parseInt(msgs[msgs.length - 1].id) : 0;
        const newMessages: Message[] = response.messages
          .filter((msg: ChatMessage) => msg.id > lastMsgId)
          .map((msg: ChatMessage) => ({
            id: msg.id.toString(),
            text: msg.message,
            mine: msg.sender_type === 'agent',
            time: formatMessageTime(msg.created_at),
          }));
        
        if (newMessages.length > 0) {
          setMsgs(prev => [...prev, ...newMessages]);
          listRef.current?.scrollToEnd({ animated: true });
        }
      }
    } catch (error) {
      console.error('检查新消息失败:', error);
    }
  };

  const send = async () => {
    if (!text.trim() || sending) return;
    
    const messageText = text.trim();
    setText('');
    setSending(true);

    // 乐观更新 UI
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      mine: true,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };
    setMsgs(prev => [...prev, tempMsg]);
    listRef.current?.scrollToEnd({ animated: true });

    try {
      const response = await sendMessage(chatId, messageText);
      
      if (response.success && response.message) {
        // 替换临时消息为服务器返回的消息
        const serverMsg = response.message as any;
        setMsgs(prev => prev.map(m => 
          m.id === tempMsg.id 
            ? {
                id: serverMsg.id.toString(),
                text: serverMsg.message,
                mine: true,
                time: formatMessageTime(serverMsg.created_at),
              }
            : m
        ));
      }
    } catch (error) {
      console.error('发送失败:', error);
      // 移除临时消息
      setMsgs(prev => prev.filter(m => m.id !== tempMsg.id));
      Alert.alert('发送失败', '请检查网络连接后重试');
    } finally {
      setSending(false);
    }
  };

  const onPickImage = async () => {
    try {
      setSheetVisible(false);
      
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('错误', result.errorMessage || '选择图片失败');
        return;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // 显示上传中
        Alert.alert('上传中', '正在上传图片...');

        try {
          // 上传图片
          const uploadResponse = await uploadFile(chatId, {
            uri: asset.uri!,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || 'image.jpg',
          });

          if (uploadResponse.url) {
            // 发送图片消息
            await sendMessage(chatId, '[图片]', 'image', uploadResponse.url);
            
            // 刷新消息列表
            await loadMessages();
          }
        } catch (error) {
          console.error('上传图片失败:', error);
          Alert.alert('上传失败', '请重试');
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // 加载客服列表（优先显示在线客服）
  const loadAgents = async () => {
    try {
      const response = await fetchOnlineAgents();
      if (response.success && response.data) {
        setAgents(response.data);
      }
    } catch (error) {
      console.error('加载客服列表失败:', error);
      // 如果获取在线客服失败，回退到获取所有客服
      try {
        const fallbackResponse = await fetchAgents();
        if (fallbackResponse.success && fallbackResponse.data) {
          setAgents(fallbackResponse.data);
        }
      } catch (fallbackError) {
        console.error('加载所有客服失败:', fallbackError);
      }
    }
  };

  // 打开转接弹窗
  const openTransferModal = () => {
    setSheetVisible(false);
    loadAgents();
    setTransferModalVisible(true);
  };

  // 加载转接历史
  const loadTransferHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetchTransferHistory(chatId);
      if (response.success && response.data) {
        setTransferHistory(response.data);
      }
    } catch (error) {
      console.error('加载转接历史失败:', error);
      Alert.alert('错误', '加载转接历史失败');
    } finally {
      setLoadingHistory(false);
    }
  };

  // 打开转接历史弹窗
  const openHistoryModal = () => {
    setSheetVisible(false);
    loadTransferHistory();
    setHistoryModalVisible(true);
  };

  // 执行转接
  const handleTransfer = async () => {
    if (!selectedAgentId) {
      Alert.alert('提示', '请选择要转接的客服');
      return;
    }

    setTransferring(true);
    try {
      const response = await transferConversation(chatId, selectedAgentId, transferNote);
      
      if (response.success) {
        Alert.alert('成功', `会话已转接给 ${response.data.to_agent}`);
        setTransferModalVisible(false);
        setSelectedAgentId('');
        setTransferNote('');
        
        // 刷新消息列表以显示系统消息
        await loadMessages();
      } else {
        Alert.alert('失败', response.message || '转接失败');
      }
    } catch (error) {
      console.error('转接失败:', error);
      Alert.alert('错误', '转接失败，请重试');
    } finally {
      setTransferring(false);
    }
  };


  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, fontSize: 14, color: colors.muted }}>加载中...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble text={item.text} mine={item.mine} time={item.time} />}
        ListEmptyComponent={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 14, color: colors.muted }}>暂无消息</Text>
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={styles.statusBar}>
            <View style={[styles.statusDot, online ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.statusText}>{online ? '在线' : '离线'}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingVertical: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.plusBtn} onPress={() => setSheetVisible(true)}>
          <Text style={styles.plusText}>＋</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="输入消息…"
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send}>
          <Text style={styles.sendText}>发送</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={sheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSheetVisible(false)}
      >
        <Pressable style={styles.sheetMask} onPress={() => setSheetVisible(false)} />
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.sheetItem} onPress={onPickImage}>
            <Text style={styles.sheetItemText}>选择图片</Text>
          </TouchableOpacity>
          <View style={styles.sheetGap} />
          <TouchableOpacity style={styles.sheetItem} onPress={openTransferModal}>
            <Text style={styles.sheetItemText}>转接会话</Text>
          </TouchableOpacity>
          <View style={styles.sheetGap} />
          <TouchableOpacity style={styles.sheetItem} onPress={openHistoryModal}>
            <Text style={styles.sheetItemText}>转接历史</Text>
          </TouchableOpacity>
          <View style={styles.sheetGap} />
          <TouchableOpacity style={[styles.sheetItem, styles.sheetCancel]} onPress={() => setSheetVisible(false)}>
            <Text style={[styles.sheetItemText, { color: '#111827' }]}>取消</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* 转接弹窗 */}
      <Modal
        visible={transferModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTransferModalVisible(false)}
      >
        <View style={styles.transferMask}>
          <View style={styles.transferModal}>
            <Text style={styles.transferTitle}>转接会话</Text>
            
            <Text style={styles.transferLabel}>选择目标客服</Text>
            <View style={styles.agentList}>
              {agents.map((agent) => (
                <TouchableOpacity
                  key={agent.id || agent.agent_id}
                  style={[
                    styles.agentItem,
                    selectedAgentId === (agent.id || agent.agent_id) && styles.agentItemSelected
                  ]}
                  onPress={() => setSelectedAgentId(agent.id || agent.agent_id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.agentItemText,
                      selectedAgentId === (agent.id || agent.agent_id) && styles.agentItemTextSelected
                    ]}>
                      {agent.name}
                    </Text>
                  </View>
                  {agent.status && (
                    <View style={[
                      styles.statusBadge,
                      agent.status === 'online' && styles.statusOnline,
                      agent.status === 'busy' && styles.statusBusy,
                      agent.status === 'away' && styles.statusAway,
                    ]}>
                      <Text style={styles.statusBadgeText}>
                        {agent.status === 'online' ? '在线' : 
                         agent.status === 'busy' ? '忙碌' : 
                         agent.status === 'away' ? '离开' : '离线'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.transferLabel}>转接备注（可选）</Text>
            <TextInput
              style={styles.transferInput}
              placeholder="例如：客户需要技术支持..."
              value={transferNote}
              onChangeText={setTransferNote}
              multiline
              numberOfLines={3}
            />

            <View style={styles.transferButtons}>
              <TouchableOpacity
                style={[styles.transferBtn, styles.transferBtnCancel]}
                onPress={() => setTransferModalVisible(false)}
                disabled={transferring}
              >
                <Text style={styles.transferBtnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.transferBtn, styles.transferBtnConfirm]}
                onPress={handleTransfer}
                disabled={transferring || !selectedAgentId}
              >
                <Text style={styles.transferBtnConfirmText}>
                  {transferring ? '转接中...' : '确认转接'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 转接历史弹窗 */}
      <Modal
        visible={historyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.transferMask}>
          <View style={styles.transferModal}>
            <Text style={styles.transferTitle}>转接历史</Text>
            
            {loadingHistory ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : transferHistory.length === 0 ? (
              <Text style={{ textAlign: 'center', color: colors.muted, paddingVertical: 20 }}>
                暂无转接记录
              </Text>
            ) : (
              <FlatList
                data={transferHistory}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.historyItem}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyAgents}>
                        {item.from_agent_name} → {item.to_agent_name}
                      </Text>
                      <Text style={styles.historyTime}>
                        {new Date(item.created_at).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    {item.reason && (
                      <Text style={styles.historyReason}>备注：{item.reason}</Text>
                    )}
                  </View>
                )}
                style={{ maxHeight: 300 }}
              />
            )}

            <TouchableOpacity
              style={[styles.transferBtn, styles.transferBtnConfirm, { marginTop: 16 }]}
              onPress={() => setHistoryModalVisible(false)}
            >
              <Text style={styles.transferBtnConfirmText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  plusBtn: { marginRight: 8, width: 36, height: 36, borderRadius: 8, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  plusText: { fontSize: 18, color: colors.primary, lineHeight: 18 },
  sendBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  sendText: { color: '#fff', fontWeight: '600' },
  sheetMask: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: 'transparent' },
  sheetItem: { backgroundColor: '#fff', paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  sheetItemText: { fontSize: 16, color: '#111827' },
  sheetSep: { height: 8 },
  sheetGap: { height: 12 },
  sheetCancel: { backgroundColor: '#f3f4f6' },
  statusBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  dotOnline: { backgroundColor: '#22c55e' },
  dotOffline: { backgroundColor: '#9ca3af' },
  statusText: { fontSize: 12, color: '#6b7280' },
  // 转接弹窗样式
  transferMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  transferModal: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 },
  transferTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  transferLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 8 },
  agentList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  agentItem: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  agentItemSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  agentItemText: { fontSize: 14, color: '#374151' },
  agentItemTextSelected: { color: '#2563eb', fontWeight: '600' },
  transferInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  transferButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  transferBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  transferBtnCancel: { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' },
  transferBtnCancelText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  transferBtnConfirm: { backgroundColor: '#2563eb' },
  transferBtnConfirmText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  // 转接历史样式
  historyItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  historyAgents: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1 },
  historyTime: { fontSize: 12, color: '#6b7280', marginLeft: 8 },
  historyReason: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  // 状态徽章样式
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  statusOnline: { backgroundColor: '#d1fae5' },
  statusBusy: { backgroundColor: '#fee2e2' },
  statusAway: { backgroundColor: '#fef3c7' },
  statusBadgeText: { fontSize: 11, fontWeight: '600', color: '#374151' },
});
