import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations';
import { hashPassword, verifyPassword } from '@/lib/utils';
import { signToken, setSessionCookie } from '@/lib/auth';
import { AuthService } from '@/services/business.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validar dados
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.errors },
        { status: 400 },
      );
    }

    const { email, password } = result.data;

    // Buscar usuário
    const user = await AuthService.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 },
      );
    }

    // Verificar senha
    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 },
      );
    }

    // Gerar token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || undefined,
    });

    // Settar cookie
    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
