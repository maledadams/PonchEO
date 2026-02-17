import { Request, Response, NextFunction } from 'express';
import * as employeeService from './employee.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response.utils';
import { Errors } from '../../shared/errors/AppError';

export async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user!.role !== 'SUPERVISOR') {
      const employee = await employeeService.findById(req.user!.id);
      sendSuccess(res, [employee]);
      return;
    }

    const includeInactive = req.query.includeInactive === 'true';
    const employees = await employeeService.findAll(includeInactive);
    sendSuccess(res, employees);
  } catch (err) {
    next(err);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction) {
  try {
    const requestedId = Number(req.params.id);

    if (req.user!.role !== 'SUPERVISOR' && requestedId !== req.user!.id) {
      throw Errors.forbidden('You can only access your own profile');
    }

    const employee = await employeeService.findById(requestedId);
    sendSuccess(res, employee);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await employeeService.create(req.body);
    sendCreated(res, employee);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await employeeService.update(Number(req.params.id), req.body);
    sendSuccess(res, employee);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await employeeService.softDelete(Number(req.params.id));
    sendSuccess(res, employee);
  } catch (err) {
    next(err);
  }
}
