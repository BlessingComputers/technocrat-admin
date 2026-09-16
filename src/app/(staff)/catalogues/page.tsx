import type { Metadata } from "next";
import { CatalogueHub } from "./catalogue-hub";

export const metadata: Metadata = {
  title: "Catalogues",
};

export default function CataloguesPage() {
  return <CatalogueHub />;
}
