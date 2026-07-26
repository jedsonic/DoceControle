import React, { useState, useEffect } from 'react';
import { User, ShippingRate } from '../types';
import { StorageService } from '../lib/storage';
import { DataService } from '../lib/dataService';
import { MapPin, Phone, Plus, Trash2, Copy, Check, Link, Navigation, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FreteConfigProps {
  userId: string;
}

export default function FreteConfig({ userId }: FreteConfigProps) {
  const [user, setUser] = useState<User | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [rates, setRates] = useState<ShippingRate[]>([]);
  
  // Form para nova taxa
  const [newMaxDist, setNewMaxDist] = useState('');
  const [newPrice, setNewPrice] = useState('');
  
  const [isCopied, setIsCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const userData = StorageService.getUserById(userId);
    if (userData) {
      setUser(userData);
      setWhatsapp(userData.whatsapp || '');
      setAddress(userData.address || '');
      setLatitude(userData.latitude ? String(userData.latitude) : '');
      setLongitude(userData.longitude ? String(userData.longitude) : '');
      setRates(userData.shippingRates || []);
    }
  }, [userId]);

  // Atualizar link sempre que os dados mudarem
  useEffect(() => {
    if (!user) return;
    
    // Obter produtos em estoque
    DataService.getAllStock(userId).then(stock => {
      const inStock = stock.filter(p => p.quantity > 0);
      const catalogData = {
        id: userId,
        businessName: user.businessName,
        whatsapp: whatsapp,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        shippingRates: rates,
        products: inStock.map(p => ({
          id: p.id,
          name: p.name,
          priceSale: p.priceSale,
          quantity: p.quantity,
          image: p.image
        }))
      };
      
      try {
        const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(catalogData))));
        setCopiedLink(`${window.location.origin}/#c=${base64Data}`);
      } catch (e) {
        // Fallback simplificado
        setCopiedLink(`${window.location.origin}/#catalogo=${userId}`);
      }
    });
  }, [user, whatsapp, address, latitude, longitude, rates, userId]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Navegador não suporta geolocalização.');
      return;
    }
    
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setLoadingLocation(false);
        setMessage({ text: 'Localização GPS obtida com sucesso!', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      },
      (error) => {
        setLoadingLocation(false);
        alert('Não foi possível obter a localização. Verifique as permissões do seu navegador.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleAddRate = (e: React.FormEvent) => {
    e.preventDefault();
    const maxDist = parseFloat(newMaxDist);
    const price = parseFloat(newPrice);

    if (isNaN(maxDist) || maxDist <= 0) {
      alert('A distância máxima precisa ser um número maior que zero.');
      return;
    }
    if (isNaN(price) || price < 0) {
      alert('O valor do frete precisa ser um número válido.');
      return;
    }

    // Adiciona e ordena por distância máxima
    const updatedRates = [...rates, { maxDistanceKm: maxDist, price }].sort(
      (a, b) => a.maxDistanceKm - b.maxDistanceKm
    );
    
    setRates(updatedRates);
    setNewMaxDist('');
    setNewPrice('');
  };

  const handleRemoveRate = (index: number) => {
    const updated = rates.filter((_, i) => i !== index);
    setRates(updated);
  };

  const handleSaveConfig = () => {
    if (!whatsapp.trim()) {
      setMessage({ text: 'Por favor, insira o número de WhatsApp para receber os pedidos.', type: 'error' });
      return;
    }

    const updated = StorageService.updateUserProfile(userId, {
      whatsapp: whatsapp.replace(/\D/g, ''), // Salva apenas dígitos
      address,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      shippingRates: rates
    });

    if (updated) {
      setUser(updated);
      setMessage({ text: 'Configurações de frete e entrega salvas com sucesso!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ text: 'Erro ao salvar configurações.', type: 'error' });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(copiedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-brown-light/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-chocolate flex items-center gap-2">
            <Navigation className="w-6 h-6 text-brand-rose" />
            Configuração de Entregas e Frete
          </h1>
          <p className="text-sm text-brand-brown-light mt-1">
            Configure seu local, regras de frete baseadas em distância e gere o link do cardápio digital para seus clientes.
          </p>
        </div>
        <button
          onClick={handleSaveConfig}
          className="px-5 py-2.5 bg-brand-chocolate hover:bg-brand-chocolate/90 text-white rounded-xl font-semibold text-xs shadow-md active:scale-95 transition cursor-pointer"
        >
          Salvar Configurações
        </button>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-xl border text-xs font-semibold text-center ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Painel Esquerdo: Cadastro do Negócio e Local */}
        <div className="bg-white rounded-2xl border border-brand-brown-light/10 p-5 space-y-4 shadow-xs">
          <h3 className="font-bold text-sm text-brand-chocolate flex items-center gap-2 border-b border-brand-brown-light/5 pb-2">
            <Phone className="w-4 h-4 text-brand-rose" /> Dados do Negócio e Contato
          </h3>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-brand-chocolate uppercase tracking-wider block">
              WhatsApp para Pedidos (com DDD)
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ex: 5511999999999"
              className="w-full px-3 py-2 bg-brand-cream/20 border border-brand-brown-light/15 rounded-xl text-brand-chocolate text-xs focus:outline-none focus:ring-1 focus:ring-brand-rose focus:border-brand-rose"
            />
            <p className="text-[9px] text-brand-brown-light/60">
              *Insira o número completo com DDI (55) + DDD + Número. Ex: 5511999999999
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-brand-chocolate uppercase tracking-wider block">
              Endereço Físico (Opcional)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Av. Paulista, 1000 - São Paulo"
              className="w-full px-3 py-2 bg-brand-cream/20 border border-brand-brown-light/15 rounded-xl text-brand-chocolate text-xs focus:outline-none focus:ring-1 focus:ring-brand-rose focus:border-brand-rose"
            />
          </div>

          <div className="space-y-2 border-t border-brand-brown-light/5 pt-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-brand-chocolate uppercase tracking-wider block flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-rose" /> Coordenadas do Vendedor (GPS)
              </label>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={loadingLocation}
                className="text-[9px] font-bold text-brand-rose hover:text-brand-rose/80 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Navigation className="w-3.5 h-3.5 animate-pulse" />
                {loadingLocation ? 'Obtendo...' : 'Usar minha localização atual'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-brand-brown-light font-medium block">Latitude</span>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Ex: -23.55052"
                  className="w-full px-3 py-2 bg-brand-cream/20 border border-brand-brown-light/15 rounded-xl text-brand-chocolate text-xs focus:outline-none focus:ring-1 focus:ring-brand-rose focus:border-brand-rose"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-brand-brown-light font-medium block">Longitude</span>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Ex: -46.633308"
                  className="w-full px-3 py-2 bg-brand-cream/20 border border-brand-brown-light/15 rounded-xl text-brand-chocolate text-xs focus:outline-none focus:ring-1 focus:ring-brand-rose focus:border-brand-rose"
                />
              </div>
            </div>
            <div className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-[9px] text-amber-800 leading-tight">
                As coordenadas são essenciais para calcular automaticamente a distância do cliente e o preço do frete correto. Obtenha-as usando o botão acima enquanto estiver na sua doceria/loja.
              </p>
            </div>
          </div>
        </div>

        {/* Painel Direito: Tabela de Taxas de Frete por Distância */}
        <div className="bg-white rounded-2xl border border-brand-brown-light/10 p-5 space-y-4 shadow-xs">
          <h3 className="font-bold text-sm text-brand-chocolate flex items-center gap-2 border-b border-brand-brown-light/5 pb-2">
            <Navigation className="w-4 h-4 text-brand-gold" /> Taxas de Frete por Distância
          </h3>

          <form onSubmit={handleAddRate} className="grid grid-cols-5 gap-2 items-end bg-brand-cream/15 p-3 rounded-xl border border-brand-brown-light/5">
            <div className="col-span-2 space-y-1">
              <label className="text-[9px] font-bold text-brand-chocolate block">Até (km)</label>
              <input
                type="number"
                step="any"
                value={newMaxDist}
                onChange={(e) => setNewMaxDist(e.target.value)}
                placeholder="Ex: 5"
                className="w-full px-2.5 py-1.5 bg-white border border-brand-brown-light/15 rounded-lg text-brand-chocolate text-xs focus:outline-none focus:ring-1 focus:ring-brand-rose"
                required
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[9px] font-bold text-brand-chocolate block">Valor (R$)</label>
              <input
                type="number"
                step="any"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Ex: 8.50"
                className="w-full px-2.5 py-1.5 bg-white border border-brand-brown-light/15 rounded-lg text-brand-chocolate text-xs focus:outline-none focus:ring-1 focus:ring-brand-rose"
                required
              />
            </div>
            <button
              type="submit"
              className="py-2 bg-brand-rose hover:bg-brand-rose/90 text-white rounded-lg flex items-center justify-center cursor-pointer transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Listagem de Taxas */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {rates.length === 0 ? (
              <div className="text-center py-6 text-brand-brown-light/50 text-xs">
                Nenhuma faixa de frete cadastrada. Cadastre faixas de entrega acima.
              </div>
            ) : (
              <div className="space-y-1.5">
                {rates.map((rate, idx) => {
                  const min = idx === 0 ? 0 : rates[idx - 1].maxDistanceKm;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-brand-cream/10 border border-brand-brown-light/5 rounded-xl text-xs"
                    >
                      <span className="font-semibold text-brand-chocolate">
                        De {min.toFixed(1)} km até {rate.maxDistanceKm.toFixed(1)} km
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-brand-rose">
                          R$ {rate.price.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRate(idx)}
                          className="text-stone-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seção inferior: Compartilhamento do Link do Cardápio */}
      <div className="bg-gradient-to-r from-brand-pink/30 to-brand-cream/30 border border-brand-pink/50 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-brand-chocolate flex items-center gap-1.5">
            <Link className="w-4 h-4 text-brand-rose animate-bounce" /> Link de Compartilhamento do Cardápio Digital
          </h4>
          <p className="text-[11px] text-brand-brown-light max-w-xl">
            Este link contém o catálogo atualizado do seu estoque de produtos ativos, número do WhatsApp e coordenadas de frete. Compartilhe com seus clientes para que façam pedidos diretamente no celular!
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            readOnly
            value={copiedLink}
            className="flex-1 md:w-64 px-3 py-2 bg-white border border-brand-brown-light/15 rounded-xl text-[10px] font-mono text-brand-chocolate focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
              isCopied ? 'bg-emerald-600 text-white' : 'bg-brand-chocolate text-white hover:bg-brand-chocolate/90'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
