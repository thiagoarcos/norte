/* AMIGOS: feed de salidas de la gente que seguís (tipo Strava), kudos y buscar personas. */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { RouteSketch } from '@/components/RouteSketch';
import { Button, Card, Empty, Field, Note, Segmented, Stat } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { fmtDay } from '@/lib/derived';
import { fmtDur, fmtPace } from '@/lib/fitness';
import {
  follow, getMyProfile, listFollowing, loadFeed, saveProfile, searchProfiles, toggleKudo, unfollow,
  type FeedItem, type Profile,
} from '@/lib/social';

export default function Social() {
  const c = useColors();
  const { user } = useAuth();
  const [me, setMe] = useState<Profile | null | undefined>(undefined);
  const [tab, setTab] = useState<'feed' | 'buscar'>('feed');
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [form, setForm] = useState({ username: '', name: user?.name ?? '' });

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const p = await getMyProfile();
      setMe(p);
      if (p) {
        const [f, fl] = await Promise.all([loadFeed(), listFollowing()]);
        setFeed(f);
        setFollowing(fl);
      }
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudo cargar');
      setMe((m) => (m === undefined ? null : m));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.local) return;
    // diferido: la primera carga no debe hacer setState dentro del efecto
    const t = setTimeout(refresh, 0);
    return () => clearTimeout(t);
  }, [user, refresh]);

  useEffect(() => {
    const t = setTimeout(() => { searchProfiles(q).then(setResults).catch(() => {}); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  if (!user || user.local) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, padding: 16 }}>
        <Note>Para seguir amigos y ver sus salidas necesitás una cuenta (Google, Apple o email). En modo local no hay social.</Note>
      </View>
    );
  }

  if (me === null) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ color: c.ink, fontSize: 24, fontWeight: '900' }}>Elegí tu usuario</Text>
        <Text style={{ color: c.sub }}>Así tus amigos te encuentran. Tus salidas se comparten solo con quienes te siguen.</Text>
        <Field label="Usuario" value={form.username} onChangeText={(t) => setForm({ ...form, username: t })} placeholder="ej: thiago.corre" autoCapitalize="none" />
        <Field label="Nombre" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="Tu nombre" />
        {err ? <Note tone="warn">{err}</Note> : null}
        <Button title="Crear perfil" onPress={async () => {
          try { setMe(await saveProfile(form.username, form.name)); setErr(null); refresh(); } catch (e: any) { setErr(e.message); }
        }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={c.primary} />}
      keyboardShouldPersistTaps="handled">
      {me && <Text style={{ color: c.sub, fontWeight: '700', marginBottom: 10 }}>Sos @{me.username} · seguís a {following.length}</Text>}
      <Segmented options={[['feed', 'Salidas'], ['buscar', 'Buscar amigos']]} value={tab} onChange={setTab} />
      {err ? <View style={{ marginTop: 10 }}><Note tone="warn">{err}</Note></View> : null}

      {tab === 'feed' && (
        <View style={{ marginTop: 12, gap: 12 }}>
          {feed.length === 0 && !loading && (
            <Card><Empty text="Todavía no hay salidas. Seguí a tus amigos desde 'Buscar amigos' y tus salidas también aparecen acá." /></Card>
          )}
          {feed.map((it) => {
            const mine = it.user_id === me?.id;
            const name = mine ? 'Vos' : it.profile?.name || `@${it.profile?.username ?? 'alguien'}`;
            return (
              <Card key={it.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: mine ? c.primary : c.accent, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '900' }}>{(name[0] || '?').toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.ink, fontWeight: '800' }}>{name}</Text>
                    <Text style={{ color: c.sub, fontSize: 12.5 }}>{fmtDay(it.date)} · salió a correr</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <RouteSketch route={it.data.route} size={92} />
                  <View style={{ flex: 1, gap: 10 }}>
                    <View style={{ flexDirection: 'row' }}>
                      <Stat value={it.data.km.toFixed(2)} label="km" align="flex-start" />
                      <Stat value={it.data.sec ? fmtDur(it.data.sec) : '–'} label="tiempo" align="flex-start" />
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                      <Stat value={it.data.sec ? fmtPace(it.data.sec / it.data.km) : '–'} label="ritmo /km" align="flex-start" />
                      <Stat value={`${it.data.elevGain ?? 0} m`} label="desnivel" align="flex-start" />
                    </View>
                  </View>
                </View>
                <Pressable
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setFeed((f) => f.map((x) => x.id === it.id ? { ...x, myKudo: !x.myKudo, kudos: x.kudos + (x.myKudo ? -1 : 1) } : x));
                    try { await toggleKudo(it); } catch { refresh(); }
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-start' }}>
                  <Ionicons name={it.myKudo ? 'flame' : 'flame-outline'} size={22} color={it.myKudo ? c.amber : c.sub} />
                  <Text style={{ color: it.myKudo ? c.amberInk : c.sub, fontWeight: '800' }}>
                    {it.kudos > 0 ? `${it.kudos} ` : ''}{mine ? 'kudos' : it.myKudo ? '¡Bien ahí!' : 'Dar kudos'}
                  </Text>
                </Pressable>
              </Card>
            );
          })}
        </View>
      )}

      {tab === 'buscar' && (
        <View style={{ marginTop: 12, gap: 10 }}>
          <Field value={q} onChangeText={setQ} placeholder="Buscá por @usuario o nombre" autoCapitalize="none" autoFocus />
          <Card style={{ paddingVertical: 4 }}>
            {results.length === 0 && <Empty text={q.trim().length < 2 ? 'Escribí al menos 2 letras.' : 'No encontré a nadie.'} />}
            {results.map((p) => {
              const on = following.includes(p.id);
              return (
                <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.ink, fontWeight: '700' }}>{p.name || p.username}</Text>
                    <Text style={{ color: c.sub, fontSize: 12.5 }}>@{p.username}</Text>
                  </View>
                  <Button small kind={on ? 'soft' : 'primary'} title={on ? 'Siguiendo' : 'Seguir'} onPress={async () => {
                    setFollowing((f) => (on ? f.filter((x) => x !== p.id) : [...f, p.id]));
                    try { if (on) await unfollow(p.id); else await follow(p.id); refresh(); } catch (e: any) { setErr(e.message); }
                  }} />
                </View>
              );
            })}
          </Card>
        </View>
      )}
    </ScrollView>
  );
}
