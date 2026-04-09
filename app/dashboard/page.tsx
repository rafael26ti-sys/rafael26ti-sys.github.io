'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Card, Button } from '@/components/ui/common';
import { DashboardStats } from '@/types';
import Link from 'next/link';
import { ProtectedLayout } from '@/components/layouts/protected';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const plantations = await axios.get('/api/plantations');
        const expenses = await axios.get('/api/expenses');

        setStats({
          totalPlantations: plantations.data.data.length,
          totalExpenses: expenses.data.data.reduce((sum: number, exp: any) => sum + exp.amount, 0),
          totalRevenue: 0,
          totalAnimals: 0,
          recentActivities: [],
          expensesByCategory: {},
          profitByPlantation: {},
        });
      } catch (error) {
        toast.error('Erro ao carregar dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <ProtectedLayout>
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Plantações</p>
              <p className="text-3xl font-bold text-green-600">{stats?.totalPlantations || 0}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Gastos Totais</p>
              <p className="text-3xl font-bold text-red-600">
                R$ {(stats?.totalExpenses || 0).toFixed(2)}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Receita Total</p>
              <p className="text-3xl font-bold text-blue-600">
                R$ {(stats?.totalRevenue || 0).toFixed(2)}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Animais</p>
              <p className="text-3xl font-bold text-yellow-600">{stats?.totalAnimals || 0}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <Link href="/dashboard/plantations/new">
                <Button className="w-full">Nova Plantação</Button>
              </Link>
              <Link href="/dashboard/expenses/new">
                <Button variant="secondary" className="w-full">
                  Registrar Gasto
                </Button>
              </Link>
              <Link href="/dashboard/harvests/new">
                <Button variant="secondary" className="w-full">
                  Registrar Colheita
                </Button>
              </Link>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bem-vindo ao seu painel de controle. Aqui você pode gerenciar todas as suas
              operações agrícolas.
            </p>
            <Link href="/dashboard/plantations">
              <Button variant="secondary" className="w-full">
                Ver Plantações
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  );
}
