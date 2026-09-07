import React from "react";
import { useSEO, PAGE_SEO } from "../../utils/seo";

export const ContactPage: React.FC = () => {
  useSEO(PAGE_SEO.contact);
  return null;
};
