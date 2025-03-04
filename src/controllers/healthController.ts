import { Request, Response } from 'express';
import { healthService } from '../services/healthService';

export const getHealthHandler = async (req: Request, res: Response) => {
  try {
    const healthStatus = await healthService.getHealthStatus();
    res.status(200).json(healthStatus);
  } catch (error: any) {
    console.error("Health check error:", error.message);
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      services: {
        api: "error",
        database: "error",
        external_api: "error",
      },
    });
  }
};
