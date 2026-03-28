import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { MobileSheepCompanion } from "../components/MobileSheepCompanion";

export function PetScreen() {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>小羊卷</Text>
        <Text style={styles.desc}>今天的小羊卷状态：元气满满，想和你贴贴。</Text>
        <MobileSheepCompanion phase="happy" colorName="云朵蓝" />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>陪伴进度</Text>
        <Text style={styles.item}>亲密度：58 / 100</Text>
        <Text style={styles.item}>今日互动：2 次</Text>
        <Text style={styles.item}>推荐：摸摸头 + 抽一次色</Text>
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
  desc: { color: "#63759B", lineHeight: 20, marginBottom: 6 },
  item: { color: "#425472", marginBottom: 6 }
});
