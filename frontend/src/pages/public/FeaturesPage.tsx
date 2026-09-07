import React from "react";
import { useSEO, PAGE_SEO } from "../../utils/seo";

export const FeaturesPage: React.FC = () => {
  useSEO(PAGE_SEO.features);
  return null;
};
