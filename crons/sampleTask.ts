const { acquireLock, releaseLock } = require("../utils/pessimisticLock");
const { getNews } = require("../utils/newsScraper");

async function myCronJob() {
  const lockAcquired = await acquireLock("sampleTask");

  if (!lockAcquired) {
    console.log("Lock not acquired, skipping execution");
    return;
  }

  try {
    console.log("Cron job is executing!");
    getNews();
  } finally {
    await releaseLock("sampleTask");
  }
}

export const sampleTask = {
  task: (strapi) => {
    console.log("Every minutes task executed");
    myCronJob();
  },
  pattern: "* * * * *", // Runs every minutes
};
