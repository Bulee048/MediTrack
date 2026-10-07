import { Department, IDepartment } from '../models/Department.js';
import { AppError } from '../utils/AppError.js';
import { validateObjectId } from '../utils/objectId.js';
import { CreateDepartmentInput, UpdateDepartmentInput } from '../validators/department.validator.js';

export class DepartmentService {
  static async getAllDepartments(search?: string): Promise<IDepartment[]> {
    const filter: Record<string, unknown> = { isActive: true };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { code: regex }, { description: regex }];
    }

    return Department.find(filter).sort({ name: 1 });
  }

  static async getDepartmentById(id: string): Promise<IDepartment> {
    validateObjectId(id, 'department ID');
    const department = await Department.findOne({ _id: id, isActive: true });
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    return department;
  }

  static async createDepartment(data: CreateDepartmentInput): Promise<IDepartment> {
    const uppercaseCode = data.code.toUpperCase();
    const existingCode = await Department.findOne({ code: uppercaseCode });
    if (existingCode) {
      throw new AppError(`Department with code '${uppercaseCode}' already exists`, 409);
    }

    return Department.create({
      ...data,
      code: uppercaseCode,
      isActive: true,
    });
  }

  static async updateDepartment(id: string, data: UpdateDepartmentInput): Promise<IDepartment> {
    validateObjectId(id, 'department ID');
    const department = await Department.findById(id);
    if (!department) {
      throw new AppError('Department not found', 404);
    }

    if (data.code && data.code.toUpperCase() !== department.code) {
      const uppercaseCode = data.code.toUpperCase();
      const existingCode = await Department.findOne({ code: uppercaseCode });
      if (existingCode) {
        throw new AppError(`Department with code '${uppercaseCode}' already exists`, 409);
      }
      department.code = uppercaseCode;
    }

    if (data.name !== undefined) department.name = data.name;
    if (data.icon !== undefined) department.icon = data.icon;
    if (data.description !== undefined) department.description = data.description;
    if (data.roomNumber !== undefined) department.roomNumber = data.roomNumber;
    if (data.isActive !== undefined) department.isActive = data.isActive;

    await department.save();
    return department;
  }

  static async deactivateDepartment(id: string): Promise<IDepartment> {
    validateObjectId(id, 'department ID');
    const department = await Department.findById(id);
    if (!department) {
      throw new AppError('Department not found', 404);
    }

    department.isActive = false;
    await department.save();
    return department;
  }
}
