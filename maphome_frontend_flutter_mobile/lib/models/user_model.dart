class UserModel {
  final String id;
  final String username;
  final String email;
  final String role; // 'admin', 'landlord', 'user'
  final String? phone;
  final String? fullName;
  final String? avatar;
  final int? verificationLevel;
  final String? verificationLevelLabel;
  final String? subscriptionTier;
  final String? createdAt;

  UserModel({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
    this.phone,
    this.fullName,
    this.avatar,
    this.verificationLevel,
    this.verificationLevelLabel,
    this.subscriptionTier,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? json['_id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'user',
      phone: json['phone'],
      fullName: json['fullName'],
      avatar: json['avatar'],
      verificationLevel: json['verificationLevel'],
      verificationLevelLabel: json['verificationLevelLabel'],
      subscriptionTier: json['subscriptionTier'],
      createdAt: json['createdAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'role': role,
      'phone': phone,
      'fullName': fullName,
      'avatar': avatar,
      'verificationLevel': verificationLevel,
      'verificationLevelLabel': verificationLevelLabel,
      'subscriptionTier': subscriptionTier,
      'createdAt': createdAt,
    };
  }
}
