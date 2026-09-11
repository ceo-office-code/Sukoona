/**
 * Copy and product data for the Sukoona concept prototype.
 *
 * The packaging images are real design concepts for one product.
 * Everything written here — ingredients, tasting notes, pack blurbs —
 * is clearly marked placeholder text for design review only.
 * No formulation, strength, dosage or health claim is stated anywhere.
 */

export type StyleKey = "soft" | "balanced" | "bold";

export const STYLES: { key: StyleKey; label: string; blurb: string }[] = [
  { key: "soft", label: "Soft", blurb: "Pale ivory, light botanical green." },
  { key: "balanced", label: "Balanced", blurb: "Warm cream, deep forest and gold." },
  { key: "bold", label: "Bold", blurb: "Deep forest ground, champagne gold." },
];

export type EditionKey = "forest" | "coral" | "midnight";

export type Edition = {
  key: EditionKey;
  name: string;
  swatch: string;
  accent: string;
  image: string;
  note: string;
  description: string;
  motifs: string[];
};

/**
 * Three packaging colourways of the same concept product.
 * These are visual alternatives, not different recipes.
 */
export const EDITIONS: Edition[] = [
  {
    key: "forest",
    name: "Forest",
    swatch: "#1E4A42",
    accent: "#C79A3A",
    image: "/product/forest.png",
    note: "Deep teal and gold",
    description:
      "The first label. Deep forest teal paper, a gold crescent, painted sage leaves and a coral arc along the base.",
    motifs: ["Forest teal", "Champagne gold", "Coral arc"],
  },
  {
    key: "coral",
    name: "Coral",
    swatch: "#BC5E44",
    accent: "#8E2F28",
    image: "/product/coral.png",
    note: "Terracotta and blush",
    description:
      "The warm colourway. Dusty terracotta paper with a burgundy wordmark and a pale blush arc edged in gold.",
    motifs: ["Terracotta", "Burgundy", "Blush arc"],
  },
  {
    key: "midnight",
    name: "Midnight",
    swatch: "#1F3566",
    accent: "#C0A24A",
    image: "/product/midnight.png",
    note: "Indigo and lilac",
    description:
      "The evening colourway. Midnight indigo paper, silvery-blue foliage and a dusty lilac arc at the base.",
    motifs: ["Midnight indigo", "Silver sage", "Lilac arc"],
  },
];

export const PACKS = [
  { size: 5, label: "5 pieces", blurb: "A short try." },
  { size: 10, label: "10 pieces", blurb: "The standard jar." },
] as const;

export type Ingredient = {
  key: string;
  name: string;
  short: string;
  detail: string;
};

/** Placeholder botanicals for layout review. Not the product formulation. */
export const INGREDIENTS: Ingredient[] = [
  {
    key: "chamomile",
    name: "Chamomile",
    short: "Evening flower",
    detail:
      "A small daisy-like flower, dried and steeped. Placeholder entry used to test how a botanical reads in this card.",
  },
  {
    key: "cardamom",
    name: "Cardamom",
    short: "Warm spice",
    detail:
      "Green pods, lightly crushed. Placeholder entry used to test a short warm-spice description.",
  },
  {
    key: "lemon-balm",
    name: "Lemon balm",
    short: "Garden herb",
    detail:
      "A leafy mint relative with a soft citrus edge. Placeholder entry for a two-line herb description.",
  },
  {
    key: "tart-cherry",
    name: "Tart cherry",
    short: "Fruit note",
    detail:
      "Pressed and reduced. Placeholder entry used to check how a fruit note sits beside the others.",
  },
  {
    key: "ginger",
    name: "Ginger",
    short: "Root",
    detail:
      "A thin slice of warmth. Placeholder entry for the shortest description in the set.",
  },
  {
    key: "pectin",
    name: "Fruit pectin",
    short: "Plant base",
    detail:
      "The setting agent, drawn from fruit. Placeholder entry standing in for a base ingredient.",
  },
];

export const FAQS = [
  {
    q: "What is this page?",
    a: "A design prototype for the Sukoona brand. It exists so layout, wording and interaction can be reviewed before any real product page is built.",
  },
  {
    q: "Can I buy anything here?",
    a: "No. There is no checkout, no cart and no payment. Nothing on this page is for sale.",
  },
  {
    q: "Are Forest, Coral and Midnight different products?",
    a: "No. They are three packaging colourways of one concept jar. The label design changes. Nothing else does.",
  },
  {
    q: "Does the style bar change the product?",
    a: "No. Soft, Balanced and Bold change the colours of this page and the illustration only. They change no product detail.",
  },
  {
    q: "Why is there no ingredient list or strength?",
    a: "This prototype deliberately carries no formulation, strength, dosage or health claim. The ingredient cards hold placeholder text for layout review.",
  },
];
