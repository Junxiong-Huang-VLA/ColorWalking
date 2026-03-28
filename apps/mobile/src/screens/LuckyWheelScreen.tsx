import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View
} from "react-native";
import { buildLuckyShareText, MODE_RITUAL_LINE, RITUAL_LINES } from "@colorwalking/shared";
import { MobileSheepCompanion } from "../components/MobileSheepCompanion";
import {
  COLOR_PALETTE,
  computeHistoryStats,
  createDrawEngine,
  formatDayKey,
  type DrawResult
} from "../lib/luckyEngine";
import { WheelGraphic } from "../components/WheelGraphic";

const HISTORY_KEY = "colorwalking.history.v1";
const RITUAL_KEY = "colorwalking.mobile.ritual.v1";
const WHEEL_SIZE = 300;
const APP_BASE_ROUNDS = 9;
const APP_EXTRA_ROUNDS = 4;
const APP_BASE_DURATION = 3600;
const APP_EXTRA_DURATION = 1100;
const REVEAL_SETTLE_MS = 520;
const COMPANION_COOLDOWN_MS = 1800;
const ORBIT_SPIN_MS = 660;

const ICON = require("../../assets/icon.png");

type DrawMode = "random" | "daily";
type RitualState = "idle" | "spinning" | "revealing";
type CompanionPhase = "enter" | "idle" | "anticipate" | "revealing" | "happy" | "comfort";

type RitualStore = {
  dayKey: string;
  result: DrawResult;
};

async function loadRitual(): Promise<RitualStore | null> {
  const raw = await AsyncStorage.getItem(RITUAL_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RitualStore;
  } catch {
    return null;
  }
}

export function LuckyWheelScreen() {
  const engine = useMemo(() => createDrawEngine(COLOR_PALETTE), []);
  const rotate = useRef(new Animated.Value(0)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;
  const orbitSpin = useRef(new Animated.Value(0)).current;
  const orbitLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const totalAngle = useRef(0);
  const revealSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const companionCooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mode, setMode] = useState<DrawMode>("daily");
  const [ritualState, setRitualState] = useState<RitualState>("idle");
  const [ritualLine, setRitualLine] = useState(MODE_RITUAL_LINE.daily(false));
  const [todayCached, setTodayCached] = useState(false);

  const [result, setResult] = useState<DrawResult | null>(null);
  const [historyAll, setHistoryAll] = useState<DrawResult[]>([]);
  const [companionPhase, setCompanionPhase] = useState<CompanionPhase>("enter");

  const busy = ritualState !== "idle";
  const spinning = ritualState === "spinning";
  const history = historyAll.slice(0, 5);
  const stats = useMemo(() => computeHistoryStats(historyAll), [historyAll]);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (!raw) return;
      try {
        setHistoryAll(JSON.parse(raw) as DrawResult[]);
      } catch {
        setHistoryAll([]);
      }
    });

    loadRitual().then((ritual) => {
      if (!ritual) return;
      if (ritual.dayKey === formatDayKey(new Date())) {
        setResult(ritual.result);
        setTodayCached(true);
        setRitualLine("今天的颜色已经准备好了，你可以再看一次揭晓。\n");
      }
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setCompanionPhase("idle"), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (spinning) {
      orbitSpin.setValue(0);
      orbitLoopRef.current = Animated.loop(
        Animated.timing(orbitSpin, {
          toValue: 1,
          duration: ORBIT_SPIN_MS,
          easing: Easing.linear,
          useNativeDriver: true
        })
      );
      orbitLoopRef.current.start();
    } else {
      orbitLoopRef.current?.stop();
      orbitSpin.stopAnimation(() => orbitSpin.setValue(0));
    }
    return () => orbitLoopRef.current?.stop();
  }, [orbitSpin, spinning]);

  useEffect(() => {
    return () => {
      if (revealSettleTimerRef.current) clearTimeout(revealSettleTimerRef.current);
      if (companionCooldownTimerRef.current) clearTimeout(companionCooldownTimerRef.current);
      orbitLoopRef.current?.stop();
    };
  }, []);

  const persistHistory = useCallback(async (next: DrawResult[]) => {
    const keep = next.slice(0, 100);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(keep));
    setHistoryAll(keep);
  }, []);

  const spin = useCallback(async () => {
    if (busy) return;

    if (revealSettleTimerRef.current) clearTimeout(revealSettleTimerRef.current);
    if (companionCooldownTimerRef.current) clearTimeout(companionCooldownTimerRef.current);

    const todayKey = formatDayKey(new Date());
    const ritual = await loadRitual();
    const draw =
      mode === "daily"
        ? ritual?.dayKey === todayKey
          ? ritual.result
          : engine.drawDaily()
        : engine.draw();

    if (mode === "daily" && (!ritual || ritual.dayKey !== todayKey)) {
      await AsyncStorage.setItem(RITUAL_KEY, JSON.stringify({ dayKey: todayKey, result: draw }));
      setTodayCached(true);
    }

    setCompanionPhase("anticipate");
    setRitualState("spinning");
    setRitualLine("小羊卷抱着幸运色礼盒，正在转转转。\n");

    const sector = 360 / engine.palette.length;
    const targetCenter = draw.index * sector + sector / 2;
    const rounds = APP_BASE_ROUNDS + Math.floor(Math.random() * APP_EXTRA_ROUNDS);
    const duration = APP_BASE_DURATION + Math.floor(Math.random() * APP_EXTRA_DURATION);
    const nextAngle = totalAngle.current + rounds * 360 + (360 - targetCenter);

    Animated.timing(rotate, {
      toValue: nextAngle,
      duration,
      easing: Easing.bezier(0.08, 0.86, 0.14, 1),
      useNativeDriver: true
    }).start(async () => {
      totalAngle.current = nextAngle % 360;
      rotate.setValue(totalAngle.current);

      setRitualState("revealing");
      setCompanionPhase("revealing");
      setRitualLine("叮！小羊卷把今天的颜色递给你啦。\n");
      setResult(draw);

      revealAnim.setValue(0);
      Animated.timing(revealAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.bezier(0.22, 0.8, 0.22, 1),
        useNativeDriver: true
      }).start();

      const existingTodayIndex = historyAll.findIndex((x) => x.dayKey === draw.dayKey);
      let nextHistory = [...historyAll];
      if (existingTodayIndex >= 0 && mode === "daily") nextHistory[existingTodayIndex] = draw;
      else nextHistory = [draw, ...nextHistory];

      void persistHistory(nextHistory);
      revealSettleTimerRef.current = setTimeout(() => {
        setRitualState("idle");
        const line = RITUAL_LINES[Math.floor(Math.random() * RITUAL_LINES.length)] ?? RITUAL_LINES[0];
        setRitualLine(line);
        setCompanionPhase("happy");
      }, REVEAL_SETTLE_MS);

      companionCooldownTimerRef.current = setTimeout(
        () => setCompanionPhase(mode === "daily" ? "comfort" : "idle"),
        REVEAL_SETTLE_MS + COMPANION_COOLDOWN_MS
      );
    });
  }, [busy, engine, historyAll, mode, persistHistory, revealAnim, rotate]);

  const onShare = useCallback(async () => {
    if (!result) return;
    await Share.share({
      message: buildLuckyShareText(result.color.name, result.color.hex, result.color.message)
    });
  }, [result]);

  const spinStyle = {
    transform: [
      {
        rotate: rotate.interpolate({ inputRange: [0, 360], outputRange: ["0deg", "360deg"] })
      }
    ]
  };

  const orbitSpinStyle = {
    transform: [
      {
        rotate: orbitSpin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] })
      }
    ]
  };

  const centerLabel = spinning
    ? "揭晓中"
    : ritualState === "revealing"
      ? "出结果啦"
      : mode === "daily" && todayCached
        ? "再看今日色"
        : "开始抽色";

  const revealStyle = {
    opacity: revealAnim.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }),
    transform: [
      {
        scale: revealAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] })
      }
    ]
  };

  const revealPulseStyle = {
    opacity: revealAnim.interpolate({ inputRange: [0, 1], outputRange: [0.36, 0] }),
    transform: [
      {
        scale: revealAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.35] })
      }
    ]
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.heroCard}>
        <Image source={ICON} style={styles.heroIcon} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>ColorWalking</Text>
          <Text style={styles.subtitle}>Q版小羊卷陪你抽今天的幸运色</Text>
        </View>
      </View>

      <MobileSheepCompanion phase={companionPhase} colorName={result?.color.name} />

      <Text style={styles.ritualLine}>{ritualLine}</Text>

      <View style={styles.modeRow}>
        <Pressable
          disabled={busy}
          onPress={() => {
            setMode("daily");
            if (ritualState === "idle") setRitualLine(MODE_RITUAL_LINE.daily(todayCached));
          }}
          style={[styles.modeBtn, mode === "daily" && styles.modeBtnActive]}
        >
          <Text style={[styles.modeText, mode === "daily" && styles.modeTextActive]}>今日模式</Text>
        </Pressable>
        <Pressable
          disabled={busy}
          onPress={() => {
            setMode("random");
            if (ritualState === "idle") setRitualLine(MODE_RITUAL_LINE.random());
          }}
          style={[styles.modeBtn, mode === "random" && styles.modeBtnActive]}
        >
          <Text style={[styles.modeText, mode === "random" && styles.modeTextActive]}>随机模式</Text>
        </Pressable>
      </View>

      <View style={styles.wheelCard}>
        <View style={styles.wheelBlock}>
          <View style={styles.pointer} />
          <Pressable style={styles.wheelPressable} onPress={() => void spin()} disabled={busy}>
            <View pointerEvents="none" style={[styles.orbitWrap, spinning && styles.orbitWrapActive]}>
              <View style={styles.orbitTrack} />
              <Animated.View style={[styles.orbitDotCarrier, orbitSpinStyle]}>
                <View style={styles.orbitDot} />
              </Animated.View>
            </View>
            <Animated.View style={[styles.wheelSurface, spinStyle]}>
              <WheelGraphic size={WHEEL_SIZE} colors={engine.palette} />
            </Animated.View>
            <Pressable style={[styles.centerBtn, busy && styles.centerBtnDisabled]} onPress={() => void spin()} disabled={busy}>
              <Text style={styles.centerText}>{centerLabel}</Text>
            </Pressable>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>今日幸运色</Text>
        {result ? (
          <Animated.View style={revealStyle}>
            <View style={styles.swatchWrap}>
              <Animated.View style={[styles.swatchPulse, { borderColor: result.color.hex }, revealPulseStyle]} />
              <View style={[styles.swatch, { backgroundColor: result.color.hex }]} />
            </View>
            <Text style={styles.colorName}>{result.color.name}</Text>
            <Text style={styles.hex}>{result.color.hex}</Text>
            {result.color.moodTag ? <Text style={styles.moodTag}>情绪关键词：{result.color.moodTag}</Text> : null}
            <Text style={styles.message}>{result.color.message}</Text>
            <Text style={styles.subline}>小羊卷说：把这份颜色放进今天的口袋。</Text>
            <Pressable style={styles.shareBtn} onPress={onShare}>
              <Text style={styles.shareText}>分享这份可爱好运</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Text style={styles.placeholder}>点一下转盘，收下今天的小小光亮。</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>陪伴记录</Text>
        <Text style={styles.statText}>累计抽取：{stats.totalDraws}</Text>
        <Text style={styles.statText}>连续天数：{stats.streakDays}</Text>
        <Text style={styles.statText}>颜色种类：{stats.uniqueColors}</Text>
        {stats.topColor ? <Text style={styles.statText}>最常出现：{stats.topColor.name}（{stats.topColor.count}次）</Text> : null}
      </View>

      <View style={styles.historyCard}>
        <Text style={styles.cardTitle}>最近抽取</Text>
        {history.length === 0 ? (
          <Text style={styles.placeholder}>还没有记录</Text>
        ) : (
          history.map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <View style={[styles.dot, { backgroundColor: item.color.hex }]} />
              <Text style={styles.historyText}>{item.color.name}</Text>
              <Text style={styles.historyHex}>{item.color.hex}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingBottom: 28,
    paddingHorizontal: 12,
    backgroundColor: "#F7F7FC"
  },
  heroCard: {
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECFA",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 14
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    color: "#213254"
  },
  subtitle: {
    marginTop: 2,
    color: "#6A7EA4",
    fontSize: 13
  },
  ritualLine: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DDE7FA",
    backgroundColor: "#FBFDFF",
    color: "#4A5F88",
    marginBottom: 10,
    lineHeight: 20
  },
  modeRow: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  modeBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D5DEEE",
    backgroundColor: "#FFFFFF"
  },
  modeBtnActive: {
    backgroundColor: "#2F4B8A",
    borderColor: "#2F4B8A"
  },
  modeText: {
    color: "#30405F",
    fontWeight: "700"
  },
  modeTextActive: {
    color: "#FFFFFF"
  },
  wheelCard: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8ECF8",
    marginBottom: 12,
    paddingVertical: 10
  },
  wheelBlock: {
    alignItems: "center",
    justifyContent: "center"
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 20,
    borderStyle: "solid",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#2B457D",
    marginBottom: -4,
    zIndex: 2
  },
  wheelPressable: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    alignItems: "center",
    justifyContent: "center"
  },
  orbitWrap: {
    position: "absolute",
    width: WHEEL_SIZE + 30,
    height: WHEEL_SIZE + 30,
    borderRadius: (WHEEL_SIZE + 30) / 2,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.42
  },
  orbitWrapActive: {
    opacity: 0.95
  },
  orbitTrack: {
    width: "100%",
    height: "100%",
    borderRadius: (WHEEL_SIZE + 30) / 2,
    borderWidth: 1,
    borderColor: "rgba(107, 157, 237, 0.30)"
  },
  orbitDotCarrier: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center"
  },
  orbitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: -3,
    backgroundColor: "#9DC6FF",
    shadowColor: "#77A9F4",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8
  },
  wheelSurface: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    overflow: "hidden",
    borderWidth: 6,
    borderColor: "#FFFFFF",
    elevation: 6
  },
  centerBtn: {
    position: "absolute",
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#4D80E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4D80E8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16
  },
  centerBtnDisabled: {
    opacity: 0.9
  },
  centerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800"
  },
  card: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8ECF8",
    padding: 16,
    marginBottom: 12
  },
  historyCard: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8ECF8",
    padding: 16
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#233457",
    marginBottom: 10
  },
  swatchWrap: {
    width: 56,
    height: 56,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: 14,
    zIndex: 1
  },
  swatchPulse: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 2
  },
  colorName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2A44"
  },
  hex: {
    fontSize: 14,
    color: "#62708C",
    marginBottom: 6
  },
  moodTag: {
    fontSize: 14,
    color: "#2F5E93",
    marginBottom: 6
  },
  message: {
    fontSize: 15,
    color: "#33415F",
    marginTop: 2
  },
  subline: {
    marginTop: 8,
    color: "#6E7FA1"
  },
  shareBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#2D467D",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  shareText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  statText: {
    color: "#455573",
    marginBottom: 4
  },
  placeholder: {
    color: "#77839A"
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10
  },
  historyText: {
    flex: 1,
    color: "#2A3653"
  },
  historyHex: {
    color: "#6A7791"
  }
});
