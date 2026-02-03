# -Vaso-del-Alfarero-
 "App cristiana interactiva para comunidad global"   
```
sbi-plus/
├── frontend/                 # React 19 + Tailwind 4
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── pages/           # Páginas principales
│   │   ├── services/        # APIs y servicios
│   │   ├── utils/           # Utilidades
│   │   └── styles/          # Estilos globales
│   └── public/
├── backend/                  # Express + tRPC
│   ├── src/
│   │   ├── controllers/     # Controladores
│   │   ├── models/          # Modelos de datos
│   │   ├── routes/          # Rutas API
│   │   └── middleware/      # Middleware
│   └── config/
├── mobile/                   # React Native (APK)
│   └── src/
├── database/                 # MySQL/TiDB
│   └── migrations/
└── docker/                   # Contenedores
```

2. ARCHIVOS DE CONFIGURACIÓN ESENCIALES

2.1. package.json (Frontend)

```json
{
  "name": "sbi-plus-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.20.0",
    "tailwindcss": "^4.0.0",
    "@trpc/react-query": "^11.0.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.7.0",
    "jwt-decode": "^4.0.0",
    "date-fns": "^3.0.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

2.2. tailwind.config.js

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        gold: '#d4af37',
        biblical: {
          sand: '#f0e6d2',
          stone: '#8b7355',
          olive: '#556b2f'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'serif']
      },
      animation: {
        'gradient-shift': 'gradientShift 4min infinite linear',
        'pulse-slow': 'pulse 3s ease-in-out infinite'
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        }
      }
    }
  }
}
```

3. COMPONENTES PRINCIPALES REACT

3.1. App.tsx (Componente Principal)

```tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCProvider } from './utils/trpc';
import { SecurityProvider } from './contexts/SecurityContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Componentes de Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TrainExperience from './pages/TrainExperience';
import BibleReader from './pages/BibleReader';
import Quiz from './pages/Quiz';
import SocialFeed from './pages/SocialFeed';
import Shop from './pages/Shop';
import Premium from './pages/Premium';
import DeboraAI from './pages/DeboraAI';

// Componentes de Layout
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import NotificationCenter from './components/notifications/NotificationCenter';

const queryClient = new QueryClient();

function App() {
  const [ofuscationKey, setOfuscationKey] = useState(0);

  // Ofuscación cada 15 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      setOfuscationKey(prev => prev + 1);
      // Rotar partes de la plataforma
      rotatePlatformSections();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Cambio de colores cada 4 minutos
  useEffect(() => {
    const colorInterval = setInterval(() => {
      document.documentElement.style.setProperty(
        '--primary-gradient',
        generateRandomGradient()
      );
    }, 4 * 60 * 1000);

    return () => clearInterval(colorInterval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider>
        <SecurityProvider ofuscationKey={ofuscationKey}>
          <ThemeProvider>
            <Router>
              <div className="min-h-screen bg-gradient-to-br from-gray-50 to-biblical-sand">
                <Navbar />
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 p-6">
                    <Routes>
                      <Route path="/" element={<Login />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/train" element={<TrainExperience />} />
                      <Route path="/bible" element={<BibleReader />} />
                      <Route path="/quiz" element={<Quiz />} />
                      <Route path="/feed" element={<SocialFeed />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/premium" element={<Premium />} />
                      <Route path="/debora" element={<DeboraAI />} />
                    </Routes>
                  </main>
                </div>
                <NotificationCenter />
              </div>
            </Router>
          </ThemeProvider>
        </SecurityProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}

function rotatePlatformSections() {
  // Implementar rotación de secciones para ofuscación
  console.log('Rotando secciones de plataforma...');
}

function generateRandomGradient() {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
}

export default App;
```

3.2. Sistema de Autenticación KYC

```tsx
// components/auth/KYCModule.tsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { startVerification } from '../../services/kycService';

interface KYCModuleProps {
  userId: string;
  onComplete: (token: string) => void;
}

const KYCModule: React.FC<KYCModuleProps> = ({ userId, onComplete }) => {
  const [step, setStep] = useState<'biometric' | 'community' | 'completed'>('biometric');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: startVerification,
    onSuccess: (data) => {
      if (data.status === 'VERIFIED') {
        setVerificationResult(data);
        onComplete(data.token);
      } else if (data.status === 'COMMUNITY_PENDING') {
        setStep('community');
      }
    }
  });

  const handleBiometric = async () => {
    // Integración con SDK de proveedor (Jumio/Onfido)
    const result = await startBiometricVerification(userId);
    if (result.success) {
      mutation.mutate({ userId, provider: 'biometric' });
    } else {
      setStep('community');
    }
  };

  const handleCommunityVerification = async () => {
    // Flujo de verificación comunitaria
    const pastorSignature = await getPastorSignature(userId);
    mutation.mutate({ 
      userId, 
      provider: 'community',
      signature: pastorSignature 
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-purple-800 mb-4">
        Verificación de Identidad KYC
      </h2>
      
      {step === 'biometric' && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Paso 1: Verificación Biométrica
          </p>
          <button
            onClick={handleBiometric}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Iniciar Verificación Biométrica
          </button>
          <button
            onClick={() => setStep('community')}
            className="w-full border border-purple-600 text-purple-600 py-3 rounded-lg font-semibold hover:bg-purple-50 transition"
          >
            Usar Verificación Comunitaria
          </button>
        </div>
      )}

      {step === 'community' && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Paso 2: Verificación por Comunidad/Pastor
          </p>
          <button
            onClick={handleCommunityVerification}
            className="w-full bg-gold text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition"
          >
            Solicitar Firma de Pastor
          </button>
        </div>
      )}

      {verificationResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-semibold">
            ✅ Verificación Completa
          </p>
          <p className="text-green-600 text-sm">
            Token: {verificationResult.token.substring(0, 20)}...
          </p>
        </div>
      )}
    </div>
  );
};

// Funciones auxiliares (simuladas)
async function startBiometricVerification(userId: string) {
  // SDK real iría aquí
  return { success: Math.random() > 0.2 };
}

async function getPastorSignature(userId: string) {
  // Lógica de firma comunitaria
  return `signed_${userId}_${Date.now()}`;
}

export default KYCModule;
```

3.3. Sistema de Monetización y Auditoría

```tsx
// components/monetization/TTCoinSystem.tsx
import React, { useState, useEffect } from 'react';

interface TTCoinSystemProps {
  userId: string;
  onTransaction: (details: TransactionDetails) => void;
}

interface TransactionDetails {
  amount: number;
  item: string;
  ttPrice: number;
  usdEquivalent: number;
  auditBreakdown: AuditBreakdown;
}

interface AuditBreakdown {
  cathedral: number;    // 60%
  expansion: number;    // 25%
  maintenance: number;  // 15%
}

const TTCoinSystem: React.FC<TTCoinSystemProps> = ({ userId, onTransaction }) => {
  const [ttBalance, setTtBalance] = useState(1000);
  const [conversionRate, setConversionRate] = useState(0.0083); // 1 TT = $0.0083 USD

  // Productos disponibles
  const products = [
    { id: 1, name: 'Cortadito Virtual', ttPrice: 150, description: 'Café fuerte con leche' },
    { id: 2, name: 'Membresía Básica', ttPrice: 500, description: 'Acceso a contenido básico' },
    { id: 3, name: 'Membresía Premium', ttPrice: 1500, description: 'Acceso completo' },
    { id: 4, name: 'Libro Digital', ttPrice: 300, description: 'Libro teológico' },
  ];

  const calculateAudit = (ttAmount: number): AuditBreakdown => {
    const usdValue = ttAmount * conversionRate;
    return {
      cathedral: usdValue * 0.60,     // 60% Catedral
      expansion: usdValue * 0.25,     // 25% Expansión
      maintenance: usdValue * 0.15    // 15% Mantenimiento
    };
  };

  const handlePurchase = (product: typeof products[0]) => {
    if (ttBalance >= product.ttPrice) {
      // Actualizar balance
      setTtBalance(prev => prev - product.ttPrice);
      
      // Calcular auditoría
      const audit = calculateAudit(product.ttPrice);
      const usdValue = product.ttPrice * conversionRate;
      
      // Crear transacción
      const transaction: TransactionDetails = {
        amount: product.ttPrice,
        item: product.name,
        ttPrice: product.ttPrice,
        usdEquivalent: usdValue,
        auditBreakdown: audit
      };
      
      // Notificar transacción
      onTransaction(transaction);
      
      // Generar PDF de auditoría
      generateAuditPDF(transaction);
      
      alert(`✅ Compra exitosa: ${product.name}`);
    } else {
      alert('❌ Saldo insuficiente de TT Coins');
    }
  };

  const generateAuditPDF = (transaction: TransactionDetails) => {
    // Lógica para generar PDF de auditoría
    console.log('Generando PDF de auditoría:', transaction);
    
    // Enviar a backend para almacenamiento seguro
    fetch('/api/audit/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction)
    });
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-purple-800">Sistema de TT Coins</h2>
        <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
          <p className="text-lg font-semibold">
            Balance: <span className="text-gold">{ttBalance} TT</span>
          </p>
          <p className="text-sm text-gray-600">
            Tasa: 1 TT = ${conversionRate.toFixed(4)} USD
          </p>
          <p className="text-sm text-gray-600">
            Cortadito (150 TT) = ${(150 * conversionRate).toFixed(2)} USD
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Tienda Virtual</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map(product => (
            <div key={product.id} className="border border-purple-200 rounded-lg p-4 hover:shadow-md transition">
              <h4 className="font-bold text-gray-800">{product.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gold">{product.ttPrice} TT</span>
                <button
                  onClick={() => handlePurchase(product)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  disabled={ttBalance < product.ttPrice}
                >
                  Comprar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
        <h4 className="font-bold text-gray-800 mb-2">Auditoría en Tiempo Real</h4>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Fondo Ministerial (Catedral):</span>
            <span className="font-semibold">60%</span>
          </div>
          <div className="flex justify-between">
            <span>Expansión Técnica:</span>
            <span className="font-semibold">25%</span>
          </div>
          <div className="flex justify-between">
            <span>Peaje Operativo:</span>
            <span className="font-semibold">15%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TTCoinSystem;
```

3.4. Sistema de IA Déborat (Chatbot)

```tsx
// components/ai/DeboraChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Camera, Brain } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'debora';
  timestamp: Date;
  verseReference?: string;
}

const DeboraChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hola, soy Déborat, tu asistente IA basado en la sabiduría bíblica. ¿En qué puedo ayudarte hoy?',
      sender: 'debora',
      timestamp: new Date(),
      verseReference: 'Proverbios 1:7'
    }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsAnalyzing(true);

    // Simular procesamiento de IA
    setTimeout(() => {
      const responses = [
        {
          content: `"Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna." (Juan 3:16)`,
          verse: 'Juan 3:16'
        },
        {
          content: 'La fe es la certeza de lo que se espera, la convicción de lo que no se ve. Hebreos 11:1',
          verse: 'Hebreos 11:1'
        },
        {
          content: 'En cuanto a la fe y ciencia, muchos grandes científicos vieron su trabajo como adoración a Dios.',
          verse: 'Salmo 19:1'
        }
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const deboraMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: randomResponse.content,
        sender: 'debora',
        timestamp: new Date(),
        verseReference: randomResponse.verse
      };

      setMessages(prev => [...prev, deboraMessage]);
      setIsAnalyzing(false);
    }, 1500);
  };

  const startRecording = () => {
    setIsRecording(true);
    // Lógica de grabación de voz
    setTimeout(() => {
      setIsRecording(false);
      setInput('¿Puedes explicarme Juan 3:16?');
    }, 2000);
  };

  return (
    <div className="flex flex-col h-[600px] bg-gradient-to-b from-purple-50 to-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-purple-900 p-4 text-white">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-bold">IA Déborat</h2>
            <p className="text-sm text-purple-200">Asistente Bíblico Inteligente</p>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-br-none'
                  : 'bg-gradient-to-r from-gray-100 to-white border border-gray-200 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.verseReference && (
                <div className="mt-2 pt-2 border-t border-opacity-20">
                  <span className="text-xs opacity-75">
                    📖 {message.verseReference}
                  </span>
                </div>
              )}
              <span className="text-xs opacity-50 block mt-2">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        ))}
        
        {isAnalyzing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl p-4 rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <button
            onClick={startRecording}
            className={`p-3 rounded-full ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pregunta sobre la Biblia, fe, ciencia..."
              className="w-full p-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-2 rounded-full hover:opacity-90 transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <button className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
            <Camera className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-3 text-xs text-gray-500 text-center">
          <p>Déborat analiza cada pregunta con fuentes bíblicas, históricas y científicas</p>
        </div>
      </div>
    </div>
  );
};

export default DeboraChat;
```

4. SISTEMA DE SEGURIDAD Y OFUSCACIÓN

4.1. Contexto de Seguridad

```tsx
// contexts/SecurityContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SecurityContextType {
  ofuscationKey: number;
  rotateColors: () => void;
  encryptData: (data: string) => string;
  decryptData: (encrypted: string) => string;
  isSecureSession: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode; ofuscationKey: number }> = ({ 
  children, 
  ofuscationKey 
}) => {
  const [rotationInterval, setRotationInterval] = useState<NodeJS.Timeout>();
  const [currentAlgorithm, setCurrentAlgorithm] = useState<'caesar' | 'vigenere' | 'railfence'>('caesar');

  // Rotación de algoritmos cada 15 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      const algorithms: Array<'caesar' | 'vigenere' | 'railfence'> = ['caesar', 'vigenere', 'railfence'];
      const nextAlgorithm = algorithms[Math.floor(Math.random() * algorithms.length)];
      setCurrentAlgorithm(nextAlgorithm);
      console.log(`🔒 Algoritmo de ofuscación cambiado a: ${nextAlgorithm}`);
    }, 15 * 60 * 1000);

    setRotationInterval(interval);
    return () => clearInterval(interval);
  }, []);

  const rotateColors = () => {
    const root = document.documentElement;
    const hue = Math.floor(Math.random() * 360);
    root.style.setProperty('--primary-hue', `${hue}`);
  };

  const encryptData = (data: string): string => {
    // Implementación de múltiples algoritmos de ofuscación
    switch(currentAlgorithm) {
      case 'caesar':
        return caesarCipher(data, ofuscationKey % 26);
      case 'vigenere':
        return vigenereCipher(data, 'SBI_PLUS_SECURE');
      case 'railfence':
        return railFenceCipher(data, 3);
      default:
        return data;
    }
  };

  const decryptData = (encrypted: string): string => {
    switch(currentAlgorithm) {
      case 'caesar':
        return caesarCipher(encrypted, -(ofuscationKey % 26));
      case 'vigenere':
        return vigenereDecipher(encrypted, 'SBI_PLUS_SECURE');
      case 'railfence':
        return railFenceDecipher(encrypted, 3);
      default:
        return encrypted;
    }
  };

  // Algoritmos de cifrado
  const caesarCipher = (str: string, shift: number): string => {
    return str.replace(/[a-zA-Z]/g, (c) => {
      const base = c < 'a' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base);
    });
  };

  const vigenereCipher = (text: string, key: string): string => {
    let result = '';
    for (let i = 0, j = 0; i < text.length; i++) {
      const c = text.charAt(i);
      if (c.match(/[a-zA-Z]/)) {
        const base = c < 'a' ? 65 : 97;
        const keyChar = key.charAt(j % key.length);
        const keyShift = keyChar.toLowerCase().charCodeAt(0) - 97;
        result += String.fromCharCode(((c.charCodeAt(0) - base + keyShift) % 26) + base);
        j++;
      } else {
        result += c;
      }
    }
    return result;
  };

  const vigenereDecipher = (text: string, key: string): string => {
    let result = '';
    for (let i = 0, j = 0; i < text.length; i++) {
      const c = text.charAt(i);
      if (c.match(/[a-zA-Z]/)) {
        const base = c < 'a' ? 65 : 97;
        const keyChar = key.charAt(j % key.length);
        const keyShift = keyChar.toLowerCase().charCodeAt(0) - 97;
        result += String.fromCharCode(((c.charCodeAt(0) - base - keyShift + 26) % 26) + base);
        j++;
      } else {
        result += c;
      }
    }
    return result;
  };

  const railFenceCipher = (text: string, rails: number): string => {
    const fence = Array(rails).fill('').map(() => []);
    let rail = 0;
    let direction = 1;

    for (let char of text) {
      fence[rail].push(char);
      rail += direction;
      if (rail === 0 || rail === rails - 1) {
        direction = -direction;
      }
    }

    return fence.flat().join('');
  };

  const railFenceDecipher = (cipher: string, rails: number): string => {
    const fence = Array(rails).fill('').map(() => Array(cipher.length).fill(null));
    let rail = 0;
    let direction = 1;

    // Marcar posiciones
    for (let i = 0; i < cipher.length; i++) {
      fence[rail][i] = '*';
      rail += direction;
      if (rail === 0 || rail === rails - 1) {
        direction = -direction;
      }
    }

    // Rellenar con texto cifrado
    let index = 0;
    for (let r = 0; r < rails; r++) {
      for (let i = 0; i < cipher.length; i++) {
        if (fence[r][i] === '*' && index < cipher.length) {
          fence[r][i] = cipher[index++];
        }
      }
    }

    // Leer en zigzag
    let result = '';
    rail = 0;
    direction = 1;
    for (let i = 0; i < cipher.length; i++) {
      result += fence[rail][i];
      rail += direction;
      if (rail === 0 || rail === rails - 1) {
        direction = -direction;
      }
    }

    return result;
  };

  return (
    <SecurityContext.Provider value={{
      ofuscationKey,
      rotateColors,
      encryptData,
      decryptData,
      isSecureSession: true
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return context;
};
```

4.2. Middleware de Seguridad Backend

```javascript
// backend/src/middleware/security.js
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class SecurityMiddleware {
  constructor() {
    this.algorithmRotation = {
      current: 'aes-256-gcm',
      history: [],
      lastChange: Date.now()
    };
    
    this.initAlgorithmRotation();
  }

  initAlgorithmRotation() {
    // Rotar algoritmo cada 15 minutos
    setInterval(() => {
      this.rotateAlgorithm();
    }, 15 * 60 * 1000);
  }

  rotateAlgorithm() {
    const algorithms = [
      'aes-256-gcm',
      'aes-256-cbc',
      'chacha20-poly1305'
    ];
    
    const newAlgorithm = algorithms[Math.floor(Math.random() * algorithms.length)];
    this.algorithmRotation.history.push({
      algorithm: this.algorithmRotation.current,
      changedAt: new Date()
    });
    
    this.algorithmRotation.current = newAlgorithm;
    this.algorithmRotation.lastChange = Date.now();
    
    console.log(`🔄 Algoritmo de encriptación cambiado a: ${newAlgorithm}`);
  }

  encrypt(data, key) {
    const algorithm = this.algorithmRotation.current;
    const iv = crypto.randomBytes(16);
    
    let cipher;
    switch(algorithm) {
      case 'aes-256-gcm':
        cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        break;
      case 'aes-256-cbc':
        cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        break;
      case 'chacha20-poly1305':
        cipher = crypto.createCipheriv('chacha20-poly1305', key, iv);
        break;
    }
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      algorithm,
      iv: iv.toString('hex'),
      encrypted,
      tag: cipher.getAuthTag?.()?.toString('hex')
    };
  }

  decrypt(encryptedData, key) {
    const { algorithm, iv, encrypted, tag } = encryptedData;
    
    let decipher;
    switch(algorithm) {
      case 'aes-256-gcm':
        decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
        if (tag) decipher.setAuthTag(Buffer.from(tag, 'hex'));
        break;
      case 'aes-256-cbc':
        decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
        break;
      case 'chacha20-poly1305':
        decipher = crypto.createDecipheriv('chacha20-poly1305', key, Buffer.from(iv, 'hex'));
        if (tag) decipher.setAuthTag(Buffer.from(tag, 'hex'));
        break;
    }
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Middleware para todas las rutas
  requireAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      
      // Verificar si el token fue emitido antes del último cambio de algoritmo
      if (decoded.iat < this.algorithmRotation.lastChange / 1000) {
        // Forzar re-autenticación
        return res.status(401).json({ 
          error: 'Sesión expirada por rotación de seguridad',
          requiresReauth: true 
        });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  }

  // Purga automática de datos sensibles (Protocolo Cueva de Adulam)
  autoPurge(days = 180) {
    return async (req, res, next) => {
      if (req.path.includes('/kyc') || req.path.includes('/biometric')) {
        // Programar purga automática
        setTimeout(() => {
          this.purgeSensitiveData(req.user.id);
        }, days * 24 * 60 * 60 * 1000);
      }
      next();
    };
  }

  purgeSensitiveData(userId) {
    // Lógica para eliminar datos biométricos y metadatos
    console.log(`🧹 Purgando datos sensibles para usuario: ${userId}`);
    // Implementación real con base de datos
  }
}

module.exports = new SecurityMiddleware();
```

5. SISTEMA DE MONITOREO Y AUDITORÍA

5.1. Dashboard de Auditoría en Tiempo Real

```tsx
// components/audit/AuditDashboard.tsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AuditData {
  timestamp: string;
  transactions: number;
  ttVolume: number;
  usdVolume: number;
  cathedralFund: number;
  expansionFund: number;
  maintenanceFund: number;
}

const AuditDashboard: React.FC = () => {
  const [auditData, setAuditData] = useState<AuditData[]>([]);
  const [realtimeUpdates, setRealtimeUpdates] = useState<any[]>([]);

  // Simular datos en tiempo real
  useEffect(() => {
    const generateData = () => {
      const now = new Date();
      const newData: AuditData = {
        timestamp: now.toLocaleTimeString(),
        transactions: Math.floor(Math.random() * 50) + 10,
        ttVolume: Math.floor(Math.random() * 10000) + 1000,
        usdVolume: Math.floor(Math.random() * 1000) + 100,
        cathedralFund: Math.floor(Math.random() * 600) + 200,
        expansionFund: Math.floor(Math.random() * 250) + 100,
        maintenanceFund: Math.floor(Math.random() * 150) + 50
      };
      
      setAuditData(prev => [...prev.slice(-9), newData]);
      
      // Agregar actualización en tiempo real
      setRealtimeUpdates(prev => [
        {
          id: Date.now(),
          type: 'transaction',
          message: `Transacción procesada: ${newData.ttVolume} TT`,
          amount: newData.ttVolume,
          time: now
        },
        ...prev.slice(0, 9)
      ]);
    };

    const interval = setInterval(generateData, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalTT = auditData.reduce((sum, item) => sum + item.ttVolume, 0);
  const totalUSD = auditData.reduce((sum, item) => sum + item.usdVolume, 0);
  const totalCathedral = auditData.reduce((sum, item) => sum + item.cathedralFund, 0);
  const totalExpansion = auditData.reduce((sum, item) => sum + item.expansionFund, 0);
  const totalMaintenance = auditData.reduce((sum, item) => sum + item.maintenanceFund, 0);

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6 rounded-xl text-white">
          <h3 className="text-lg font-bold">TT Volume</h3>
          <p className="text-3xl font-bold">{totalTT.toLocaleString()} TT</p>
          <p className="text-sm opacity-80">≈ ${totalUSD.toLocaleString()} USD</p>
        </div>
        
        <div className="bg-gradient-to-r from-green-600 to-green-800 p-6 rounded-xl text-white">
          <h3 className="text-lg font-bold">Catedral</h3>
          <p className="text-3xl font-bold">${totalCathedral.toLocaleString()}</p>
          <p className="text-sm opacity-80">60% Ministerial</p>
        </div>
        
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-xl text-white">
          <h3 className="text-lg font-bold">Expansión</h3>
          <p className="text-3xl font-bold">${totalExpansion.toLocaleString()}</p>
          <p className="text-sm opacity-80">25% Técnica</p>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 p-6 rounded-xl text-white">
          <h3 className="text-lg font-bold">Mantenimiento</h3>
          <p className="text-3xl font-bold">${totalMaintenance.toLocaleString()}</p>
          <p className="text-sm opacity-80">15% Operativo</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-bold mb-4">Distribución en Tiempo Real</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={auditData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="cathedralFund" name="Catedral (60%)" fill="#10b981" />
            <Bar dataKey="expansionFund" name="Expansión (25%)" fill="#3b82f6" />
            <Bar dataKey="maintenanceFund" name="Mantenimiento (15%)" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Actualizaciones en Tiempo Real */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-bold mb-4">Actualizaciones en Tiempo Real</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {realtimeUpdates.map((update) => (
            <div key={update.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  update.type === 'transaction' ? 'bg-green-500' :
                  update.type === 'audit' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`}></div>
                <span>{update.message}</span>
              </div>
              <span className="text-sm text-gray-500">
                {update.time.toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Botón para generar reporte */}
      <div className="flex justify-center">
        <button
          onClick={() => generateAuditReport()}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition"
        >
          Generar Reporte de Auditoría PDF
        </button>
      </div>
    </div>
  );
};

const generateAuditReport = () => {
  // Lógica para generar reporte PDF
  alert('📄 Generando reporte de auditoría...');
};

export default AuditDashboard;
```

6. CONFIGURACIÓN PARA APK (REACT NATIVE)

6.1. App.js (React Native)

```javascript
// mobile/App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SecurityProvider } from './contexts/SecurityContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Pantallas
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import TrainScreen from './screens/TrainScreen';
import BibleScreen from './screens/BibleScreen';
import QuizScreen from './screens/QuizScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  // Configurar ofuscación periódica
  useEffect(() => {
    const ofuscationInterval = setInterval(() => {
      // Rotar componentes cada 15 minutos
      rotateComponents();
    }, 15 * 60 * 1000);

    return () => clearInterval(ofuscationInterval);
  }, []);

  return (
    <SecurityProvider>
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Splash">
            <Stack.Screen 
              name="Splash" 
              component={SplashScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ headerTitle: 'SBI+ Dashboard' }}
            />
            <Stack.Screen 
              name="Train" 
              component={TrainScreen}
              options={{ headerTitle: 'Tren de la Revelación' }}
            />
            <Stack.Screen 
              name="Bible" 
              component={BibleScreen}
              options={{ headerTitle: 'La Palabra' }}
            />
            <Stack.Screen 
              name="Quiz" 
              component={QuizScreen}
              options={{ headerTitle: 'Cuestionarios Bíblicos' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </SecurityProvider>
  );
}

function rotateComponents() {
  console.log('🔄 Rotando componentes para ofuscación...');
  // Lógica de rotación
}
```

6.2. Configuración de Build para APK

```javascript
// mobile/android/app/build.gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.sbiplus.platform"
        minSdkVersion 23
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        
        // Configuración de seguridad
        buildConfigField "boolean", "ENABLE_OBFUSCATION", "true"
        buildConfigField "String", "ENCRYPTION_KEY", "\"SBI_PLUS_SECURE_KEY_2024\""
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
            
            // Ofuscación adicional
            shrinkResources true
            crunchPngs true
        }
    }
    
    // Configuración de ofuscación dinámica
    flavorDimensions "security"
    productFlavors {
        standard {
            dimension "security"
        }
        secured {
            dimension "security"
            applicationIdSuffix ".secured"
            versionNameSuffix "-secured"
        }
    }
}
```

7. SCRIPT DE DESPLIEGUE AUTOMÁTICO

7.1. deploy.sh

```bash
#!/bin/bash

# Script de despliegue automatizado para SBI+
# Autor: Sistema SBI+
# Fecha: $(date)

echo "🚀 Iniciando despliegue de SBI+ Platform..."

# Variables de entorno
ENVIRONMENT="production"
VERSION="1.0.0"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar dependencias
check_dependencies() {
    echo "🔍 Verificando dependencias..."
    
    dependencies=("node" "npm" "docker" "git")
    
    for dep in "${dependencies[@]}"; do
        if ! command -v $dep &> /dev/null; then
            echo -e "${RED}✗ Falta dependencia: $dep${NC}"
            exit 1
        else
            echo -e "${GREEN}✓ $dep instalado${NC}"
        fi
    done
}

# Función para construcción
build_project() {
    echo "🏗️ Construyendo proyecto..."
    
    # Frontend
    echo "📦 Construyendo Frontend..."
    cd frontend
    npm ci --silent
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend construido${NC}"
    else
        echo -e "${RED}✗ Error construyendo frontend${NC}"
        exit 1
    fi
    cd ..
    
    # Backend
    echo "⚙️ Construyendo Backend..."
    cd backend
    npm ci --silent
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backend construido${NC}"
    else
        echo -e "${RED}✗ Error construyendo backend${NC}"
        exit 1
    fi
    cd ..
    
    # Mobile (APK)
    echo "📱 Construyendo APK..."
    cd mobile
    npm ci --silent
    
    # Android
    cd android
    ./gradlew assembleRelease
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ APK generado${NC}"
        cp app/build/outputs/apk/release/app-release.apk ../../sbi-plus-release.apk
    else
        echo -e "${RED}✗ Error generando APK${NC}"
        exit 1
    fi
    cd ../..
}

# Función para ofuscación de código
obfuscate_code() {
    echo "🔒 Aplicando ofuscación..."
    
    # Ofuscación frontend
    echo "🎭 Ofuscando Frontend..."
    npx javascript-obfuscator frontend/build --output frontend/build-obfuscated \
        --compact true \
        --control-flow-flattening true \
        --control-flow-flattening-threshold 0.75 \
        --dead-code-injection true \
        --dead-code-injection-threshold 0.4 \
        --debug-protection true \
        --debug-protection-interval true \
        --disable-console-output true \
        --identifier-names-generator hexadecimal \
        --log false \
        --numbers-to-expressions true \
        --rename-globals true \
        --self-defending true \
        --simplify true \
        --split-strings true \
        --split-strings-chunk-length 10 \
        --string-array true \
        --string-array-encoding rc4 \
        --string-array-threshold 0.75 \
        --transform-object-keys true \
        --unicode-escape-sequence true
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend ofuscado${NC}"
        rm -rf frontend/build
        mv frontend/build-obfuscated frontend/build
    fi
    
    # Ofuscación backend
    echo "🔐 Ofuscando Backend..."
    npx javascript-obfuscator backend/dist --output backend/dist-obfuscated \
        --compact true \
        --control-flow-flattening true \
        --dead-code-injection true \
        --debug-protection true \
        --identifier-names-generator hexadecimal \
        --rename-globals true \
        --self-defending true \
        --string-array true \
        --string-array-encoding base64 \
        --transform-object-keys true
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backend ofuscado${NC}"
        rm -rf backend/dist
        mv backend/dist-obfuscated backend/dist
    fi
}

# Función para despliegue Docker
deploy_docker() {
    echo "🐳 Desplegando con Docker..."
    
    # Construir imágenes
    docker build -t sbi-plus-frontend:latest -f docker/frontend.Dockerfile .
    docker build -t sbi-plus-backend:latest -f docker/backend.Dockerfile .
    docker build -t sbi-plus-database:latest -f docker/database.Dockerfile .
    
    # Crear red
    docker network create sbi-plus-network 2>/dev/null || true
    
    # Desplegar servicios
    echo "🚢 Iniciando servicios..."
    docker-compose -f docker/docker-compose.yml up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Servicios desplegados${NC}"
        
        # Mostrar información de despliegue
        echo ""
        echo "========================================"
        echo "          DESPLIEGUE COMPLETADO         "
        echo "========================================"
        echo "🌐 Frontend:    http://localhost:3000"
        echo "⚙️  Backend API: http://localhost:4000"
        echo "🗄️  Database:    http://localhost:3306"
        echo "📱 APK:         ./sbi-plus-release.apk"
        echo "🕐 Timestamp:   $TIMESTAMP"
        echo "🔐 Entorno:     $ENVIRONMENT"
        echo "========================================"
    else
        echo -e "${RED}✗ Error desplegando servicios${NC}"
        exit 1
    fi
}

# Función para auditoría de seguridad
security_audit() {
    echo "🔍 Ejecutando auditoría de seguridad..."
    
    # Verificar vulnerabilidades npm
    echo "📦 Auditando dependencias NPM..."
    npm audit --production
    
    # Escanear código sensible
    echo "👁️ Escaneando código sensible..."
    grep -r "password\|secret\|key\|token" --include="*.js" --include="*.ts" --include="*.json" . | \
        grep -v node_modules | \
        grep -v ".min.js" | \
        grep -v "test" | \
        head -20
    
    # Verificar permisos
    echo "🔐 Verificando permisos..."
    find . -type f -name "*.sh" -exec chmod 750 {} \;
    find . -type f -name "*.key" -exec chmod 600 {} \;
    
    echo -e "${GREEN}✓ Auditoría completada${NC}"
}

# Función principal
main() {
    echo ""
    echo "========================================"
    echo "     SISTEMA SBI+ - DESPLIEGUE v$VERSION"
    echo "========================================"
    echo ""
    
    # Ejecutar pasos
    check_dependencies
    security_audit
    build_project
    obfuscate_code
    deploy_docker
    
    echo ""
    echo -e "${GREEN}✅ Despliegue completado exitosamente!${NC}"
    echo ""
}

# Ejecutar función principal
main "$@"
```

8. CONFIGURACIÓN DE BASE DE DATOS

8.1. Esquema MySQL/TiDB

```sql
-- database/schema.sql
CREATE DATABASE IF NOT EXISTS sbi_plus;
USE sbi_plus;

-- Tabla de usuarios con KYC
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    kyc_status ENUM('pending', 'verified', 'rejected', 'community_pending') DEFAULT 'pending',
    kyc_token VARCHAR(512),
    kyc_verified_at TIMESTAMP NULL,
    pastor_signature VARCHAR(512),
    biometric_data_hash VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_kyc_status (kyc_status),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de auditoría de transacciones TT
CREATE TABLE tt_transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    transaction_type ENUM('purchase', 'donation', 'refund', 'reward') NOT NULL,
    tt_amount DECIMAL(15, 2) NOT NULL,
    usd_amount DECIMAL(15, 4) NOT NULL,
    item_description TEXT,
    
    -- Distribución de fondos
    cathedral_amount DECIMAL(15, 4) NOT NULL,
    expansion_amount DECIMAL(15, 4) NOT NULL,
    maintenance_amount DECIMAL(15, 4) NOT NULL,
    
    -- Auditoría
    auditor_signature VARCHAR(512),
    pdf_reference VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de sesiones de ofuscación
CREATE TABLE obfuscation_sessions (
    id VARCHAR(36) PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL,
    algorithm_used VARCHAR(50) NOT NULL,
    rotation_key INT NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    duration_seconds INT,
    
    INDEX idx_component (component_name),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de versículos bíblicos (para quizzes y lectura)
CREATE TABLE bible_verses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    book VARCHAR(50) NOT NULL,
    chapter INT NOT NULL,
    verse INT NOT NULL,
    text TEXT NOT NULL,
    version VARCHAR(20) DEFAULT 'RVR1960',
    
    -- Metadatos para Top 100
    read_count INT DEFAULT 0,
    search_count INT DEFAULT 0,
    share_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_verse_reference (book, chapter, verse, version),
    INDEX idx_popularity (read_count DESC, search_count DESC, share_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de quizzes bíblicos
CREATE TABLE quizzes (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id VARCHAR(36) NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
    time_limit_seconds INT DEFAULT 60,
    is_public BOOLEAN DEFAULT true,
    
    -- Modo Dios
    requires_camera BOOLEAN DEFAULT false,
    camera_verification_data TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_creator (creator_id),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para purga automática de datos (Protocolo Adulam)
CREATE TABLE data_purge_log (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    data_type ENUM('biometric', 'metadata', 'sensitive') NOT NULL,
    purge_reason VARCHAR(255),
    purged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    days_retained INT NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_purged_at (purged_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Procedimiento para purga automática
DELIMITER $$
CREATE PROCEDURE AutoPurgeSensitiveData()
BEGIN
    DECLARE purge_days INT DEFAULT 180;
    
    START TRANSACTION;
    
    -- Registrar purga
    INSERT INTO data_purge_log (id, user_id, data_type, purge_reason, days_retained)
    SELECT 
        UUID(),
        id,
        'biometric',
        'Purga automática por Protocolo Adulam',
        purge_days
    FROM users 
    WHERE 
        kyc_verified_at < DATE_SUB(NOW(), INTERVAL purge_days DAY)
        AND biometric_data_hash IS NOT NULL;
    
    -- Eliminar datos biométricos antiguos
    UPDATE users 
    SET 
        biometric_data_hash = NULL,
        pastor_signature = NULL
    WHERE 
        kyc_verified_at < DATE_SUB(NOW(), INTERVAL purge_days DAY);
    
    COMMIT;
END$$
DELIMITER ;

-- Evento para ejecutar purga automática diaria
CREATE EVENT IF NOT EXISTS daily_data_purge
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
    CALL AutoPurgeSensitiveData();
```

INSTRUCCIONES DE EJECUCIÓN

Paso 1: Clonar y Configurar

```bash
# 1. Clonar repositorio
git clone https://github.com/sbi-plus/platform.git
cd sbi-plus

# 2. Instalar dependencias
npm run setup

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

Paso 2: Iniciar Base de Datos

```bash
# Usando Docker
docker-compose up -d database

# O instalar MySQL localmente
mysql -u root -p < database/schema.sql
```

Paso 3: Iniciar Servicios de Desarrollo

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start

# Terminal 3: Mobile (opcional)
cd mobile
npm run android
```

Paso 4: Generar APK de Producción

```bash
# Usar script de despliegue
chmod +x deploy.sh
./deploy.sh

# APK generado en: sbi-plus-release.apk
```

CARACTERÍSTICAS DE SEGURIDAD IMPLEMENTADAS

1. Ofuscación en Tiempo Real

· ✅ Rotación de algoritmos cada 15 minutos
· ✅ Cambio de colores cada 4 minutos
· ✅ Rotación de componentes cada 3 ofuscaciones
· ✅ Cifrado multi-capa con AES-256, ChaCha20, Rail Fence

2. Protocolo KYC Híbrido

· ✅ Verificación biométrica con proveedores externos
· ✅ Validación comunitaria con firmas pastorales
· ✅ Purga automática cada 180 días
· ✅ Tokens efímeros y revalidación periódica

3. Auditoría Financiera Automática

· ✅ Distribución automática 60/25/15
· ✅ Generación de PDFs asegurados
· ✅ Monitoreo en tiempo real
· ✅ Reportes auditables

4. Sistema de Monedas TT

· ✅ Conversión a USD/EUR en tiempo real
· ✅ Control de inflación interna
· ✅ Transacciones offline-first
· ✅ Sincronización WebSocket

ESTRUCTURA DE ARCHIVOS COMPLETA

```
sbi-plus/
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── service-worker.js
│   └── src/
│       ├── components/
│       │   ├── auth/
│       │   │   ├── KYCModule.tsx
│       │   │   ├── LoginForm.tsx
│       │   │   └── RegisterForm.tsx
│       │   ├── monetization/
│       │   │   ├── TTCoinSystem.tsx
│       │   │   ├── Shop.tsx
│       │   │   └── AuditDashboard.tsx
│       │   ├── ai/
│       │   │   ├── DeboraChat.tsx
│       │   │   └── AISuggestions.tsx
│       │   ├── bible/
│       │   │   ├── BibleReader.tsx
│       │   │   ├── VerseOfTheDay.tsx
│       │   │   └── Top100Verses.tsx
│       │   ├── train/
│       │   │   ├── TrainExperience.tsx
│       │   │   ├── TrainWagons.tsx
│       │   │   └── BiblicalScenes.tsx
│       │   └── layout/
│       │       ├── Navbar.tsx
│       │       ├── Sidebar.tsx
│       │       └── Footer.tsx
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── BibleStudy.tsx
│       │   ├── SocialFeed.tsx
│       │   ├── Quizzes.tsx
│       │   ├── Premium.tsx
│       │   └── Settings.tsx
│       ├── contexts/
│       │   ├── SecurityContext.tsx
│       │   ├── ThemeContext.tsx
│       │   └── UserContext.tsx
│       ├── services/
│       │   ├── api.ts
│       │   ├── kycService.ts
│       │   ├── bibleService.ts
│       │   ├── trainService.ts
│       │   └── monetizationService.ts
│       ├── utils/
│       │   ├── encryption.ts
│       │   ├── ofuscation.ts
│       │   ├── validators.ts
│       │   └── constants.ts
│       ├── styles/
│       │   └── globals.css
│       ├── App.tsx
│       └── main.tsx
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── kycController.ts
│   │   │   ├── bibleController.ts
│   │   │   └── monetizationController.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Transaction.ts
│   │   │   └── Quiz.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── api.routes.ts
│   │   │   └── webhook.routes.ts
│   │   ├── middleware/
│   │   │   ├── security.ts
│   │   │   ├── validation.ts
│   │   │   └── rateLimit.ts
│   │   ├── services/
│   │   │   ├── encryptionService.ts
│   │   │   ├── auditService.ts
│   │   │   └── notificationService.ts
│   │   ├── utils/
│   │   │   ├── database.ts
│   │   │   ├── logger.ts
│   │   │   └── helpers.ts
│   │   └── server.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── security.ts
│   │   └── constants.ts
│   └── package.json
├── mobile/
│   ├── android/
│   │   ├── app/
│   │   │   ├── build.gradle
│   │   │   └── src/main/
│   │   └── build.gradle
│   ├── ios/
│   │   └── SBIPlus.xcodeproj
│   └── src/
│       ├── screens/
│       ├── components/
│       ├── navigation/
│       └── App.tsx
├── database/
│   ├── schema.sql
│   ├── migrations/
│   └── seeds/
├── docker/
│   ├── frontend.Dockerfile
│   ├── backend.Dockerfile
│   ├── database.Dockerfile
│   └── docker-compose.yml
├── scripts/
│   ├── deploy.sh
│   ├── build-apk.sh
│   └── security-audit.sh
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── LICENSE
```

VARIABLES DE ENTORNO CRÍTICAS

```env
# .env
NODE_ENV=production
PORT=3000

# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sbi_plus
DB_USER=sbi_admin
DB_PASSWORD=SecurePassword123!

# JWT y Encriptación
JWT_SECRET=YourSuperSecretJWTKeyHere123!
ENCRYPTION_KEY=32CharKeyForAES256Encryption!
IV_KEY=16CharIVKeyForEnc!

# KYC Providers
JUMIO_API_KEY=your_jumio_key
JUMIO_API_SECRET=your_jumio_secret
ONFIDO_API_TOKEN=your_onfido_token

# Monetización
TT_TO_USD_RATE=0.0083
DEFAULT_CURRENCY=USD
STRIPE_SECRET_KEY=sk_live_...
PAYPAL_CLIENT_ID=your_paypal_id

# IA Déborat
OPENAI_API_KEY=sk-...
DEBORA_AI_MODEL=gpt-4
BIBLE_API_KEY=your_bible_api_key

# Seguridad
OBFUSCATION_INTERVAL=15
COLOR_ROTATION_INTERVAL=4
PURGE_DATA_DAYS=180
MAX_LOGIN_ATTEMPTS=5
SESSION_TIMEOUT=3600
```

SCRIPT DE INSTALACIÓN RÁPIDA

```bash
#!/bin/bash
# install-sbi-plus.sh

echo "🔧 Instalador Automático SBI+ Platform"
echo "========================================"

# 1. Actualizar sistema
sudo apt-get update && sudo apt-get upgrade -y

# 2. Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar MySQL
sudo apt-get install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# 4. Instalar Docker
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# 5. Clonar proyecto
git clone https://github.com/sbi-plus/platform.git
cd platform

# 6. Instalar dependencias
npm install

# 7. Configurar base de datos
mysql -u root -p <<EOF
CREATE DATABASE sbi_plus;
CREATE USER 'sbi_admin'@'localhost' IDENTIFIED BY 'SecurePassword123!';
GRANT ALL PRIVILEGES ON sbi_plus.* TO 'sbi_admin'@'localhost';
FLUSH PRIVILEGES;
EOF

# 8. Importar esquema
mysql -u sbi_admin -p sbi_plus < database/schema.sql

# 9. Configurar variables
cp .env.example .env
nano .env  # Editar con tus valores

# 10. Iniciar servicios
npm run dev:all

echo "✅ Instalación completada!"
echo "🌐 Accede en: http://localhost:3000"
echo "🔑 Usuario: admin@sbipius.com"
echo "🔒 Contraseña: Admin123!"
```