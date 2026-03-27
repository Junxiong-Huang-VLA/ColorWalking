import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View
} from "react-native";
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

type DrawMode = "random" | "daily";
type RitualState = "idle" | "spinning" | "revealing";
type CompanionPhase = "enter" | "idle" | "anticipate" | "happy" | "comfort";

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
  const totalAngle = useRef(0);

  const [mode, setMode] = useState<DrawMode>("daily");
  const [ritualState, setRitualState] = useState<RitualState>("idle");
  const [ritualLine, setRitualLine] = useState("点一下转盘，收下今天的第一份温柔提醒。");
  const [todayCached, setTodayCached] = useState(false);

  const [result, setResult] = useState<DrawResult | null>(null);
  const [historyAll, setHistoryAll] = useState<DrawResult[]>([]);
  const [companionPhase, setCompanionPhase] = useState<CompanionPhase>("enter");

  const spinning = ritualState === "spinning";
  const history = historyAll.slice(0, 5);
  const stats = useMemo(() => computeHistoryStats(historyAll), [historyAll]);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as DrawResult[];
        setHistoryAll(parsed);
      } catch {
        setHistoryAll([]);
      }
    });

    loadRitual().then((ritual) => {
      if (!ritual) return;
      if (ritual.dayKey === formatDayKey(new Date())) {
        setResult(ritual.result);
        setTodayCached(true);
        setRitualLine("今天的颜色已经准备好了，你可以再看一次揭晓。");
      }
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCompanionPhase("idle");
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!spinning && result) {
        setCompanionPhase("comfort");
      }
    }, 18000);
    return () => clearTimeout(timer);
  }, [spinning, result?.id]);

  const persistHistory = useCallback(async (next: DrawResult[]) => {
    const keep = next.slice(0, 100);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(keep));
    setHistoryAll(keep);
  }, []);

  const spin = useCallback(async () => {
    if (spinning) return;

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
    setRitualLine("小羊卷在等你，一起揭晓今天的颜色。");

    const sector = 360 / engine.palette.length;
    const targetCenter = draw.index * sector + sector / 2;
    const rounds = 8 + Math.floor(Math.random() * 4);
    const duration = 3400 + Math.floor(Math.random() * 1200);
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
      setRitualLine("结果出来了，收下这份属于今天的温柔。\n");
      setResult(draw);

      const existingTodayIndex = historyAll.findIndex((x) => x.dayKey === draw.dayKey);
      let nextHistory = [...historyAll];
      if (existingTodayIndex >= 0 && mode === "daily") {
        nextHistory[existingTodayIndex] = draw;
      } else {
        nextHistory = [draw, ...nextHistory];
      }

      await persistHistory(nextHistory);
      setCompanionPhase("happy");

      setTimeout(() => {
        setRitualState("idle");
        setRitualLine(mode === "daily" ? "今天的颜色会一直陪着你。" : "随机模式下，每次都会有新的相遇。");
      }, 480);

      setTimeout(() => setCompanionPhase(mode === "daily" ? "comfort" : "idle"), 2200);
    });
  }, [engine, historyAll, mode, persistHistory, rotate, spinning]);

  const onShare = useCallback(async () => {
    if (!result) return;
    await Share.share({
      message: `我在 ColorWalking 抽到今日幸运色：${result.color.name} ${result.color.hex}。${result.color.message}`
    });
  }, [result]);

  const spinStyle = {
    transform: [
      {
        rotate: rotate.interpolate({
          inputRange: [0, 360],
          outputRange: ["0deg", "360deg"]
        })
      }
    ]
  };

  const centerLabel = spinning
    ? "揭晓中"
    : mode === "daily" && todayCached
      ? "再看今日色"
      : "开始抽色";

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <MobileSheepCompanion phase={companionPhase} colorName={result?.color.name} />

      <Text style={styles.ritualLine}>{ritualLine}</Text>

      <View style={styles.modeRow}>
        <Pressable
          onPress={() => {
            setMode("daily");
            if (ritualState === "idle") {
              setRitualLine(todayCached ? "今天的颜色已经在等你了。" : "今天模式下，每天只会有一个颜色结果。");
            }
          }}
          style={[styles.modeBtn, mode === "daily" && styles.modeBtnActive]}
        >
          <Text style={[styles.modeText, mode === "daily" && styles.modeTextActive]}>今日模式</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setMode("random");
            if (ritualState === "idle") setRitualLine("随机模式下，每次转盘都会出现新的颜色。\n");
          }}
          style={[styles.modeBtn, mode === "random" && styles.modeBtnActive]}
        >
          <Text style={[styles.modeText, mode === "random" && styles.modeTextActive]}>随机模式</Text>
        </Pressable>
      </View>

      <View style={styles.wheelBlock}>
        <View style={styles.pointer} />
        <Pressable style={styles.wheelPressable} onPress={() => void spin()}>
          <Animated.View style={[styles.wheelSurface, spinStyle]}>
            <WheelGraphic size={WHEEL_SIZE} colors={engine.palette} />
          </Animated.View>
          <Pressable style={styles.centerBtn} onPress={() => void spin()}>
            <Text style={styles.centerText}>{centerLabel}</Text>
          </Pressable>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>今日幸运色</Text>
        {result ? (
          <>
            <View style={[styles.swatch, { backgroundColor: result.color.hex }]} />
            <Text style={styles.colorName}>{result.color.name}</Text>
            <Text style={styles.hex}>{result.color.hex}</Text>
            {result.color.moodTag ? <Text style={styles.moodTag}>情绪关键词：{result.color.moodTag}</Text> : null}
            <Text style={styles.message}>{result.color.message}</Text>
            <Text style={styles.subline}>把这份颜色留给今天的自己。</Text>
            <Pressable style={styles.shareBtn} onPress={onShare}>
              <Text style={styles.shareText}>分享幸运色</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.placeholder}>点一下转盘，收下今天的小小光亮。</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>陪伴记录</Text>
        <Text style={styles.statText}>累计抽取：{stats.totalDraws}</Text>
        <Text style={styles.statText}>连续天数：{stats.streakDays}</Text>
        <Text style={styles.statText}>颜色种类：{stats.uniqueColors}</Text>
        {stats.topColor ? (
          <Text style={styles.statText}>最常出现：{stats.topColor.name}（{stats.topColor.count}次）</Text>
        ) : null}
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
    paddingBottom: 24,
    alignItems: "center"
  },
  ritualLine: {
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8E1F1",
    backgroundColor: "#F8FBFF",
    color: "#4A5D84",
    marginBottom: 10,
    lineHeight: 20
  },
  modeRow: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    marginBottom: 10
  },
  modeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D5DDED",
    backgroundColor: "#FFFFFF"
  },
  modeBtnActive: {
    backgroundColor: "#1F2A44",
    borderColor: "#1F2A44"
  },
  modeText: {
    color: "#30405F"
  },
  modeTextActive: {
    color: "#FFFFFF"
  },
  wheelBlock: {
    marginTop: 6,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 22,
    borderStyle: "solid",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#1F2A44",
    marginBottom: -4,
    zIndex: 2
  },
  wheelPressable: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    alignItems: "center",
    justifyContent: "center"
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
    backgroundColor: "#3E7BEE",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3E7BEE",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16
  },
  centerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700"
  },
  card: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 12
  },
  historyCard: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 16
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2A44",
    marginBottom: 10
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginBottom: 10
  },
  colorName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2A44"
  },
  hex: {
    fontSize: 14,
    color: "#61708B",
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
    color: "#667794"
  },
  shareBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#1F2A44",
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
