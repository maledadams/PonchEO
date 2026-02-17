import { Request, Response, NextFunction } from 'express';
import * as holidayService from './holiday.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response.utils';

export async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const holidays = await holidayService.findAll(year);
    sendSuccess(res, holidays);
  } catch (err) {
    next(err);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction) {
  try {
    const holiday = await holidayService.findById(Number(req.params.id));
    sendSuccess(res, holiday);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const holiday = await holidayService.create(req.body);
    sendCreated(res, holiday);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const holiday = await holidayService.update(Number(req.params.id), req.body);
    sendSuccess(res, holiday);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await holidayService.remove(Number(req.params.id));
    sendSuccess(res, { message: 'Holiday deleted' });
  } catch (err) {
    next(err);
  }
}

export async function seedHolidays(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await holidayService.seedDRHolidays(Number(req.params.year));
    sendCreated(res, result);
  } catch (err) {
    next(err);
  }
}
