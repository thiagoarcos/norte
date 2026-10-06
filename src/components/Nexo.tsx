/* Orbe flotante de NEXO + ventana de chat (como en NORTE). */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/constants/theme';
import { checkPendingReplies, sendChat, setTts, speakMsg, useNexoChat } from '@/lib/nexo';

export function NexoOrb() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const float = useSharedValue(0);
  const spin = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(withSequence(withTiming(-5, { duration: 2200, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })), -1);
    spin.value = withRepeat(withTiming(360, { duration: 7000, easing: Easing.linear }), -1);
  }, [float, spin]);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const bottom = insets.bottom + (Platform.OS === 'web' ? 76 : 96);

  return (
    <>
      {!open && (
        <Animated.View style={[{ position: 'absolute', right: 16, bottom, zIndex: 50 }, floatStyle]}>
          <Pressable onPress={() => { setOpen(true); checkPendingReplies(); }} accessibilityLabel="Hablar con NEXO"
            style={({ pressed }) => ({ width: 56, height: 56, borderRadius: 28, overflow: 'hidden', transform: [{ scale: pressed ? 0.9 : 1 }],
              shadowColor: '#10B981', shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 })}>
            <Animated.View style={[{ position: 'absolute', top: -14, left: -14, right: -14, bottom: -14 }, spinStyle]}>
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <View style={{ flex: 1, backgroundColor: '#10B981' }} />
                <View style={{ flex: 1, backgroundColor: '#34D399' }} />
              </View>
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <View style={{ flex: 1, backgroundColor: '#059669' }} />
                <View style={{ flex: 1, backgroundColor: '#00E676' }} />
              </View>
            </Animated.View>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="happy-outline" size={26} color="#fff" />
            </View>
          </Pressable>
        </Animated.View>
      )}
      <NexoChat open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function NexoChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { msgs, busy, tts } = useNexoChat();
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const input = useRef<TextInput>(null);
  const recog = useRef<any>(null);

  useEffect(() => { setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50); }, [msgs.length, busy, open]);

  const send = (t?: string) => { const v = (t ?? text).trim(); if (!v) return; setText(''); sendChat(v); };

  // Dictado: en la web con Web Speech; en el teléfono, el 🎤 del teclado.
  const mic = () => {
    const w = typeof window !== 'undefined' ? (window as any) : null;
    const SR = Platform.OS === 'web' && w ? (w.SpeechRecognition || w.webkitSpeechRecognition) : null;
    if (!SR) { input.current?.focus(); return; }
    if (listening) { recog.current?.stop(); return; }
    const r = new SR();
    r.lang = 'es-AR'; r.interimResults = true; r.continuous = false;
    r.onresult = (e: any) => {
      let t = '', final = false;
      for (let i = 0; i < e.results.length; i++) { t += e.results[i][0].transcript; if (e.results[i].isFinal) final = true; }
      setText(t);
      if (final && t.trim()) setTimeout(() => send(t), 120);
    };
    r.onend = () => { setListening(false); recog.current = null; };
    r.onerror = () => setListening(false);
    recog.current = r; setListening(true);
    try { r.start(); } catch { setListening(false); }
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} transparent={false}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.line }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="happy-outline" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.ink, fontWeight: '800', fontSize: 16 }}>NEXO</Text>
            <Text style={{ color: c.sub, fontSize: 11.5, fontWeight: '600' }}>Tu asistente</Text>
          </View>
          <Ionicons name={tts ? 'volume-high' : 'volume-mute'} size={21} color={tts ? c.primary : c.sub} onPress={() => setTts(!tts)} />
          <Ionicons name="close" size={24} color={c.sub} onPress={onClose} style={{ marginLeft: 8 }} />
        </View>
        <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 10, flexGrow: 1 }}>
          {msgs.length === 0 && (
            <View style={{ margin: 'auto', alignItems: 'center', maxWidth: 290, marginTop: 80 }}>
              <Ionicons name="happy-outline" size={40} color={c.sub} />
              <Text style={{ color: c.sub, fontSize: 14, fontWeight: '600', lineHeight: 21, textAlign: 'center', marginTop: 10 }}>
                Escribile a NEXO. Necesitás el servidor configurado (en Más → NEXO) y nexo_bridge.py corriendo en tu PC con NEXO prendido.
              </Text>
            </View>
          )}
          {msgs.map((m) => (
            <Pressable key={m.id} onPress={m.role === 'nexo' ? () => speakMsg(m.text) : undefined} style={{ alignSelf: m.role === 'me' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
              <View style={{
                paddingVertical: 10, paddingHorizontal: 13, borderRadius: 16,
                backgroundColor: m.role === 'me' ? c.primary : c.card, borderWidth: m.role === 'me' ? 0 : 1, borderColor: c.line,
                borderBottomRightRadius: m.role === 'me' ? 4 : 16, borderBottomLeftRadius: m.role === 'me' ? 16 : 4,
              }}>
                <Text style={{ color: m.role === 'me' ? '#fff' : c.ink, fontSize: 14.5, lineHeight: 20 }}>{m.text}</Text>
              </View>
            </Pressable>
          ))}
          {busy && <Text style={{ color: c.sub, fontSize: 13, fontWeight: '600' }}>NEXO está pensando…</Text>}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8, padding: 12, paddingBottom: insets.bottom + 12, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.line }}>
          <TextInput ref={input} value={text} onChangeText={setText} placeholder="Escribí o hablale a NEXO…" placeholderTextColor={c.sub}
            onSubmitEditing={() => send()} returnKeyType="send"
            style={{ flex: 1, backgroundColor: c.soft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: c.ink, borderWidth: 1, borderColor: c.line }} />
          <Pressable onPress={mic} disabled={busy} style={{ width: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: listening ? c.primary : c.line, opacity: busy ? 0.5 : 1 }}>
            <Ionicons name="mic" size={18} color={listening ? c.primary : c.sub} />
          </Pressable>
          <Pressable onPress={() => send()} disabled={busy} style={({ pressed }) => ({ width: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary, opacity: busy ? 0.5 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] })}>
            <Ionicons name="send" size={17} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
