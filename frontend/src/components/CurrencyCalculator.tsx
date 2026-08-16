import { useEffect, useState } from 'react';
import { Calculator, X, ArrowRightLeft, RefreshCw } from 'lucide-react';

interface Rates { date: string; base: string; rates: Record<string, number>; names: Record<string, string>; symbols: Record<string, string>; }

const BASE = '/api';

export default function CurrencyCalculator() {
  const [open, setOpen] = useState(false);
  const [rates, setRates] = useState<Rates | null>(null);
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('CUP');
  const [to, setTo] = useState('USD');
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => { loadRates(); }, []);

  const loadRates = async () => {
    const res = await fetch(`${BASE}/currency/rates`);
    if (res.ok) setRates(await res.json());
  };

  const convert = async () => {
    const res = await fetch(`${BASE}/currency/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount) || 0, from_currency: from, to_currency: to }),
    });
    if (res.ok) { const data = await res.json(); setResult(data.converted_amount); }
  };

  useEffect(() => { if (amount && rates) convert(); }, [amount, from, to]);

  const swap = () => { setFrom(to); setTo(from); };
  const currencies = rates ? ['CUP', ...Object.keys(rates.rates)] : ['CUP', 'USD', 'EUR', 'MLC'];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-gold text-black flex items-center justify-center shadow-lg hover:bg-brand-gold-light transition-all hover:scale-110"
        title="Calculadora de Monedas"
      >
        <Calculator className="w-6 h-6" />
      </button>

      {/* Calculator Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-brand-card border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-brand-dark px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-brand-gold" />
              <span className="text-brand-gold font-bold text-sm">Convertidor de Monedas</span>
            </div>
            <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>

          <div className="p-4">
            {rates && (
              <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                Tasas del {rates.date}
                <button onClick={loadRates}><RefreshCw className="w-3 h-3" /></button>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Cantidad</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input-field !py-2 text-lg" />
              </div>

              <div className="grid grid-cols-5 gap-2 items-center">
                <div className="col-span-2">
                  <label className="text-xs text-gray-400">De</label>
                  <select value={from} onChange={e => setFrom(e.target.value)} className="input-field !py-2 text-sm">
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex justify-center pt-4">
                  <button onClick={swap} className="text-brand-gold hover:text-brand-gold-light"><ArrowRightLeft className="w-4 h-4" /></button>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400">A</label>
                  <select value={to} onChange={e => setTo(e.target.value)} className="input-field !py-2 text-sm">
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {result !== null && (
                <div className="bg-brand-dark rounded-lg p-3 text-center">
                  <span className="text-gray-400 text-sm">{rates?.symbols?.[from] || ''}{amount} {from} =</span>
                  <div className="text-2xl font-bold text-brand-gold">{rates?.symbols?.[to] || ''}{result.toFixed(2)} {to}</div>
                </div>
              )}
            </div>

            {/* Quick rates */}
            {rates && (
              <div className="mt-3 border-t border-gray-800 pt-3">
                <p className="text-xs text-gray-500 mb-2">Tasas del día (1 unidad = CUP)</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {Object.entries(rates.rates).map(([code, rate]) => (
                    <div key={code} className="flex justify-between bg-brand-dark rounded px-2 py-1">
                      <span className="text-gray-400">{code}</span>
                      <span className="text-white">{rate} CUP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
