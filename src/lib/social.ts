/* Social tipo Strava: perfil con @usuario, seguir amigos, feed de salidas y kudos.
   Necesita cuenta en la nube (en modo local no hay social). */
import { downsample } from '@/lib/fitness';
import type { RunData } from '@/lib/runTracker';
import type { Rec } from '@/lib/store';
import { supabase } from '@/lib/supabase';

export type Profile = { id: string; username: string; name: string | null };
export type FeedItem = {
  id: string; user_id: string; date: string; created_at: string;
  data: Pick<RunData, 'km' | 'sec' | 'kcal' | 'elevGain' | 'startedAt'> & { route: [number, number][] };
  profile: Profile | null;
  kudos: number;
  myKudo: boolean;
};

const sb = () => {
  if (!supabase) throw new Error('El social necesita una cuenta en la nube.');
  return supabase;
};
const me = async () => {
  const { data } = await sb().auth.getUser();
  if (!data.user) throw new Error('Iniciá sesión.');
  return data.user.id;
};

export async function getMyProfile(): Promise<Profile | null> {
  const uid = await me();
  const { data } = await sb().from('profiles').select('id,username,name').eq('id', uid).maybeSingle();
  return data as Profile | null;
}

export async function saveProfile(username: string, name: string): Promise<Profile> {
  const uid = await me();
  const u = username.trim().toLowerCase().replace(/^@/, '');
  if (!/^[a-z0-9_.]{3,20}$/.test(u)) throw new Error('El usuario va de 3 a 20 letras, números, punto o guion bajo.');
  const { data, error } = await sb().from('profiles').upsert({ id: uid, username: u, name: name.trim() || null }).select('id,username,name').single();
  if (error) throw new Error(error.code === '23505' ? 'Ese usuario ya existe, probá otro.' : error.message);
  return data as Profile;
}

export async function searchProfiles(q: string): Promise<Profile[]> {
  const term = q.trim().toLowerCase().replace(/^@/, '');
  if (term.length < 2) return [];
  const uid = await me();
  const { data } = await sb().from('profiles').select('id,username,name')
    .or(`username.ilike.%${term.replace(/[%,()]/g, '')}%,name.ilike.%${term.replace(/[%,()]/g, '')}%`)
    .neq('id', uid).limit(20);
  return (data as Profile[]) || [];
}

export async function listFollowing(): Promise<string[]> {
  const uid = await me();
  const { data } = await sb().from('follows').select('following').eq('follower', uid);
  return (data || []).map((r: { following: string }) => r.following);
}

export async function follow(id: string) {
  const uid = await me();
  const { error } = await sb().from('follows').insert({ follower: uid, following: id });
  if (error && error.code !== '23505') throw error;
}

export async function unfollow(id: string) {
  const uid = await me();
  await sb().from('follows').delete().eq('follower', uid).eq('following', id);
}

/* Publica una salida en el feed (solo si tenés perfil social). */
export async function publishRun(rec: Rec<RunData>) {
  if (!supabase) return;
  const profile = await getMyProfile().catch(() => null);
  if (!profile) return;
  const r = rec.data;
  await sb().from('activities').upsert({
    id: rec.id, user_id: profile.id, date: rec.date,
    data: { km: r.km, sec: r.sec, kcal: r.kcal, elevGain: r.elevGain, startedAt: r.startedAt, route: downsample(r.route, 150) },
  });
}

export async function unpublishRun(id: string) {
  if (!supabase) return;
  await supabase.from('activities').delete().eq('id', id);
}

export async function loadFeed(): Promise<FeedItem[]> {
  const uid = await me();
  const { data, error } = await sb().from('activities')
    .select('id,user_id,date,created_at,data,profile:profiles(id,username,name)')
    .order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  const items = (data || []) as any[];
  const ids = items.map((i) => i.id);
  const { data: k } = ids.length
    ? await sb().from('kudos').select('activity_id,user_id').in('activity_id', ids)
    : { data: [] as { activity_id: string; user_id: string }[] };
  return items.map((i) => {
    const mine = (k || []).filter((x: any) => x.activity_id === i.id);
    return { ...i, profile: Array.isArray(i.profile) ? i.profile[0] : i.profile, kudos: mine.length, myKudo: mine.some((x: any) => x.user_id === uid) };
  });
}

export async function toggleKudo(item: FeedItem) {
  const uid = await me();
  if (item.myKudo) await sb().from('kudos').delete().eq('activity_id', item.id).eq('user_id', uid);
  else await sb().from('kudos').insert({ activity_id: item.id, user_id: uid });
}
