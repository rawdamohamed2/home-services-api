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

  while (radius <= MAX_RADIUS_METERS) {
    const workers = await _baseQuery(coordinates, radius, limit)
      .select("_id firstName lastName profileImage location.coordinates")
      .lean();

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
        .populate("user", "firstName lastName")
        .limit(limit)
        .lean();

      if (workers.length > 0) {
        console.log(
          `Found ${workers.length} workers in category within ${radius / 1000}km`,
        );
        return workers.map((w) => ({
          workerId: w._id,
          workerUser: w.user,
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
