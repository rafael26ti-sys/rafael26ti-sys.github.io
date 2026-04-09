'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Alert } from '@/components/ui/common';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post('/api/auth/register', formData);
      toast.success('Conta criada com sucesso!');
      router.push('/dashboard');
    } catch (error: any) {
      if (error.response?.data?.details) {
        const errorMap: Record<string, string> = {};
        error.response.data.details.forEach((err: any) => {
          errorMap[err.path[0]] = err.message;
        });
        setErrors(errorMap);
      } else {
        toast.error(error.response?.data?.error || 'Erro ao criar conta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Criar Conta</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome completo"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          <Input
            label="Senha"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />

          <Input
            label="Confirmar senha"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              name="terms"
              checked={formData.terms}
              onChange={handleChange}
              className="rounded"
              required
            />
            <label className="ml-2 text-sm text-gray-600">
              Concordo com os termos de serviço
            </label>
          </div>
          {errors.terms && <p className="text-red-500 text-sm">{errors.terms}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Já tem conta?{' '}
          <a href="/login" className="text-green-600 hover:text-green-700 font-medium">
            Entrar
          </a>
        </p>
      </Card>
    </div>
  );
}
