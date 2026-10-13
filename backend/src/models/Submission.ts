import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubmission extends Document {
  postLink: string;
  platform: 'instagram' | 'youtube';
  viewCount: number;
  currentMilestoneIndex: number;
  totalPaid: number;
  campaign: Types.ObjectId;
  creator: Types.ObjectId;
  flagged: boolean;
  lastViewUpdate: Date | null;
  previousViewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    postLink: {
      type: String,
      required: [true, 'Post link is required'],
      trim: true,
    },
    platform: {
      type: String,
      enum: {
        values: ['instagram', 'youtube'],
        message: 'Platform must be either instagram or youtube',
      },
      required: [true, 'Platform is required'],
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentMilestoneIndex: {
      type: Number,
      default: -1, // -1 = no milestone reached yet
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    campaign: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'Campaign reference is required'],
      index: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required'],
      index: true,
    },
    flagged: {
      type: Boolean,
      default: false,
    },
    lastViewUpdate: {
      type: Date,
      default: null,
    },
    previousViewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Compound index: one submission per creator per campaign
submissionSchema.index({ creator: 1, campaign: 1 }, { unique: true });

// Index for common queries
submissionSchema.index({ campaign: 1, creator: 1 });

export const Submission = mongoose.model<ISubmission>(
  'Submission',
  submissionSchema
);
