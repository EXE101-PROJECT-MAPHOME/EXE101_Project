import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Flag, X, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react-native';
import api from '../utils/api';

interface ReportPropertyDialogProps {
  propertyId: string;
  propertyName: string;
}

const REPORT_REASONS = [
  { value: 'incorrect_info', label: 'Thông tin không chính xác' },
  { value: 'duplicate', label: 'Tin đăng trùng lặp' },
  { value: 'sold_rented', label: 'Phòng đã cho thuê/bán' },
  { value: 'fraud', label: 'Dấu hiệu lừa đảo' },
  { value: 'prohibited_content', label: 'Nội dung cấm/nhạy cảm' },
  { value: 'other', label: 'Lý do khác' },
];

export function ReportPropertyDialog({
  propertyId,
  propertyName,
}: ReportPropertyDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for simple custom dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      setError('Vui lòng chọn lý do báo cáo.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/api/reports', {
        propertyId,
        reason,
        description,
      });

      if (res.status === 200 || res.status === 201) {
        setIsSubmitted(true);
        setTimeout(() => {
          setOpen(false);
          setIsSubmitted(false);
          setReason('');
          setDescription('');
        }, 3000);
      } else {
        setError(res.data?.message || 'Có lỗi xảy ra khi gửi báo cáo.');
      }
    } catch (err: any) {
      console.error('Report error:', err);
      setError(err.response?.data?.message || 'Không thể kết nối tới máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setOpen(false);
      setDropdownOpen(false);
    }
  };

  const selectedReasonLabel =
    REPORT_REASONS.find((r) => r.value === reason)?.label || 'Chọn lý do';

  return (
    <>
      <TouchableOpacity
        style={styles.triggerBtn}
        onPress={() => setOpen(true)}
      >
        <Flag size={16} color="#dc2626" style={{ marginRight: 8 }} />
        <Text style={styles.triggerBtnText}>Báo cáo tin đăng</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.dialogBox}>
            {isSubmitted ? (
              <View style={styles.successContainer}>
                <CheckCircle2 size={64} color="#16a34a" style={styles.successIcon} />
                <Text style={styles.successTitle}>Cảm ơn bạn!</Text>
                <Text style={styles.successDesc}>
                  Báo cáo của bạn đã được gửi. Chúng tôi sẽ xem xét trong thời gian sớm nhất.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.header}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Flag size={20} color="#dc2626" />
                    <Text style={styles.headerTitle}>Báo cáo tin đăng</Text>
                  </View>
                  <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <X size={24} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                  <Text style={styles.subtitle}>
                    Bạn đang báo cáo tin:{' '}
                    <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>
                      {propertyName}
                    </Text>
                  </Text>

                  {error && (
                    <View style={styles.errorBox}>
                      <AlertCircle size={16} color="#dc2626" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  {/* Custom Dropdown for Reason */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Lý do báo cáo *</Text>
                    <TouchableOpacity
                      style={styles.selectTrigger}
                      onPress={() => setDropdownOpen(!dropdownOpen)}
                    >
                      <Text
                        style={[
                          styles.selectValue,
                          !reason && { color: '#94a3b8' },
                        ]}
                      >
                        {selectedReasonLabel}
                      </Text>
                      <ChevronDown size={20} color="#94a3b8" />
                    </TouchableOpacity>

                    {dropdownOpen && (
                      <View style={styles.dropdownMenu}>
                        {REPORT_REASONS.map((item) => (
                          <TouchableOpacity
                            key={item.value}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setReason(item.value);
                              setDropdownOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                reason === item.value && { color: '#dc2626', fontWeight: 'bold' },
                              ]}
                            >
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Mô tả chi tiết (không bắt buộc)</Text>
                    <TextInput
                      style={styles.textarea}
                      placeholder="Cung cấp thêm chi tiết để chúng tôi xử lý nhanh hơn..."
                      placeholderTextColor="#94a3b8"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      value={description}
                      onChangeText={setDescription}
                    />
                  </View>
                  
                  <View style={{ height: 20 }} />
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity
                    style={[styles.btn, styles.cancelBtn]}
                    onPress={handleClose}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.cancelBtnText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.submitBtnText}>Gửi báo cáo</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  triggerBtnText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dialogBox: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginLeft: 8,
  },
  content: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'white',
  },
  selectValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#334155',
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'white',
    fontSize: 14,
    color: '#1e293b',
    minHeight: 120,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: '#dc2626',
  },
  submitBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
