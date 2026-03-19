import mongoose from "mongoose";

export interface IBankAccount {
  _id: string;
  bankName: string;
  upiId: string;
  qrCodeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bankAccountSchema = new mongoose.Schema<IBankAccount>(
  {
    bankName: { type: String, required: true },
    upiId: { type: String, required: true },
    qrCodeUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.BankAccount || mongoose.model<IBankAccount>("BankAccount", bankAccountSchema);
