import mongoose from "mongoose";
const MAX_RADIUS_METERS = Number(process.env.MAX_SEARCH_RADIUS_METERS) || 80000;

export const findNearbyWorkers = async ({
  coordinates,
  maxDistance = 10000,
  limit = 5,
}) => {
  const workers = await _searchWithExpansion(coordinates, maxDistance, limit);
  return workers.map((w) => w._id);
};

export const findNearbyWorkersWithDistance = async ({
  coordinates,
  maxDistance = 10000,
  limit = 5,
}) => {
  const workers = await _searchWithExpansion(coordinates, maxDistance, limit);
  return workers.map((w) => ({
    ...w,
    distanceKm: _haversineKm(coordinates, w.location.coordinates),
  }));
};

const _searchWithExpansion = async (coordinates, initialRadius, limit) => {
  let radius = initialRadius;
  console.log("_searchWithExpansion", radius);
  while (radius <= MAX_RADIUS_METERS) {
    const workers = await _baseQuery(coordinates, radius, limit)
      .select("_id firstName lastName profileImage location.coordinates")
      .lean();
    console.log("_searchWithExpansion", workers);
    if (workers.length > 0) {
      console.log(`Found ${workers.length} workers within ${radius / 1000}km`);
      return workers;
    }

    const nextRadius = radius * 2;
    console.log(
      `No workers within ${radius / 1000}km — expanding to ${nextRadius / 1000}km`,
    );
    radius = nextRadius;
  }

  console.log(
    `No workers found within max radius ${MAX_RADIUS_METERS / 1000}km`,
  );
  return [];
};

const _baseQuery = (coordinates, maxDistance, limit) => {
  const User = mongoose.model("User");

  return User.find({
    role: "worker",
    isBlocked: false,
    //isVerified: true,
    enabledLocation: true,
    location: {
      $near: {
        $geometry: { type: "Point", coordinates },
        $maxDistance: maxDistance,
      },
    },
  }).limit(limit);
};
//
// const _haversineKm = ([lng1, lat1], [lng2, lat2]) => {
//   const R = 6371;
//   const dLat = _rad(lat2 - lat1);
//   const dLng = _rad(lng2 - lng1);
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(_rad(lat1)) * Math.cos(_rad(lat2)) * Math.sin(dLng / 2) ** 2;
//   return parseFloat(
//     (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2),
//   );
// };
//
// const _rad = (deg) => (deg * Math.PI) / 180;
//
// export const debugWorkerQuery = async (coordinates) => {
//   const User = mongoose.model("User");
//
//   const allWorkers = await User.find({ role: "worker" })
//     .select(
//       "firstName lastName enabledLocation location.coordinates isVerified isBlocked",
//     )
//     .lean();
//
//   const notBlocked = allWorkers.filter((w) => !w.isBlocked);
//   const verified = notBlocked.filter((w) => w.isVerified);
//   const locationEnabled = verified.filter((w) => w.enabledLocation);
//   const hasCoords = locationEnabled.filter(
//     (w) => w.location?.coordinates?.length === 2,
//   );
//
//   console.log("=== Worker Debug ===");
//   console.log(`Total role:worker     → ${allWorkers.length}`);
//   console.log(`isBlocked:false       → ${notBlocked.length}`);
//   console.log(`isVerified:true       → ${verified.length}`);
//   console.log(`enabledLocation:true  → ${locationEnabled.length}`);
//   console.log(`has valid coordinates → ${hasCoords.length}`);
//   console.table(
//     allWorkers.map((w) => ({
//       name: `${w.firstName} ${w.lastName}`,
//       isVerified: w.isVerified,
//       isBlocked: w.isBlocked,
//       enabledLocation: w.enabledLocation,
//       coordinates: w.location?.coordinates?.join(", ") ?? "NONE",
//     })),
//   );
// };

export const findNearbyWorkersByCategory = async ({
  coordinates,
  categoryId,
  maxDistance = 10000,
  limit = 5,
}) => {
  const WorkerProfile = mongoose.model("WorkerProfile");
  let radius = maxDistance;

  while (radius <= MAX_RADIUS_METERS) {
    // Step 1: get nearby user IDs
    const nearbyUsers = await _baseQuery(coordinates, radius, limit * 3)
      .select("_id")
      .lean();

    if (nearbyUsers.length > 0) {
      const nearbyUserIds = nearbyUsers.map((u) => u._id);

      // Step 2: filter by category + approvalStatus
      const workers = await WorkerProfile.find({
        user: { $in: nearbyUserIds },
        //approvalStatus: "approved",
        ...(categoryId && { categories: categoryId }),
      })
        .select("_id user")
        .limit(limit)
        .lean();

      if (workers.length > 0) {
        console.log(
          `Found ${workers.length} workers in category within ${radius / 1000}km`,
        );
        return workers.map((w) => ({
          workerId: w._id,
          workerUserId: w.user,
        }));
      }
    }

    const next = radius * 2;
    console.log(
      `No category workers within ${radius / 1000}km — expanding to ${next / 1000}km`,
    );
    radius = next;
  }

  console.log(
    `No workers found in category within max ${MAX_RADIUS_METERS / 1000}km`,
  );
  return [];
};
