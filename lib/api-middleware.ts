import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userEmail?: string;
  organizationId?: string;
}

export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<Response>,
) {
  return async (req: NextRequest) => {
    try {
      const session = await getSession();

      if (!session) {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 401 },
        );
      }

      const authReq = req as AuthenticatedRequest;
      authReq.userId = session.userId;
      authReq.userEmail = session.email;
      authReq.organizationId = session.organizationId;

      return handler(authReq);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 },
      );
    }
  };
}

export function apiResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
