const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },

  // Onboarding preferences — collected on first registration only
  genres: { type: [String], default: [] },
  yearlyGoal: { type: Number, default: 12 },
  motivation: {
    type: String,
    enum: ['escape', 'learn', 'understand', 'grow', ''],
    default: '',
  },
  onboardingComplete: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Strip password before any JSON serialization
userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    genres: this.genres,
    yearlyGoal: this.yearlyGoal,
    motivation: this.motivation,
    onboardingComplete: this.onboardingComplete,
  };
};

module.exports = mongoose.model('User', userSchema);
