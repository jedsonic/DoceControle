import React, { useState, useEffect } from 'react';
import { StockProduct, SaleItem } from '../types';
import { DataService } from '../lib/dataService';
import { Search, ShoppingCart, Plus, Minus, CreditCard, DollarSign, Sparkles, Check, Trash2, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PdvScreenProps {
  userId: string;
  onBack?: () => void;
  onSaleSuccess?: () => void;
}

export default function PdvScreen({ userId, onBack, onSaleSuccess }: PdvScreenProps) {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ product: StockProduct; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'cartao'>('pix');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [lastSaleTotal, setLastSaleTotal] = useState(0);
  const [customTotal, setCustomTotal] = useState<string>('');

  useEffect(() => {
    loadProducts();
  }, [userId]);

  // Reset custom total when cart changes to prevent carrying over stale custom values
  useEffect(() => {
    setCustomTotal('');
  }, [cart]);

  const loadProducts = async () => {
    const data = await DataService.getAllStock(userId);
    setProducts(data);
  };

  const handleAddToCart = (prod: StockProduct) => {
    if (prod.quantity <= 0) {
      alert('Este produto está sem estoque de produção. Faça uma nova produção para reabastecer.');
      return;
    }

    const existingCartItemIndex = cart.findIndex(item => item.product.id === prod.id);
    if (existingCartItemIndex !== -1) {
      const currentCartQty = cart[existingCartItemIndex].quantity;
      if (currentCartQty >= prod.quantity) {
        alert(`Não é possível adicionar mais unidades. Limite de estoque disponível (${prod.quantity} un) atingido.`);
        return;
      }
      const updated = [...cart];
      updated[existingCartItemIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product: prod, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (prodId: string) => {
    setCart(cart.filter(item => item.product.id !== prodId));
  };

  const handleAdjustCartQty = (prodId: string, amount: number) => {
    const existingIndex = cart.findIndex(item => item.product.id === prodId);
    if (existingIndex === -1) return;

    const item = cart[existingIndex];
    const newQty = item.quantity + amount;

    if (newQty <= 0) {
      handleRemoveFromCart(prodId);
    } else {
      if (newQty > item.product.quantity) {
        alert(`Limite de estoque disponível (${item.product.quantity} un) atingido.`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity = newQty;
      setCart(updated);
    }
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Adicione pelo menos um produto ao carrinho para fechar a venda.');
      return;
    }

    const cartTotalAmount = cart.reduce((sum, item) => sum + (item.product.priceSale * item.quantity), 0);
    const finalAmount = customTotal !== '' ? parseFloat(customTotal) : cartTotalAmount;

    if (isNaN(finalAmount) || finalAmount < 0) {
      alert('Por favor, insira um valor de venda total válido.');
      return;
    }

    const totalCost = cart.reduce((sum, item) => sum + (item.product.costUnit * item.quantity), 0);

    const saleItems: SaleItem[] = cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      priceUnit: item.product.priceSale,
      costUnit: item.product.costUnit
    }));

    const salePayload = {
      date: new Date().toISOString(),
      items: saleItems,
      totalAmount: finalAmount,
      totalCost,
      paymentMethod
    };

    // Registra venda (desconta estoque e grava venda)
    await DataService.registerSale(userId, salePayload);
    
    setLastSaleTotal(finalAmount);
    setCheckoutSuccess(true);
    setCart([]);
    loadProducts(); // reload stock values

    if (onSaleSuccess) {
      onSaleSuccess();
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter(prod =>
    prod.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.priceSale * item.quantity), 0);

  return (
    <div id="pdv-screen" className="max-w-6xl mx-auto px-4 py-4">
      {/* PDV Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-brown-light/10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 bg-white rounded-xl border border-brand-brown-light/10 text-brand-chocolate hover:bg-brand-cream/50 transition active:scale-95 touch-target"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-brand-chocolate">Frente de Caixa (PDV)</h1>
            <p className="text-[11px] text-brand-brown-light">Vendas ágeis e controle de caixa diário</p>
          </div>
        </div>

        <button
          onClick={() => { loadProducts(); handleClearCart(); setCheckoutSuccess(false); }}
          className="p-2 bg-white hover:bg-brand-cream/40 rounded-xl border border-brand-brown-light/10 text-brand-brown-light hover:text-brand-chocolate transition"
          title="Resetar PDV"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {checkoutSuccess ? (
        /* Checkout Success Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/50 backdrop-blur-xl rounded-3xl border border-white/60 p-8 text-center max-w-md mx-auto my-10 shadow-lg"
        >
          <div className="w-16 h-16 bg-emerald-50/50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4 border border-emerald-100/50">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <h2 className="text-2xl font-bold text-brand-chocolate mb-2">Venda Registrada!</h2>
          <p className="text-sm text-brand-brown-light mb-6">
            O estoque dos produtos vendidos foi baixado e os valores foram alocados na regra 40/40/20 com sucesso.
          </p>
          
          <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 mb-6 font-mono">
            <span className="text-xs text-brand-brown-light uppercase block">VALOR DA VENDA</span>
            <span className="text-2xl font-extrabold text-brand-chocolate">R$ {lastSaleTotal.toFixed(2)}</span>
            
            <div className="border-t border-white/40 mt-3 pt-3 grid grid-cols-3 gap-1 text-[10px] text-brand-brown-light/80 text-left">
              <div>
                <span className="block font-bold">Reposição (40%):</span>
                <span>R$ {(lastSaleTotal * 0.4).toFixed(2)}</span>
              </div>
              <div>
                <span className="block font-bold">Lucro (40%):</span>
                <span>R$ {(lastSaleTotal * 0.4).toFixed(2)}</span>
              </div>
              <div>
                <span className="block font-bold">Caixa (20%):</span>
                <span>R$ {(lastSaleTotal * 0.2).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCheckoutSuccess(false)}
            className="w-full py-3.5 bg-brand-chocolate hover:bg-brand-chocolate/90 text-white rounded-2xl font-bold text-sm shadow-md transition cursor-pointer"
          >
            Próxima Venda
          </button>
        </motion.div>
      ) : (
        /* Active PDV Interface */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Products Selector Grid (Col: 7) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-brown-light/50">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busque o produto por nome..."
                className="w-full pl-9 pr-4 py-3 bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose focus:bg-white/60 transition shadow-xs text-brand-chocolate font-medium"
              />
            </div>

            {/* Products cards container */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar pb-6">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full bg-white/40 backdrop-blur-md rounded-2xl p-8 border border-white/50 text-center text-brand-brown-light/60">
                  <p className="text-xs font-semibold">Sem produtos no estoque.</p>
                  <p className="text-[10px] mt-1">Crie lotes de produção e envie-os ao estoque primeiro.</p>
                </div>
              ) : (
                filteredProducts.map((prod) => {
                  const isInCart = cart.some(item => item.product.id === prod.id);
                  const cartItem = cart.find(item => item.product.id === prod.id);
                  const inStock = prod.quantity;
                  const isOut = inStock <= 0;

                  return (
                    <motion.button
                      key={prod.id}
                      onClick={() => handleAddToCart(prod)}
                      whileTap={{ scale: 0.97 }}
                      className={`relative bg-white/40 backdrop-blur-md rounded-2xl border p-3.5 text-left transition flex flex-col justify-between shadow-xs select-none h-32 touch-target cursor-pointer ${isOut ? 'border-white/20 opacity-60 bg-white/10 cursor-not-allowed' : isInCart ? 'border-brand-rose bg-white/60 shadow-inner' : 'border-white/55 hover:bg-white/65 hover:border-white'}`}
                      disabled={isOut}
                    >
                      {/* Badge if item in cart */}
                      {isInCart && cartItem && (
                        <span className="absolute top-2 right-2 bg-brand-rose text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                          {cartItem.quantity}
                        </span>
                      )}

                      {/* Info */}
                      <div className="w-full">
                        <span className="block font-bold text-xs text-brand-chocolate line-clamp-2 leading-tight">
                          {prod.name}
                        </span>
                        <span className="block font-mono text-xs text-brand-chocolate/50 mt-1 font-semibold">
                          Qtd: {inStock} un
                        </span>
                      </div>

                      {/* Pricing Footer */}
                      <div className="w-full mt-2 flex items-center justify-between border-t border-white/30 pt-1.5">
                        <span className="font-mono text-sm font-bold text-brand-chocolate">
                          R$ {prod.priceSale.toFixed(2)}
                        </span>
                        {!isOut && (
                          <span className="text-[9px] text-brand-rose font-bold uppercase tracking-wider">
                            + Toque
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>

          {/* Checkout / Shopping Cart Column (Col: 5) */}
          <div className="lg:col-span-5 bg-white/45 backdrop-blur-xl rounded-3xl border border-white/65 p-5 shadow-sm sticky top-4">
            <h2 className="font-bold text-brand-chocolate text-base mb-4 flex items-center gap-1.5">
              <ShoppingCart className="w-5 h-5 text-brand-rose" />
              <span>Cesta de Vendas ({cart.reduce((sum, i) => sum + i.quantity, 0)})</span>
            </h2>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto mb-5 pr-1 border-b border-white/30 pb-4">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-brand-brown-light/50">
                  <p className="text-xs font-semibold italic">A cesta está vazia.</p>
                  <p className="text-[10px] mt-1">Toque nos produtos ao lado para iniciar o atendimento.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-white/30 p-2.5 rounded-xl border border-white/40 backdrop-blur-sm flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-brand-chocolate truncate leading-tight">{item.product.name}</p>
                      <span className="text-[10px] text-brand-brown-light/70 font-mono">
                        R$ {item.product.priceSale.toFixed(2)} / un
                      </span>
                    </div>

                    {/* Quantity selectors */}
                    <div className="flex items-center gap-1.5 bg-white/40 p-1 rounded-lg border border-white/40 shrink-0 select-none">
                      <button
                        onClick={() => handleAdjustCartQty(item.product.id, -1)}
                        className="w-5 h-5 flex items-center justify-center bg-white/60 hover:bg-white text-brand-chocolate rounded-md font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-xs text-brand-chocolate min-w-[16px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleAdjustCartQty(item.product.id, 1)}
                        className="w-5 h-5 flex items-center justify-center bg-white/60 hover:bg-white text-brand-chocolate rounded-md font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Single Item Cost total */}
                    <div className="text-right shrink-0 min-w-[50px] font-mono font-bold text-brand-chocolate">
                      R$ {(item.product.priceSale * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order total */}
            <div className="space-y-4">
              <div className="bg-white/30 p-3.5 rounded-2xl border border-white/40 space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-xs text-brand-brown-light font-bold">
                  <span>Subtotal do Carrinho:</span>
                  <span className="font-mono">R$ {cartTotal.toFixed(2)}</span>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-white/20 pt-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="custom-total-input" className="text-xs font-black text-brand-chocolate uppercase tracking-wider flex items-center gap-1.5">
                      <span>Valor Final Cobrado:</span>
                      {customTotal !== '' && (
                        <button
                          type="button"
                          onClick={() => setCustomTotal('')}
                          className="text-[9px] text-brand-rose bg-brand-rose/10 hover:bg-brand-rose/20 px-2 py-0.5 rounded-md transition font-extrabold cursor-pointer uppercase tracking-wider"
                          title="Restaurar valor original do carrinho"
                        >
                          Restaurar Original
                        </button>
                      )}
                    </label>
                    <span className="text-[10px] text-brand-brown-light/70 italic hidden sm:inline">Toque para editar o valor</span>
                  </div>
                  
                  <div className="relative flex items-center bg-white/60 focus-within:bg-white rounded-xl border border-white/50 transition-all shadow-xs pl-3">
                    <span className="font-mono font-bold text-sm text-brand-chocolate/50">R$</span>
                    <input
                      id="custom-total-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={customTotal !== '' ? customTotal : cartTotal === 0 ? '' : cartTotal.toFixed(2)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomTotal(val);
                      }}
                      placeholder="0.00"
                      className="w-full bg-transparent border-none text-xl font-mono font-black text-brand-chocolate focus:outline-none py-2 px-1 text-right pr-3"
                    />
                  </div>

                  {customTotal !== '' && !isNaN(parseFloat(customTotal)) && (
                    <div className="flex justify-between items-center text-[10px] font-bold border-t border-dashed border-white/30 pt-1.5 mt-0.5">
                      <span className="text-brand-brown-light/80">Desconto / Ajuste:</span>
                      <span className={parseFloat(customTotal) < cartTotal ? "text-emerald-700" : "text-amber-700"}>
                        {parseFloat(customTotal) < cartTotal ? 'Economia de' : 'Acréscimo de'} R$ {Math.abs(parseFloat(customTotal) - cartTotal).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-[10px] font-bold text-brand-chocolate uppercase tracking-wider block mb-2">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`py-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center border cursor-pointer ${paymentMethod === 'pix' ? 'bg-brand-chocolate text-white border-brand-chocolate shadow-sm' : 'bg-white/30 border-white/50 backdrop-blur-sm text-brand-brown-light hover:border-white'}`}
                  >
                    <Sparkles className="w-4 h-4 mb-1 text-brand-gold" />
                    <span>PIX</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('dinheiro')}
                    className={`py-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center border cursor-pointer ${paymentMethod === 'dinheiro' ? 'bg-brand-chocolate text-white border-brand-chocolate shadow-sm' : 'bg-white/30 border-white/50 backdrop-blur-sm text-brand-brown-light hover:border-white'}`}
                  >
                    <DollarSign className="w-4 h-4 mb-1 text-emerald-500" />
                    <span>Dinheiro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cartao')}
                    className={`py-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center border cursor-pointer ${paymentMethod === 'cartao' ? 'bg-brand-chocolate text-white border-brand-chocolate shadow-sm' : 'bg-white/30 border-white/50 backdrop-blur-sm text-brand-brown-light hover:border-white'}`}
                  >
                    <CreditCard className="w-4 h-4 mb-1 text-indigo-500" />
                    <span>Cartão</span>
                  </button>
                </div>
              </div>

              {/* Action checkout button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-4 bg-brand-rose hover:bg-brand-rose/90 disabled:opacity-40 text-white rounded-2xl font-black text-sm shadow-md active:scale-95 hover:shadow-lg transition flex items-center justify-center gap-2 touch-target cursor-pointer"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                REGISTRAR VENDA
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
