import { Request, Response, NextFunction } from 'express';
import * as punchService from './punch.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response.utils';
import { PunchQuery } from './punch.schema';

export async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: PunchQuery = {
      employeeId: req.query.employeeId ? Number(req.query.employeeId) : undefined,
      status: req.query.status as PunchQuery['status'],
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const punches = await punchService.findAll(filters, req.user!);
    sendSuccess(res, punches);
  } catch (err) {
    next(err);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction) {
  try {
    const punch = await punchService.findById(Number(req.params.id), req.user!);
    sendSuccess(res, punch);
  } catch (err) {
    next(err);
  }
}

export async function findOpen(_req: Request, res: Response, next: NextFunction) {
  try {
    const punches = await punchService.findOpenPunches();
    sendSuccess(res, punches);
  } catch (err) {
    next(err);
  }
}

export async function clockIn(req: Request, res: Response, next: NextFunction) {
  try {
    const punch = await punchService.clockIn(req.user!.id);
    sendCreated(res, punch);
  } catch (err) {
    next(err);
  }
}

export async function clockOut(req: Request, res: Response, next: NextFunction) {
  try {
    const punch = await punchService.clockOut(req.user!.id);
    sendSuccess(res, punch);
  } catch (err) {
    next(err);
  }
}
