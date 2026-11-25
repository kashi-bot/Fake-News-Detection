import mongoose from "mongoose";
import { env } from "./config/env";
import { User } from "./models/User";
import { Verification } from "./models/Verification";
import { NewsSource } from "./models/NewsSource";
import { logger } from "./utils/logger";

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  logger.info("Connected to MongoDB for seeding");

  await User.deleteMany({});
  await Verification.deleteMany({});
  await NewsSource.deleteMany({});

  const admin: any = new User({
    name: "Admin",
    email: "admin@truthlens.ai",
    role: "admin",
    isVerified: true,
  });
  await admin.setPassword("AdminPass123!");
  await admin.save();

  const user: any = new User({
    name: "Demo User",
    email: "user@truthlens.ai",
    role: "user",
    isVerified: true,
  });
  await user.setPassword("UserPass123!");
  await user.save();

  const existingAdmin = await User.findOne({ email: "admin@truthlens.ai" });
  if (!existingAdmin) {
    const admin: any = new User({
      name: "Admin",
      email: "admin@truthlens.ai",
      role: "superadmin",
      isVerified: true,
    });
    await admin.setPassword("AdminPass123!");
    await admin.save();
    logger.info("Admin created: admin@truthlens.ai / AdminPass123!");
  } else {
    logger.info("Admin already exists, skipping");
  }

  await NewsSource.create({
    domain: "ndtv.com",
    name: "NDTV",
    category: "ESTABLISHED_PUBLISHER",
    country: "IN",
    isOfficial: false,
  });

  await NewsSource.create({
    domain: "pib.gov.in",
    name: "Press Information Bureau",
    category: "OFFICIAL_GOVERNMENT",
    country: "IN",
    isOfficial: true,
  });

  logger.info("Seeding complete. Admin: admin@truthlens.ai / AdminPass123!");
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ err }, "Seeding failed");
  process.exit(1);
});
