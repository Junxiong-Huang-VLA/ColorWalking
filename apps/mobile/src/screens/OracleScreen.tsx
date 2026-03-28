import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const ORACLE_HINTS = [
  "宜：给今天留一点松弛感。",
  "宜：先做最小的一步，再继续。",
  "宜：和喜欢的人分享一件小事。",
  "忌：把自己逼得太紧。",
  "宜：慢慢来，也会到达。"
];

export function OracleScreen() {
  const tip = ORACLE_HINTS[new Date().getDate() % ORACLE_HINTS.length] ?? ORACLE_HINTS[0];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>时色签</Text>
        <Text style={styles.desc}>给今天一个轻轻的提醒，小羊卷说：你已经做得很好。</Text>
        <View style={styles.tipBox}>
          <Text style={styles.tip}>{tip}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>今日小行动</Text>
        <Text style={styles.item}>1. 先喝一口温水</Text>
        <Text style={styles.item}>2. 完成一件最小任务</Text>
        <Text style={styles.item}>3. 给自己一句鼓励</Text>
        <Pressable style={styles.btn}>
          <Text style={styles.btnText}>我已收到</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingBottom: 20 },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8ECF8",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12
  },
  title: { fontSize: 19, fontWeight: "800", color: "#24365C", marginBottom: 8 },
  desc: { color: "#63759B", lineHeight: 20 },
  tipBox: { marginTop: 12, borderRadius: 14, backgroundColor: "#F6FAFF", padding: 12 },
  tip: { color: "#3B527F", fontWeight: "700" },
  item: { color: "#425472", marginBottom: 6 },
  btn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#4B7FE8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  btnText: { color: "#FFFFFF", fontWeight: "700" }
});
