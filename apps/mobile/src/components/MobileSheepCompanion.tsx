import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { CHIBI_THEME } from "../../../../packages/chibi-ui/src";

export type CompanionPhase = "enter" | "idle" | "anticipate" | "revealing" | "happy" | "comfort";
export type SheepSkin = "classic" | "mint" | "berry";

type CompanionProps = {
  phase: CompanionPhase;
  colorName?: string;
  onPet?: () => void;
  skin?: SheepSkin;
};

const MESSAGE_POOL: Record<CompanionPhase, string[]> = {
  enter: ["小羊卷到场啦，今天也要可可爱爱。"],
  idle: ["慢慢来，我们先抱抱今天的心情。", "准备好就点一下，我会一直在。"],
  anticipate: ["正在帮你把好运整理好。"],
  revealing: ["叮，幸运色正在揭晓。"],
  happy: ["今天这抹颜色和你很搭。", "把这份小好运装进口袋吧。"],
  comfort: ["辛苦了，今天也已经很棒了。"]
};

const SKIN_MAP: Record<SheepSkin, { shell: string; ear: string; scarf: string; tag: string }> = {
  classic: { shell: "#FFF9F1", ear: "#F6EBDD", scarf: "#9FD2FF", tag: "#7BCB91" },
  mint: { shell: "#F2FFF8", ear: "#E3F5EA", scarf: "#95E7CF", tag: "#7CCB9A" },
  berry: { shell: "#FFF4FA", ear: "#FCE2EE", scarf: "#D7B4FF", tag: "#E38CB5" }
};

function pickMessage(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? "我在。";
}

function faceForPhase(phase: CompanionPhase): string {
  if (phase === "anticipate" || phase === "revealing") return "☆";
  if (phase === "happy") return "✦";
  if (phase === "comfort") return "♡";
  return "•";
}

export function MobileSheepCompanion({ phase, colorName, onPet, skin = "classic" }: CompanionProps) {
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const message = useMemo(() => {
    const base = pickMessage(MESSAGE_POOL[phase]);
    return phase === "happy" && colorName ? `${base} 今日色是 ${colorName}。` : base;
  }, [phase, colorName]);

  const eye = faceForPhase(phase);
  const s = SKIN_MAP[skin];

  const petAnim = {
    transform: [
      {
        translateY: breathe.interpolate({ inputRange: [0, 1], outputRange: [0, -3] })
      },
      {
        scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] })
      }
    ]
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Animated.View style={petAnim}>
          <Pressable style={[styles.petShell, { backgroundColor: s.shell }]} onPress={onPet}>
            <View style={[styles.earLeft, { backgroundColor: s.ear }]} />
            <View style={[styles.earRight, { backgroundColor: s.ear }]} />
            <View style={styles.fluffTop} />

            <View style={styles.faceCard}>
              <View style={styles.eyeRow}>
                <View style={styles.eye}><Text style={styles.eyeMark}>{eye}</Text></View>
                <View style={styles.eye}><Text style={styles.eyeMark}>{phase === "happy" ? "◕" : "•"}</Text></View>
              </View>
              <View style={styles.nose} />
              <View style={styles.mouth} />
              <View style={styles.blushLeft} />
              <View style={styles.blushRight} />
            </View>

            <View style={[styles.scarf, { backgroundColor: s.scarf }]} />
            <View style={[styles.tag, { backgroundColor: s.tag }]} />
          </Pressable>
        </Animated.View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Q版小羊卷</Text>
        </View>
      </View>

      <View style={styles.bubble}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    marginBottom: 14
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  petShell: {
    width: 96,
    height: 110,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#F1E4D8",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  earLeft: {
    position: "absolute",
    left: 8,
    top: 18,
    width: 14,
    height: 20,
    borderRadius: 8
  },
  earRight: {
    position: "absolute",
    right: 8,
    top: 18,
    width: 14,
    height: 20,
    borderRadius: 8
  },
  fluffTop: {
    position: "absolute",
    top: 8,
    width: 30,
    height: 10,
    borderRadius: 8,
    backgroundColor: "#FFFFFF"
  },
  faceCard: {
    width: 62,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFE4D7",
    alignItems: "center",
    justifyContent: "center"
  },
  eyeRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: -2
  },
  eye: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2A3A62",
    alignItems: "center",
    justifyContent: "center"
  },
  eyeMark: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
    lineHeight: 10
  },
  nose: {
    marginTop: 5,
    width: 7,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2A3A62"
  },
  mouth: {
    marginTop: 2,
    width: 14,
    height: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: "#2A3A62"
  },
  blushLeft: {
    position: "absolute",
    left: 7,
    bottom: 12,
    width: 10,
    height: 6,
    borderRadius: 4,
    backgroundColor: "#F7B8C8"
  },
  blushRight: {
    position: "absolute",
    right: 7,
    bottom: 12,
    width: 10,
    height: 6,
    borderRadius: 4,
    backgroundColor: "#F7B8C8"
  },
  scarf: {
    position: "absolute",
    bottom: 16,
    width: 56,
    height: 11,
    borderRadius: 7
  },
  tag: {
    position: "absolute",
    bottom: 13,
    right: 21,
    width: 8,
    height: 13,
    borderRadius: 3
  },
  badge: {
    height: 28,
    borderRadius: CHIBI_THEME.radius.pill,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#DDE9FF"
  },
  badgeText: {
    color: "#4F6890",
    fontSize: 12,
    fontWeight: "700"
  },
  bubble: {
    marginTop: 10,
    borderRadius: CHIBI_THEME.radius.pill,
    borderWidth: 1,
    borderColor: CHIBI_THEME.color.bubbleBorder,
    backgroundColor: CHIBI_THEME.color.bubbleBg,
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  message: {
    color: CHIBI_THEME.color.textNormal,
    fontSize: 14,
    lineHeight: 20
  }
});
