import axios from 'axios';
import { createSignature } from '../utils/signature';
import { prisma } from '../database/prismaClient';
import dotenv from 'dotenv';

dotenv.config();

export async function callExternalAPI(
  method: 'get' | 'post',
  endpoint: string,
  userId: number,
  body: Record<string, any> | null = null
) {
  // Получаем externalId и secretKey из базы
  const externalAccount = await prisma.externalApiAccount.findUnique({
    where: { userId },
  });
  if (!externalAccount) {
    throw new Error('External API account not found for user.');
  }

  const secretKey = externalAccount.secretKey;
  const externalUserId = externalAccount.externalId || '';

  // Создаем подпись
  const signature = createSignature(body, secretKey);
  const url = `${process.env.EXTERNAL_API}${endpoint}`;
  const config = {
    method,
    url,
    headers: {
      'user-id': externalUserId,
      'x-signature': signature,
      'Content-Type': 'application/json',
    },
    data: body,
  };

  return axios(config);
}
