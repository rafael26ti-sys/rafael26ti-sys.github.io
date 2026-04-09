import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { AuthService } from '@/services/business.service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 },
      );
    }

    const user = await AuthService.getUserById(session.userId);

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 },
    );
  }
}
