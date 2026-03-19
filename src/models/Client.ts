import mongoose from "mongoose";

export interface IClient {
  _id: string;
  name: string;
  address: string;
  mobile: string;
  alternateMobile?: string;
  relativeMobile?: string;
  mapLink?: string;
  aadharUrl?: string;
  panUrl?: string;
  photoUrl?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new mongoose.Schema<IClient>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    mobile: { type: String, required: true },
    alternateMobile: { type: String },
    relativeMobile: { type: String },
    mapLink: { type: String },
    aadharUrl: { type: String },
    panUrl: { type: String },
    photoUrl: { type: String },
    location: {
      lat: Number,
      lng: Number,
      address: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Client || mongoose.model<IClient>("Client", clientSchema);
