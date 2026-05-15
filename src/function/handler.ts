import { APIGatewayProxyHandler } from "aws-lambda";
import { generateQuestionsFromJD } from "../service/quesGen.service";
import { GenerateRequest } from "../model/quesGen.model";
import { getAPIHeaders, logger } from "../service/quesGen.service";

export const handler: APIGatewayProxyHandler = async (event: any) => {
  logger.info("Received event", { event });

  try {
    const body = JSON.parse(event.body) as GenerateRequest;

    if (!body.hrsJobDesc) {
      return {
        statusCode: 400,
        headers: getAPIHeaders(event.headers),
        body: JSON.stringify({ error: "Missing hrsJobDesc" }),
      };
    }

    const questions = await generateQuestionsFromJD(body);

    return {
      statusCode: 200,
      headers: getAPIHeaders(event.headers),
      body: JSON.stringify(questions),
    };
  } catch (err: any) {
    logger.error("Error generating questions", err);

    return {
      statusCode: 500,
      headers: getAPIHeaders(event.headers),
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};