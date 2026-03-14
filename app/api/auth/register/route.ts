import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations';
import { hashPassword } from '@/lib/utils';
import { signToken, setSessionCookie } from '@/lib/auth';
import { AuthService, OrganizationService } from '@/services/business.service';
import { generateSlug } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validar dados
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.errors },
        { status: 400 },
      );
    }

    const { name, email, password } = result.data;

    // Verificar se usuário já existe
    const existingUser = await AuthService.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 },
      );
    }

    // Hash de senha
    const hashedPassword = await hashPassword(password);

    // Criar usuário
    const user = await AuthService.createUser({
      email,
      name,
      password: hashedPassword,
    });

    // Criar organização padrão
    const org = await OrganizationService.createOrganization({
      name: `${name}`,
      slug: generateSlug(name),
      ownerId: user.id,
      description: 'Minha organização',
    });

    // Atualizar usuário com organização
    await AuthService.updateUser(user.id, {
      organizationId: org.id,
    });

    // Gerar token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: org.id,
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
        },
        token,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 },
    );
  }
}
