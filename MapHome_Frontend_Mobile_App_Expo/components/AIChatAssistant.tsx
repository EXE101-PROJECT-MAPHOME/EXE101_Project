import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EventSource from 'react-native-sse';
import { API_BASE, AI_URL } from '../utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatAssistant() {
  const [modalVisible, setModalVisible] = useState(false);
  const [provider, setProvider] = useState<'auto' | 'gemini' | 'groq' | 'openrouter'>('auto');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Danh sách model có thể chọn
  const modelOptions: { value: 'auto' | 'gemini' | 'groq' | 'openrouter'; label: string; desc: string; icon: string }[] = [
    { value: 'auto',       label: 'Auto',       desc: 'Tự động chọn AI tốt nhất',       icon: '✨' },
    { value: 'gemini',     label: 'Gemini',     desc: 'Google Gemini (tự động chọn phiên bản)',  icon: '🔵' },
    { value: 'openrouter', label: 'OpenRouter', desc: 'Gemini Flash Free via OpenRouter', icon: '🟢' },
    { value: 'groq',       label: 'Llama 3.3',  desc: 'Meta Llama 3.3-70B via Groq',     icon: '🟡' },
  ];
  const currentModel = modelOptions.find((o) => o.value === provider) ?? modelOptions[0];
  // Map provider → model name cụ thể để gửi lên backend
  const providerModelMap: Record<string, string> = {
    auto: '',
    gemini: 'gemini-2.5-flash',
    groq: 'llama-3.3-70b-versatile',
    openrouter: 'openrouter/free',
  };
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Chào bạn! Mình là MapHome AI, mình có thể giúp gì cho bạn hôm nay?',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  const pathname = usePathname();
  const [currentPropertyId, setCurrentPropertyId] = useState<string | null>(null);

  useEffect(() => {
    // Extract property ID from pathname (e.g., /room/66a123...)
    const match = pathname?.match(/\/room\/([a-zA-Z0-9]+)/);
    const id = match ? match[1] : null;
    setCurrentPropertyId(id);

    if (id && messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Tôi thấy bạn đang xem căn phòng này. Bạn có thắc mắc gì về tiện ích hay giá thuê không? Tôi có thể giải đáp ngay!',
        },
      ]);
    }
  }, [pathname, messages.length]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    const newMsg: Message = { id: Date.now().toString(), role: 'user', content: userMessage };
    setMessages((prev) => [...prev, newMsg]);
    setIsLoading(true);

    const botMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: botMsgId, role: 'assistant', content: '' }]);

    const history = messages.filter((_, idx) => idx > 0).map(m => ({ role: m.role, content: m.content }));
    const token = await AsyncStorage.getItem('token');

    const es = new EventSource(`${AI_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'x-api-key': process.env.EXPO_PUBLIC_MAPHOME_AI_API_KEY || 'maphome_secret_key_123', // API Key bảo vệ server Python
      },
      body: JSON.stringify({
        message: userMessage,
        propertyId: currentPropertyId,
        provider: provider,
        model: providerModelMap[provider] || undefined,
        history: history,
      }),
    });

    es.addEventListener('message', (event: any) => {
      if (event.data === '[DONE]') {
        es.close();
        setIsLoading(false);
        return;
      }
      try {
        const data = JSON.parse(event.data);
        if (data.content) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId
                ? { ...msg, content: msg.content + data.content }
                : msg
            )
          );
        }
      } catch (e) {
        console.error('Error parsing SSE message', e);
      }
    });

    es.addEventListener('error', (event: any) => {
      console.error('SSE Error:', event);
      if (event.type === 'error') {
        es.close();
        setIsLoading(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId && msg.content === ''
              ? { ...msg, content: '[LỖI] Đã xảy ra lỗi kết nối với máy chủ AI.' }
              : msg
          )
        );
      }
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperBot]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="hardware-chip" size={16} color="#fff" />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.messageUser : styles.messageBot]}>
          <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextBot]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#8b5cf6', '#a855f7']}
          style={styles.fabGradient}
        >
          <Ionicons name="chatbubbles" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.chatContainer}>
            <LinearGradient
              colors={['#8b5cf6', '#a855f7']}
              style={styles.header}
            >
              <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerIconBg}>
                    <Ionicons name="hardware-chip" size={20} color="#8b5cf6" />
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>MapHome AI</Text>
                    <Text style={styles.headerSubtitle}>• TRỢ LÝ ẢO THÔNG MINH</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Model Selector Dropdown */}
              <TouchableOpacity
                style={styles.modelDropdownTrigger}
                onPress={() => setIsModelDropdownOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.modelDropdownIcon}>{currentModel.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modelDropdownLabel}>{currentModel.icon} {currentModel.label}</Text>
                  <Text style={styles.modelDropdownDesc}>{currentModel.desc}</Text>
                </View>
                <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>

              {/* Dropdown Modal */}
              <Modal
                visible={isModelDropdownOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsModelDropdownOpen(false)}
              >
                <TouchableOpacity
                  style={styles.dropdownOverlay}
                  activeOpacity={1}
                  onPress={() => setIsModelDropdownOpen(false)}
                >
                  <View style={styles.dropdownMenu}>
                    <Text style={styles.dropdownTitle}>Chọn AI Model</Text>
                    {modelOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.dropdownItem, provider === opt.value && styles.dropdownItemActive]}
                        onPress={() => { setProvider(opt.value); setIsModelDropdownOpen(false); }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownItemIcon}>{opt.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.dropdownItemLabel, provider === opt.value && styles.dropdownItemLabelActive]}>{opt.label}</Text>
                          <Text style={styles.dropdownItemDesc}>{opt.desc}</Text>
                        </View>
                        {provider === opt.value && <Ionicons name="checkmark" size={16} color="#8b5cf6" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>
            </LinearGradient>

            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Hỏi tôi bất cứ điều gì..."
                placeholderTextColor="#9ca3af"
                multiline
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.footerBrand}>
              <Ionicons name="sparkles" size={12} color="#8b5cf6" />
              <Text style={styles.footerBrandText}>POWERED BY MAPHOME INTELLIGENCE</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 84,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 9999,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    backgroundColor: '#f9fafb',
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    paddingTop: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    gap: 8,
  },
  modelDropdownIcon: {
    fontSize: 16,
  },
  modelDropdownLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  modelDropdownDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 1,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  dropdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dropdownItemActive: {
    backgroundColor: '#f5f3ff',
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  dropdownItemIcon: {
    fontSize: 22,
  },
  dropdownItemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  dropdownItemLabelActive: {
    color: '#7c3aed',
  },
  dropdownItemDesc: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBg: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
  },
  messageList: {
    padding: 16,
    paddingBottom: 32,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperBot: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    backgroundColor: '#8b5cf6',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  messageUser: {
    backgroundColor: '#8b5cf6',
    borderBottomRightRadius: 4,
  },
  messageBot: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextUser: {
    color: '#fff',
  },
  messageTextBot: {
    color: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    maxHeight: 100,
    color: '#1f2937',
  },
  sendButton: {
    backgroundColor: '#a855f7',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  footerBrand: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#fff',
  },
  footerBrandText: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
});
