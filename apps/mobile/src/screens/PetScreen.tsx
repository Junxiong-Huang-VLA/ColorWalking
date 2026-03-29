import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CHIBI_CARD_STYLE, CHIBI_THEME } from "../../../../packages/chibi-ui/src";
import { MobileSheepCompanion, type SheepSkin } from "../components/MobileSheepCompanion";

type PetAction = "feed" | "play" | "rest" | "groom" | "walk" | "pet";

type PetState = {
  level: number;
  xp: number;
  hunger: number;
  energy: number;
  clean: number;
  mood: number;
  skin: SheepSkin;
  souvenirs: string[];
  logs: string[];
  lastActionAt: string;
};

const PET_KEY = "colorwalking.mobile.pet.v3";
const HISTORY_KEY = "colorwalking.history.v1";
const XP_PER_LEVEL = 100;

const DEFAULT_PET: PetState = {
  level: 1,
  xp: 0,
  hunger: 40,
  energy: 78,
  clean: 80,
  mood: 82,
  skin: "classic",
  souvenirs: [],
  logs: ["小羊卷住进了你的口袋养成仓。"],
  lastActionAt: new Date().toISOString()
};

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function gainXp(state: PetState, gain: number): PetState {
  let xp = state.xp + gain;
  let level = state.level;
  while (xp >= XP_PER_LEVEL) {
    xp -= XP_PER_LEVEL;
    level += 1;
  }
  return { ...state, xp, level };
}

function applyDecay(state: PetState): PetState {
  const now = Date.now();
  const last = new Date(state.lastActionAt).getTime();
  if (!Number.isFinite(last) || now <= last) return state;
  const hours = (now - last) / 3600000;
  if (hours < 0.05) return state;

  const hunger = clamp(state.hunger + hours * 3.2);
  const energy = clamp(state.energy - hours * 2.5);
  const clean = clamp(state.clean - hours * 2.2);
  const mood = clamp(20 + (100 - hunger) * 0.35 + energy * 0.35 + clean * 0.3);

  return {
    ...state,
    hunger,
    energy,
    clean,
    mood,
    lastActionAt: new Date(now).toISOString()
  };
}

function petLine(action: PetAction): string {
  if (action === "feed") return "小羊卷：咩呜，好吃，心情上升！";
  if (action === "play") return "小羊卷：蹦蹦跳跳，陪你放松一下。";
  if (action === "rest") return "小羊卷：贴贴休息，电量回来了。";
  if (action === "groom") return "小羊卷：梳毛完毕，香香软软。";
  if (action === "walk") return "小羊卷：散步回来，捡到一份纪念品。";
  return "小羊卷：摸摸头，我就会很开心。";
}

function souvenirByAction(action: PetAction): string | null {
  if (action !== "walk") return null;
  const pool = ["云朵贴纸", "微风铃铛", "彩虹小纽扣", "糖果羽毛", "幸运丝带"];
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

async function readTodayLuckyColor(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return null;
  try {
    const list = JSON.parse(raw) as Array<{ color?: { name?: string } }>;
    return list[0]?.color?.name ?? null;
  } catch {
    return null;
  }
}

export function PetScreen() {
  const [pet, setPet] = useState<PetState>(DEFAULT_PET);
  const [phase, setPhase] = useState<"idle" | "happy" | "comfort">("idle");
  const [todayColor, setTodayColor] = useState<string | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(PET_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as PetState;
        setPet(applyDecay({ ...DEFAULT_PET, ...parsed }));
      } catch {
        setPet(DEFAULT_PET);
      }
    });
    readTodayLuckyColor().then((name) => setTodayColor(name ?? undefined));
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(PET_KEY, JSON.stringify(pet)).catch(() => {
      // ignore
    });
  }, [pet]);

  const xpPercent = Math.round((pet.xp / XP_PER_LEVEL) * 100);

  const runAction = (action: PetAction) => {
    setPet((prev) => {
      let next = applyDecay(prev);
      if (action === "feed") {
        next = gainXp({ ...next, hunger: clamp(next.hunger - 22), mood: clamp(next.mood + 8) }, 14);
      } else if (action === "play") {
        next = gainXp(
          {
            ...next,
            hunger: clamp(next.hunger + 7),
            energy: clamp(next.energy - 12),
            mood: clamp(next.mood + 10)
          },
          18
        );
      } else if (action === "rest") {
        next = gainXp({ ...next, energy: clamp(next.energy + 24), mood: clamp(next.mood + 6) }, 10);
      } else if (action === "groom") {
        next = gainXp({ ...next, clean: clamp(next.clean + 24), mood: clamp(next.mood + 6) }, 12);
      } else if (action === "walk") {
        const souvenir = souvenirByAction(action);
        next = gainXp(
          {
            ...next,
            energy: clamp(next.energy - 8),
            hunger: clamp(next.hunger + 10),
            mood: clamp(next.mood + 8),
            souvenirs: souvenir ? [souvenir, ...next.souvenirs].slice(0, 8) : next.souvenirs
          },
          16
        );
      } else {
        next = gainXp({ ...next, mood: clamp(next.mood + 4) }, 6);
      }

      const line = petLine(action);
      return {
        ...next,
        logs: [line, ...next.logs].slice(0, 12),
        lastActionAt: new Date().toISOString()
      };
    });

    setPhase(action === "rest" ? "comfort" : "happy");
    setTimeout(() => setPhase("idle"), 1000);
  };

  const moodDesc = useMemo(() => {
    if (pet.mood >= 85) return "开心到冒泡";
    if (pet.mood >= 65) return "状态稳定";
    if (pet.mood >= 40) return "需要陪伴";
    return "想要抱抱";
  }, [pet.mood]);

  const setSkin = (skin: SheepSkin) => {
    setPet((prev) => ({ ...prev, skin, logs: [`外观切换为 ${skin} 套装。`, ...prev.logs].slice(0, 12) }));
    setPhase("happy");
    setTimeout(() => setPhase("idle"), 900);
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>小羊卷养成仓</Text>
        <Text style={styles.desc}>和网站同主题的陪伴仓：喂食、玩耍、休息、清洁、散步都在这里。</Text>
        <MobileSheepCompanion phase={phase} colorName={todayColor} onPet={() => runAction("pet")} skin={pet.skin} />

        <View style={styles.skinRow}>
          <Pressable style={[styles.skinBtn, pet.skin === "classic" && styles.skinBtnActive]} onPress={() => setSkin("classic")}>
            <Text style={[styles.skinText, pet.skin === "classic" && styles.skinTextActive]}>经典</Text>
          </Pressable>
          <Pressable style={[styles.skinBtn, pet.skin === "mint" && styles.skinBtnActive]} onPress={() => setSkin("mint")}>
            <Text style={[styles.skinText, pet.skin === "mint" && styles.skinTextActive]}>薄荷</Text>
          </Pressable>
          <Pressable style={[styles.skinBtn, pet.skin === "berry" && styles.skinBtnActive]} onPress={() => setSkin("berry")}>
            <Text style={[styles.skinText, pet.skin === "berry" && styles.skinTextActive]}>莓莓</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>成长状态</Text>
        <View style={styles.meterRow}><Text style={styles.meterLabel}>等级</Text><Text style={styles.meterValue}>Lv.{pet.level}</Text></View>
        <View style={styles.progress}><View style={[styles.progressFill, { width: `${xpPercent}%` }]} /></View>
        <Text style={styles.note}>经验 {pet.xp}/{XP_PER_LEVEL}</Text>

        <View style={styles.meterRow}><Text style={styles.meterLabel}>心情</Text><Text style={styles.meterValue}>{pet.mood}</Text></View>
        <View style={styles.progress}><View style={[styles.progressFillSoft, { width: `${pet.mood}%` }]} /></View>
        <Text style={styles.note}>{moodDesc}</Text>

        <View style={styles.triplet}>
          <View style={styles.statBox}><Text style={styles.statLabel}>饥饿</Text><Text style={styles.statValue}>{pet.hunger}</Text></View>
          <View style={styles.statBox}><Text style={styles.statLabel}>体力</Text><Text style={styles.statValue}>{pet.energy}</Text></View>
          <View style={styles.statBox}><Text style={styles.statLabel}>洁净</Text><Text style={styles.statValue}>{pet.clean}</Text></View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>互动操作</Text>
        <View style={styles.actionGrid}>
          <Pressable style={styles.actionBtn} onPress={() => runAction("feed")}><Text style={styles.actionText}>喂食</Text></Pressable>
          <Pressable style={styles.actionBtn} onPress={() => runAction("play")}><Text style={styles.actionText}>玩耍</Text></Pressable>
          <Pressable style={styles.actionBtn} onPress={() => runAction("rest")}><Text style={styles.actionText}>休息</Text></Pressable>
          <Pressable style={styles.actionBtn} onPress={() => runAction("groom")}><Text style={styles.actionText}>清洁</Text></Pressable>
          <Pressable style={[styles.actionBtn, styles.actionWide]} onPress={() => runAction("walk")}><Text style={styles.actionText}>去散步拿纪念品</Text></Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>纪念品收藏</Text>
        {pet.souvenirs.length ? (
          <View style={styles.tags}>
            {pet.souvenirs.map((item, idx) => (
              <View key={`${item}-${idx}`} style={styles.tag}><Text style={styles.tagText}>{item}</Text></View>
            ))}
          </View>
        ) : (
          <Text style={styles.note}>还没有纪念品，去散步试试。</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>陪伴日志</Text>
        {pet.logs.map((line, idx) => (
          <Text key={`${line}-${idx}`} style={styles.logLine}>• {line}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingBottom: 20 },
  card: {
    ...CHIBI_CARD_STYLE,
    marginBottom: 12
  },
  title: { fontSize: 21, fontWeight: "800", color: CHIBI_THEME.color.textStrong, marginBottom: 6 },
  desc: { color: CHIBI_THEME.color.textSoft, lineHeight: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: CHIBI_THEME.color.textStrong, marginBottom: 8 },
  skinRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  skinBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#F4F8FF",
    borderWidth: 1,
    borderColor: "#DCE7FB"
  },
  skinBtnActive: {
    backgroundColor: CHIBI_THEME.color.primary,
    borderColor: CHIBI_THEME.color.primary
  },
  skinText: { color: CHIBI_THEME.color.primary, fontWeight: "700" },
  skinTextActive: { color: "#FFFFFF" },
  meterRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  meterLabel: { color: CHIBI_THEME.color.textNormal, fontWeight: "700" },
  meterValue: { color: CHIBI_THEME.color.textStrong, fontWeight: "800" },
  progress: {
    width: "100%",
    height: 8,
    borderRadius: 8,
    backgroundColor: "#E8EFFC",
    overflow: "hidden",
    marginTop: 6
  },
  progressFill: { height: "100%", backgroundColor: "#5E8BEA" },
  progressFillSoft: { height: "100%", backgroundColor: "#8FC4FF" },
  note: { marginTop: 6, color: CHIBI_THEME.color.textSoft },
  triplet: { flexDirection: "row", gap: 8, marginTop: 10 },
  statBox: {
    flex: 1,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#E4ECFC",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center"
  },
  statLabel: { color: CHIBI_THEME.color.textSoft, fontSize: 12 },
  statValue: { color: CHIBI_THEME.color.textStrong, fontWeight: "800", fontSize: 18, marginTop: 4 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionBtn: {
    width: "48%",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D8E4FA",
    backgroundColor: "#F5F9FF"
  },
  actionWide: { width: "100%", backgroundColor: "#EEF4FF" },
  actionText: { color: CHIBI_THEME.color.primary, fontWeight: "800" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#FFF8EE",
    borderWidth: 1,
    borderColor: "#F4E6CD"
  },
  tagText: { color: "#7D5D2F", fontWeight: "700" },
  logLine: { color: CHIBI_THEME.color.textNormal, lineHeight: 20, marginTop: 4 }
});
