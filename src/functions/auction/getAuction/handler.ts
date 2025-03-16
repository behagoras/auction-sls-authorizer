import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyResult } from 'aws-lambda';

import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import httpEventNormalizer from "@middy/http-event-normalizer";
import jsonBodyParser from "@middy/http-json-body-parser";
import createError from "http-errors";

import { APIGatewayTypedEvent } from '@types';
import { AuctionSchema } from "../auctionsSchema";


export const getAuction = async (
  event: APIGatewayTypedEvent<AuctionSchema, { id: string }>,
): Promise<APIGatewayProxyResult> => {
  const client = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(client);

  const id = event.pathParameters.id;

  const command = new GetCommand({
    TableName: process.env.AUCTION_TABLE_NAME,
    Key: { id },
  });

  try {
    const { Item: auction } = await docClient.send(command);

    if (!auction) {
      throw new createError.NotFound(`Auction with ID "${id}" not found.`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ auction }),
    };
  } catch (error) {
    if (error && (error as any).statusCode) {
      throw error;
    }
    throw new createError.InternalServerError(error);
  }
};

export const main = middy(getAuction)
  .use(jsonBodyParser())
  .use(httpEventNormalizer())
  .use(httpErrorHandler());