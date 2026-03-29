import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CHIBI_CARD_STYLE, CHIBI_THEME } from "../../../../packages/chibi-ui/src";

type TabKey = "features" | "wheel" | "oracle" | "pet";

type Props = {
  onNavigate: (tab: TabKey) => void;
};

const FEATURE_ITEMS = [
  {
    title: "仪式感抽取",
    desc: "每天来一次，点一下转盘，收下一份属于今天的颜色和提醒。"
  },
  {
    title: "轻陪伴反馈",
    desc: "小羊卷会在抽色前后回应你，安静陪伴，不打扰也不缺席。"
  },
  {
    title: "可回看记录",
    desc: "自动保存最近结果，帮你看见情绪变化与颜色轨迹。"
  }
] as const;

const HABITS = ["先抽一色", "轻轻分享", "慢慢回看"] as const;
const FUTURE_STAGES = ["Now: 品牌站 + App 联动", "Next: 围巾/玩偶预约", "Later: AI陪伴 + 终端"] as const;

export function FeaturesScreen({ onNavigate }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>产品亮点</Text>
        <Text style={styles.desc}>和网页版同主题：品牌、产品、下载、IP 世界观、Future 路线正在统一成长。</Text>
        <View style={styles.grid}>
          {FEATURE_ITEMS.map((item) => (
            <View key={item.title} style={styles.featureBox}>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>每日小习惯</Text>
        <View style={styles.habitRow}>
          {HABITS.map((habit) => (
            <View key={habit} style={styles.habitTag}>
              <Text style={styles.habitText}>{habit}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.note}>不用一次做很多，今天只做一步也算前进。</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>IP 与未来路线</Text>
        <Text style={styles.desc}>小羊卷来自“颜色云岛”，未来会承接围巾系列、玩偶、桌面陪伴终端与 AI 陪伴能力。</Text>
        <View style={styles.futureList}>
          {FUTURE_STAGES.map((item) => (
            <Text key={item} style={styles.futureItem}>• {item}</Text>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>开始体验</Text>
        <View style={styles.actionGrid}>
          <Pressable style={styles.actionBtn} onPress={() => onNavigate("wheel")}>
            <Text style={styles.actionText}>去幸运转盘</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => onNavigate("oracle")}>
            <Text style={styles.actionText}>去时色签</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.actionBtnWide]} onPress={() => onNavigate("pet")}>
            <Text style={styles.actionText}>去小羊卷养成仓</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingBottom: 22
  },
  card: {
    ...CHIBI_CARD_STYLE,
    marginBottom: 12
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: CHIBI_THEME.color.textStrong,
    marginBottom: 6
  },
  desc: {
    color: CHIBI_THEME.color.textSoft,
    lineHeight: 20,
    marginBottom: 10
  },
  grid: {
    gap: 8
  },
  featureBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFE9FC",
    backgroundColor: "#F8FBFF",
    padding: 10
  },
  featureTitle: {
    color: CHIBI_THEME.color.textStrong,
    fontWeight: "800",
    marginBottom: 4
  },
  featureDesc: {
    color: CHIBI_THEME.color.textNormal,
    lineHeight: 19
  },
  habitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  habitTag: {
    borderRadius: CHIBI_THEME.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#EEF5FF",
    borderWidth: 1,
    borderColor: "#D8E6FF"
  },
  habitText: {
    color: "#43608D",
    fontWeight: "700"
  },
  note: {
    marginTop: 10,
    color: CHIBI_THEME.color.textSoft
  },
  futureList: {
    gap: 4
  },
  futureItem: {
    color: CHIBI_THEME.color.textNormal,
    lineHeight: 20
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  actionBtn: {
    width: "48%",
    borderRadius: 12,
    backgroundColor: "#F4F8FF",
    borderWidth: 1,
    borderColor: "#D8E4FA",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11
  },
  actionBtnWide: {
    width: "100%",
    backgroundColor: "#EAF2FF"
  },
  actionText: {
    color: CHIBI_THEME.color.primary,
    fontWeight: "800"
  }
});
