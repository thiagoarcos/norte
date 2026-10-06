/* MÁS (de NORTE + Vamo): cuenta, logros y medallas, hábitos, recordatorios, tips propios,
   NEXO (servidor y notificaciones), notificaciones del teléfono, Apple Health / Health
   Connect, tema, datos (importar desde NORTE, backup) y cerrar sesión. */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { Button, Card, Chip, DayPicker, Field, IconBtn, Note, Screen, Section } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { useMedals } from '@/lib/achievements';
import { useAuth } from '@/lib/auth';
import { Alert } from '@/lib/dialog';
import { pickFile, saveTextFile } from '@/lib/files';
import { connectHealth, healthSupported } from '@/lib/health';
import { pushCall } from '@/lib/nexo';
import { useNorte } from '@/lib/norte';
import { findNorteInBrowser, importFromText } from '@/lib/norteImport';
import { DAYS, dstr, uid } from '@/lib/norteData';
import { DEFAULT_NOTIFS, askNotifPermission } from '@/lib/notify';
import { exportAll, importNorte, setSettings, syncStatus, up, useSettings } from '@/lib/store';
import { flash } from '@/lib/toast';
import { disableWebPush, enableWebPush, webPushSupported } from '@/lib/webpush';

export default function Mas() {
  const c = useColors();
  const { user, signOut } = useAuth();
  const d = useNorte();
  const s = d.s;
  const settings = useSettings();
  const medals = useMedals();
  const [editRem, setEditRem] = useState<string | null>(null);
  const [newRem, setNewRem] = useState({ text: '', time: '18:00' });
  const [newTip, setNewTip] = useState('');
  const [importing, setImporting] = useState(false);
  const notifs = { ...DEFAULT_NOTIFS, ...(s.notifs || {}) };
  const isWeb = Platform.OS === 'web';
  const theme = settings.theme || 'system';

  const setNotif = async (patch: Partial<typeof notifs>) => {
    if (Object.values(patch).some((v) => v === true) && !(await askNotifPermission())) {
      Alert.alert('Notificaciones', 'Activá las notificaciones de Vamo en los ajustes del teléfono.');
      return;
    }
    up((st) => { st.notifs = { ...notifs, ...patch }; });
  };

  const importFile = async () => {
    try {
      const f = await pickFile(['application/json', 'text/plain', '*/*']);
      if (!f) return;
      setImporting(true);
      const text = await f.text();
      Alert.alert('¿Importar este backup de NORTE?', 'Reemplaza tus datos actuales de Vamo por los del backup.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Importar', onPress: () => {
          try { const r = importFromText(text); flash(`✅ Datos de NORTE importados${r.runs ? ` (+${r.runs} salidas)` : ''}`, 7000); }
          catch (e: any) { Alert.alert('No se pudo importar', e?.message ?? String(e)); }
        } },
      ]);
    } catch (e: any) {
      Alert.alert('No se pudo leer el archivo', e?.message ?? String(e));
    } finally { setImporting(false); }
  };
  const norteHere = isWeb ? findNorteInBrowser() : null;

  return (
    <Screen title="Más" subtitle="Cuenta, logros y ajustes">
      {/* Cuenta */}
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{(s.profile?.name || user?.name || user?.email || 'V').trim()[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.ink, fontWeight: '800', fontSize: 17 }}>{s.profile?.name || user?.name || 'Sin nombre'}</Text>
          <Text style={{ color: c.sub, fontSize: 12.5 }}>
            {user?.local ? 'Modo local · datos solo en este teléfono' : `${user?.email ?? ''} · ${syncStatus === 'ok' ? 'sincronizado ✓' : syncStatus === 'error' ? 'sin conexión' : 'sincronizando…'}`}
          </Text>
        </View>
      </Card>
      <Card style={{ marginTop: 10, gap: 8 }}>
        <Field label="Tu nombre" value={s.profile?.name ?? ''} placeholder={user?.name ?? 'Tu nombre'} onChangeText={(t) => setSettings({ name: t })} />
      </Card>
      <Card style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.primarySoft, borderColor: c.primarySoft }}>
        <Ionicons name="star" size={22} color={c.primary} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.ink, fontWeight: '800' }}>Beta gratis</Text>
          <Text style={{ color: c.sub, fontSize: 12.5 }}>Todo está desbloqueado mientras dure la prueba. Después, Vamo Pro costará US$10/mes.</Text>
        </View>
      </Card>

      {/* Tema */}
      <Section title="Tema" />
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {([['system', 'Automático'], ['light', '☀️ Claro'], ['dark', '🌙 Oscuro']] as const).map(([k, l]) => <Chip key={k} label={l} on={theme === k} onPress={() => setSettings({ theme: k })} />)}
      </View>

      {/* Logros de NORTE */}
      <Section title={`Logros (${d.achDone}/${d.ACHIEVEMENTS.length})`} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {d.ACHIEVEMENTS.map((a, i) => (
          <Card key={i} style={{ width: '48.5%', opacity: a.done ? 1 : 0.45, padding: 12 }}>
            <Ionicons name={(a.done ? a.icon : 'lock-closed') as any} size={24} color={a.done ? c.primary : c.sub} />
            <Text style={{ color: c.ink, fontWeight: '800', fontSize: 13.5, marginTop: 4 }}>{a.name}</Text>
            <Text style={{ color: c.sub, fontSize: 11.5, lineHeight: 15 }}>{a.desc}</Text>
          </Card>
        ))}
      </View>

      {/* Medallas de Vamo */}
      <Section title={`Medallas · ${medals.filter((m) => m.done).length}/${medals.length}`} />
      <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {medals.map((m) => (
          <Pressable key={m.id} onPress={() => Alert.alert(`${m.icon} ${m.name}`, `${m.desc}${m.done ? '\n\n¡Conseguida!' : `\n\nProgreso: ${Math.round((m.progress ?? 0) * 100)}%`}`)}
            style={{ width: '31%', alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: m.done ? c.amberSoft : c.soft, opacity: m.done ? 1 : 0.55 }}>
            <Text style={{ fontSize: 28 }}>{m.icon}</Text>
            <Text numberOfLines={2} style={{ color: c.ink, fontWeight: '700', fontSize: 11.5, textAlign: 'center', marginTop: 4 }}>{m.name}</Text>
            {!m.done && <View style={{ width: '70%', height: 4, borderRadius: 2, backgroundColor: c.line, marginTop: 6, overflow: 'hidden' }}><View style={{ width: `${(m.progress ?? 0) * 100}%`, height: '100%', backgroundColor: c.amber }} /></View>}
          </Pressable>
        ))}
      </Card>

      {/* Hábitos */}
      <Section title="Hábitos" />
      <Card onPress={() => router.push('/habitos')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontSize: 22 }}>🎯</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.ink, fontWeight: '800' }}>Tus hábitos ({s.habits.length})</Text>
          <Text style={{ color: c.sub, fontSize: 12.5 }}>Rachas, semana, últimos 28 días, íconos y días</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.sub} />
      </Card>

      {/* Recordatorios */}
      <Section title="Recordatorios" />
      {s.reminders.map((r: any) => {
        const editing = editRem === r.id;
        const rUp = (fn: (x: any) => void) => up((st) => { const x = st.reminders.find((y: any) => y.id === r.id); if (x) fn(x); });
        return (
          <Card key={r.id} style={{ marginBottom: 8, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {editing ? <View style={{ width: 90 }}><Field value={r.time} onChangeText={(t) => rUp((x) => { x.time = t; })} /></View>
                : <Text style={{ backgroundColor: c.amberSoft, color: c.amberInk, fontWeight: '800', fontSize: 13, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, overflow: 'hidden' }}>{r.time}</Text>}
              <View style={{ flex: 1 }}>
                {editing ? <Field value={r.text} onChangeText={(t) => rUp((x) => { x.text = t; })} /> : (
                  <>
                    <Text style={{ color: c.ink, fontWeight: '600', fontSize: 15 }}>{r.text}</Text>
                    <Text style={{ color: c.sub, fontSize: 12.5 }}>{r.days.length === 7 ? 'Todos los días' : r.days.map((x: number) => DAYS[x]).join(' · ')}</Text>
                  </>
                )}
              </View>
              <IconBtn onPress={() => setEditRem(editing ? null : r.id)}>{editing ? '✓' : '✎'}</IconBtn>
            </View>
            {editing && (
              <>
                <DayPicker days={r.days} onToggle={(i) => rUp((x) => { x.days = x.days.includes(i) ? x.days.filter((y: number) => y !== i) : [...x.days, i]; })} />
                <View style={{ alignItems: 'flex-end' }}>
                  <Button small kind="danger" title="Borrar" onPress={() => { setEditRem(null); up((st) => { st.reminders = st.reminders.filter((x: any) => x.id !== r.id); }); }} />
                </View>
              </>
            )}
          </Card>
        );
      })}
      <Card style={{ gap: 8 }}>
        <Text style={{ color: c.ink, fontWeight: '700' }}>Nuevo recordatorio</Text>
        <Field placeholder="Texto (ej: preparar comida de mañana)" value={newRem.text} onChangeText={(t) => setNewRem({ ...newRem, text: t })} />
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <Field label="Hora (HH:MM)" value={newRem.time} onChangeText={(t) => setNewRem({ ...newRem, time: t })} />
          <Button title="Agregar" onPress={() => {
            if (!newRem.text.trim()) return;
            up((st) => { st.reminders.push({ id: uid(), text: newRem.text.trim(), time: newRem.time, days: [0, 1, 2, 3, 4, 5, 6] }); });
            setNewRem({ text: '', time: '18:00' });
          }} />
        </View>
        <Text style={{ color: c.sub, fontSize: 12.5 }}>{isWeb ? 'Te llegan como notificación si activás las notificaciones de NEXO (abajo).' : 'Te llegan como notificación del teléfono.'}</Text>
      </Card>

      {/* Tips propios */}
      <Section title="Mis tips personalizados" />
      <Card style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <Field placeholder="Agregá tu propio tip o frase" value={newTip} onChangeText={setNewTip} />
          <Button title="＋" onPress={() => { if (!newTip.trim()) return; up((st) => { st.customTips = [...(st.customTips || []), newTip.trim()]; }); setNewTip(''); }} />
        </View>
        {(s.customTips || []).map((t: string, i: number) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: c.line, paddingTop: 8 }}>
            <Text style={{ flex: 1, color: c.ink }}>⭐ {t}</Text>
            <IconBtn tone="danger" onPress={() => up((st) => { st.customTips = st.customTips.filter((_: string, j: number) => j !== i); })}>✕</IconBtn>
          </View>
        ))}
        {(s.customTips || []).length === 0 && <Text style={{ color: c.sub, fontSize: 13 }}>Tus tips entran en la rotación del “Tip del día”.</Text>}
      </Card>

      {/* NEXO */}
      <Section title="NEXO 🤖" />
      <Card style={{ gap: 8 }}>
        <Text style={{ color: c.sub, fontSize: 13, lineHeight: 19 }}>Servidor (relay) de NEXO: el mismo de NORTE. Con esto funcionan el chat, los comandos de NEXO y el sync de tu día. Si importaste tu backup de NORTE ya viene cargado.</Text>
        <Field placeholder="URL del servidor (https://…workers.dev)" autoCapitalize="none" value={s.push?.url || ''} onChangeText={(t) => up((st) => { st.push = { ...(st.push || {}), url: t.trim() }; })} />
        <Field placeholder="Token secreto" autoCapitalize="none" secureTextEntry value={s.push?.token || ''} onChangeText={(t) => up((st) => { st.push = { ...(st.push || {}), token: t.trim() }; })} />
        {isWeb && (
          s.push?.enabled ? (
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Text style={{ flex: 1, color: c.primary, fontWeight: '700' }}>✅ Notificaciones activadas en este teléfono</Text>
              <Button small kind="soft" title="Probar" onPress={async () => { const r = await pushCall('/test'); flash(r && r.ok ? 'Enviada: fijate la notificación 📲' : 'No se pudo enviar la prueba'); }} />
              <Button small kind="danger" title="Desactivar" onPress={async () => { await disableWebPush(); flash('Notificaciones desactivadas'); }} />
            </View>
          ) : (
            <>
              <Button small title="Activar notificaciones en este teléfono" onPress={async () => flash(await enableWebPush(), 8000)} />
              {!webPushSupported() && <Text style={{ color: c.sub, fontSize: 12 }}>En iPhone: agregá Vamo a la pantalla de inicio (Compartir → Agregar a inicio, iOS 16.4+).</Text>}
            </>
          )
        )}
      </Card>

      {/* Notificaciones del teléfono */}
      {!isWeb && (
        <>
          <Section title="Notificaciones del teléfono" />
          <Card style={{ gap: 4 }}>
            {([
              ['water', 'Agua', `Cada ${notifs.waterEvery} h, de ${notifs.waterFrom} a ${notifs.waterTo} h`],
              ['fasting', 'Ayuno', 'Cuando empieza y cuando termina'],
              ['run', 'Correr', `Todos los días a las ${notifs.runTime} con los km que tocan`],
            ] as const).map(([k, l, sub]) => (
              <Pressable key={k} onPress={() => setNotif({ [k]: !notifs[k] })} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.ink, fontWeight: '700', fontSize: 15 }}>{l}</Text>
                  <Text style={{ color: c.sub, fontSize: 12.5 }}>{sub}</Text>
                </View>
                <Ionicons name={notifs[k] ? 'toggle' : 'toggle-outline'} size={38} color={notifs[k] ? c.primary : c.sub} />
              </Pressable>
            ))}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Field label="Agua cada (h)" keyboardType="number-pad" value={String(notifs.waterEvery)} onChangeText={(t) => setNotif({ waterEvery: Math.max(1, Math.min(6, Number(t) || 2)) })} />
              <Field label="Aviso de correr" value={notifs.runTime} onChangeText={(t) => setNotif({ runTime: t })} />
            </View>
            <Text style={{ color: c.sub, fontSize: 12 }}>Los recordatorios, la agenda y el ayuno también llegan como notificación.</Text>
          </Card>
        </>
      )}

      {/* Salud del teléfono */}
      {!isWeb && (
        <>
          <Section title={Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect'} />
          <Card style={{ gap: 10 }}>
            <Text style={{ color: c.sub, fontSize: 13 }}>Leé tus pasos y pulso del día, y guardá tus salidas como entrenamientos.</Text>
            {healthSupported ? (
              <Button kind={s.health ? 'soft' : 'primary'} title={s.health ? 'Conectado ✓ (tocá para desconectar)' : 'Conectar'} onPress={async () => {
                if (s.health) { setSettings({ health: false }); return; }
                const ok = await connectHealth().catch(() => false);
                if (ok) setSettings({ health: true });
                else Alert.alert('No se pudo conectar', Platform.OS === 'android' ? 'Instalá o actualizá Health Connect desde Play Store.' : 'Revisá los permisos en Salud → Perfil → Apps → Vamo.');
              }} />
            ) : <Note>Disponible en la app instalada (no en Expo Go).</Note>}
          </Card>
        </>
      )}

      {/* Datos */}
      <Section title="Datos" />
      <Card style={{ gap: 10 }}>
        <Text style={{ color: c.sub, fontSize: 12.5, lineHeight: 18 }}>
          {user?.local ? 'Modo local: todo vive en este teléfono. Guardá un backup de vez en cuando.' : 'Tus datos se guardan en tu cuenta y se sincronizan entre tus dispositivos.'}
        </Text>
        {norteHere && (
          <Button title="Importar datos de NORTE de este navegador" onPress={() => Alert.alert('¿Importar tus datos de NORTE?', 'Reemplaza tus datos actuales de Vamo por los que NORTE dejó en este navegador.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Importar', onPress: () => { const r = importNorte(norteHere); flash(`✅ Datos de NORTE importados${r.runs ? ` (+${r.runs} salidas)` : ''}`, 7000); } },
          ])} />
        )}
        <Button kind="soft" title={importing ? 'Leyendo…' : 'Importar backup de NORTE (archivo)'} icon={<Ionicons name="download-outline" size={18} color={c.scheme === 'dark' ? c.primaryInk : c.primary} />} onPress={importFile} />
        <Button kind="soft" title="Exportar backup" icon={<Ionicons name="share-outline" size={18} color={c.scheme === 'dark' ? c.primaryInk : c.primary} />} onPress={async () => {
          try { await saveTextFile(`vamo-backup-${dstr()}.json`, JSON.stringify(exportAll(), null, 2)); flash('📦 Backup listo'); } catch { flash('No se pudo generar el backup'); }
        }} />
        <Text style={{ color: c.sub, fontSize: 12 }}>El backup de Vamo tiene el mismo formato que el de NORTE.</Text>
      </Card>

      <Button kind="danger" title="Cerrar sesión" style={{ marginTop: 24 }} onPress={() =>
        Alert.alert('¿Cerrar sesión?', user?.local ? 'En modo local tus datos quedan en este teléfono.' : 'Tus datos quedan guardados en tu cuenta.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
        ])} />
    </Screen>
  );
}
