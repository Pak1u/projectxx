import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        vendor: true,
        employee: true
      }
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    
    // Get the name from vendor or employee
    let name = '';
    if (user.role === 'VENDOR' && user.vendor) {
      name = user.vendor.name;
    } else if (user.role === 'EMPLOYEE' && user.employee) {
      name = user.employee.name;
    }
    
    res.json({ 
      token, 
      email: user.email, 
      name, 
      role: user.role 
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err });
  }
}

export default function login(req: Request, res: Response, next: NextFunction) {
  loginHandler(req, res).catch(next);
} 