import React from "react";
import { useSEO, PAGE_SEO } from "../../utils/seo";

export const PricingPage: React.FC = () => {
  useSEO(PAGE_SEO.pricing);
  return null;
};
