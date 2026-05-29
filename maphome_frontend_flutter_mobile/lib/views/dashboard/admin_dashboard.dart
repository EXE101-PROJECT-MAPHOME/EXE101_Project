import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/verification_provider.dart';
import '../../providers/properties_provider.dart';
import '../../models/verification_model.dart';

class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<VerificationProvider>(context, listen: false).fetchRequests();
    });
  }

  void _showActionDialog(VerificationRequest req, bool isDark) {
    final noteController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: isDark ? AppColors.darkCard : Colors.white,
          title: Text('Xử lý yêu cầu xác minh', style: TextStyle(color: isDark ? AppColors.darkForeground : AppColors.primary)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Phòng trọ: ${req.propertyName}'),
              Text('Chủ trọ: ${req.landlordName}'),
              const SizedBox(height: 8),
              if (req.userProvidedPhotos.isNotEmpty) ...[
                const Text('Ảnh chủ trọ nộp đối chứng:', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: Image.network(req.userProvidedPhotos.first, height: 100, fit: BoxFit.cover),
                ),
                const SizedBox(height: 12),
              ],
              TextField(
                controller: noteController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Ghi chú thanh tra (Inspector Notes)',
                ),
              ),
            ],
          ),
          actionsAlignment: MainAxisAlignment.spaceBetween,
          actions: [
            // Reject Button
            TextButton(
              onPressed: () async {
                final vp = Provider.of<VerificationProvider>(context, listen: false);
                await vp.updateRequestStatus(req.id, 'rejected');
                if (context.mounted) {
                  Navigator.pop(context);
                  _refresh();
                }
              },
              child: const Text('Từ chối', style: TextStyle(color: AppColors.error)),
            ),
            
            // Request photos
            if (req.status == 'pending')
              TextButton(
                onPressed: () async {
                  final vp = Provider.of<VerificationProvider>(context, listen: false);
                  await vp.updateRequestStatus(req.id, 'awaiting_photos');
                  if (context.mounted) {
                    Navigator.pop(context);
                    _refresh();
                  }
                },
                child: const Text('Yêu cầu ảnh', style: TextStyle(color: AppColors.info)),
              ),
            
            // Approve / Complete
            ElevatedButton(
              onPressed: () async {
                final vp = Provider.of<VerificationProvider>(context, listen: false);
                final pp = Provider.of<PropertiesProvider>(context, listen: false);
                
                final success = await vp.completeInspection(
                  req.id,
                  'verified',
                  notes: noteController.text.trim(),
                );
                
                if (success) {
                  // Refresh properties to reflect green badge instantly
                  await pp.fetchProperties();
                }

                if (context.mounted) {
                  Navigator.pop(context);
                  _refresh();
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
              child: const Text('Phê duyệt cấp badge'),
            ),
          ],
        );
      },
    );
  }

  void _refresh() {
    Provider.of<VerificationProvider>(context, listen: false).fetchRequests();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final verificationProvider = Provider.of<VerificationProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final requests = verificationProvider.requests;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text('Dashboard Admin', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
        foregroundColor: isDark ? AppColors.darkForeground : AppColors.primary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refresh,
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.error),
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: verificationProvider.loading
          ? const Center(child: CircularProgressIndicator())
          : requests.isEmpty
              ? const Center(
                  child: Text('Không có yêu cầu xác minh nào.', style: TextStyle(color: AppColors.mutedForeground)),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: requests.length,
                  itemBuilder: (context, index) {
                    final r = requests[index];
                    Color statusColor = AppColors.warning;
                    String statusText = 'Đang xử lý';

                    switch (r.status) {
                      case 'approved':
                      case 'completed':
                        statusColor = AppColors.success;
                        statusText = 'Đã phê duyệt';
                        break;
                      case 'rejected':
                        statusColor = AppColors.error;
                        statusText = 'Từ chối';
                        break;
                      case 'awaiting_photos':
                        statusColor = AppColors.info;
                        statusText = 'Chờ nộp ảnh';
                        break;
                      case 'photos_submitted':
                        statusColor = Colors.purple;
                        statusText = 'Đã nộp ảnh';
                        break;
                    }

                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      color: isDark ? AppColors.darkCard : AppColors.card,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                        side: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.border),
                      ),
                      child: ListTile(
                        title: Text(r.propertyName, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text('Chủ trọ: ${r.landlordName} (${r.phone})', style: const TextStyle(fontSize: 12)),
                            const SizedBox(height: 2),
                            Text('Hẹn: ${r.scheduledDate} lúc ${r.scheduledTime}', style: const TextStyle(fontSize: 12)),
                          ],
                        ),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: statusColor, borderRadius: BorderRadius.circular(4)),
                          child: Text(
                            statusText,
                            style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                          ),
                        ),
                        onTap: r.status == 'completed' || r.status == 'rejected'
                            ? null
                            : () => _showActionDialog(r, isDark),
                      ),
                    );
                  },
                ),
    );
  }
}
