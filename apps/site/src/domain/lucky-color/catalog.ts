/**
 * @deprecated 已由 `src/config/lucky-colors.json` + `src/lib/luckyColorEngine.ts` 接管主链。
 * 保留仅用于历史回溯，不应继续引用。
 */
import type { LuckyColorItem } from "../../state/types";

export const LUCKY_COLOR_CATALOG: LuckyColorItem[] = [
  {
    colorId: "apricot_mist",
    colorName: "杏雾",
    hex: "#F5C7A8",
    softHex: "#F9E4D5",
    glowHex: "#FFD8C2",
    category: "warm_cloud",
    keywords: ["慢一点", "温暖", "被接住"],
    message: "这份颜色是送给今天的你。",
    moodBias: { baseEmotion: "soft", levelBias: 8, stabilityBias: 0.1 }
  },
  {
    colorId: "cloud_blue",
    colorName: "云湾蓝",
    hex: "#7FA9D9",
    softHex: "#C9DBEE",
    glowHex: "#A9C8E8",
    category: "cloud_cool",
    keywords: ["呼吸", "平静", "低打扰"],
    message: "今天可以慢一点。",
    moodBias: { baseEmotion: "calm", levelBias: 6, stabilityBias: 0.12 }
  },
  {
    colorId: "moon_milk",
    colorName: "月乳白",
    hex: "#F2EFE7",
    softHex: "#FBF8F1",
    glowHex: "#FFF6E7",
    category: "moonlight",
    keywords: ["安静", "轻轻", "夜色"],
    message: "不着急，我在这里。",
    moodBias: { baseEmotion: "soft", levelBias: 5, stabilityBias: 0.15 }
  },
  {
    colorId: "mint_cloud",
    colorName: "薄荷云",
    hex: "#9ECFB9",
    softHex: "#DCEFE5",
    glowHex: "#BCE5D4",
    category: "green_soft",
    keywords: ["舒缓", "慢风", "放松"],
    message: "今天也给自己一点温柔。",
    moodBias: { baseEmotion: "calm", levelBias: 7, stabilityBias: 0.1 }
  },
  {
    colorId: "butter_sun",
    colorName: "奶油阳",
    hex: "#F7D98A",
    softHex: "#FCEFC9",
    glowHex: "#FFE7A8",
    category: "sun_warm",
    keywords: ["一点元气", "轻亮", "暖暖的"],
    message: "今天会有一点轻轻的开心。",
    moodBias: { baseEmotion: "happy", levelBias: 10, stabilityBias: 0.06 }
  },
  {
    colorId: "sky_veil",
    colorName: "天纱青",
    hex: "#8DC7D6",
    softHex: "#D2EBF0",
    glowHex: "#AEE1EA",
    category: "breeze",
    keywords: ["微风", "轻陪伴", "云朵"],
    message: "这份颜色会轻轻陪着你。",
    moodBias: { baseEmotion: "soft", levelBias: 6, stabilityBias: 0.1 }
  },
  {
    colorId: "rose_dawn",
    colorName: "玫晨粉",
    hex: "#E9B3B8",
    softHex: "#F6D9DC",
    glowHex: "#F2C6CB",
    category: "blush",
    keywords: ["抱抱", "温柔", "靠近"],
    message: "你值得被温柔对待。",
    moodBias: { baseEmotion: "soft", levelBias: 9, stabilityBias: 0.11 }
  },
  {
    colorId: "amber_honey",
    colorName: "琥珀蜜",
    hex: "#DDAA68",
    softHex: "#F0D8B8",
    glowHex: "#E8C38F",
    category: "amber",
    keywords: ["暖", "看见自己", "小小开心"],
    message: "今天把这份暖色放在身边。",
    moodBias: { baseEmotion: "happy", levelBias: 8, stabilityBias: 0.07 }
  },
  {
    colorId: "lake_gray",
    colorName: "湖雾灰",
    hex: "#AAB7C8",
    softHex: "#DCE2EA",
    glowHex: "#C4CFDE",
    category: "mist",
    keywords: ["收心", "安静", "慢下来"],
    message: "先把呼吸放慢一点。",
    moodBias: { baseEmotion: "calm", levelBias: 5, stabilityBias: 0.14 }
  },
  {
    colorId: "lilac_hush",
    colorName: "雾丁香",
    hex: "#B9B0D9",
    softHex: "#E2DCF1",
    glowHex: "#CDC3E8",
    category: "hush",
    keywords: ["轻声", "月夜", "静静"],
    message: "今天轻轻说，也很好。",
    moodBias: { baseEmotion: "shy", levelBias: 7, stabilityBias: 0.12 }
  },
  {
    colorId: "cocoa_night",
    colorName: "可可夜",
    hex: "#8E7A73",
    softHex: "#D2C4BE",
    glowHex: "#B59D95",
    category: "dusk",
    keywords: ["休息", "夜晚", "慢慢来"],
    message: "困一点也没关系。",
    moodBias: { baseEmotion: "sleepy", levelBias: 12, stabilityBias: 0.16 }
  },
  {
    colorId: "moss_soft",
    colorName: "苔软绿",
    hex: "#8FAE88",
    softHex: "#D6E4D2",
    glowHex: "#ABC7A5",
    category: "island",
    keywords: ["生长", "岛屿", "安心"],
    message: "今天就轻轻往前走。",
    moodBias: { baseEmotion: "soft", levelBias: 7, stabilityBias: 0.09 }
  },
  {
    colorId: "rain_glass",
    colorName: "雨玻蓝",
    hex: "#6F8DAF",
    softHex: "#C5D3E1",
    glowHex: "#93ADC6",
    category: "rain",
    keywords: ["被陪着", "安静", "不逞强"],
    message: "慢一点也没关系。",
    moodBias: { baseEmotion: "sad", levelBias: 8, stabilityBias: 0.13 }
  }
];
