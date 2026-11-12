import { NextResponse } from 'next/server';
import { User } from '@/lib/db/models';
import jwt from 'jsonwebtoken';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: true,
        data: {
          id: 'demo-user',
          name: 'Demo User',
          email: 'demo@speco.ai',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return NextResponse.json(
          { success: false, message: 'Token has expired' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const user = (await User.findById(decoded.id, {
      attributes: { exclude: ['password'] },
    })) as any;

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user.get ? user.get({ plain: true }) : user,
    });
  } catch (error: any) {
    console.error('Me error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return NextResponse.json(
          { success: false, message: 'Token has expired' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const user = (await User.findById(decoded.id)) as any;
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const { name, email } = await req.json();
    if (name !== undefined) {
      user.name = name;
    }
    if (email !== undefined) {
      const emailChanged = email !== user.email;
      if (emailChanged) {
        const existing = await User.findOne({ where: { email } });
        if (existing) {
          return NextResponse.json(
            { success: false, message: 'Email already in use' },
            { status: 400 }
          );
        }
        user.email = email;
      }
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error: any) {
    console.error('Update me error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
