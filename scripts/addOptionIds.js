import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Debug: شوف الـ variables المتاحة ─────────────────────────────────────────
const uri =
  process.env.MONGO_URL ||
  process.env.MONGO_URL ||
  process.env.MONGO_URL ||
  process.env.DB_URI;

if (!uri) {
  console.error("❌ No MongoDB URI found. Available env vars:");
  console.log(
    Object.keys(process.env).filter(
      (k) =>
        k.toLowerCase().includes("mongo") ||
        k.toLowerCase().includes("db") ||
        k.toLowerCase().includes("database"),
    ),
  );
  process.exit(1);
}

console.log("✅ Using URI:", uri.replace(/:\/\/.*@/, "://***@")); // يخفي الـ password

await mongoose.connect(uri);

const Service = mongoose.model(
  "Service",
  new mongoose.Schema({}, { strict: false }),
);

const services = await Service.find({
  priceOptions: { $elemMatch: { _id: { $exists: false } } },
});

console.log(`Found ${services.length} services with options missing _id`);

for (const service of services) {
  let changed = false;

  service.priceOptions = service.priceOptions.map((option) => {
    if (!option._id) {
      option._id = new mongoose.Types.ObjectId();
      changed = true;
      console.log(
        `  ✅ Added _id to "${option.optionName}" in service ${service._id}`,
      );
    }
    return option;
  });

  if (changed) {
    await Service.updateOne(
      { _id: service._id },
      { $set: { priceOptions: service.priceOptions } },
    );
  }
}

console.log("✅ Done");
await mongoose.disconnect();
