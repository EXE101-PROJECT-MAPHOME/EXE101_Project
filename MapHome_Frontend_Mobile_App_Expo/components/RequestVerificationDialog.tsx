import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Calendar, Clock, ShieldCheck, Award, CheckCircle } from 'lucide-react-native';
import api from '../utils/api';
import * as Linking from 'expo-linking';

interface RequestVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  landlordId: string;
  landlordName: string;
  landlordPhone: string;
  landlordProperties: any[];
}

export function RequestVerificationDialog({
  isOpen,
  onClose,
  landlordId,
  landlordName,
  landlordPhone,
  landlordProperties,
}: RequestVerificationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [pricing, setPricing] = useState({
    basicVerification: 0,
    premiumVerification: 500000,
  });

  const [propDropdownOpen, setPropDropdownOpen] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchPricing = async () => {
        try {
          const res = await api.get('/api/verifications/pricing');
          if (res.status === 200) {
            setPricing(res.data);
          }
        } catch (err) {
          console.log('Failed to fetch verification pricing', err);
        }
      };
      fetchPricing();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedPropertyId || !scheduledDate) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn căn trọ và ngày hẹn');
      return;
    }

    const property = landlordProperties.find(
      (p) => (p.id || p._id) === selectedPropertyId
    );
    if (!property) return;

    setIsSubmitting(true);
    try {
      const payload = {
        propertyId: property.id || property._id,
        propertyName: property.name,
        landlordId,
        landlordName,
        scheduledDate,
        scheduledTime,
        notes,
        address: property.address,
        phone: landlordPhone,
      };

      const res = await api.post('/api/verifications', payload);

      if (res.status === 200 || res.status === 201) {
        const verificationId = res.data._id || res.data.id;

        Alert.alert('Thành công', 'Đang chuyển hướng sang cổng thanh toán...');

        try {
          const paymentRes = await api.post('/api/payments/create', {
            amount: pricing.premiumVerification || 500000,
            description: 'Phi xac thuc thuc te',
            planId: 'premium_verification',
            verificationId,
            appReturnUrl: Linking.createURL('/'), // Go back to app
          });

          if (paymentRes.status === 200 && paymentRes.data.url) {
            await Linking.openURL(paymentRes.data.url);
            onClose();
          } else {
            throw new Error('Không thể tạo link thanh toán');
          }
        } catch (paymentErr) {
          Alert.alert(
            'Lỗi thanh toán',
            'Không thể kết nối với PayOS. Vui lòng thử thanh toán lại trong Dashboard.'
          );
          onClose();
        }
      } else {
        throw new Error('Gửi yêu cầu thất bại');
      }
    } catch (err: any) {
      Alert.alert(
        'Lỗi',
        err.response?.data?.message || 'Có lỗi xảy ra. Không thể gửi yêu cầu. ❌'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const times = [
    '08:00', '09:00', '10:00', '11:00',
    '13:00', '14:00', '15:00', '16:00'
  ];

  const selectedPropObj = landlordProperties.find((p) => (p.id || p._id) === selectedPropertyId);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBg}>
                <ShieldCheck size={24} color="#fff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Cấp Tích Xanh</Text>
                <Text style={styles.headerSubtitle}>Nâng cao độ tin cậy</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Benefits */}
            <View style={styles.benefitsBox}>
              <View style={styles.benefitsHeader}>
                <Award size={18} color="#059669" />
                <Text style={styles.benefitsTitle}>Lợi ích khi có Tích Xanh</Text>
              </View>
              <View style={styles.benefitsGrid}>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>⭐</Text>
                  <Text style={styles.benefitLabel}>Lên top tìm kiếm</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>🛡️</Text>
                  <Text style={styles.benefitLabel}>Tăng độ tin cậy</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>📈</Text>
                  <Text style={styles.benefitLabel}>+50% lượt xem</Text>
                </View>
              </View>
            </View>

            {/* Select Property */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Chọn căn trọ cần kiểm tra *</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setPropDropdownOpen(!propDropdownOpen)}
              >
                <Text style={[styles.dropdownValue, !selectedPropertyId && { color: '#94a3b8' }]}>
                  {selectedPropObj ? selectedPropObj.name : '-- Chọn căn trọ --'}
                </Text>
              </TouchableOpacity>
              
              {propDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {landlordProperties.map((prop) => (
                    <TouchableOpacity
                      key={prop.id || prop._id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedPropertyId(prop.id || prop._id);
                        setPropDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{prop.name}</Text>
                    </TouchableOpacity>
                  ))}
                  {landlordProperties.length === 0 && (
                    <Text style={{ padding: 12, color: '#ef4444' }}>Bạn chưa có tin đăng nào.</Text>
                  )}
                </View>
              )}
            </View>

            {/* Schedule */}
            <View style={styles.rowGroup}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Ngày hẹn * (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2025-10-25"
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Giờ hẹn *</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => setTimeDropdownOpen(!timeDropdownOpen)}
                >
                  <Text style={styles.dropdownValue}>{scheduledTime}</Text>
                </TouchableOpacity>
                {timeDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {times.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setScheduledTime(t);
                          setTimeDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ghi chú thêm (tùy chọn)</Text>
              <TextInput
                style={[styles.input, { minHeight: 80 }]}
                placeholder="VD: Hẹn tại cổng chính..."
                multiline
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Process */}
            <View style={styles.processBox}>
              <View style={styles.processHeader}>
                <CheckCircle size={16} color="#1d4ed8" />
                <Text style={styles.processTitle}>Quy trình kiểm tra</Text>
              </View>
              <Text style={styles.processText}>1. Admin xác nhận lịch hẹn</Text>
              <Text style={styles.processText}>2. Đội ngũ kiểm tra đến hiện trường</Text>
              <Text style={styles.processText}>3. Đánh giá vị trí, phòng ốc</Text>
              <Text style={styles.processText}>4. Cấp Tích Xanh nếu đạt yêu cầu</Text>
              <View style={styles.priceRow}>
                <Award size={14} color="#2563eb" />
                <Text style={styles.priceText}>
                  Chi phí: {pricing.premiumVerification.toLocaleString()}đ / lần
                </Text>
              </View>
            </View>
            
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, (isSubmitting || !selectedPropertyId) && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={isSubmitting || !selectedPropertyId}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <ShieldCheck size={16} color="white" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>Gửi yêu cầu</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    backgroundColor: '#059669', // Emerald 600
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBg: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#d1fae5',
    fontSize: 12,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 12,
  },
  content: {
    padding: 20,
  },
  benefitsBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitsTitle: {
    fontWeight: 'bold',
    color: '#064e3b',
    marginLeft: 8,
  },
  benefitsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  benefitItem: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  benefitIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  benefitLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 14,
    backgroundColor: 'white',
  },
  dropdownValue: {
    color: '#111827',
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: 'white',
    maxHeight: 150,
    overflow: 'hidden',
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemText: {
    color: '#1f2937',
  },
  rowGroup: {
    flexDirection: 'row',
    gap: 12,
    zIndex: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 14,
    backgroundColor: 'white',
    color: '#111827',
  },
  processBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 16,
  },
  processHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  processTitle: {
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginLeft: 6,
  },
  processText: {
    fontSize: 12,
    color: '#1e40af',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#dbeafe',
  },
  priceText: {
    fontWeight: 'bold',
    color: '#2563eb',
    fontSize: 12,
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: 'bold',
    color: '#4b5563',
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#059669',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontWeight: 'bold',
    color: 'white',
  },
});
