import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

type CompanionPhase = "enter" | "idle" | "anticipate" | "happy" | "comfort";

type CompanionProps = {
  phase: CompanionPhase;
  colorName?: string;
};

const MESSAGE_POOL: Record<CompanionPhase, string[]> = {
  enter: ["小羊卷来陪你了。"],
  idle: ["今天也慢慢来，我们先看看颜色。", "我在这儿，陪你抽一份小幸运。"],
  anticipate: ["准备好了，我和你一起等结果。"],
  happy: ["这份颜色很适合你。", "收到啦，今天的颜色到了。"],
  comfort: ["辛苦了，记得也对自己温柔一点。", "不用着急，慢慢走也很好。"]
};

function pickMessage(pool: string[], recent: string[]): string {
  const candidates = pool.filter((item) => !recent.includes(item));
  const base = candidates.length ? candidates : pool;
  return base[Math.floor(Math.random() * base.length)];
}

export function MobileSheepCompanion({ phase, colorName }: CompanionProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [message, setMessage] = useState("小羊卷来陪你了。");
  const recentMessages = useRef<string[]>([]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  useEffect(() => {
    const next = pickMessage(MESSAGE_POOL[phase], recentMessages.current);
    recentMessages.current = [...recentMessages.current.slice(-3), next];
    const suffix = phase === "happy" && colorName ? ` 今日是${colorName}。` : "";
    setMessage(`${next}${suffix}`);
  }, [phase, colorName]);

  const bobStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: floatAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -4]
          })
        },
        { scale: scaleAnim }
      ]
    }),
    [floatAnim, scaleAnim]
  );

  return (
    <View style={styles.wrap}>
      <Animated.View style={bobStyle}>
        <Pressable
          style={styles.sheepBtn}
          onPressIn={() => {
            Animated.spring(scaleAnim, {
              toValue: 0.95,
              useNativeDriver: true
            }).start();
          }}
          onPressOut={() => {
            Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 4,
              useNativeDriver: true
            }).start();
          }}
        >
          <Text style={styles.sheepFace}>🐑</Text>
        </Pressable>
      </Animated.View>
      <View style={styles.bubble}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    marginBottom: 12,
    alignItems: "flex-start"
  },
  sheepBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D8E1F1"
  },
  sheepFace: {
    fontSize: 28
  },
  bubble: {
    marginTop: 8,
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8E1F1",
    backgroundColor: "#F8FBFF",
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  message: {
    color: "#415274",
    fontSize: 14
  }
});
