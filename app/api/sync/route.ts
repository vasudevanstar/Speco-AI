import { NextResponse } from 'next/server';
import { sequelize } from '@/lib/db/models/config/database';
// Import models so they are registered with Sequelize
import '@/lib/db/models';

export async function GET() {
  try {
    const dialect = (sequelize as any).getDialect?.() || (sequelize as any).options?.dialect;
    if (dialect === 'sqlite') {
      await sequelize.sync();
    } else {
      await sequelize.sync();
    }
    return NextResponse.json({ message: 'Database synced successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
