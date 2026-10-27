import mongoose from 'mongoose';

const globalTaskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const GlobalTask = mongoose.model('GlobalTask', globalTaskSchema);
