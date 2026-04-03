export type FeaturedProduct = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  siteImagePath: string;
  mobileImageUrl: string;
  websiteUrl: string;
};

const featuredProduct: FeaturedProduct = {
  id: "sheep-roll-official",
  name: "小羊卷官方主视觉",
  tagline: "来自 product image 的统一品牌主图",
  description:
    "当前官网与数字生命体 Demo 共用同一张 product image 主图，用于统一小羊卷 / 羊卷岛品牌表达。",
  siteImagePath: "/images/products/official/sheep-roll-official.jpg",
  mobileImageUrl: "https://www.colorful-lamb-rolls.cloud/images/products/official/sheep-roll-official.jpg",
  websiteUrl: "/"
};

export function getFeaturedProduct(): FeaturedProduct {
  return featuredProduct;
}
