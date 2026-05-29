import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/properties_provider.dart';

class PostRoomScreen extends StatefulWidget {
  const PostRoomScreen({super.key});

  @override
  State<PostRoomScreen> createState() => _PostRoomScreenState();
}

class _PostRoomScreenState extends State<PostRoomScreen> {
  final _formKey = GlobalKey<FormState>();
  
  final _nameController = TextEditingController();
  final _addressController = TextEditingController();
  final _priceController = TextEditingController();
  final _areaController = TextEditingController();
  final _phoneController = TextEditingController();
  final _ownerNameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _imageUrlController = TextEditingController();
  
  // Coordinates
  final _latController = TextEditingController(text: '21.0285');
  final _lngController = TextEditingController(text: '105.8542');

  // Amenities
  bool _wifi = false;
  bool _furniture = false;
  bool _tv = false;
  bool _washingMachine = false;
  bool _kitchen = false;
  bool _refrigerator = false;
  bool _airConditioner = false;

  bool _loading = false;

  @override
  void initState() {
    super.initState();
    // Pre-fill landlord name and phone from auth provider
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (auth.isAuthenticated) {
        _ownerNameController.text = auth.user?.fullName ?? '';
        _phoneController.text = auth.user?.phone ?? '';
      }
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _addressController.dispose();
    _priceController.dispose();
    _areaController.dispose();
    _phoneController.dispose();
    _ownerNameController.dispose();
    _descriptionController.dispose();
    _imageUrlController.dispose();
    _latController.dispose();
    _lngController.dispose();
    super.dispose();
  }

  Future<void> _submitListing() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    
    final propertiesProvider = Provider.of<PropertiesProvider>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);

    // Build request payload
    final propertyData = {
      'name': _nameController.text.trim(),
      'address': _addressController.text.trim(),
      'price': int.parse(_priceController.text.trim()),
      'area': int.parse(_areaController.text.trim()),
      'location': [
        double.parse(_latController.text.trim()),
        double.parse(_lngController.text.trim())
      ],
      'amenities': {
        'wifi': _wifi,
        'furniture': _furniture,
        'tv': _tv,
        'washingMachine': _washingMachine,
        'kitchen': _kitchen,
        'refrigerator': _refrigerator,
        'airConditioner': _airConditioner,
      },
      'image': _imageUrlController.text.trim().isEmpty 
          ? 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
          : _imageUrlController.text.trim(),
      'phone': _phoneController.text.trim(),
      'ownerName': _ownerNameController.text.trim(),
      'description': _descriptionController.text.trim(),
      'landlordId': auth.user?.id,
    };

    final success = await propertiesProvider.addProperty(propertyData);
    setState(() => _loading = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đăng tin thành công! Tin đăng đang chờ phê duyệt.'),
            backgroundColor: AppColors.success,
          ),
        );
        // Clear fields
        _nameController.clear();
        _addressController.clear();
        _priceController.clear();
        _areaController.clear();
        _descriptionController.clear();
        _imageUrlController.clear();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đăng tin thất bại. Vui lòng kiểm tra lại thông tin.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text('Đăng phòng cho thuê', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
        foregroundColor: isDark ? AppColors.darkForeground : AppColors.primary,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildFormSection(
                  title: 'Thông tin cơ bản',
                  isDark: isDark,
                  children: [
                    _buildTextField(
                      controller: _nameController,
                      label: 'Tiêu đề tin đăng',
                      hint: 'Ví dụ: Phòng trọ khép kín giá rẻ Cầu Giấy',
                      validator: (val) => val == null || val.trim().isEmpty ? 'Vui lòng nhập tiêu đề' : null,
                      isDark: isDark,
                    ),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: _addressController,
                      label: 'Địa chỉ chính xác',
                      hint: 'Số nhà, ngõ hẻm, tên đường, quận/huyện',
                      validator: (val) => val == null || val.trim().isEmpty ? 'Vui lòng nhập địa chỉ' : null,
                      isDark: isDark,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _priceController,
                            label: 'Giá cho thuê (VND/tháng)',
                            hint: 'Ví dụ: 3500000',
                            keyboardType: TextInputType.number,
                            validator: (val) => val == null || val.trim().isEmpty ? 'Vui lòng nhập giá' : null,
                            isDark: isDark,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildTextField(
                            controller: _areaController,
                            label: 'Diện tích (m²)',
                            hint: 'Ví dụ: 25',
                            keyboardType: TextInputType.number,
                            validator: (val) => val == null || val.trim().isEmpty ? 'Vui lòng nhập diện tích' : null,
                            isDark: isDark,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                _buildFormSection(
                  title: 'Tọa độ vị trí (Bản đồ)',
                  isDark: isDark,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _latController,
                            label: 'Vĩ độ (Latitude)',
                            hint: 'Ví dụ: 21.0285',
                            keyboardType: TextInputType.number,
                            isDark: isDark,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildTextField(
                            controller: _lngController,
                            label: 'Kinh độ (Longitude)',
                            hint: 'Ví dụ: 105.8542',
                            keyboardType: TextInputType.number,
                            isDark: isDark,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                _buildFormSection(
                  title: 'Hình ảnh & Mô tả',
                  isDark: isDark,
                  children: [
                    _buildTextField(
                      controller: _imageUrlController,
                      label: 'Đường dẫn ảnh (URL)',
                      hint: 'Nhập liên kết hình ảnh phòng trọ (Unsplash...)',
                      isDark: isDark,
                    ),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: _descriptionController,
                      label: 'Mô tả chi tiết',
                      hint: 'Mô tả giờ giấc, chi phí điện nước, tiện ích xung quanh...',
                      maxLines: 4,
                      isDark: isDark,
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                _buildFormSection(
                  title: 'Tiện ích có sẵn',
                  isDark: isDark,
                  children: [
                    _buildCheckbox('Wifi / Mạng internet', _wifi, (val) => setState(() => _wifi = val)),
                    _buildCheckbox('Đầy đủ nội thất', _furniture, (val) => setState(() => _furniture = val)),
                    _buildCheckbox('Tivi', _tv, (val) => setState(() => _tv = val)),
                    _buildCheckbox('Máy giặt', _washingMachine, (val) => setState(() => _washingMachine = val)),
                    _buildCheckbox('Nhà bếp riêng', _kitchen, (val) => setState(() => _kitchen = val)),
                    _buildCheckbox('Tủ lạnh', _refrigerator, (val) => setState(() => _refrigerator = val)),
                    _buildCheckbox('Máy điều hòa', _airConditioner, (val) => setState(() => _airConditioner = val)),
                  ],
                ),
                const SizedBox(height: 16),

                _buildFormSection(
                  title: 'Thông tin liên hệ',
                  isDark: isDark,
                  children: [
                    _buildTextField(
                      controller: _ownerNameController,
                      label: 'Tên người liên hệ',
                      hint: 'Họ tên chủ trọ',
                      validator: (val) => val == null || val.trim().isEmpty ? 'Nhập tên liên hệ' : null,
                      isDark: isDark,
                    ),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: _phoneController,
                      label: 'Số điện thoại liên hệ',
                      hint: 'Số điện thoại',
                      validator: (val) => val == null || val.trim().isEmpty ? 'Nhập số điện thoại' : null,
                      isDark: isDark,
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: _loading ? null : _submitListing,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isDark ? AppColors.darkForeground : AppColors.primary,
                    foregroundColor: isDark ? AppColors.primary : Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Đăng tin ngay',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFormSection({
    required String title,
    required bool isDark,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: isDark ? AppColors.darkForeground : AppColors.primary,
            ),
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    String? Function(String?)? validator,
    required bool isDark,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.mutedForeground),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: AppColors.mutedForeground, fontSize: 13),
            filled: true,
            fillColor: isDark ? AppColors.darkSecondary : AppColors.inputBackground,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
          validator: validator,
        ),
      ],
    );
  }

  Widget _buildCheckbox(String label, bool value, Function(bool) onChanged) {
    return CheckboxListTile(
      title: Text(label, style: const TextStyle(fontSize: 13)),
      value: value,
      activeColor: AppColors.primary,
      contentPadding: EdgeInsets.zero,
      onChanged: (val) => onChanged(val ?? false),
    );
  }
}
