import React from "react";
import { useSEO, PAGE_SEO } from "../../utils/seo";

export const BlogPage: React.FC = () => {
  useSEO(PAGE_SEO.blog);
  return null;
};
