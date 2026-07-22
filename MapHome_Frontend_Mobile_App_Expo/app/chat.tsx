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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EventSource from 'react-native-sse';
import { API_BASE, AI_URL } from '../utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatScreen() {
  const router = useRouter();
  
  const [provider, setProvider] = useState<'auto' | 'gemini' | 'groq' | 'openrouter' | 'monica' | 'github' | 'sambanova'>('auto');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Danh sách model có thể chọn
  const modelOptions: { value: 'auto' | 'gemini' | 'groq' | 'openrouter' | 'monica' | 'github' | 'sambanova'; label: string; desc: string; icon: string }[] = [
    { value: 'auto',       label: 'Auto',       desc: 'Tự động chọn AI tốt nhất',       icon: '✨' },
    { value: 'github',     label: 'GitHub',     desc: 'GitHub Models (GPT-4o)',         icon: '🐙' },
    { value: 'sambanova',  label: 'SambaNova',  desc: 'Llama 3.1 70B (Siêu nhanh)',     icon: '🚀' },
    { value: 'gemini',     label: 'Gemini',     desc: 'Google Gemini (tự động chọn phiên bản)',  icon: '🔵' },
    { value: 'openrouter', label: 'OpenRouter', desc: 'Gemini Flash Free via OpenRouter', icon: '🟢' },
    { value: 'groq',       label: 'Llama 3.3',  desc: 'Meta Llama 3.3-70B via Groq',     icon: '🟡' },
    { value: 'monica',     label: 'Monica',     desc: 'Monica AI (GPT-4o/Claude)',      icon: '🟣' },
  ];
  const currentModel = modelOptions.find((o) => o.value === provider) ?? modelOptions[0];
  const providerModelMap: Record<string, string> = {
    auto: '',
    github: 'gpt-4o',
    sambanova: 'Meta-Llama-3.3-70B-Instruct',
    monica: 'gpt-4o',
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

  const startNewChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Chào bạn! Mình là MapHome AI, mình có thể giúp gì cho bạn hôm nay?',
    }]);
  };

  useEffect(() => {
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
        'x-api-key': process.env.EXPO_PUBLIC_MAPHOME_AI_API_KEY || 'maphome_secret_key_123',
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

  const renderMessage = ({ item, index }: { item: Message, index: number }) => {
    const isUser = item.role === 'user';
    
    // Welcome State if only 1 message
    if (index === 0 && messages.length === 1 && !isUser) {
      return (
        <View style={styles.welcomeContainer}>
          <LinearGradient
            colors={['#4f46e5', '#9333ea']}
            style={styles.welcomeIconContainer}
          >
            <Ionicons name="sparkles" size={40} color="#fff" />
          </LinearGradient>
          <Text style={styles.welcomeTitle}>Xin chào!</Text>
          <Text style={styles.welcomeDesc}>Tôi là trợ lý AI thông minh của MapHome. Tôi có thể giúp gì cho bạn hôm nay?</Text>
          
          <View style={styles.suggestionGrid}>
            {[
              { icon: 'search', title: 'Tìm phòng trọ', prompt: 'Gợi ý phòng trọ sinh viên giá rẻ, an ninh tốt ở trung tâm thành phố.', color: '#6366f1' },
              { icon: 'document-text', title: 'Tư vấn hợp đồng', prompt: 'Lưu ý khi ký hợp đồng thuê nhà cần nhớ', color: '#10b981' },
              { icon: 'home', title: 'Kinh nghiệm thuê', prompt: 'Mẹo tìm phòng an toàn không bị lừa', color: '#f59e0b' },
              { icon: 'location', title: 'Khám phá khu vực', prompt: 'Đánh giá tiện ích và an ninh khu vực Quận 7', color: '#8b5cf6' }
            ].map((sug, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionCard}
                onPress={() => setInputText(sug.prompt)}
                activeOpacity={0.7}
              >
                <View style={[styles.suggestionIconBg, { borderColor: sug.color + '20' }]}>
                  <Ionicons name={sug.icon as any} size={20} color={sug.color} />
                </View>
                <Text style={styles.suggestionText}>{sug.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    if (index === 0 && messages.length > 1 && !isUser) return null; // Hide the initial welcome message when chatting

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <LinearGradient
          colors={['#8b5cf6', '#a855f7']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerIconBg}>
                <Ionicons name="hardware-chip" size={20} color="#8b5cf6" />
              </View>
              <View>
                <Text style={styles.headerTitle}>MapHome AI</Text>
              </View>
            </View>
            <TouchableOpacity onPress={startNewChat} style={styles.newChatButton}>
              <Ionicons name="add" size={24} color="#fff" />
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

        <View style={styles.chatArea}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        </View>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  newChatButton: {
    padding: 4,
  },
  modelDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modelDropdownIcon: {
    fontSize: 20,
  },
  modelDropdownLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  modelDropdownDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    padding: 16,
    paddingBottom: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  dropdownItemActive: {
    backgroundColor: '#f5f3ff',
  },
  dropdownItemIcon: {
    fontSize: 24,
  },
  dropdownItemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  dropdownItemLabelActive: {
    color: '#7c3aed',
  },
  dropdownItemDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    minHeight: 300,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 8,
  },
  welcomeDesc: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 32,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  suggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  suggestionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  suggestionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  messageList: {
    padding: 16,
    paddingBottom: 32,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperBot: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    color: '#334155',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 48,
    maxHeight: 120,
    fontSize: 15,
    color: '#1e293b',
    marginRight: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: Platform.OS === 'ios' ? 16 : 16,
    backgroundColor: '#fff',
  },
  footerBrandText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
  },
});
