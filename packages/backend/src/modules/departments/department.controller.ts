import { Request, Response, NextFunction } from 'express';
import * as departmentService from './department.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response.utils';

export async function findAll(_req: Request, res: Response, next: NextFunction) {
  try {
    const departments = await departmentService.findAll();
    sendSuccess(res, departments);
  } catch (err) {
    next(err);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction) {
  try {
    const department = await departmentService.findById(Number(req.params.id));
    sendSuccess(res, department);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const department = await departmentService.create(req.body);
    sendCreated(res, department);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const department = await departmentService.update(Number(req.params.id), req.body);
    sendSuccess(res, department);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const department = await departmentService.remove(Number(req.params.id));
    sendSuccess(res, department);
  } catch (err) {
    next(err);
  }
}
