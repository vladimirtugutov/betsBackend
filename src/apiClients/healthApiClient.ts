import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function checkExternalHealth(): Promise<string> {
  try {
    // Запрос к эндпоинту /api/health без специальных заголовков
    const url = `${process.env.EXTERNAL_API}/health`;
    const externalResponse = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    // console.log('externalResponse', externalResponse?.data);
    
    return externalResponse.status === 200 ? 'ok' : 'error';
  } catch (error: any) {
    console.error("External API health check failed:", error.message);
    return 'error';
  }
}
