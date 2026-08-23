import { sendMessage } from "./message.services.js";

//SERVICES

export const askHealthQuestion = async (
  question: string,
  correlationId: string,
) => {
  const result = await sendMessage({
    question,
    correlationId,
  });

  return {
    code: 200,
    message: "Question answered successfully",
    data: result,
    meta: { correlationId },
  };
};
