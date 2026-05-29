class VerificationRequest {
  final String id;
  final String propertyId;
  final String propertyName;
  final String landlordId;
  final String landlordName;
  final String phone;
  final String address;
  final String scheduledDate;
  final String scheduledTime;
  final String? notes;
  final String status; // 'pending' | 'approved' | 'awaiting_photos' | 'photos_submitted' | 'completed' | 'rejected'
  final String requestedAt;
  final String? completedAt;
  final String? badgeAwarded; // 'none' | 'verified'
  final String? inspectorNotes;
  final String requesterType; // 'landlord' | 'user'
  final String requesterId;
  final String requesterName;
  final String? requesterPhone;
  final List<String> userProvidedPhotos;
  final String? notifiedAt;
  final String? photosSubmittedAt;

  VerificationRequest({
    required this.id,
    required this.propertyId,
    required this.propertyName,
    required this.landlordId,
    required this.landlordName,
    required this.phone,
    required this.address,
    required this.scheduledDate,
    required this.scheduledTime,
    this.notes,
    required this.status,
    required this.requestedAt,
    this.completedAt,
    this.badgeAwarded,
    this.inspectorNotes,
    required this.requesterType,
    required this.requesterId,
    required this.requesterName,
    this.requesterPhone,
    this.userProvidedPhotos = const [],
    this.notifiedAt,
    this.photosSubmittedAt,
  });

  factory VerificationRequest.fromJson(Map<String, dynamic> json) {
    List<String> photosList = [];
    if (json['userProvidedPhotos'] != null) {
      photosList = List<String>.from(json['userProvidedPhotos']);
    }

    return VerificationRequest(
      id: json['id'] ?? json['_id'] ?? '',
      propertyId: json['propertyId'] ?? '',
      propertyName: json['propertyName'] ?? '',
      landlordId: json['landlordId'] ?? '',
      landlordName: json['landlordName'] ?? '',
      phone: json['phone'] ?? '',
      address: json['address'] ?? '',
      scheduledDate: json['scheduledDate'] ?? '',
      scheduledTime: json['scheduledTime'] ?? '',
      notes: json['notes'],
      status: json['status'] ?? 'pending',
      requestedAt: json['requestedAt'] ?? '',
      completedAt: json['completedAt'],
      badgeAwarded: json['badgeAwarded'],
      inspectorNotes: json['inspectorNotes'],
      requesterType: json['requesterType'] ?? 'landlord',
      requesterId: json['requesterId'] ?? '',
      requesterName: json['requesterName'] ?? '',
      requesterPhone: json['requesterPhone'],
      userProvidedPhotos: photosList,
      notifiedAt: json['notifiedAt'],
      photosSubmittedAt: json['photosSubmittedAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'propertyId': propertyId,
      'propertyName': propertyName,
      'landlordId': landlordId,
      'landlordName': landlordName,
      'phone': phone,
      'address': address,
      'scheduledDate': scheduledDate,
      'scheduledTime': scheduledTime,
      'notes': notes,
      'status': status,
      'requestedAt': requestedAt,
      'completedAt': completedAt,
      'badgeAwarded': badgeAwarded,
      'inspectorNotes': inspectorNotes,
      'requesterType': requesterType,
      'requesterId': requesterId,
      'requesterName': requesterName,
      'requesterPhone': requesterPhone,
      'userProvidedPhotos': userProvidedPhotos,
      'notifiedAt': notifiedAt,
      'photosSubmittedAt': photosSubmittedAt,
    };
  }
}
