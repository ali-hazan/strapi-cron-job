// Constants
const LOCK_TIMEOUT = 60000; // 60 seconds timeout

// Helper function to determine if the lock is still valid
const isLockValid = (lockDate) => {
  const timeSinceLock = new Date().getTime() - new Date(lockDate).getTime();
  return timeSinceLock < LOCK_TIMEOUT;
};

async function acquireLock(jobName) {
  // Find the lock in the database
  const existingLock = await strapi.entityService.findMany(
    "api::cron-lock.cron-lock",
    {
      filters: { job_name: jobName },
      sort: { id: "desc" },
      limit: 1,
    }
  );

  const lock = existingLock?.[0];

  // If a lock exists and is still valid, return false
  if (lock && isLockValid(lock.updatedAt)) {
    return false;
  }

  // Create or update the lock
  try {
    if (lock) {
      // Lock exists but has expired, update it
      await strapi.entityService.update("api::cron-lock.cron-lock", lock.id, {
        data: {
          locked: true,
          locked_at: new Date(),
        },
      });
    } else {
      // No lock exists, create a new one
      await strapi.entityService.create("api::cron-lock.cron-lock", {
        data: {
          job_name: jobName,
          locked: true,
          locked_at: new Date(),
        },
      });
    }
    return true;
  } catch (error) {
    // If there's an error (e.g., the lock is already acquired by another process), return false
    console.error("Error acquiring lock:", error);
    return false;
  }
}

async function releaseLock(jobName) {
  // Find the lock in the database
  const existingLock = await strapi.entityService.findMany(
    "api::cron-lock.cron-lock",
    {
      filters: { job_name: jobName },
      sort: { id: "desc" },
      limit: 1,
    }
  );

  const lock = existingLock?.[0];

  // If a lock exists, release it
  if (lock) {
    await strapi.entityService.update("api::cron-lock.cron-lock", lock.id, {
      data: {
        locked: false,
        // Optionally update the locked_at to the current time or another field to indicate release
      },
    });
  }
}

export { acquireLock, releaseLock };
