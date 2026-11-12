import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      if (decoded) return decoded;
    } catch (e) {
      // Fall through to default user
    }
  }
  return { id: null, email: 'demo@speco.ai', name: 'Demo User', role: 'admin' };
}

export function unauthorized() {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
}
