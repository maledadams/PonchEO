import { Request, Response, NextFunction } from 'express';
import * as assignmentService from './assignment.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response.utils';

export async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      employeeId: req.query.employeeId ? Number(req.query.employeeId) : undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const assignments = await assignmentService.findAll(filters);
    sendSuccess(res, assignments);
  } catch (err) {
    next(err);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await assignmentService.findById(Number(req.params.id));
    sendSuccess(res, assignment);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await assignmentService.create(req.body);
    sendCreated(res, assignment);
  } catch (err) {
    next(err);
  }
}

export async function bulkCreate(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await assignmentService.bulkCreate(req.body);
    sendCreated(res, result);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await assignmentService.update(Number(req.params.id), req.body);
    sendSuccess(res, assignment);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await assignmentService.remove(Number(req.params.id));
    sendSuccess(res, { message: 'Shift assignment deleted' });
  } catch (err) {
    next(err);
  }
}
