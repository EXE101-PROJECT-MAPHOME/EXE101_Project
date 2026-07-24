import React, { useState } from 'react';
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
} from 'react-native';
import { ShieldCheck, X, CheckCircle2, AlertCircle, Upload } from 'lucide-react-native';
import api from '../utils/api';
// Assuming expo-document-picker or expo-image-picker can be used for files
// but we'll use a mock button for the UI for now.

interface InspectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onSuccess?: () => void;
}

export function InspectionDialog({
  isOpen,
  onClose,
  request,
  onSuccess,
}: InspectionDialogProps) {
  const [notes, setNotes] = useState('');
  const [isApproved, setIsApproved] = useState(true);
  const [checklist, setChecklist] = useState({
    isAccurate: false,
    hasAmenities: false,
    isSecure: false,
    isLegal: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaCount, setMediaCount] = useState(0);

  const handleComplete = async () => {
    if (!isApproved && !notes.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do không đạt');
      return;
    }

    setIsSubmitting(true);
    try {
      // Dummy API call based on web
      // const res = await api.put(`/api/admin/verification/${request.id}/complete`, { ... });
      
      // Simulate network request
      await new Promise((res) => setTimeout(res, 1000));
      
      Alert.alert(
        isApproved ? 'Hoàn tất kiểm tra' : 'Đã từ chối',
        isApproved ? 'Đã cấp Tích Xanh thành công!' : 'Đã từ chối yêu cầu.',
      );
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật kết quả.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen || !request) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBg}>
                <ShieldCheck size={24} color="white" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Hoàn thành kiểm tra</Text>
                <Text style={styles.headerSubtitle}>Xác thực căn trọ trên nền tảng</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Request Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Thông tin yêu cầu</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Căn trọ:</Text>
                  <Text style={styles.infoValue}>{request.propertyName}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Chủ trọ:</Text>
                  <Text style={styles.infoValue}>{request.landlordName}</Text>
                </View>
                <View style={[styles.infoCol, { width: '100%' }]}>
                  <Text style={styles.infoLabel}>Địa chỉ:</Text>
                  <Text style={styles.infoValue}>{request.address}</Text>
                </View>
                <View style={[styles.infoCol, { width: '100%' }]}>
                  <Text style={styles.infoLabel}>SĐT liên hệ:</Text>
                  <Text style={styles.infoValue}>{request.phone}</Text>
                </View>
              </View>
            </View>

            {/* Approval Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, isApproved ? styles.toggleActiveApprove : styles.toggleInactive]}
                onPress={() => setIsApproved(true)}
              >
                <CheckCircle2 size={20} color={isApproved ? '#15803d' : '#9ca3af'} />
                <Text style={[styles.toggleText, isApproved ? { color: '#15803d' } : { color: '#9ca3af' }]}>
                  Đạt yêu cầu
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !isApproved ? styles.toggleActiveReject : styles.toggleInactive]}
                onPress={() => setIsApproved(false)}
              >
                <AlertCircle size={20} color={!isApproved ? '#b91c1c' : '#9ca3af'} />
                <Text style={[styles.toggleText, !isApproved ? { color: '#b91c1c' } : { color: '#9ca3af' }]}>
                  Không đạt
                </Text>
              </TouchableOpacity>
            </View>

            {/* Verification Preview */}
            {isApproved && (
              <View style={styles.previewBox}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewIconBg}>
                    <ShieldCheck size={20} color="white" />
                  </View>
                  <View>
                    <Text style={styles.previewTitle}>Đã được xác thực</Text>
                    <Text style={styles.previewSubtitle}>Bởi nền tảng MapHome</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {isApproved ? 'Ghi chú đánh giá (tùy chọn)' : 'Lý do không đạt *'}
              </Text>
              <TextInput
                style={styles.textarea}
                placeholder={isApproved ? 'VD: Phòng đúng mô tả...' : 'VD: Vị trí không chính xác...'}
                multiline
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Checklist */}
            {isApproved && (
              <View style={styles.checklistContainer}>
                <Text style={styles.label}>Tiêu chí thẩm định</Text>
                <View style={styles.checkGrid}>
                  <TouchableOpacity
                    style={styles.checkItem}
                    onPress={() => toggleChecklist('isAccurate')}
                  >
                    <View style={[styles.checkbox, checklist.isAccurate && styles.checkboxActive]}>
                      {checklist.isAccurate && <CheckCircle2 size={14} color="white" />}
                    </View>
                    <Text style={styles.checkText}>Hình ảnh trung thực</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.checkItem}
                    onPress={() => toggleChecklist('hasAmenities')}
                  >
                    <View style={[styles.checkbox, checklist.hasAmenities && styles.checkboxActive]}>
                      {checklist.hasAmenities && <CheckCircle2 size={14} color="white" />}
                    </View>
                    <Text style={styles.checkText}>Tiện nghi tốt</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.checkItem}
                    onPress={() => toggleChecklist('isSecure')}
                  >
                    <View style={[styles.checkbox, checklist.isSecure && styles.checkboxActive]}>
                      {checklist.isSecure && <CheckCircle2 size={14} color="white" />}
                    </View>
                    <Text style={styles.checkText}>An ninh đảm bảo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.checkItem}
                    onPress={() => toggleChecklist('isLegal')}
                  >
                    <View style={[styles.checkbox, checklist.isLegal && styles.checkboxActive]}>
                      {checklist.isLegal && <CheckCircle2 size={14} color="white" />}
                    </View>
                    <Text style={styles.checkText}>Pháp lý hợp lệ</Text>
                  </TouchableOpacity>
                </View>

                {/* File Upload Mock */}
                <View style={styles.uploadContainer}>
                  <Text style={styles.label}>Minh chứng (Ảnh/Video)</Text>
                  <TouchableOpacity
                    style={styles.uploadBox}
                    onPress={() => setMediaCount(mediaCount + 1)}
                  >
                    <Upload size={24} color="#6b7280" />
                    <Text style={styles.uploadText}>Nhấn để tải lên file</Text>
                  </TouchableOpacity>
                  {mediaCount > 0 && (
                    <Text style={styles.mediaCountText}>Đã chọn {mediaCount} file.</Text>
                  )}
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                !isApproved ? { backgroundColor: '#dc2626' } : { backgroundColor: '#059669' },
                isSubmitting && { opacity: 0.7 }
              ]}
              onPress={handleComplete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  {isApproved ? (
                    <CheckCircle2 size={16} color="white" style={{ marginRight: 6 }} />
                  ) : (
                    <AlertCircle size={16} color="white" style={{ marginRight: 6 }} />
                  )}
                  <Text style={styles.submitBtnText}>
                    {isApproved ? 'Cấp Tích Xanh' : 'Từ chối yêu cầu'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: '#059669',
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#d1fae5',
    fontSize: 12,
  },
  closeBtn: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  infoTitle: {
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoCol: {
    width: '45%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  toggleActiveApprove: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  toggleActiveReject: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  toggleInactive: {
    backgroundColor: 'white',
    borderColor: '#e5e7eb',
  },
  toggleText: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  previewBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIconBg: {
    backgroundColor: '#22c55e',
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  previewTitle: {
    fontWeight: 'bold',
    color: '#14532d',
    fontSize: 16,
  },
  previewSubtitle: {
    color: '#15803d',
    fontSize: 12,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    backgroundColor: 'white',
    color: '#0f172a',
  },
  checklistContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  checkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkText: {
    fontSize: 12,
    color: '#334155',
  },
  uploadContainer: {
    marginBottom: 20,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  uploadText: {
    color: '#64748b',
    marginTop: 8,
    fontWeight: '500',
  },
  mediaCountText: {
    marginTop: 8,
    fontSize: 12,
    color: '#059669',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: 'bold',
    color: '#475569',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitBtnText: {
    fontWeight: 'bold',
    color: 'white',
  },
});
