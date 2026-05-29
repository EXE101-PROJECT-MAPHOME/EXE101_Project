import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../providers/auth_provider.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailFormKey = GlobalKey<FormState>();
  final _otpFormKey = GlobalKey<FormState>();
  
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  int _step = 1; // 1: Email, 2: OTP + New Password
  bool _loading = false;
  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submitEmail() async {
    if (!_emailFormKey.currentState!.validate()) return;
    
    setState(() => _loading = true);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final result = await auth.forgotPassword(_emailController.text.trim());
    setState(() => _loading = false);

    if (mounted) {
      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Mã xác thực đã được gửi đến email.'),
            backgroundColor: AppColors.success,
          ),
        );
        setState(() => _step = 2);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Có lỗi xảy ra'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _submitReset() async {
    if (!_otpFormKey.currentState!.validate()) return;
    
    setState(() => _loading = true);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    
    // Step 2a: verify reset code
    final verifyResult = await auth.verifyResetCode(
      _emailController.text.trim(),
      _otpController.text.trim(),
    );
    
    if (!verifyResult['success']) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(verifyResult['message'] ?? 'Mã xác nhận không chính xác'),
            backgroundColor: AppColors.error,
          ),
        );
      }
      return;
    }
    
    // Step 2b: reset password
    final resetResult = await auth.resetPassword(
      _emailController.text.trim(),
      _otpController.text.trim(),
      _newPasswordController.text,
    );
    setState(() => _loading = false);

    if (mounted) {
      if (resetResult['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.pop(context); // Go back to login screen
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(resetResult['message'] ?? 'Đặt lại mật khẩu thất bại'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  String? _validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) return 'Email không được để trống';
    final regExp = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!regExp.hasMatch(value)) return 'Định dạng email không hợp lệ';
    return null;
  }

  String? _validateOtp(String? value) {
    if (value == null || value.trim().isEmpty) return 'Mã xác nhận không được để trống';
    final regExp = RegExp(r'^\d{6}$');
    if (!regExp.hasMatch(value)) return 'Mã xác nhận phải là 6 chữ số';
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) return 'Mật khẩu mới không được để trống';
    if (value.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
    
    bool hasUppercase = value.contains(RegExp(r'[A-Z]'));
    bool hasLowercase = value.contains(RegExp(r'[a-z]'));
    bool hasDigits = value.contains(RegExp(r'[0-9]'));
    bool hasSpecialCharacters = value.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'));
    
    if (!hasUppercase || !hasLowercase || !hasDigits || !hasSpecialCharacters) {
      return 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: isDark ? AppColors.darkForeground : AppColors.primary),
          onPressed: () {
            if (_step == 2) {
              setState(() => _step = 1);
            } else {
              Navigator.pop(context);
            }
          },
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: _step == 1 ? _buildEmailStep(isDark) : _buildOtpStep(isDark),
          ),
        ),
      ),
    );
  }

  Widget _buildEmailStep(bool isDark) {
    return Form(
      key: _emailFormKey,
      child: Column(
        key: const ValueKey('email_step'),
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 20),
          Text(
            'Quên mật khẩu',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: isDark ? AppColors.darkForeground : AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Nhập email đã đăng ký của bạn. Chúng tôi sẽ gửi một mã xác nhận 6 số để đặt lại mật khẩu.',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.mutedForeground,
            ),
          ),
          const SizedBox(height: 40),
          
          Text(
            'Email của bạn',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: isDark ? AppColors.darkForeground : AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(
              hintText: 'Nhập email của bạn',
              hintStyle: const TextStyle(color: AppColors.mutedForeground, fontSize: 14),
              filled: true,
              fillColor: isDark ? AppColors.darkSecondary : AppColors.inputBackground,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              prefixIcon: const Icon(Icons.mail_outline, color: AppColors.mutedForeground),
            ),
            validator: _validateEmail,
          ),
          const SizedBox(height: 36),

          ElevatedButton(
            onPressed: _loading ? null : _submitEmail,
            style: ElevatedButton.styleFrom(
              backgroundColor: isDark ? AppColors.darkForeground : AppColors.primary,
              foregroundColor: isDark ? AppColors.primary : Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              elevation: 0,
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
                    'Gửi mã xác nhận',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildOtpStep(bool isDark) {
    return Form(
      key: _otpFormKey,
      child: Column(
        key: const ValueKey('otp_step'),
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 20),
          Text(
            'Đặt lại mật khẩu',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: isDark ? AppColors.darkForeground : AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Mã xác thực đã được gửi tới ${_emailController.text}. Vui lòng nhập mã và mật khẩu mới.',
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.mutedForeground,
            ),
          ),
          const SizedBox(height: 30),

          // OTP field
          Text(
            'Mã xác nhận (6 chữ số)',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: isDark ? AppColors.darkForeground : AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _otpController,
            keyboardType: TextInputType.number,
            maxLength: 6,
            decoration: InputDecoration(
              hintText: 'Nhập mã OTP 6 số',
              hintStyle: const TextStyle(color: AppColors.mutedForeground, fontSize: 14),
              filled: true,
              fillColor: isDark ? AppColors.darkSecondary : AppColors.inputBackground,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              prefixIcon: const Icon(Icons.pin_outlined, color: AppColors.mutedForeground),
              counterText: "",
            ),
            validator: _validateOtp,
          ),
          const SizedBox(height: 20),

          // New Password field
          Text(
            'Mật khẩu mới',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: isDark ? AppColors.darkForeground : AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _newPasswordController,
            obscureText: _obscureNewPassword,
            decoration: InputDecoration(
              hintText: 'Nhập mật khẩu mới',
              hintStyle: const TextStyle(color: AppColors.mutedForeground, fontSize: 14),
              filled: true,
              fillColor: isDark ? AppColors.darkSecondary : AppColors.inputBackground,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              prefixIcon: const Icon(Icons.lock_outline, color: AppColors.mutedForeground),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscureNewPassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                  color: AppColors.mutedForeground,
                ),
                onPressed: () {
                  setState(() {
                    _obscureNewPassword = !_obscureNewPassword;
                  });
                },
              ),
            ),
            validator: _validatePassword,
          ),
          const SizedBox(height: 20),

          // Confirm New Password field
          Text(
            'Xác nhận mật khẩu mới',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: isDark ? AppColors.darkForeground : AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _confirmPasswordController,
            obscureText: _obscureConfirmPassword,
            decoration: InputDecoration(
              hintText: 'Nhập lại mật khẩu mới',
              hintStyle: const TextStyle(color: AppColors.mutedForeground, fontSize: 14),
              filled: true,
              fillColor: isDark ? AppColors.darkSecondary : AppColors.inputBackground,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              prefixIcon: const Icon(Icons.lock_outline, color: AppColors.mutedForeground),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscureConfirmPassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                  color: AppColors.mutedForeground,
                ),
                onPressed: () {
                  setState(() {
                    _obscureConfirmPassword = !_obscureConfirmPassword;
                  });
                },
              ),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) return 'Vui lòng xác nhận mật khẩu mới';
              if (value != _newPasswordController.text) return 'Mật khẩu xác nhận không khớp';
              return null;
            },
          ),
          const SizedBox(height: 36),

          ElevatedButton(
            onPressed: _loading ? null : _submitReset,
            style: ElevatedButton.styleFrom(
              backgroundColor: isDark ? AppColors.darkForeground : AppColors.primary,
              foregroundColor: isDark ? AppColors.primary : Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              elevation: 0,
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
                    'Hoàn thành',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
          ),
        ],
      ),
    );
  }
}
