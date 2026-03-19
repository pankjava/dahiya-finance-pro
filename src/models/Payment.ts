import mongoose from "mongoose";

export type PaymentMethod = "cash" | "upi";

export interface IPayment {
  _id: string;
  loanId: mongoose.Types.ObjectId;
  scheduleIds: mongoose.Types.ObjectId[];
  amount: number;
  paidAt: Date;
  method: PaymentMethod;
  bankAccountId?: mongoose.Types.ObjectId;
  bankName?: string;
  transactionTime?: Date;
  referenceNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new mongoose.Schema<IPayment>(
  {
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan", required: true },
    scheduleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "PaymentSchedule" }],
    amount: { type: Number, required: true },
    paidAt: { type: Date, required: true },
    method: { type: String, enum: ["cash", "upi"], required: true },
    bankAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "BankAccount" },
    bankName: String,
    transactionTime: Date,
    referenceNote: String,
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model<IPayment>("Payment", paymentSchema);
