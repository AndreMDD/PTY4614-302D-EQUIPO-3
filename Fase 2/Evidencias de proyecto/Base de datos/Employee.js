import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      default: 'Operaciones',
      trim: true,
    },
    position: {
      type: String,
      required: true,
      default: 'Especialista',
      trim: true,
    },
    pin: {
      type: String,
      default: '1234',
    },
    role: {
      type: String,
      enum: ['EMPLOYEE', 'ADMIN'],
      default: 'EMPLOYEE',
    },
    avatar: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export const Employee = mongoose.model('Employee', employeeSchema);
