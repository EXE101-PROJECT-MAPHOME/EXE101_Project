class Amenities {
  final bool wifi;
  final bool furniture;
  final bool tv;
  final bool washingMachine;
  final bool kitchen;
  final bool refrigerator;
  final bool airConditioner;
  final bool parking;
  final bool water;

  Amenities({
    this.wifi = false,
    this.furniture = false,
    this.tv = false,
    this.washingMachine = false,
    this.kitchen = false,
    this.refrigerator = false,
    this.airConditioner = false,
    this.parking = false,
    this.water = false,
  });

  factory Amenities.fromJson(Map<String, dynamic> json) {
    return Amenities(
      wifi: json['wifi'] ?? false,
      furniture: json['furniture'] ?? false,
      tv: json['tv'] ?? false,
      washingMachine: json['washingMachine'] ?? false,
      kitchen: json['kitchen'] ?? false,
      refrigerator: json['refrigerator'] ?? false,
      airConditioner: json['airConditioner'] ?? json['ac'] ?? false,
      parking: json['parking'] ?? false,
      water: json['water'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'wifi': wifi,
      'furniture': furniture,
      'tv': tv,
      'washingMachine': washingMachine,
      'kitchen': kitchen,
      'refrigerator': refrigerator,
      'airConditioner': airConditioner,
      'parking': parking,
      'water': water,
    };
  }
}

class GreenBadge {
  final String level; // 'none' | 'verified'
  final String? awardedAt;
  final String? awardedBy;
  final String? inspectionNotes;

  GreenBadge({
    required this.level,
    this.awardedAt,
    this.awardedBy,
    this.inspectionNotes,
  });

  factory GreenBadge.fromJson(Map<String, dynamic> json) {
    return GreenBadge(
      level: json['level'] ?? 'none',
      awardedAt: json['awardedAt'],
      awardedBy: json['awardedBy'],
      inspectionNotes: json['inspectionNotes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'level': level,
      'awardedAt': awardedAt,
      'awardedBy': awardedBy,
      'inspectionNotes': inspectionNotes,
    };
  }
}

class NearbyLandmark {
  final String name;
  final double distanceKm;
  final String distanceText;

  NearbyLandmark({
    required this.name,
    required this.distanceKm,
    required this.distanceText,
  });

  factory NearbyLandmark.fromJson(Map<String, dynamic> json) {
    return NearbyLandmark(
      name: json['name'] ?? '',
      distanceKm: (json['distanceKm'] ?? 0).toDouble(),
      distanceText: json['distanceText'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'distanceKm': distanceKm,
      'distanceText': distanceText,
    };
  }
}

class RentalProperty {
  final String id;
  final String name;
  final String address;
  final int price;
  final double lat;
  final double lng;
  final Amenities amenities;
  final String image;
  final List<String> images;
  final int area;
  final bool available;
  final String phone;
  final String ownerName;
  final String verificationLevel; // 'none' | 'verified'
  final String? verifiedAt;
  final String? locationAccuracy;
  final String? landlordId;
  final GreenBadge? greenBadge;
  final int views;
  final int favorites;
  final String description;
  final double? rating;
  final int? ratingCount;
  final List<NearbyLandmark> nearbyLandmarks;
  final double? distance; // Client computed or backend sorted distance in km

  RentalProperty({
    required this.id,
    required this.name,
    required this.address,
    required this.price,
    required this.lat,
    required this.lng,
    required this.amenities,
    required this.image,
    required this.images,
    required this.area,
    this.available = true,
    required this.phone,
    required this.ownerName,
    required this.verificationLevel,
    this.verifiedAt,
    this.locationAccuracy,
    this.landlordId,
    this.greenBadge,
    this.views = 0,
    this.favorites = 0,
    this.description = '',
    this.rating,
    this.ratingCount,
    this.nearbyLandmarks = const [],
    this.distance,
  });

  factory RentalProperty.fromJson(Map<String, dynamic> json) {
    // Parse location [lat, lng] or [lng, lat]
    double latitude = 21.0285; // Default Hanoi
    double longitude = 105.8542;
    if (json['location'] != null) {
      if (json['location'] is List && (json['location'] as List).length >= 2) {
        // Backend stores location as [longitude, latitude] or [latitude, longitude].
        // React client does: location: [number, number]. Let's support both.
        latitude = (json['location'][0] ?? 0.0).toDouble();
        longitude = (json['location'][1] ?? 0.0).toDouble();
        // If coordinate values look swapped (Hanoi latitude is around 21, longitude is 105)
        if (latitude > 90 || latitude < -90) {
          double temp = latitude;
          latitude = longitude;
          longitude = temp;
        }
      } else if (json['location'] is Map) {
        latitude = (json['location']['lat'] ?? 0.0).toDouble();
        longitude = (json['location']['lng'] ?? json['location']['lon'] ?? 0.0).toDouble();
      }
    }

    // Parse image list
    List<String> imagesList = [];
    if (json['images'] != null) {
      imagesList = List<String>.from(json['images']);
    } else if (json['image'] != null) {
      imagesList = [json['image']];
    }

    // Parse landmarks
    List<NearbyLandmark> landmarksList = [];
    if (json['nearbyLandmarks'] != null) {
      landmarksList = (json['nearbyLandmarks'] as List)
          .map((i) => NearbyLandmark.fromJson(i))
          .toList();
    }

    return RentalProperty(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      price: json['price'] != null ? (json['price'] as num).toInt() : 0,
      lat: latitude,
      lng: longitude,
      amenities: json['amenities'] != null
          ? Amenities.fromJson(json['amenities'])
          : Amenities(),
      image: json['image'] ?? 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500',
      images: imagesList,
      area: json['area'] != null ? (json['area'] as num).toInt() : 0,
      available: json['available'] ?? true,
      phone: json['phone'] ?? '',
      ownerName: json['ownerName'] ?? '',
      verificationLevel: json['verificationLevel'] ?? 'none',
      verifiedAt: json['verifiedAt'],
      locationAccuracy: json['locationAccuracy']?.toString(),
      landlordId: json['landlordId'] is Map
          ? (json['landlordId']['id'] ?? json['landlordId']['_id'])
          : json['landlordId']?.toString(),
      greenBadge: json['greenBadge'] != null
          ? GreenBadge.fromJson(json['greenBadge'])
          : null,
      views: json['views'] ?? 0,
      favorites: json['favorites'] ?? 0,
      description: json['description'] ?? '',
      rating: json['rating'] != null ? (json['rating'] as num).toDouble() : null,
      ratingCount: json['ratingCount'],
      nearbyLandmarks: landmarksList,
      distance: json['distance'] != null ? (json['distance'] as num).toDouble() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'price': price,
      'location': [lat, lng],
      'amenities': amenities.toJson(),
      'image': image,
      'images': images,
      'area': area,
      'available': available,
      'phone': phone,
      'ownerName': ownerName,
      'verificationLevel': verificationLevel,
      'verifiedAt': verifiedAt,
      'locationAccuracy': locationAccuracy,
      'landlordId': landlordId,
      'greenBadge': greenBadge?.toJson(),
      'views': views,
      'favorites': favorites,
      'description': description,
      'rating': rating,
      'ratingCount': ratingCount,
      'nearbyLandmarks': nearbyLandmarks.map((i) => i.toJson()).toList(),
    };
  }
}
