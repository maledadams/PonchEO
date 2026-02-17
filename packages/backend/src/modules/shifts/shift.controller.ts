import { Request, Response, NextFunction } from 'express';
import * as shiftService from './shift.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response.utils';

export async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const shifts = await shiftService.findAll(includeInactive);
    sendSuccess(res, shifts);
  } catch (err) {
    next(err);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction) {
  try {
    const shift = await shiftService.findById(Number(req.params.id));
    sendSuccess(res, shift);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const shift = await shiftService.create(req.body);
    sendCreated(res, shift);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const shift = await shiftService.update(Number(req.params.id), req.body);
    sendSuccess(res, shift);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const shift = await shiftService.softDelete(Number(req.params.id));
    sendSuccess(res, shift);
  } catch (err) {
    next(err);
  }
}
