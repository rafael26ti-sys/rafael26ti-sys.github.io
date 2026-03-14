import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 },
      );
    }

    await clearSessionCookie();

    return NextResponse.json(
      { success: true, message: 'Desconectado com sucesso' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Erro ao desconectar' },
      { status: 500 },
    );
  }
}
