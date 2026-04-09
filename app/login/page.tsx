'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Alert } from '@/components/ui/common';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post('/api/auth/login', formData);
      toast.success('Bem-vindo!');
      router.push('/dashboard');
    } catch (error: any) {
      if (error.response?.data?.details) {
        const errorMap: Record<string, string> = {};
        error.response.data.details.forEach((err: any) => {
          errorMap[err.path[0]] = err.message;
        });
        setErrors(errorMap);
      } else {
        toast.error(error.response?.data?.error || 'Erro ao entrar');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Entrar</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Não tem conta?{' '}
          <a href="/register" className="text-green-600 hover:text-green-700 font-medium">
            Criar conta
          </a>
        </p>
      </Card>
    </div>
  );
}
