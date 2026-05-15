import {
  BedrockRuntimeClient,
  ConversationRole,
  ConverseCommand
} from "@aws-sdk/client-bedrock-runtime";
import { GenerateRequest, QuestionOutput } from "../model/quesGen.model";

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

export const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data),
};

export function getAPIHeaders(headers: any): { [key: string]: string } {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": headers?.origin || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
  };
}

function normalizeJD(rawJD: string): string {
  return rawJD
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join(" ")
    .replace(/\s+/g, " ");
}

export async function generateQuestionsFromJD(
  input: GenerateRequest
): Promise<QuestionOutput[]> {
  logger.info("generateQuestionsFromJD() called with:", input);

  const jobDescription = normalizeJD(input.hrsJobDesc);

  const systemPrompt = [{
    text: `
IMPORTANT: Your first task is to classify the job description.

- If the job description is NOT technical, respond with ONLY this text:
NON_TECH_JD

- If it IS technical, generate exactly 5 STAR-style technical interview questions.

Rules:
- Generate exactly 5 questions.
- After EACH question include "Expected Answer:"
- Output format:

1. <question>
Expected Answer: <answer>

2. <question>
Expected Answer: <answer>
`
  }];

  const userPrompt = [{
    role: ConversationRole.USER,
    content: [{ text: jobDescription }]
  }];

  const command = new ConverseCommand({
    modelId: "us.amazon.nova-micro-v1:0",
    system: systemPrompt,
    messages: userPrompt,
    inferenceConfig: {
      maxTokens: 1000,
      temperature: 0.7
    }
  });

  try {
    logger.debug("Sending Converse prompt to Bedrock...");

    const response = await bedrockClient.send(command);

    const outputText =
      response.output?.message?.content?.[0]?.text ?? "";

    logger.debug("Raw Converse output:", outputText);

    if (outputText.trim().toUpperCase() === "NON_TECH_JD") {
      logger.warn("Non-technical JD detected");
      return [];
    }

    const questions: QuestionOutput[] = [];
    const rawLines = outputText
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);

    let currentQuestion = "";
    let currentAnswer = "";
    let questionId = 1;

    for (const line of rawLines) {
      if (/^\d+\./.test(line)) {
        if (currentQuestion) {
          questions.push({
            hrsQuesId: `${questionId++}`,
            hrsQuesText: currentQuestion,
            hrsExpAns: currentAnswer.trim()
          });
        }

        currentQuestion = line.replace(/^\d+\.\s*/, "").trim();
        currentAnswer = "";
      }
      else if (/expected\s*answer\s*:/i.test(line)) {
        currentAnswer = line
          .replace(/\**expected\s*answer\s*:\**/i, "")
          .trim();
      }
      else if (currentAnswer) {
        currentAnswer += " " + line;
      }
    }

    if (currentQuestion) {
      questions.push({
        hrsQuesId: `${questionId++}`,
        hrsQuesText: currentQuestion,
        hrsExpAns: currentAnswer.trim()
      });
    }

    logger.info("Generated questions:", questions);

    return questions;

  } catch (error: any) {
    logger.error("Bedrock error:", error);
    throw new Error("Failed to generate questions");
  }
}