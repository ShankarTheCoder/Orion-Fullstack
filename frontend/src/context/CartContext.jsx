import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as cartService from '../services/cartService';
import { useAuthContext } from './AuthContext';

const CartContext = createContext(null);

// The cart lives on the SERVER (carts collection) for customers. Guests have
// no cart at all in this architecture - addToCart returns { needsLogin: true }
// so the UI can send them to the Login page with a message.
export function CartProvider({ children }) {
  const { user, isCustomer } = useAuthContext();
  const [cart, setCart] = useState({ items: [], subtotal: 0, deliveryCharge: 0, total: 0 });
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!isCustomer) { setCart({ items: [], subtotal: 0, deliveryCharge: 0, total: 0 }); return; }
    try { setCart(await cartService.getCart()); } catch { /* keep last state */ }
  }, [isCustomer]);

  useEffect(() => { refresh(); }, [refresh, user?.id]);

  const guard = useCallback(() => {
    if (!user) return 'guest';
    if (!isCustomer) return 'not-customer';
    return null;
  }, [user, isCustomer]);

  const add = useCallback(async (productId, quantity = 1) => {
    const blocked = guard();
    if (blocked) return { needsLogin: blocked === 'guest', blocked };
    setBusy(true);
    try { setCart(await cartService.addToCart(productId, quantity)); return { ok: true }; }
    finally { setBusy(false); }
  }, [guard]);

  const update = useCallback(async (productId, quantity) => {
    setBusy(true);
    try { setCart(await cartService.updateCartItem(productId, quantity)); }
    finally { setBusy(false); }
  }, []);

  const remove = useCallback(async (productId) => {
    setBusy(true);
    try { setCart(await cartService.removeCartItem(productId)); }
    finally { setBusy(false); }
  }, []);

  const clear = useCallback(async () => {
    setBusy(true);
    try { setCart(await cartService.clearCart()); }
    finally { setBusy(false); }
  }, []);

  const count = useMemo(() => cart.items.reduce((s, i) => s + i.quantity, 0), [cart]);

  const value = useMemo(() => ({ cart, count, busy, add, update, remove, clear, refresh }),
    [cart, count, busy, add, update, remove, clear, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used inside <CartProvider>');
  return ctx;
}

export default CartContext;
