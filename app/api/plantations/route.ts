import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PlantationService } from '@/services/business.service';
import { plantationSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 },
      );
    }

    const plantations = await PlantationService.getPlantationsByOrganization(
      session.organizationId || '',
    );

    return NextResponse.json({
      success: true,
      data: plantations,
    });
  } catch (error) {
    console.error('Get plantations error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar plantações' },
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
    const result = plantationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.errors },
        { status: 400 },
      );
    }

    const plantation = await PlantationService.createPlantation({
      ...result.data,
      organizationId: session.organizationId,
      userId: session.userId,
    });

    return NextResponse.json(
      {
        success: true,
        data: plantation,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Create plantation error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar plantação' },
      { status: 500 },
    );
  }
}
