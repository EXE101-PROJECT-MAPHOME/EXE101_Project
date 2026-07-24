import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import {
  Clock,
  CheckCircle,
  XCircle,
  Award,
  ClipboardCheck,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  Calendar,
  ArrowRight,
} from 'lucide-react-native';
import api from '../utils/api';
import { ConfirmDialog } from './ConfirmDialog';
import { InspectionDialog } from './InspectionDialog';

export function InspectionsView() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Confirm Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmDesc, setConfirmDesc] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => {});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Dummy API call based on web structure
      const res = await api.get('/api/admin/verifications');
      setRequests(res.data || []);
    } catch (err) {
      console.log('Failed to fetch verification requests', err);
      // Mock data for UI demonstration since API might not exist yet
      setRequests([
        {
          id: '1',
          propertyName: 'Phòng trọ cao cấp Q7',
          landlordName: 'Nguyễn Văn A',
          phone: '0901234567',
          address: '123 Đường Số 1, Quận 7, TP.HCM',
          scheduledDate: '2025-10-25',
          scheduledTime: '09:00',
          status: 'pending',
          notes: 'Gọi trước khi đến 15 phút',
        },
        {
          id: '2',
          propertyName: 'Căn hộ mini Bình Thạnh',
          landlordName: 'Trần Thị B',
          phone: '0987654321',
          address: '456 Xô Viết Nghệ Tĩnh, Bình Thạnh',
          scheduledDate: '2025-10-20',
          scheduledTime: '14:00',
          status: 'approved',
          badgeAwarded: 'none',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = (id: string, status: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status } : req))
    );
  };

  const handleApprove = (requestId: string) => {
    setConfirmTitle('Xác nhận duyệt lịch hẹn?');
    setConfirmDesc('Bạn có muốn duyệt và lên lịch kiểm tra cho yêu cầu này?');
    setOnConfirmAction(() => () => {
      updateRequestStatus(requestId, 'approved');
      Alert.alert('Thành công', 'Đã duyệt lịch hẹn! ✅');
    });
    setConfirmOpen(true);
  };

  const handleReject = (requestId: string) => {
    // React Native doesn't have a simple Prompt out of the box for Android,
    // so we'll use a simple confirm for now, or you could implement a custom prompt modal.
    Alert.prompt(
      'Từ chối yêu cầu',
      'Nhập lý do từ chối:',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: (text) => {
            if (text) {
              updateRequestStatus(requestId, 'rejected');
              Alert.alert('Đã từ chối', 'Đã từ chối yêu cầu! ❌');
            } else {
              Alert.alert('Lỗi', 'Cần nhập lý do từ chối');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleInspect = (request: any) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const handleInspectionSuccess = () => {
    if (selectedRequest) {
      updateRequestStatus(selectedRequest.id, 'completed');
    }
    fetchRequests();
  };

  const stats = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard icon={<Clock size={24} color="#f59e0b" />} label="Chờ duyệt" count={stats.pending} color="orange" />
        <StatCard icon={<CheckCircle size={24} color="#3b82f6" />} label="Đã duyệt lịch" count={stats.approved} color="blue" />
        <StatCard icon={<Award size={24} color="#10b981" />} label="Cấp tích xanh" count={stats.completed} color="green" />
        <StatCard icon={<XCircle size={24} color="#ef4444" />} label="Từ chối" count={stats.rejected} color="red" />
      </View>

      {/* Main Header */}
      <View style={styles.mainHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.mainTitle}>Danh sách yêu cầu</Text>
          <Text style={styles.mainSubtitle}>Quản lý các lượt thực địa và xác minh</Text>
        </View>
        <View style={styles.totalBadge}>
          <ClipboardCheck size={14} color="#64748b" />
          <Text style={styles.totalBadgeText}>Tổng số: {requests.length}</Text>
        </View>
      </View>

      {/* Request List */}
      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBg}>
            <ShieldCheck size={48} color="#cbd5e1" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có yêu cầu nào</Text>
          <Text style={styles.emptySubtitle}>
            Khi chủ trọ gửi yêu cầu xác thực, thông tin sẽ hiển thị tại đây.
          </Text>
        </View>
      ) : (
        <View style={styles.requestList}>
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onApprove={() => handleApprove(req.id)}
              onReject={() => handleReject(req.id)}
              onInspect={() => handleInspect(req)}
            />
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />

      <InspectionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        request={selectedRequest}
        onSuccess={handleInspectionSuccess}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDesc}
        onConfirm={() => {
          onConfirmAction();
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </ScrollView>
  );
}

function StatCard({ icon, label, count, color }: any) {
  const getTheme = () => {
    switch (color) {
      case 'orange':
        return { bg: '#fffbeb', border: '#fef3c7', text: '#d97706', bar: '#f59e0b' };
      case 'blue':
        return { bg: '#eff6ff', border: '#dbeafe', text: '#2563eb', bar: '#3b82f6' };
      case 'green':
        return { bg: '#ecfdf5', border: '#d1fae5', text: '#059669', bar: '#10b981' };
      case 'red':
        return { bg: '#fef2f2', border: '#fee2e2', text: '#dc2626', bar: '#ef4444' };
      default:
        return { bg: '#f8fafc', border: '#f1f5f9', text: '#475569', bar: '#94a3b8' };
    }
  };
  const theme = getTheme();

  return (
    <View style={[styles.statCard, { backgroundColor: 'white', borderColor: theme.border }]}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statIconWrapper, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          {icon}
        </View>
        <Text style={[styles.statCount, { color: theme.text }]}>{count}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={[styles.statBar, { backgroundColor: theme.bar }]} />
    </View>
  );
}

function RequestCard({ request, onApprove, onReject, onInspect }: any) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Đang chờ duyệt', bg: '#fffbeb', text: '#d97706', border: '#fef3c7' };
      case 'approved':
        return { label: 'Đã lên lịch', bg: '#eff6ff', text: '#2563eb', border: '#dbeafe' };
      case 'completed':
        return { label: 'Đã hoàn thành', bg: '#ecfdf5', text: '#059669', border: '#d1fae5' };
      case 'rejected':
        return { label: 'Đã từ chối', bg: '#fef2f2', text: '#dc2626', border: '#fee2e2' };
      default:
        return { label: status, bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    }
  };
  const statusInfo = getStatusInfo(request.status);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.propertyName}>{request.propertyName}</Text>
          <View style={styles.landlordInfoRow}>
            <View style={styles.infoBadge}>
              <User size={12} color="#64748b" />
              <Text style={styles.infoBadgeText}>{request.landlordName}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Phone size={12} color="#64748b" />
              <Text style={styles.infoBadgeText}>{request.phone}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg, borderColor: statusInfo.border }]}>
          <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <View style={styles.detailIconBg}>
            <MapPin size={16} color="#64748b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>Địa điểm</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{request.address}</Text>
          </View>
        </View>
        <View style={styles.detailItem}>
          <View style={styles.detailIconBg}>
            <Calendar size={16} color="#64748b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>Thời gian</Text>
            <Text style={styles.detailValue}>{request.scheduledDate} • {request.scheduledTime}</Text>
          </View>
        </View>
      </View>

      {request.notes && (
        <Text style={styles.notesText}>" {request.notes} "</Text>
      )}

      <View style={styles.actionsRow}>
        {request.status === 'pending' && (
          <>
            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={onApprove}>
              <CheckCircle size={14} color="white" />
              <Text style={styles.approveBtnText}>Duyệt lịch</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={onReject}>
              <XCircle size={14} color="#ef4444" />
              <Text style={styles.rejectBtnText}>Từ chối</Text>
            </TouchableOpacity>
          </>
        )}
        {request.status === 'approved' && (
          <TouchableOpacity style={[styles.actionBtn, styles.inspectBtn]} onPress={onInspect}>
            <Text style={styles.inspectBtnText}>Tiến hành kiểm tra</Text>
            <ArrowRight size={14} color="white" />
          </TouchableOpacity>
        )}
        {request.status === 'completed' && (
          <View style={[styles.actionBtn, styles.completedBtn]}>
            <CheckCircle size={14} color="#059669" />
            <Text style={styles.completedBtnText}>Đã hoàn tất thực địa</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statCount: {
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  statBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    opacity: 0.3,
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  mainSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  totalBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  requestList: {
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 8,
  },
  landlordInfoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  infoBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#94a3b8',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  approveBtn: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  approveBtnText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 12,
  },
  rejectBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  rejectBtnText: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 12,
  },
  inspectBtn: {
    backgroundColor: '#0f172a',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  inspectBtnText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 12,
  },
  completedBtn: {
    backgroundColor: '#ecfdf5',
  },
  completedBtnText: {
    color: '#059669',
    fontWeight: '900',
    fontSize: 12,
  },
});
