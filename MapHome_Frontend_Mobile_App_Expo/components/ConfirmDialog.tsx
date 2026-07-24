import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { XCircle } from 'lucide-react-native';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  title = 'Xác nhận thao tác',
  description = 'Bạn có chắc chắn muốn thực hiện thao tác này?',
  confirmText = 'Xác nhận',
  cancelText = 'Huỷ',
  onConfirm,
  onCancel,
  icon,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialogBox}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onCancel}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <XCircle size={24} color="#94a3b8" />
              </TouchableOpacity>

              {icon || <XCircle size={40} color="#f43f5e" style={styles.icon} />}

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={onConfirm}
                >
                  <Text style={styles.confirmText}>{confirmText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                >
                  <Text style={styles.cancelText}>{cancelText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#f43f5e',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  confirmText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
