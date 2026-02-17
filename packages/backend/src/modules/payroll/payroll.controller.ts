import { Request, Response, NextFunction } from 'express';
import * as payrollService from './payroll.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response.utils';

export async function generate(req: Request, res: Response, next: NextFunction) {
  try {
    const summaries = await payrollService.generatePayroll(req.body, req.user!.id);
    sendCreated(res, summaries);
  } catch (err) {
    next(err);
  }
}

export async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      periodStart: req.query.periodStart as string | undefined,
      periodEnd: req.query.periodEnd as string | undefined,
      status: req.query.status as string | undefined,
    };
    const summaries = await payrollService.findAll(filters);
    sendSuccess(res, summaries);
  } catch (err) {
    next(err);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await payrollService.findById(Number(req.params.id));
    sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
}

export async function finalize(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await payrollService.finalize(Number(req.params.id));
    sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
}

export async function revert(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await payrollService.revert(Number(req.params.id));
    sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
}
