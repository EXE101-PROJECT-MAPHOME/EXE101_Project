import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Lock, Mail, Phone, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ tất cả thông tin.');
      return;
    }
    try {
      setLoading(true);
      const res = await register({
        username,
        email,
        password,
        fullName,
        phone,
        role: 'user' // Default to tenant role
      });
      setLoading(false);
      if (res.success) {
        Alert.alert('Thành công', 'Đăng ký tài khoản thành công!');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Thất bại', res.message || 'Đăng ký tài khoản thất bại.');
      }
    } catch {
      setLoading(false);
      Alert.alert('Lỗi', 'Không thể kết nối tới máy chủ.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 px-6 justify-center py-12">
          
          <View className="items-center mb-8">
            <Text className="text-3xl font-black text-emerald-950 text-center mb-2">Khởi tạo hành trình</Text>
            <Text className="text-slate-500 text-center text-base">Tham gia cùng cộng đồng tìm trọ hiện đại nhất hiện nay.</Text>
          </View>

          <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            
            <View className="flex-row justify-between mb-4">
              <View className="w-[48%]">
                <Text className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">Họ và tên</Text>
                <View className="bg-slate-50 rounded-2xl border border-slate-200 h-12 px-3 focus:border-emerald-500">
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Nguyễn Văn A"
                    className="flex-1 h-full text-sm font-medium text-slate-700"
                  />
                </View>
              </View>
              <View className="w-[48%]">
                <Text className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 ml-1">Số điện thoại</Text>
                <View className="flex-row items-center bg-slate-50 rounded-2xl border border-slate-200 h-12 px-3 focus:border-blue-500">
                  <Phone size={14} color="#94a3b8" />
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="091..."
                    keyboardType="phone-pad"
                    className="flex-1 ml-2 h-full text-sm font-medium text-slate-700"
                  />
                </View>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email liên lạc</Text>
              <View className="flex-row items-center bg-slate-50 rounded-2xl border border-slate-200 h-12 px-3 focus:border-emerald-500">
                <Mail size={16} color="#94a3b8" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 ml-3 h-full text-sm font-medium text-slate-700"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">Tên đăng nhập</Text>
              <View className="flex-row items-center bg-slate-50 rounded-2xl border border-slate-200 h-12 px-3 focus:border-emerald-500">
                <User size={16} color="#94a3b8" />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username"
                  autoCapitalize="none"
                  className="flex-1 ml-3 h-full text-sm font-medium text-slate-700"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2 ml-1">Mật khẩu</Text>
              <View className="flex-row items-center bg-slate-50 rounded-2xl border border-slate-200 h-12 px-3 focus:border-blue-500">
                <Lock size={16} color="#94a3b8" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  className="flex-1 ml-3 h-full text-sm font-medium text-slate-700"
                />
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleRegister}
              disabled={loading}
              className="w-full bg-emerald-600 h-14 rounded-2xl flex-row items-center justify-center shadow-lg"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-black text-lg mr-2">Đăng ký ngay</Text>
                  <ArrowRight size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-slate-500 font-medium">Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text className="text-emerald-600 font-bold">Đăng nhập</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

