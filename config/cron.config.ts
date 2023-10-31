// src/config/cron.config.ts
import { sampleTask } from "../crons/sampleTask";

module.exports = {
  [sampleTask.pattern]: sampleTask.task,
};
