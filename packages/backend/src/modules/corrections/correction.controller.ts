import { Request, Response, NextFunction } from 'express';
import * as correctionService from './correction.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response.utils';

export async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      employeeId: req.query.employeeId ? Number(req.query.employeeId) : undefined,
    };
    const corrections = await correctionService.findAll(filters, req.user!);
    sendSuccess(res, corrections);
  } catch (err) {
    next(err);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction) {
  try {
    const correction = await correctionService.findById(Number(req.params.id), req.user!);
    sendSuccess(res, correction);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const correction = await correctionService.create(req.body, req.user!.id);
    sendCreated(res, correction);
  } catch (err) {
    next(err);
  }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    const correction = await correctionService.approve(
      Number(req.params.id),
      req.user!.id,
      req.body,
    );
    sendSuccess(res, correction);
  } catch (err) {
    next(err);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const correction = await correctionService.reject(
      Number(req.params.id),
      req.user!.id,
      req.body,
    );
    sendSuccess(res, correction);
  } catch (err) {
    next(err);
  }
}
