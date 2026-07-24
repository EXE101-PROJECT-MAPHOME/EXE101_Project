import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Crown,
  Calendar,
  Zap,
  ArrowRight,
  X,
  Check,
  Star,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  CreditCard,
  Download,
} from 'lucide-react-native';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

export function SubscriptionManagement() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [showComparison, setShowComparison] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [subRes, transRes] = await Promise.all([
          api.get('/api/subscriptions/me'),
          api.get('/api/transactions/me'),
        ]);
        setSubscription(subRes.data);
        setTransactions(transRes.data);
      } catch (err) {
        console.log('Failed to fetch subscription data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  const handleRenew = () => router.push('/pricing');
  const handleUpgrade = () => router.push('/pricing');

  const handleCancelSubscription = () => {
    Alert.alert(
      'Xác nhận hủy',
      'Bạn có chắc chắn muốn hủy gói dịch vụ hiện tại? Hành động này sẽ làm mới gói dịch vụ của bạn về trạng thái Free.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await api.post('/api/subscriptions/cancel');
              if (res.status === 200) {
                Alert.alert('Thành công', 'Đã hủy gói dịch vụ thành công!');
                const subRes = await api.get('/api/subscriptions/me');
                setSubscription(subRes.data);
                await refreshProfile();
              }
            } catch (err: any) {
              Alert.alert('Lỗi', err.response?.data?.message || 'Không thể hủy gói dịch vụ');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Khởi tạo dữ liệu gói cước...</Text>
      </View>
    );
  }

  const currentSub = subscription || {
    planName: 'Gói Cơ bản (Miễn phí)',
    status: 'active',
    startDate: user?.createdAt || new Date().toISOString(),
    expiryDate: null,
    features: ['Đăng tin thường', 'Hiển thị bảng lọc cơ bản', 'Hỗ trợ cộng đồng'],
  };

  const daysRemaining = currentSub.expiryDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(currentSub.expiryDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const progressPercent = currentSub.expiryDate ? (daysRemaining / 30) * 100 : 0;
  const isPaidPlan =
    currentSub.planName &&
    !currentSub.planName.toLowerCase().includes('free') &&
    !currentSub.planName.toLowerCase().includes('miễn phí');

  const usageStats = subscription?.usageStats || [
    { label: 'Tin đã đăng', value: '0/1', icon: 'zap', color: '#3b82f6', trend: '+100%' },
    { label: 'Lượt xem', value: '0', icon: 'trendingup', color: '#10b981', trend: '0' },
    { label: 'Xác thực', value: '0', icon: 'shieldcheck', color: '#f59e0b', trend: 'Dự kiến 1' },
  ];

  const comparisonFeatures = [
    { name: 'Số lượng tin đăng', standard: '20 tin', pro: '50 tin' },
    { name: 'Hiển thị ưu tiên', standard: 'Cơ bản', pro: 'Ưu tiên Top 1' },
    { name: 'Tích xanh xác thực', standard: '3-5 ngày', pro: 'Hỗ trợ 24h' },
    { name: 'Thống kê nâng cao', standard: false, pro: true },
    { name: 'Hỗ trợ 24/7', standard: false, pro: true },
    { name: 'Quản lý tập trung', standard: true, pro: true },
  ];

  const renderIcon = (iconName: string, color: string) => {
    switch (iconName.toLowerCase()) {
      case 'star':
        return <Star size={24} color={color} />;
      case 'trendingup':
        return <TrendingUp size={24} color={color} />;
      case 'shieldcheck':
        return <ShieldCheck size={24} color={color} />;
      case 'zap':
        return <Zap size={24} color={color} />;
      default:
        return <Star size={24} color={color} />;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Hero Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.crownIcon}>
            <Crown size={32} color="white" />
          </View>
          <View style={styles.heroTitleContainer}>
            <Text style={styles.planName}>{currentSub.planName}</Text>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBadgeText}>Đang hoạt động</Text>
            </View>
          </View>
        </View>

        <Text style={styles.dateText}>
          Kích hoạt: {new Date(currentSub.startDate).toLocaleDateString('vi-VN')}
          {currentSub.expiryDate &&
            ` • Hết hạn: ${new Date(currentSub.expiryDate).toLocaleDateString('vi-VN')}`}
        </Text>

        {currentSub.expiryDate ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.daysRemainingText}>
                {daysRemaining} <Text style={styles.daysRemainingLabel}>Ngày còn lại</Text>
              </Text>
              <Text style={styles.percentText}>{progressPercent.toFixed(0)}% Còn lại</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
            </View>
          </View>
        ) : (
          <View style={styles.freeHint}>
            <Zap size={16} color="#eab308" />
            <Text style={styles.freeHintText}>
              Bạn đang sử dụng gói mặc định. Nâng cấp để nhận nhiều ưu tiên hiển thị hơn!
            </Text>
          </View>
        )}

        <View style={styles.heroActions}>
          <TouchableOpacity style={[styles.btn, styles.renewBtn]} onPress={handleRenew}>
            <Text style={styles.renewBtnText}>Gia hạn ngay</Text>
            <ArrowRight size={16} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.upgradeBtn]} onPress={handleUpgrade}>
            <Zap size={16} color="#eab308" style={{ marginRight: 8 }} />
            <Text style={styles.upgradeBtnText}>Nâng cấp lên Pro</Text>
          </TouchableOpacity>
          {isPaidPlan && (
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={handleCancelSubscription}>
              <X size={16} color="#e11d48" style={{ marginRight: 8 }} />
              <Text style={styles.cancelBtnText}>Hủy gói cước</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. Unlocked Features */}
      <Text style={styles.sectionTitle}>
        <Check size={20} color="#059669" /> Tính năng sở hữu
      </Text>
      <View style={styles.featuresList}>
        {currentSub.features.map((feature: string, idx: number) => (
          <View key={idx} style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Check size={14} color="#059669" />
            </View>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* 3. Usage Stats */}
      <View style={styles.statsGrid}>
        {usageStats.map((stat: any, idx: number) => (
          <View key={idx} style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: `${stat.color}15` }]}>
              {renderIcon(stat.icon, stat.color)}
            </View>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <View style={styles.statTrend}>
              <TrendingUp size={10} color="#059669" />
              <Text style={styles.statTrendText}>{stat.trend}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 4. Comparison Section */}
      <View style={styles.comparisonHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>So sánh gói cước</Text>
          <Text style={styles.sectionSubtitle}>Tìm giải pháp tối ưu nhất cho bạn</Text>
        </View>
        <TouchableOpacity
          style={styles.comparisonToggleBtn}
          onPress={() => setShowComparison(!showComparison)}
        >
          <Text style={styles.comparisonToggleText}>
            {showComparison ? 'Thu gọn' : 'Xem chi tiết'}
          </Text>
          {showComparison ? (
            <ChevronDown size={16} color="#4f46e5" />
          ) : (
            <ChevronRight size={16} color="#4f46e5" />
          )}
        </TouchableOpacity>
      </View>

      {showComparison && (
        <View style={styles.comparisonTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellTitle, { flex: 2 }]}>Tính năng</Text>
            <Text style={[styles.tableCellTitle, { flex: 1, textAlign: 'center' }]}>Standard</Text>
            <Text style={[styles.tableCellTitle, styles.tableCellPro, { flex: 1, textAlign: 'center' }]}>PRO</Text>
          </View>
          {comparisonFeatures.map((feature, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>{feature.name}</Text>
              
              <View style={[styles.tableCellContainer, { flex: 1 }]}>
                {typeof feature.standard === 'boolean' ? (
                  feature.standard ? (
                    <Check size={16} color="#22c55e" />
                  ) : (
                    <X size={16} color="#d1d5db" />
                  )
                ) : (
                  <Text style={styles.tableCell}>{feature.standard}</Text>
                )}
              </View>
              
              <View style={[styles.tableCellContainer, { flex: 1 }]}>
                {typeof feature.pro === 'boolean' ? (
                  feature.pro ? (
                    <Check size={16} color="#4f46e5" />
                  ) : (
                    <X size={16} color="#d1d5db" />
                  )
                ) : (
                  <Text style={[styles.tableCell, { color: '#4f46e5', fontWeight: 'bold' }]}>
                    {feature.pro}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 5. Transactions History */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
        <CreditCard size={20} color="#4f46e5" /> Lịch sử giao dịch
      </Text>
      <View style={styles.transactionsContainer}>
        {transactions.length === 0 ? (
          <View style={styles.emptyTransactions}>
            <CreditCard size={32} color="#d1d5db" />
            <Text style={styles.emptyText}>Chưa ghi nhận giao dịch nào</Text>
          </View>
        ) : (
          transactions.map((t) => (
            <View key={t._id || t.id} style={styles.transactionRow}>
              <View style={styles.transLeft}>
                <Text style={styles.transDesc}>{t.description}</Text>
                <Text style={styles.transDate}>
                  {new Date(t.createdAt).toLocaleDateString('vi-VN')} • {t.paymentMethod}
                </Text>
              </View>
              <View style={styles.transRight}>
                <Text style={styles.transAmount}>{(t.amount || 0).toLocaleString('vi-VN')}đ</Text>
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => Alert.alert('Tải hóa đơn', `Đang tải hóa đơn ${t.invoiceId}...`)}
                >
                  <Download size={16} color="#4f46e5" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  heroCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  crownIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  heroTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
    marginRight: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  daysRemainingText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  daysRemainingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  percentText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563eb',
    textTransform: 'uppercase',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  freeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  freeHintText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b45309',
    marginLeft: 8,
    flex: 1,
  },
  heroActions: {
    gap: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  renewBtn: {
    backgroundColor: '#4f46e5',
  },
  renewBtnText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
  },
  upgradeBtn: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e0e7ff',
  },
  upgradeBtnText: {
    color: '#4f46e5',
    fontWeight: '900',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#fff1f2',
    borderWidth: 2,
    borderColor: '#ffe4e6',
  },
  cancelBtnText: {
    color: '#e11d48',
    fontWeight: '900',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  featureIcon: {
    backgroundColor: '#ecfdf5',
    padding: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  featureText: {
    fontWeight: 'bold',
    color: '#334155',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statTrendText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    marginLeft: 4,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  comparisonToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  comparisonToggleText: {
    color: '#4f46e5',
    fontWeight: '900',
    fontSize: 12,
    marginRight: 4,
  },
  comparisonTable: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 8,
  },
  tableCellTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  tableCellPro: {
    color: '#4f46e5',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 12,
    color: '#334155',
  },
  tableCellContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionsContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 12,
    color: '#94a3b8',
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  transLeft: {
    flex: 1,
    marginRight: 12,
  },
  transDesc: {
    fontWeight: '900',
    color: '#1e293b',
    fontSize: 14,
    marginBottom: 4,
  },
  transDate: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  transRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transAmount: {
    fontWeight: '900',
    color: '#4f46e5',
    fontSize: 14,
    marginRight: 12,
  },
  downloadBtn: {
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 8,
  },
});
