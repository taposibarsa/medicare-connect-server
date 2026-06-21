const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewText: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'reviews',
  }
);

reviewSchema.index({ doctorId: 1 });
reviewSchema.index({ patientId: 1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
