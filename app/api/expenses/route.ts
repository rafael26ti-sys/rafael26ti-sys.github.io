import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ExpenseService } from '@/services/business.service';
import { expenseSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 },
      );
    }

    const expenses = await ExpenseService.getExpensesByOrganization(
      session.organizationId || '',
    );

    return NextResponse.json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar despesas' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const result = expenseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.errors },
        { status: 400 },
      );
    }

    const expense = await ExpenseService.createExpense({
      ...result.data,
      organizationId: session.organizationId,
      userId: session.userId,
    });

    return NextResponse.json(
      {
        success: true,
        data: expense,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar despesa' },
      { status: 500 },
    );
  }
}
