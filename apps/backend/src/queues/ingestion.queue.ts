import { Queue } from "bullmq";

const redis_username = process.env.REDIS_USERNAME! as string;
const redis_password = process.env.REDIS_PASSWORD! as string;
const redis_host = process.env.REDIS_HOST! as string;
const redis_port = Number(process.env.REDIS_PORT!);

export const ingestionQueue = new Queue("ingestion-queue", {
  connection: {
    username: redis_username,
    password: redis_password,
    host: redis_host,
    port: redis_port,
  },
  defaultJobOptions: {
    attempts: 3, 
    backoff: {
      type: "exponential",
      delay: 3000, 
    },
    removeOnComplete: { count: 200 }, 
    removeOnFail: { count: 500 }, 
  },
});

export const addTranslationToQueue = async (translationId: string, correlationId?: string) => {
  const job = await ingestionQueue.add("ingestion-job", {translationId, correlationId });
  return job.id;
};

