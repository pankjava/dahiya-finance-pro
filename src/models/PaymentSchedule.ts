import mongoose from "mongoose";

export type ScheduleStatus = "paid" | "upcoming" | "missed";

export interface IPaymentSchedule {
  _id: string;
  loanId: mongoose.Types.ObjectId;
  dueDate: Date;
  amount: number;
  /** Carry-forward from previous missed/partial payment */
  carryForwardAmount?: number;
  status: ScheduleStatus;
  paidAmount?: number;
  paidAt?: Date;
  paymentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentScheduleSchema = new mongoose.Schema<IPaymentSchedule>(
  {
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan", required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    carryForwardAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["paid", "upcoming", "missed"], default: "upcoming" },
    paidAmount: Number,
    paidAt: Date,
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  },
  { timestamps: true }
);

export default mongoose.models.PaymentSchedule || mongoose.model<IPaymentSchedule>("PaymentSchedule", paymentScheduleSchema);
