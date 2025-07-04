import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function registerHandler(req: Request, res: Response) {
  try {
    const { email, password, role, vendor, employee } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    let userData: any = { email, password: hashedPassword, role };
    let name = '';
    
    if (role === 'VENDOR') {
      if (!vendor || !vendor.name || !vendor.contact) {
        return res.status(400).json({ error: 'Vendor info required' });
      }
      const createdVendor = await prisma.vendor.create({ data: vendor });
      userData.vendorId = createdVendor.id;
      name = vendor.name;
    } else if (role === 'EMPLOYEE') {
      if (!employee || !employee.name || !employee.position) {
        return res.status(400).json({ error: 'Employee info required' });
      }
      const createdEmployee = await prisma.walmartEmployee.create({ data: employee });
      userData.employeeId = createdEmployee.id;
      name = employee.name;
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await prisma.user.create({ data: userData });
    res.status(201).json({ 
      id: user.id, 
      email: user.email, 
      name, 
      role: user.role 
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: err });
  }
}

export default function register(req: Request, res: Response, next: NextFunction) {
  registerHandler(req, res).catch(next);
} 