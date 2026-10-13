import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMilestone {
  views: number;
  payout: number;
}

export interface ICampaign extends Document {
  name: string;
  platform: 'instagram' | 'youtube';
  totalBudget: number;
  budgetSpent: number;
  milestones: IMilestone[];
  status: 'live' | 'completed';
  brand: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  remainingBudget: number; // virtual
}

const milestoneSchema = new Schema<IMilestone>(
  {
    views: {
      type: Number,
      required: [true, 'View threshold is required'],
      min: [1, 'View threshold must be at least 1'],
    },
    payout: {
      type: Number,
      required: [true, 'Payout amount is required'],
      min: [1, 'Payout must be at least 1'],
    },
  },
  { _id: false }
);

const campaignSchema = new Schema<ICampaign>(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      minlength: [3, 'Campaign name must be at least 3 characters'],
      maxlength: [100, 'Campaign name must be at most 100 characters'],
    },
    platform: {
      type: String,
      enum: {
        values: ['instagram', 'youtube'],
        message: 'Platform must be either instagram or youtube',
      },
      required: [true, 'Platform is required'],
    },
    totalBudget: {
      type: Number,
      required: [true, 'Total budget is required'],
      min: [1, 'Budget must be at least 1'],
    },
    budgetSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    milestones: {
      type: [milestoneSchema],
      required: [true, 'At least one milestone is required'],
      validate: {
        validator: function (milestones: IMilestone[]) {
          return milestones.length >= 1;
        },
        message: 'At least one milestone is required',
      },
    },
    status: {
      type: String,
      enum: ['live', 'completed'],
      default: 'live',
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Brand reference is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for remaining budget
campaignSchema.virtual('remainingBudget').get(function () {
  return this.totalBudget - this.budgetSpent;
});

// Pre-save: sort milestones ascending by views
campaignSchema.pre('save', function () {
  if (this.isModified('milestones')) {
    this.milestones.sort((a, b) => a.views - b.views);
  }
});

// Indexes
campaignSchema.index({ status: 1 });
campaignSchema.index({ brand: 1, status: 1 });

export const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);
