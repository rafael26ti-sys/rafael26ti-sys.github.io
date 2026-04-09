import type { Config } from 'tailwindcss/types';

export const APP_CONFIG: Config & {
  appName: string;
  appDescription: string;
  appVersion: string;
  supportEmail: string;
  siteUrl: string;
  apiUrl: string;
} = {
  appName: 'Controle Rural SaaS',
  appDescription: 'Sistema moderno de controle de produção rural',
  appVersion: '1.0.0',
  supportEmail: 'support@controlrural.com',
  siteUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
} as any;

export const AUTH_CONFIG = {
  JWT_EXPIRATION: '7d',
  SESSION_EXPIRATION: '30d',
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export const STORAGE = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
};

export const FEATURES = {
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
  ENABLE_TWO_FACTOR: false,
  ENABLE_SOCIAL_LOGIN: false,
};

export const PLANS = {
  FREE: {
    name: 'Gratuito',
    maxUsers: 1,
    maxPlantations: 5,
    maxExpenses: 100,
    features: ['Dashboard básico', 'Controle de plantações', 'Controle de gastos'],
  },
  STARTER: {
    name: 'Iniciante',
    maxUsers: 5,
    maxPlantations: 20,
    maxExpenses: 1000,
    features: [
      'Tudo do plano Gratuito',
      'Até 5 usuários',
      'Controle de animais',
      'Controle de equipamentos',
    ],
  },
  PROFESSIONAL: {
    name: 'Profissional',
    maxUsers: 50,
    maxPlantations: 100,
    maxExpenses: 10000,
    features: ['Tudo do Iniciante', 'Relatórios avançados', 'API de integração', 'Suporte prioritário'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    maxUsers: -1,
    maxPlantations: -1,
    maxExpenses: -1,
    features: ['Tudo ilimitado', 'Dedicado', 'SLA', 'Integração customizada'],
  },
};
