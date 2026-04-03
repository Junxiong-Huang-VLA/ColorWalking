import React from "react";
import { getFeaturedProduct } from "@colorwalking/shared";
import { Image, Linking, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import { CompanionHubScreen } from "./src/screens/CompanionHubScreen";
import { LuckyWheelScreen } from "./src/screens/LuckyWheelScreen";

export default function App() {
  const featuredProduct = getFeaturedProduct();
  const [activeTab, setActiveTab] = React.useState<"companion" | "lucky_color">("companion");

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.brand}>ColorWalking</Text>
        <Text style={styles.subtitle}>小羊卷数字生命体 · 温柔低打扰陪伴</Text>

        <View style={styles.productCard}>
          <Image source={{ uri: featuredProduct.mobileImageUrl }} style={styles.productImage} />
          <Text style={styles.productTitle}>{featuredProduct.name}</Text>
          <Text style={styles.productTagline}>{featuredProduct.tagline}</Text>
          <Pressable style={styles.productBtn} onPress={() => Linking.openURL(featuredProduct.websiteUrl)}>
            <Text style={styles.productBtnText}>打开官网</Text>
          </Pressable>
        </View>

        <View style={styles.topTabs}>
          <Pressable
            style={[styles.topTab, activeTab === "companion" && styles.topTabActive]}
            onPress={() => setActiveTab("companion")}
          >
            <Text style={[styles.topTabText, activeTab === "companion" && styles.topTabTextActive]}>数字生命体</Text>
          </Pressable>
          <Pressable
            style={[styles.topTab, activeTab === "lucky_color" && styles.topTabActive]}
            onPress={() => setActiveTab("lucky_color")}
          >
            <Text style={[styles.topTabText, activeTab === "lucky_color" && styles.topTabTextActive]}>幸运色转盘</Text>
          </Pressable>
        </View>

        {activeTab === "companion" ? <CompanionHubScreen /> : <LuckyWheelScreen />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F6FB"
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12
  },
  brand: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1F2A44"
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 15,
    color: "#62708A"
  },
  productCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#FFFFFF"
  },
  productImage: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginBottom: 8
  },
  productTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2A44"
  },
  productTagline: {
    marginTop: 2,
    marginBottom: 8,
    color: "#61708B"
  },
  productBtn: {
    alignSelf: "flex-start",
    borderRadius: 8,
    backgroundColor: "#1F2A44",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  productBtnText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  topTabs: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    marginBottom: 10
  },
  topTab: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CFDAEE",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    alignItems: "center"
  },
  topTabActive: {
    backgroundColor: "#1F2A44",
    borderColor: "#1F2A44"
  },
  topTabText: {
    color: "#34425D",
    fontWeight: "600"
  },
  topTabTextActive: {
    color: "#FFFFFF"
  }
});
