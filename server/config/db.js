import dns from "node:dns";
import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in .env");
  }

  // Some networks (VPNs / multi-adapter Windows) make Node's DNS client refuse
  // the SRV lookup that mongodb+srv:// requires. Setting DNS_SERVERS in .env
  // points Node at a resolver that answers (e.g. 8.8.8.8,1.1.1.1).
  if (process.env.DNS_SERVERS) {
    dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

export default connectDB;
