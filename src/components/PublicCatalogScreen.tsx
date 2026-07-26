import React, { useState, useEffect } from 'react';
import { ShippingRate } from '../types';
import { StorageService } from '../lib/storage';
import { ShoppingCart, Plus, Minus, MapPin, Navigation, MessageSquare, CreditCard, Check, AlertCircle, Cake, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CatalogProduct {
  id: string;
  name: string;
  priceSale: number;
  quantity: number;
  image?: string;
}

interface CatalogData {
  id: string;
  businessName: string;
  whatsapp: string;
  latitude?: number;
  longitude?: number;
  shippingRates: ShippingRate[];
  products: CatalogProduct[];
}

export default function PublicCatalogScreen() {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [cart, setCart] = useState<{ product: CatalogProduct; quantity: number }[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientLat, setClientLat] = useState<number | null>(null);
  const [clientLon, setClientLon] = useState<number | null>(null);
  
  const [distance, setDistance] = useState<number | null>(null);
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'cartao'>('pix');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Carregar dados a partir da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    let b64 = params.get('c');
    let sellerId = params.get('catalogo');

    // Se não estiver no search/query string, buscar no hash diretamente para evitar conversão de '+' em ' '
    const hash = window.location.hash;
    if (!b64 && hash.startsWith('#c=')) {
      b64 = decodeURIComponent(hash.substring(3));
    }
    if (!sellerId && hash.startsWith('#catalogo=')) {
      sellerId = decodeURIComponent(hash.substring(10));
    }

    if (b64) {
      try {
        // Substituir espaços de volta para '+' caso a URL tenha sido processada em algum momento como query
        const normalizedB64 = b64.replace(/ /g, '+');
        const decoded = JSON.parse(decodeURIComponent(escape(atob(normalizedB64)))) as CatalogData;
        setCatalog(decoded);
      } catch (err) {
        setErrorMsg('Erro ao decodificar os dados do cardápio digital.');
      }
    } else if (sellerId) {
      // Mesma máquina / teste local
      const seller = StorageService.getUserById(sellerId);
      if (seller) {
        const stock = StorageService.getAllStock(sellerId).filter(p => p.quantity > 0);
        setCatalog({
          id: sellerId,
          businessName: seller.businessName,
          whatsapp: seller.whatsapp || '',
          latitude: seller.latitude,
          longitude: seller.longitude,
          shippingRates: seller.shippingRates || [],
          products: stock.map(p => ({
            id: p.id,
            name: p.name,
            priceSale: p.priceSale,
            quantity: p.quantity,
            image: p.image
          }))
        });
      } else {
        setErrorMsg('Vendedor não encontrado no sistema.');
      }
    } else {
      setErrorMsg('Nenhum catálogo selecionado. Acesse pelo link de compartilhamento correto.');
    }
  }, []);

  // Calcular distância geodésica (Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distância em km
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Navegador não suporta geolocalização.');
      return;
    }

    if (!catalog?.latitude || !catalog?.longitude) {
      alert('O vendedor não configurou suas coordenadas GPS. Não é possível calcular a distância automaticamente.');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setClientLat(lat);
        setClientLon(lon);

        const dist = calculateDistance(lat, lon, catalog.latitude!, catalog.longitude!);
        setDistance(dist);

        // Calcular frete com base na distância
        const applicableRate = catalog.shippingRates.find(
          (rate) => dist <= rate.maxDistanceKm
        );

        if (applicableRate) {
          setShippingFee(applicableRate.price);
        } else if (catalog.shippingRates.length > 0) {
          // Se for maior que o máximo cadastrado, aplica a maior taxa
          const maxRate = catalog.shippingRates[catalog.shippingRates.length - 1];
          setShippingFee(maxRate.price);
        } else {
          setShippingFee(0);
        }
        
        setLoadingLocation(false);
      },
      (error) => {
        setLoadingLocation(false);
        alert('Não foi possível acessar seu GPS. Por favor, insira o endereço manualmente.');
      },
      { enableHighAccuracy: true }
    );
  };

  const geocodeAddress = async (addressText: string) => {
    if (!addressText.trim()) return;
    if (!catalog?.latitude || !catalog?.longitude) {
      alert('Vendedor não possui coordenadas GPS configuradas. Digite a distância manualmente abaixo.');
      return;
    }
    
    setLoadingLocation(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addressText)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setClientLat(lat);
        setClientLon(lon);

        const dist = calculateDistance(lat, lon, catalog.latitude, catalog.longitude);
        setDistance(dist);

        const applicableRate = catalog.shippingRates.find(
          (rate) => dist <= rate.maxDistanceKm
        );
        if (applicableRate) {
          setShippingFee(applicableRate.price);
        } else if (catalog.shippingRates.length > 0) {
          const maxRate = catalog.shippingRates[catalog.shippingRates.length - 1];
          setShippingFee(maxRate.price);
        } else {
          setShippingFee(0);
        }
      } else {
        alert('Endereço não localizado pelo mapa. Por favor, insira a distância estimada em km manualmente abaixo.');
      }
    } catch (e) {
      console.error('Error geocoding:', e);
      alert('Erro ao calcular frete pelo mapa. Por favor, insira a distância estimada em km manualmente abaixo.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleAddToCart = (prod: CatalogProduct) => {
    const existingIndex = cart.findIndex(item => item.product.id === prod.id);
    if (existingIndex !== -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= prod.quantity) {
        alert('Desculpe, limite máximo de estoque do vendedor atingido.');
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product: prod, quantity: 1 }]);
    }
  };

  const handleAdjustQty = (prodId: string, amount: number) => {
    const existingIndex = cart.findIndex(item => item.product.id === prodId);
    if (existingIndex === -1) return;

    const item = cart[existingIndex];
    const newQty = item.quantity + amount;

    if (newQty <= 0) {
      setCart(cart.filter(x => x.product.id !== prodId));
    } else {
      if (newQty > item.product.quantity) {
        alert('Estoque disponível atingido.');
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity = newQty;
      setCart(updated);
    }
  };

  const handleSubmitOrder = () => {
    if (!clientName.trim()) {
      alert('Por favor, informe seu nome.');
      return;
    }
    if (!clientAddress.trim()) {
      alert('Por favor, informe seu endereço para entrega.');
      return;
    }
    if (cart.length === 0) {
      alert('Adicione pelo menos um doce ao seu pedido!');
      return;
    }
    if (!catalog?.whatsapp) {
      alert('Este vendedor não cadastrou um WhatsApp de contato para receber pedidos.');
      return;
    }

    const itemsSubtotal = cart.reduce((sum, item) => sum + item.product.priceSale * item.quantity, 0);
    const totalDelivery = shippingFee || 0;
    const finalTotal = itemsSubtotal + totalDelivery;

    // Montar mensagem para o WhatsApp
    const paymentLabels = { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão de Crédito/Débito' };

    let text = `Olá! Gostaria de fazer um pedido em *${catalog.businessName}*:\n\n`;
    text += `*Cliente:* ${clientName}\n`;
    text += `*Endereço:* ${clientAddress}\n`;
    if (distance !== null) {
      text += `*Distância:* ${distance.toFixed(1)} km\n`;
    }
    text += `*Pagamento:* ${paymentLabels[paymentMethod]}\n\n`;
    
    text += `*Itens do Pedido:*\n`;
    cart.forEach(item => {
      text += `- ${item.quantity}x ${item.product.name} (R$ ${(item.product.priceSale * item.quantity).toFixed(2)})\n`;
    });
    
    text += `\n*Valores:*\n`;
    text += `- Subtotal: R$ ${itemsSubtotal.toFixed(2)}\n`;
    text += `- Frete: R$ ${totalDelivery.toFixed(2)}\n`;
    text += `*Total Geral: R$ ${finalTotal.toFixed(2)}*\n\n`;
    text += `Aguardo a confirmação do pedido!`;

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${catalog.whatsapp}?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
  };

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream/20 p-4 text-center">
        <div className="max-w-md bg-white rounded-3xl p-8 border border-brand-brown-light/10 shadow-xl space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-brand-chocolate">Ops! Algo deu errado</h2>
          <p className="text-sm text-brand-brown-light leading-relaxed">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream/20">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-brand-rose border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-xs text-brand-brown-light font-bold">Carregando catálogo...</span>
        </div>
      </div>
    );
  }

  const itemsSubtotal = cart.reduce((sum, item) => sum + item.product.priceSale * item.quantity, 0);
  const totalAmount = itemsSubtotal + (shippingFee || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-pink/20 via-brand-cream/20 to-white pb-10 text-brand-chocolate font-sans">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-40 bg-white/45 backdrop-blur-xl border-b border-white/50 shadow-xs px-4 py-4 text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 bg-brand-rose rounded-2xl flex items-center justify-center text-white shadow-sm mb-1">
            <Cake className="w-6 h-6" />
          </div>
          <h1 className="font-extrabold text-xl tracking-tight text-brand-chocolate">
            {catalog.businessName}
          </h1>
          <span className="inline-flex items-center gap-1 bg-brand-pink/60 text-brand-chocolate text-[10px] font-bold px-2.5 py-1 rounded-full border border-brand-rose/20">
            <Sparkles className="w-3 h-3 text-brand-gold animate-spin" /> Cardápio Digital & Pedido Rápido
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 grid grid-cols-1 gap-6">
        {/* Produtos em Estoque */}
        <section className="space-y-3">
          <h2 className="font-extrabold text-sm text-brand-chocolate uppercase tracking-wider pl-1">
            Nossos Doces Disponíveis
          </h2>
          
          {catalog.products.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-brand-brown-light/10 text-brand-brown-light/60 text-sm">
              Nenhum doce em estoque disponível para pedidos no momento. Volte mais tarde!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {catalog.products.map((prod) => {
                const cartItem = cart.find((c) => c.product.id === prod.id);
                return (
                  <motion.div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-brand-brown-light/10 p-3.5 flex gap-3 items-center shadow-xs hover:shadow-md transition-all duration-200"
                    whileHover={{ y: -2 }}
                  >
                    {prod.image ? (
                      <img src={prod.image} alt={prod.name} className="w-16 h-16 object-cover rounded-xl border border-brand-brown-light/5 shadow-xs shrink-0" />
                    ) : (
                      <div className="w-16 h-16 bg-brand-rose/5 text-brand-rose/65 rounded-xl flex items-center justify-center shrink-0 border border-brand-rose/10">
                        <Cake className="w-6 h-6 animate-pulse" />
                      </div>
                    )}
                    <div className="space-y-0.5 pr-1 min-w-0 flex-1 text-left">
                      <h3 className="font-bold text-xs text-brand-chocolate leading-snug truncate">{prod.name}</h3>
                      <span className="text-sm font-extrabold text-brand-rose block">
                        R$ {prod.priceSale.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-brand-brown-light font-medium block">
                        Disponível: {prod.quantity} un
                      </span>
                    </div>

                    <div className="shrink-0">
                      {cartItem ? (
                        <div className="flex items-center gap-2.5 bg-brand-cream/40 px-2 py-1.5 rounded-xl border border-brand-brown-light/10">
                          <button
                            onClick={() => handleAdjustQty(prod.id, -1)}
                            className="p-1 bg-white hover:bg-brand-rose/10 hover:text-brand-rose rounded-lg border border-brand-brown-light/5 text-brand-chocolate transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{cartItem.quantity}</span>
                          <button
                            onClick={() => handleAdjustQty(prod.id, 1)}
                            className="p-1 bg-white hover:bg-brand-rose/10 hover:text-brand-rose rounded-lg border border-brand-brown-light/5 text-brand-chocolate transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(prod)}
                          className="px-3.5 py-2 bg-brand-chocolate hover:bg-brand-chocolate/90 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
                        >
                          Adicionar
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Informações de Entrega e Fechamento */}
        {cart.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-brand-brown-light/10 p-5 space-y-5 shadow-lg"
          >
            <h2 className="font-extrabold text-sm text-brand-chocolate uppercase tracking-wider border-b border-brand-brown-light/5 pb-2 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-brand-rose" /> Dados do Seu Pedido
            </h2>

            {/* Itens do Carrinho */}
            <div className="space-y-2.5">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-brand-rose bg-brand-pink/30 px-2 py-0.5 rounded-md">
                      {item.quantity}x
                    </span>
                    <span className="font-medium text-brand-chocolate">{item.product.name}</span>
                  </div>
                  <span className="font-bold text-brand-chocolate">
                    R$ {(item.product.priceSale * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Dados do Cliente */}
            <div className="space-y-3.5 border-t border-brand-brown-light/5 pt-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-chocolate uppercase tracking-wider block">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Digite seu nome completo"
                  className="w-full px-3.5 py-2.5 bg-brand-cream/10 border border-brand-brown-light/15 rounded-xl text-brand-chocolate text-xs focus:outline-none focus:ring-1 focus:ring-brand-rose focus:border-brand-rose"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-[10px] font-bold text-brand-chocolate uppercase tracking-wider block">
                    Endereço de Entrega
                  </label>
                  <div className="flex gap-2">
                    {catalog.latitude && catalog.longitude && (
                      <>
                        <button
                          type="button"
                          onClick={() => geocodeAddress(clientAddress)}
                          disabled={loadingLocation || !clientAddress.trim()}
                          className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 disabled:text-stone-400 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          Calcular frete pelo endereço
                        </button>
                        <span className="text-[9px] text-stone-300">|</span>
                        <button
                          type="button"
                          onClick={handleGetCurrentLocation}
                          disabled={loadingLocation}
                          className="text-[9px] font-bold text-brand-rose hover:text-brand-rose/80 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Navigation className="w-3 h-3 animate-pulse" />
                          {loadingLocation ? 'Calculando...' : 'Usar GPS do Celular'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  onBlur={() => geocodeAddress(clientAddress)}
                  placeholder="Rua, número, bairro, complemento..."
                  className="w-full px-3.5 py-2.5 bg-brand-cream/10 border border-brand-brown-light/15 rounded-xl text-brand-chocolate text-xs focus:outline-none focus:ring-1 focus:ring-brand-rose focus:border-brand-rose"
                />
                
                {/* Fallback de distância manual */}
                <div className="flex items-center justify-between text-xs bg-brand-cream/10 border border-brand-brown-light/10 p-2.5 rounded-xl">
                  <span className="text-brand-brown-light font-medium">Não achou no mapa? Ajuste a distância manualmente (km):</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ex: 4.5"
                    value={distance !== null ? Number(distance.toFixed(1)) : ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val >= 0) {
                        setDistance(val);
                        // Calcular frete com base na distância manual
                        const rate = catalog.shippingRates.find(r => val <= r.maxDistanceKm);
                        if (rate) {
                          setShippingFee(rate.price);
                        } else if (catalog.shippingRates.length > 0) {
                          setShippingFee(catalog.shippingRates[catalog.shippingRates.length - 1].price);
                        } else {
                          setShippingFee(0);
                        }
                      } else {
                        setDistance(null);
                        setShippingFee(null);
                      }
                    }}
                    className="w-20 px-2 py-1 bg-white border border-brand-brown-light/15 rounded-lg text-brand-chocolate font-bold text-center focus:outline-none focus:ring-1 focus:ring-brand-rose text-xs"
                  />
                </div>
              </div>

              {/* Status do cálculo de distância e frete */}
              {distance !== null && (
                <div className="p-3 bg-brand-pink/20 border border-brand-pink/50 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-brand-chocolate flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-rose" />
                    Distância calculada: {distance.toFixed(2)} km
                  </span>
                  <span className="font-bold text-brand-rose">
                    Frete: R$ {shippingFee?.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-2 border-t border-brand-brown-light/5 pt-4">
              <label className="text-[10px] font-bold text-brand-chocolate uppercase tracking-wider block">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['pix', 'dinheiro', 'cartao'] as const).map((method) => {
                  const labels = { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão' };
                  const isSelected = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-1 border rounded-xl font-bold text-xs text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer relative ${
                        isSelected
                          ? 'bg-brand-chocolate text-white border-brand-chocolate'
                          : 'bg-white border-brand-brown-light/15 text-brand-brown-light hover:bg-brand-cream/20'
                      }`}
                    >
                      {isSelected && (
                        <Check className="absolute top-1 right-1 w-3 h-3 text-brand-rose" />
                      )}
                      <CreditCard className="w-4 h-4" />
                      {labels[method]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resumo Final de Valores e Botão de Enviar */}
            <div className="border-t border-brand-brown-light/10 pt-4 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-brand-brown-light">Produtos:</span>
                  <span className="font-medium">R$ {itemsSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-brown-light">Entrega / Frete:</span>
                  <span className="font-medium">
                    {shippingFee !== null ? `R$ ${shippingFee.toFixed(2)}` : 'Calculando...'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-brand-brown-light/5 pt-1.5 text-sm font-extrabold">
                  <span className="text-brand-chocolate">Total Geral:</span>
                  <span className="text-brand-rose text-base">R$ {totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <MessageSquare className="w-5 h-5 animate-pulse" />
                Confirmar e Enviar via WhatsApp
              </button>
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}
