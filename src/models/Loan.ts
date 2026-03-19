import mongoose from "mongoose";

export type LoanType = "daily" | "meter" | "weekly" | "monthly";

export interface ILoan {
  _id: string;
  clientId: mongoose.Types.ObjectId;
  loanType: LoanType;
  principal: number;
  interestRatePerMonth: number;
  durationDays: number;
  startDate: Date;
  endDate: Date;
  dailyAmount?: number;
  weeklyAmount?: number;
  monthlyAmount?: number;
  totalInterest: number;
  totalPayable: number;
  status: "active" | "closed" | "overdue";
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new mongoose.Schema<ILoan>(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    loanType: { type: String, enum: ["daily", "meter", "weekly", "monthly"], required: true },
    principal: { type: Number, required: true },
    interestRatePerMonth: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    dailyAmount: Number,
    weeklyAmount: Number,
    monthlyAmount: Number,
    totalInterest: { type: Number, required: true },
    totalPayable: { type: Number, required: true },
    status: { type: String, enum: ["active", "closed", "overdue"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.models.Loan || mongoose.model<ILoan>("Loan", loanSchema);
