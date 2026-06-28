const mongoose = require('mongoose');

const VerificationRequestSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  propertyName: { type: String, required: true },
  landlordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Landlord', required: true },
  landlordName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  notes: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'awaiting_photos', 'photos_submitted', 'completed', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  badgeAwarded: { type: String, enum: ['none', 'verified'] },
  inspectorNotes: { type: String },
  inspectionMedia: { type: [String], default: [] },
  inspectionChecklist: {
    isAccurate: { type: Boolean, default: false },
    hasAmenities: { type: Boolean, default: false },
    isSecure: { type: Boolean, default: false },
    isLegal: { type: Boolean, default: false }
  },
  requesterType: { type: String, enum: ['landlord', 'user'], required: true },
  requesterId: { type: String, required: true },
  requesterName: { type: String, required: true },
  requesterPhone: { type: String },
  userProvidedPhotos: { type: [String] },
  notifiedAt: { type: Date },
  photosSubmittedAt: { type: Date },
  amount: { type: Number, default: 0 },
  packageType: { type: String, enum: ['basic', 'premium', 'none'], default: 'none' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' }
}, {
  timestamps: true
});

module.exports = mongoose.model('VerificationRequest', VerificationRequestSchema);
