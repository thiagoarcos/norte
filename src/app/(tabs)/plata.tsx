/* PLATA (de NORTE): patrimonio por cuentas (pesos, crypto, wallets Solana, broker IOL),
   cotización del dólar blue, pasivos, ingresos y gastos del mes con presupuesto, meta de
   ahorro y tendencias de meme coins. */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Ring } from '@/components/Ring';
import { Bar, Button, Card, Chip, Empty, Field, IconBtn, Screen, Section, Segmented } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { FIN_GRUPOS, FIN_TIPOS, useNorte } from '@/lib/norte';
import { INGRESO_CATS, dstr, fmtMoney, parseMoney, shiftYm, uid, ymLabel } from '@/lib/norteData';
import { getState, up } from '@/lib/store';
import { flash } from '@/lib/toast';

const FIN_EMOJIS = ['💰', '💸', '🪙', '💳', '🏦', '📈', '📊', '🍊', '💵', '💶', '🐷', '⭐', '🚀', '🔷'];
let trendingCache: { day: string; list: any[] } | null = null;

export default function Plata() {
  const [view, setView] = useState<'patrimonio' | 'mes' | 'meta'>('patrimonio');
  const d = useNorte();
  const [rateLoading, setRateLoading] = useState(false);

  const fetchUsdRate = useCallback(async () => {
    setRateLoading(true);
    try {
      const r = await fetch('https://dolarapi.com/v1/dolares/blue');
      const j = await r.json();
      const venta = Number(j && j.venta);
      if (!Number.isFinite(venta) || venta <= 0) throw new Error('respuesta inválida');
      up((st) => { st.finance.usdRate = venta; st.finance.rateUpdated = dstr(); });
      flash('💵 Cotización actualizada (dólar blue)');
    } catch {
      flash('No se pudo traer la cotización — revisá tu conexión o editala a mano');
    }
    setRateLoading(false);
  }, []);

  // Al entrar a Plata: dólar una vez por día y wallets sin sincronizar hoy
  useFocusEffect(useCallback(() => {
    const st = getState();
    const todayKey = dstr();
    if (st.finance?.rateUpdated !== todayKey) fetchUsdRate();
    (st.finance.accounts || []).filter((a: any) => a.tipo === 'wallet' && a.address && a.lastSynced !== todayKey).forEach((a: any) => syncWallet(a));
  }, [fetchUsdRate]));

  return (
    <Screen title="Plata" subtitle={{ patrimonio: 'Patrimonio', mes: 'Ingresos y gastos', meta: 'Meta de ahorro' }[view]}>
      <View style={{ marginBottom: 14 }}>
        <Segmented options={[['patrimonio', 'Patrimonio'], ['mes', 'Mes'], ['meta', 'Meta']]} value={view} onChange={setView} />
      </View>
      {view === 'patrimonio' && <Patrimonio d={d} fetchUsdRate={fetchUsdRate} rateLoading={rateLoading} />}
      {view === 'mes' && <Mes d={d} />}
      {view === 'meta' && <Meta d={d} />}
    </Screen>
  );
}

/* Wallets on-chain (Phantom/Solana): saldo directo de la blockchain con la dirección pública. */
async function syncWallet(acc: any) {
  if (!acc || !acc.address) return;
  try {
    const [balRes, priceRes] = await Promise.all([
      fetch('https://solana-rpc.publicnode.com', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [acc.address] }),
      }),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'),
    ]);
    const bal = await balRes.json();
    const price = await priceRes.json();
    const lamports = Number(bal?.result?.value);
    const solPrice = Number(price?.solana?.usd);
    if (!Number.isFinite(lamports) || !Number.isFinite(solPrice)) throw new Error('respuesta inválida');
    const sol = lamports / 1e9;
    const usd = sol * solPrice;
    const today = dstr();
    up((st) => {
      const a = st.finance.accounts.find((x: any) => x.id === acc.id);
      if (!a) return;
      a.saldoSol = sol; a.saldo = usd; a.lastSynced = today;
      a.history = a.history || {}; a.history[today] = usd;
    });
    flash(`👻 ${acc.name}: sincronizado (${sol.toFixed(3)} SOL)`);
  } catch {
    flash(`No se pudo sincronizar ${acc.name} — revisá la dirección o probá de nuevo`);
  }
}

function Patrimonio({ d, fetchUsdRate, rateLoading }: { d: any; fetchUsdRate: () => void; rateLoading: boolean }) {
  const c = useColors();
  const [editRate, setEditRate] = useState<string | null>(null);
  const [editAcc, setEditAcc] = useState<string | null>(null);
  const [saldoDraft, setSaldoDraft] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState<'' | 'acc' | 'wallet' | 'iol'>('');
  const [newAcc, setNewAcc] = useState({ name: '', tipo: 'pesos', moneda: 'ARS', icon: '💰' });
  const [newWallet, setNewWallet] = useState({ name: 'Phantom', address: '' });
  const [iol, setIol] = useState({ user: '', pass: '', forId: '' as string });
  const [iolLoading, setIolLoading] = useState(false);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [debt, setDebt] = useState({ name: '', monto: '' });
  const [trending, setTrending] = useState<any[]>(trendingCache?.list || []);
  const [trLoading, setTrLoading] = useState(false);
  const today = d.today;

  const fetchTrending = useCallback(async () => {
    setTrLoading(true);
    try {
      const r = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=price_change_percentage_24h_desc&per_page=8&price_change_percentage=24h');
      const j = await r.json();
      if (!Array.isArray(j)) throw new Error('x');
      trendingCache = { day: today, list: j };
      setTrending(j);
    } catch { flash('No se pudieron traer las tendencias cripto ahora'); }
    setTrLoading(false);
  }, [today]);
  useFocusEffect(useCallback(() => { if (trendingCache?.day !== today) fetchTrending(); }, [fetchTrending, today]));

  const setSaldo = (id: string) => {
    const v = parseMoney(saldoDraft[id] || '');
    if (!Number.isFinite(v)) { flash('Poné un número válido'); return; }
    up((st) => { const a = st.finance.accounts.find((x: any) => x.id === id); if (!a) return; a.saldo = v; a.history = a.history || {}; a.history[today] = v; });
    setSaldoDraft((x) => { const n = { ...x }; delete n[id]; return n; });
    flash('💰 Saldo actualizado');
  };

  // IOL: usuario y clave se usan una vez para pedir un token y se descartan (no se guardan).
  const syncIol = async (existingId?: string) => {
    if (!iol.user.trim() || !iol.pass) { flash('Poné usuario y contraseña de IOL'); return; }
    setIolLoading(true);
    try {
      const tok = await fetch('https://api.invertironline.com/token', {
        method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: `grant_type=password&username=${encodeURIComponent(iol.user)}&password=${encodeURIComponent(iol.pass)}`,
      });
      if (!tok.ok) throw new Error('credenciales inválidas');
      const access = (await tok.json()).access_token;
      if (!access) throw new Error('sin token');
      const cuenta = await fetch('https://api.invertironline.com/api/v2/estadocuenta', { headers: { authorization: 'Bearer ' + access } });
      if (!cuenta.ok) throw new Error('no se pudo leer el estado de cuenta');
      const cj = await cuenta.json();
      const cuentas = Array.isArray(cj?.cuentas) ? cj.cuentas : [];
      if (!cuentas.length) throw new Error('respuesta sin cuentas');
      let total = 0;
      cuentas.forEach((x: any) => { const val = Number(x.total ?? x.totalEnPesos ?? 0); total += /usd|dolar/i.test(x.moneda || '') ? val * d.usdRate : val; });
      const id = existingId || uid();
      up((st) => {
        let a = st.finance.accounts.find((x: any) => x.id === id);
        if (!a) { a = { id, name: 'IOL', tipo: 'broker', broker: 'iol', moneda: 'ARS', saldo: 0, icon: '📈', history: {} }; st.finance.accounts.push(a); }
        a.saldo = total; a.lastSynced = today; a.history = a.history || {}; a.history[today] = total;
      });
      flash(`📈 IOL sincronizado: ${fmtMoney(total, 'ARS')}`);
      setAdding('');
    } catch (e: any) {
      flash(`No se pudo sincronizar IOL: ${e.message || 'revisá tus credenciales'}`);
    }
    setIol({ user: '', pass: '', forId: '' });
    setIolLoading(false);
  };

  const accUp = (id: string, fn: (a: any) => void) => up((st) => { const a = st.finance.accounts.find((x: any) => x.id === id); if (a) fn(a); });

  const iolForm = (forId?: string) => (
    <View style={{ gap: 8, marginTop: 10 }}>
      <Field placeholder="Usuario IOL" autoCapitalize="none" value={iol.user} onChangeText={(t) => setIol({ ...iol, user: t })} />
      <Field placeholder="Contraseña" secureTextEntry value={iol.pass} onChangeText={(t) => setIol({ ...iol, pass: t })} />
      <Text style={{ color: c.sub, fontSize: 11.5 }}>No se guardan — se usan una vez para pedir un token a la API oficial de IOL y se descartan.</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button kind="ghost" title="Cancelar" style={{ flex: 1 }} onPress={() => { setAdding(''); setIol({ user: '', pass: '', forId: '' }); }} />
        <Button title={iolLoading ? 'Conectando…' : forId ? 'Sincronizar' : 'Conectar'} style={{ flex: 1 }} onPress={() => syncIol(forId)} />
      </View>
    </View>
  );

  return (
    <>
      {/* Hero: patrimonio total */}
      <View style={{ backgroundColor: c.primary, borderRadius: 22, padding: 20 }}>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>PATRIMONIO TOTAL</Text>
        <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: 4 }}>{fmtMoney(d.totalARS, 'ARS')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>≈ {fmtMoney(d.totalUSD, 'USD')}</Text>
          {d.finTrend != null && d.finTrend !== 0 && (
            <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '800', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
              {d.finTrend > 0 ? '▲ +' : '▼ '}{fmtMoney(d.finTrend, 'ARS')} · 30d
            </Text>
          )}
        </View>
        <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.22)' }}>
          {editRate != null ? (
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>1 USD =</Text>
              <View style={{ flex: 1 }}><Field autoFocus keyboardType="number-pad" value={editRate} onChangeText={setEditRate} /></View>
              <Button small kind="dark" title="OK" onPress={() => { up((st) => { st.finance.usdRate = Number(editRate) || d.usdRate; st.finance.rateUpdated = today; }); setEditRate(null); flash('Cotización actualizada'); }} />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={() => setEditRate(String(d.usdRate))}>
                <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12.5, fontWeight: '700' }}>$ 1 USD = ${d.usdRate.toLocaleString('es-AR')} ✎</Text>
              </Pressable>
              {rateLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="refresh" size={15} color="rgba(255,255,255,0.85)" onPress={fetchUsdRate} />}
            </View>
          )}
        </View>
      </View>

      {/* Reparto por tipo */}
      {d.totalARS > 0 && d.finByTipo.length > 0 && (
        <Card style={{ marginTop: 12, gap: 8 }}>
          <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 4 }}>
            {d.finByTipo.map((g: any) => <View key={g.tipo} style={{ width: `${(g.totalARS / d.totalARS) * 100}%`, backgroundColor: g.color }} />)}
          </View>
          {d.finByTipo.map((g: any) => (
            <View key={g.tipo} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: g.color }} />
              <Ionicons name={g.icon} size={15} color={c.sub} />
              <Text style={{ flex: 1, color: c.ink, fontWeight: '800', fontSize: 14 }}>{g.label}</Text>
              <Text style={{ color: c.sub, fontWeight: '700', fontSize: 13 }}>{Math.round((g.totalARS / d.totalARS) * 100)}%</Text>
              <Text style={{ color: c.ink, fontWeight: '800', fontSize: 14, minWidth: 92, textAlign: 'right' }}>{fmtMoney(g.totalARS, 'ARS')}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Cuentas por tipo */}
      {FIN_GRUPOS.map((tipo) => {
        const accs = d.finByTipo.find((g: any) => g.tipo === tipo)?.accounts ?? [];
        if (!accs.length) return null;
        return (
          <View key={tipo}>
            <Section title={FIN_TIPOS[tipo].label} />
            {accs.map((a: any) => {
              const editing = editAcc === a.id;
              const hist = Object.keys(a.history || {}).sort();
              const lastUpd = hist.length ? hist[hist.length - 1] : null;
              const prevVal = hist.length > 1 ? a.history[hist[hist.length - 2]] : null;
              const delta = prevVal != null ? (Number(a.saldo) || 0) - prevVal : null;
              return (
                <Card key={a.id} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 26 }}>{a.icon}</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <Text numberOfLines={1} style={{ color: c.ink, fontWeight: '800', fontSize: 15.5, flexShrink: 1 }}>{a.name}</Text>
                        <Text style={{ fontSize: 10.5, fontWeight: '800', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, overflow: 'hidden', backgroundColor: a.moneda === 'USD' ? c.greenSoft : c.soft, color: a.moneda === 'USD' ? c.okInk : c.sub }}>{a.moneda}</Text>
                      </View>
                      <Text style={{ color: c.sub, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                        {lastUpd ? `Actualizado ${lastUpd === today ? 'hoy' : lastUpd}` : 'Sin actualizar'}
                        {delta != null && delta !== 0 ? <Text style={{ color: delta > 0 ? c.okInk : c.red, fontWeight: '800' }}> · {delta > 0 ? '+' : ''}{fmtMoney(delta, a.moneda)}</Text> : null}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: c.ink, fontWeight: '900', fontSize: 17 }}>{fmtMoney(a.saldo, a.moneda)}</Text>
                      {a.moneda === 'USD' && <Text style={{ color: c.sub, fontSize: 11.5, fontWeight: '600' }}>≈ {fmtMoney(d.toARS(a), 'ARS')}</Text>}
                      {a.tipo === 'wallet' && a.saldoSol != null && <Text style={{ color: c.sub, fontSize: 11, fontWeight: '600' }}>{Number(a.saldoSol).toFixed(3)} SOL</Text>}
                    </View>
                    <IconBtn onPress={() => setEditAcc(editing ? null : a.id)}>{editing ? '✕' : '✎'}</IconBtn>
                  </View>

                  {!editing && a.tipo === 'wallet' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                      <Text numberOfLines={1} style={{ flex: 1, color: c.sub, fontSize: 11.5, fontFamily: 'monospace' }}>{a.address ? `${a.address.slice(0, 4)}…${a.address.slice(-4)}` : 'Sin dirección'}</Text>
                      <Button small kind="soft" title={syncing[a.id] ? 'Sincronizando…' : 'Sincronizar'} onPress={async () => { setSyncing((x) => ({ ...x, [a.id]: true })); await syncWallet(a); setSyncing((x) => ({ ...x, [a.id]: false })); }} />
                    </View>
                  )}
                  {!editing && a.tipo === 'broker' && (iol.forId === a.id ? iolForm(a.id) : (
                    <Button small kind="soft" title="Sincronizar (pide usuario y clave)" style={{ marginTop: 12 }} onPress={() => setIol({ user: '', pass: '', forId: a.id })} />
                  ))}
                  {!editing && a.tipo !== 'wallet' && a.tipo !== 'broker' && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'flex-end' }}>
                      <Field placeholder={`Nuevo saldo (${a.moneda})`} keyboardType="decimal-pad" value={saldoDraft[a.id] || ''} onChangeText={(t) => setSaldoDraft({ ...saldoDraft, [a.id]: t })} onSubmitEditing={() => setSaldo(a.id)} />
                      <Button title="Guardar" onPress={() => setSaldo(a.id)} />
                    </View>
                  )}
                  {editing && (
                    <View style={{ marginTop: 12, gap: 10 }}>
                      <Field label="NOMBRE" value={a.name} onChangeText={(t) => accUp(a.id, (x) => { x.name = t; })} />
                      {a.tipo === 'wallet' ? (
                        <Field label="DIRECCIÓN (SOLANA)" autoCapitalize="none" value={a.address || ''} placeholder="Ej: 9WzD…AWWM" onChangeText={(t) => accUp(a.id, (x) => { x.address = t.trim(); })} />
                      ) : (
                        <>
                          <Segmented options={[['crypto', 'Crypto'], ['pesos', 'Pesos'], ['inversion', 'Inversión']]} value={a.tipo} onChange={(v) => accUp(a.id, (x) => { x.tipo = v; })} />
                          <Segmented options={[['ARS', 'Pesos ($)'], ['USD', 'Dólares (US$)']]} value={a.moneda} onChange={(v) => accUp(a.id, (x) => { x.moneda = v; })} />
                        </>
                      )}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {FIN_EMOJIS.map((em) => (
                          <Pressable key={em} onPress={() => accUp(a.id, (x) => { x.icon = em; })} style={{ padding: 6, borderRadius: 10, backgroundColor: a.icon === em ? c.primarySoft : c.soft }}><Text style={{ fontSize: 18 }}>{em}</Text></Pressable>
                        ))}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Button small kind="danger" title="Borrar cuenta" onPress={() => { setEditAcc(null); up((st) => { st.finance.accounts = st.finance.accounts.filter((x: any) => x.id !== a.id); }); }} />
                      </View>
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        );
      })}

      {/* Pasivos */}
      <Section title="Pasivos" />
      <Card style={{ gap: 8 }}>
        {d.debts.map((x: any) => (
          <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ flex: 1, color: c.ink, fontWeight: '700' }}>{x.name}</Text>
            <Text style={{ color: c.red, fontWeight: '800' }}>−{fmtMoney(x.monto, 'ARS')}</Text>
            <IconBtn tone="danger" onPress={() => up((st) => { st.finance.debts = st.finance.debts.filter((y: any) => y.id !== x.id); })}>✕</IconBtn>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <Field placeholder="Deuda (ej: tarjeta)" value={debt.name} onChangeText={(t) => setDebt({ ...debt, name: t })} />
          <View style={{ width: 110 }}><Field placeholder="Monto ($)" keyboardType="decimal-pad" value={debt.monto} onChangeText={(t) => setDebt({ ...debt, monto: t })} /></View>
          <Button title="＋" onPress={() => {
            const v = parseMoney(debt.monto);
            if (!debt.name.trim() || !Number.isFinite(v) || v <= 0) { flash('Poné nombre y monto'); return; }
            up((st) => { st.finance.debts = st.finance.debts || []; st.finance.debts.push({ id: uid(), name: debt.name.trim(), monto: v }); });
            setDebt({ name: '', monto: '' });
          }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.line, paddingTop: 10 }}>
          <Text style={{ color: c.ink, fontWeight: '900', fontSize: 15 }}>Patrimonio neto</Text>
          <Text style={{ color: c.ink, fontWeight: '900', fontSize: 15 }}>{fmtMoney(d.netARS, 'ARS')}</Text>
        </View>
      </Card>

      {/* Agregar */}
      <Section title="Agregar" />
      {adding === 'acc' ? (
        <Card style={{ gap: 10 }}>
          <Field label="NOMBRE" placeholder="Ej: Binance, Banco, Lemon…" value={newAcc.name} onChangeText={(t) => setNewAcc({ ...newAcc, name: t })} />
          <Segmented options={[['crypto', 'Crypto'], ['pesos', 'Pesos'], ['inversion', 'Inversión']]} value={newAcc.tipo} onChange={(v) => setNewAcc({ ...newAcc, tipo: v, moneda: v === 'crypto' ? 'USD' : newAcc.moneda })} />
          <Segmented options={[['ARS', 'Pesos ($)'], ['USD', 'Dólares (US$)']]} value={newAcc.moneda} onChange={(v) => setNewAcc({ ...newAcc, moneda: v })} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {FIN_EMOJIS.map((em) => <Pressable key={em} onPress={() => setNewAcc({ ...newAcc, icon: em })} style={{ padding: 6, borderRadius: 10, backgroundColor: newAcc.icon === em ? c.primarySoft : c.soft }}><Text style={{ fontSize: 18 }}>{em}</Text></Pressable>)}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button kind="ghost" title="Cancelar" style={{ flex: 1 }} onPress={() => setAdding('')} />
            <Button title="Crear cuenta" style={{ flex: 1 }} onPress={() => {
              if (!newAcc.name.trim()) { flash('Poné un nombre'); return; }
              up((st) => { st.finance.accounts.push({ id: uid(), name: newAcc.name.trim(), tipo: newAcc.tipo, moneda: newAcc.moneda, saldo: 0, icon: newAcc.icon, history: {} }); });
              setAdding(''); setNewAcc({ name: '', tipo: 'pesos', moneda: 'ARS', icon: '💰' }); flash('Cuenta agregada');
            }} />
          </View>
        </Card>
      ) : adding === 'wallet' ? (
        <Card style={{ gap: 10 }}>
          <Field label="NOMBRE" placeholder="Ej: Phantom, Axiom…" value={newWallet.name} onChangeText={(t) => setNewWallet({ ...newWallet, name: t })} />
          <Field label="DIRECCIÓN PÚBLICA (SOLANA)" autoCapitalize="none" placeholder="Ej: 9WzD…AWWM" value={newWallet.address} onChangeText={(t) => setNewWallet({ ...newWallet, address: t.trim() })} />
          <Text style={{ color: c.sub, fontSize: 11.5 }}>Solo la dirección pública — nunca pegues acá tu frase semilla (seed phrase) o clave privada.</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button kind="ghost" title="Cancelar" style={{ flex: 1 }} onPress={() => setAdding('')} />
            <Button title="Conectar" style={{ flex: 1 }} onPress={() => {
              if (!newWallet.name.trim() || !newWallet.address.trim()) { flash('Poné nombre y dirección pública'); return; }
              const acc = { id: uid(), name: newWallet.name.trim(), tipo: 'wallet', chain: 'solana', address: newWallet.address.trim(), moneda: 'USD', saldo: 0, icon: '👻', history: {} };
              up((st) => { st.finance.accounts.push(acc); });
              setAdding(''); setNewWallet({ name: 'Phantom', address: '' });
              flash('Wallet agregada — sincronizando…');
              syncWallet(acc);
            }} />
          </View>
        </Card>
      ) : adding === 'iol' ? (
        <Card>{iolForm()}</Card>
      ) : (
        <View style={{ gap: 8 }}>
          <Button kind="soft" title="Conectar wallet Solana (Phantom)" icon={<Ionicons name="wallet" size={17} color={c.scheme === 'dark' ? c.primaryInk : c.primary} />} onPress={() => setAdding('wallet')} />
          <Button kind="soft" title="Conectar broker (IOL)" icon={<Ionicons name="business" size={17} color={c.scheme === 'dark' ? c.primaryInk : c.primary} />} onPress={() => { setIol({ user: '', pass: '', forId: '' }); setAdding('iol'); }} />
          <Button kind="soft" title="Cuenta manual (banco, billeteras…)" icon={<Ionicons name="add" size={18} color={c.scheme === 'dark' ? c.primaryInk : c.primary} />} onPress={() => setAdding('acc')} />
        </View>
      )}

      {/* Tendencias de meme coins */}
      <Section title="Tendencias cripto (24h)" right={trLoading ? <ActivityIndicator size="small" color={c.sub} /> : <Ionicons name="refresh" size={16} color={c.sub} onPress={fetchTrending} />} />
      <Card>
        <Text style={{ color: c.sub, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>🔥 Meme coins que más se movieron</Text>
        {!trending.length && !trLoading && <Empty text="Sin datos todavía" />}
        {trending.map((x) => (
          <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderTopWidth: 1, borderTopColor: c.line }}>
            <Image source={{ uri: x.image }} style={{ width: 22, height: 22, borderRadius: 11 }} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: c.ink, fontWeight: '800', fontSize: 13.5 }}>{x.name}</Text>
              <Text style={{ color: c.sub, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>{x.symbol}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: c.ink, fontWeight: '800', fontSize: 13 }}>US$ {Number(x.current_price).toLocaleString('es-AR', { maximumFractionDigits: 6 })}</Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: (x.price_change_percentage_24h || 0) >= 0 ? c.okInk : c.red }}>
                {(x.price_change_percentage_24h || 0) >= 0 ? '+' : ''}{Number(x.price_change_percentage_24h || 0).toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </Card>
    </>
  );
}

function Mes({ d }: { d: any }) {
  const c = useColors();
  const [month, setMonth] = useState(d.curMonth);
  const [draft, setDraft] = useState({ tipo: 'egreso', monto: '', cat: '', nota: '', fecha: '' });
  const [budgetEdit, setBudgetEdit] = useState(false);
  const sm = d.monthSummary(month);
  const isIngreso = draft.tipo === 'ingreso';
  const cats = isIngreso ? INGRESO_CATS : [...d.budget.map((b: any) => b.name), 'Otro'];
  const budFijos = d.budget.filter((b: any) => b.tipo === 'fijo').reduce((a: number, b: any) => a + (Number(b.monto) || 0), 0);
  const budVar = d.budget.filter((b: any) => b.tipo !== 'fijo').reduce((a: number, b: any) => a + (Number(b.monto) || 0), 0);
  const defaultFecha = month === d.curMonth ? d.today : `${month}-01`;
  const plan = d.plan;

  const addMov = () => {
    const v = parseMoney(draft.monto);
    if (!Number.isFinite(v) || v <= 0) { flash('Poné un monto válido'); return; }
    const cat = draft.cat || (isIngreso ? 'Sueldo' : 'Otro');
    const bud = d.budget.find((b: any) => b.name === cat);
    up((st) => {
      st.finance.movs = st.finance.movs || [];
      st.finance.movs.push({ id: uid(), fecha: draft.fecha || defaultFecha, tipo: draft.tipo, cat, monto: v, nota: draft.nota.trim(), ...(isIngreso ? {} : { clase: bud?.tipo === 'fijo' ? 'fijo' : 'variable' }) });
    });
    setDraft({ ...draft, monto: '', nota: '', fecha: '' });
    flash(isIngreso ? '💵 Ingreso registrado' : '🧾 Gasto registrado');
  };
  const budUp = (id: string, fn: (b: any) => void) => up((st) => { const b = st.finance.budget.find((x: any) => x.id === id); if (b) fn(b); });

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <IconBtn onPress={() => setMonth(shiftYm(month, -1))}>‹</IconBtn>
        <Text style={{ color: c.ink, fontWeight: '800', fontSize: 16 }}>{ymLabel(month)}</Text>
        <IconBtn onPress={() => setMonth(shiftYm(month, 1))}>›</IconBtn>
      </View>

      <View style={{ backgroundColor: c.primary, borderRadius: 22, padding: 20 }}>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>AHORRO DEL MES</Text>
        <Text style={{ color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 4 }}>{sm.ahorro < 0 ? '−' : ''}{fmtMoney(Math.abs(sm.ahorro), 'ARS')}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.22)' }}>
          {([['Ingresos', sm.ingresos], ['Fijos', sm.fijos], ['Variables', sm.variables]] as const).map(([l, v]) => (
            <View key={l} style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' }}>{l.toUpperCase()}</Text>
              <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 2 }}>{fmtMoney(v, 'ARS')}</Text>
            </View>
          ))}
        </View>
      </View>
      {plan.ahorroMensual > 0 && sm.ingresos > 0 && (
        <Text style={{ textAlign: 'center', marginTop: 8, fontWeight: '700', fontSize: 12.5, color: sm.ahorro >= plan.ahorroMensual ? c.okInk : c.sub }}>
          {sm.ahorro >= plan.ahorroMensual ? `✅ Llegaste a tu objetivo de ahorro (${fmtMoney(plan.ahorroMensual, 'ARS')})` : `Te faltan ${fmtMoney(plan.ahorroMensual - sm.ahorro, 'ARS')} para tu objetivo de ahorro del mes`}
        </Text>
      )}

      <Section title="Registrar" />
      <Card style={{ gap: 10 }}>
        <Segmented options={[['egreso', 'Gasto'], ['ingreso', 'Ingreso']]} value={draft.tipo} onChange={(v) => setDraft({ ...draft, tipo: v, cat: '' })} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Field placeholder="Monto ($)" keyboardType="decimal-pad" value={draft.monto} onChangeText={(t) => setDraft({ ...draft, monto: t })} />
          <View style={{ width: 130 }}><Field placeholder="AAAA-MM-DD" value={draft.fecha || defaultFecha} onChangeText={(t) => setDraft({ ...draft, fecha: t })} /></View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {cats.map((x: string) => {
            const bud = d.budget.find((b: any) => b.name === x);
            return <Chip key={x} label={`${bud?.icon ? bud.icon + ' ' : ''}${x}`} on={(draft.cat || (isIngreso ? 'Sueldo' : 'Otro')) === x} onPress={() => setDraft({ ...draft, cat: x })} />;
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <Field placeholder="Nota (opcional)" value={draft.nota} onChangeText={(t) => setDraft({ ...draft, nota: t })} onSubmitEditing={addMov} />
          <Button title="Agregar" onPress={addMov} />
        </View>
      </Card>

      <Section title="Presupuesto" right={<Button small kind="ghost" title={budgetEdit ? 'Listo' : 'Editar'} onPress={() => setBudgetEdit(!budgetEdit)} />} />
      <Card>
        {(['fijo', 'variable'] as const).map((t) => (
          <View key={t} style={{ marginBottom: t === 'fijo' ? 14 : 0 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: c.sub, fontSize: 12, fontWeight: '800' }}>COSTOS {t === 'fijo' ? 'FIJOS' : 'VARIABLES'}</Text>
              <Text style={{ color: c.sub, fontSize: 12, fontWeight: '800' }}>{fmtMoney(t === 'fijo' ? sm.fijos : sm.variables, 'ARS')} / {fmtMoney(t === 'fijo' ? budFijos : budVar, 'ARS')}</Text>
            </View>
            {d.budget.filter((b: any) => (b.tipo === 'fijo') === (t === 'fijo')).map((b: any) => {
              const real = sm.porCat[b.name] || 0;
              const pct = b.monto ? real / b.monto : 0;
              return (
                <View key={b.id} style={{ paddingVertical: 7, borderTopWidth: 1, borderTopColor: c.line }}>
                  {budgetEdit ? (
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <Field value={b.name} onChangeText={(x) => budUp(b.id, (y) => { y.name = x; })} />
                      <View style={{ width: 100 }}><Field keyboardType="number-pad" value={String(b.monto || '')} onChangeText={(x) => budUp(b.id, (y) => { const v = parseMoney(x); y.monto = Number.isFinite(v) ? v : 0; })} /></View>
                      <Chip label={b.tipo === 'fijo' ? 'Fijo' : 'Var.'} onPress={() => budUp(b.id, (y) => { y.tipo = y.tipo === 'fijo' ? 'variable' : 'fijo'; })} />
                      <IconBtn tone="danger" onPress={() => up((st) => { st.finance.budget = st.finance.budget.filter((x: any) => x.id !== b.id); })}>✕</IconBtn>
                    </View>
                  ) : (
                    <>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                        <Text style={{ color: c.ink, fontWeight: '700', fontSize: 13.5, flex: 1 }}>{b.icon} {b.name}</Text>
                        <Text style={{ color: pct > 1 ? c.red : c.ink, fontWeight: '700', fontSize: 13.5 }}>{fmtMoney(real, 'ARS')} <Text style={{ color: c.sub, fontWeight: '600' }}>/ {fmtMoney(b.monto, 'ARS')}</Text></Text>
                      </View>
                      <View style={{ marginTop: 6 }}><Bar pct={pct} color={pct > 1 ? c.red : pct > 0.85 ? c.amber : c.primary} height={6} /></View>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        ))}
        {budgetEdit && <Button small kind="soft" title="＋ Agregar categoría" style={{ marginTop: 10 }} onPress={() => up((st) => { st.finance.budget = st.finance.budget || []; st.finance.budget.push({ id: uid(), name: 'Nueva categoría', tipo: 'variable', monto: 0, icon: '🧾' }); })} />}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.line }}>
          <Text style={{ color: c.ink, fontWeight: '800' }}>Total del mes</Text>
          <Text style={{ color: c.ink, fontWeight: '800' }}>{fmtMoney(sm.egresos, 'ARS')} / {fmtMoney(budFijos + budVar, 'ARS')}</Text>
        </View>
      </Card>

      <Section title="Movimientos" />
      <Card>
        {!sm.ms.length && <Empty text="Todavía no cargaste nada este mes" />}
        {[...sm.ms].sort((a: any, b: any) => (b.fecha || '').localeCompare(a.fecha || '')).map((m: any, i: number) => (
          <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: c.ink, fontWeight: '800', fontSize: 13.5 }}>{m.cat}{m.nota ? <Text style={{ color: c.sub, fontWeight: '600' }}> · {m.nota}</Text> : null}</Text>
              <Text style={{ color: c.sub, fontSize: 11.5, fontWeight: '600' }}>{m.fecha.slice(8, 10)}/{m.fecha.slice(5, 7)}{m.tipo === 'egreso' ? ` · ${m.clase === 'fijo' ? 'fijo' : 'variable'}` : ' · ingreso'}</Text>
            </View>
            <Text style={{ fontWeight: '800', fontSize: 14, color: m.tipo === 'ingreso' ? c.okInk : c.ink }}>{m.tipo === 'ingreso' ? '+' : '−'}{fmtMoney(m.monto, 'ARS')}</Text>
            <IconBtn tone="danger" onPress={() => up((st) => { st.finance.movs = st.finance.movs.filter((x: any) => x.id !== m.id); })}>✕</IconBtn>
          </View>
        ))}
      </Card>
    </>
  );
}

function Meta({ d }: { d: any }) {
  const c = useColors();
  const [edit, setEdit] = useState(false);
  const plan = d.plan;
  const pct = d.planMeta ? Math.max(0, d.netARS) / d.planMeta : 0;
  const ahorroMes = d.monthSummary(d.curMonth).ahorro;
  const mesesProy = plan.ahorroMensual > 0 ? Math.ceil(d.planFalta / plan.ahorroMensual) : null;
  const llegaEn = mesesProy != null ? shiftYm(d.curMonth, mesesProy) : null;
  const aTiempo = llegaEn != null && llegaEn <= plan.fecha.slice(0, 7);
  const setPlan = (fn: (p: any) => void) => up((st) => { fn(st.finance.plan); });

  return (
    <>
      <View style={{ backgroundColor: c.primary, borderRadius: 22, padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Ring pct={pct} size={92} stroke={9} color="#fff">
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>{Math.round(Math.min(1, pct) * 100)}%</Text>
          </Ring>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>🏠 {String(plan.nombre).toUpperCase()}</Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 4 }}>{fmtMoney(Math.max(0, d.netARS), 'ARS')}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700' }}>de {fmtMoney(d.planMeta, 'ARS')}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.22)' }}>
          {([['Falta', fmtMoney(d.planFalta, 'ARS')], ['Quedan', d.planDias > 0 ? `${d.planDias} días` : '¡Llegó!'], ['Por mes', d.planFalta > 0 ? fmtMoney(d.planPorMes, 'ARS') : '—']] as const).map(([l, v]) => (
            <View key={l} style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' }}>{l.toUpperCase()}</Text>
              <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 2 }}>{v}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={{ color: c.sub, fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 8 }}>El progreso es tu patrimonio neto: cuentas de Patrimonio menos pasivos.</Text>

      <Section title="Ritmo" />
      <Card style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: c.ink, fontWeight: '700' }}>Objetivo de ahorro mensual</Text><Text style={{ color: c.ink, fontWeight: '700' }}>{fmtMoney(plan.ahorroMensual, 'ARS')}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: c.ink, fontWeight: '700' }}>Ahorro real este mes</Text>
          <Text style={{ color: ahorroMes >= plan.ahorroMensual ? c.okInk : c.ink, fontWeight: '700' }}>{ahorroMes < 0 ? '−' : ''}{fmtMoney(Math.abs(ahorroMes), 'ARS')}</Text>
        </View>
        {d.planFalta > 0 && llegaEn && (
          <View style={{ marginTop: 6, padding: 10, borderRadius: 12, backgroundColor: aTiempo ? c.greenSoft : c.amberSoft }}>
            <Text style={{ color: aTiempo ? c.okInk : c.amberInk, fontWeight: '700', fontSize: 13, lineHeight: 19 }}>
              {aTiempo ? `A este ritmo llegás en ${ymLabel(llegaEn).toLowerCase()} ✅` : `A este ritmo llegás recién en ${ymLabel(llegaEn).toLowerCase()}. Para llegar a tiempo necesitás ${fmtMoney(d.planPorMes, 'ARS')}/mes.`}
            </Text>
          </View>
        )}
      </Card>

      <Section title="Qué necesitás juntar" right={<Button small kind="ghost" title={edit ? 'Listo' : 'Editar'} onPress={() => setEdit(!edit)} />} />
      <Card style={{ gap: 8 }}>
        {edit && (
          <>
            <Field label="NOMBRE" value={plan.nombre} onChangeText={(t) => setPlan((p) => { p.nombre = t; })} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Field label="FECHA (AAAA-MM-DD)" value={plan.fecha} onChangeText={(t) => setPlan((p) => { p.fecha = t; })} />
              <Field label="AHORRO / MES" keyboardType="number-pad" value={String(plan.ahorroMensual || '')} onChangeText={(t) => setPlan((p) => { const v = parseMoney(t); p.ahorroMensual = Number.isFinite(v) ? v : 0; })} />
            </View>
          </>
        )}
        {(plan.items || []).map((it: any) => (
          <View key={it.id} style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: 8 }}>
            {edit ? (
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Field value={it.name} onChangeText={(t) => setPlan((p) => { p.items.find((x: any) => x.id === it.id).name = t; })} />
                <View style={{ width: 110 }}><Field keyboardType="number-pad" value={String(it.monto || '')} onChangeText={(t) => setPlan((p) => { const v = parseMoney(t); p.items.find((x: any) => x.id === it.id).monto = Number.isFinite(v) ? v : 0; })} /></View>
                <IconBtn tone="danger" onPress={() => setPlan((p) => { p.items = p.items.filter((x: any) => x.id !== it.id); })}>✕</IconBtn>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                <Text style={{ color: c.ink, fontWeight: '700', flex: 1 }}>{it.name}</Text><Text style={{ color: c.ink, fontWeight: '700' }}>{fmtMoney(it.monto, 'ARS')}</Text>
              </View>
            )}
          </View>
        ))}
        {edit && <Button small kind="soft" title="＋ Agregar ítem" onPress={() => setPlan((p) => { p.items = p.items || []; p.items.push({ id: uid(), name: 'Nuevo ítem', monto: 0 }); })} />}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.line, paddingTop: 10 }}>
          <Text style={{ color: c.ink, fontWeight: '900', fontSize: 15 }}>Meta total</Text><Text style={{ color: c.ink, fontWeight: '900', fontSize: 15 }}>{fmtMoney(d.planMeta, 'ARS')}</Text>
        </View>
      </Card>
    </>
  );
}
