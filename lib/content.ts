/** Product preview copy. Ingredients remain explicitly marked as placeholders. */

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
    q: "Which jar is shown here?",
    a: "The signature forest Sukoona Gummy Vati jar, with a gold lid and a label that reads 10 gummies. The pack selector is a quantity preview; the forest label stays the same.",
  },
  {
    q: "What does the switch in the header do?",
    a: "It switches the page between dark and light themes. Your choice is remembered on this browser. The jar and product details stay the same.",
  },
  {
    q: "Why is there no ingredient list or strength?",
    a: "This prototype deliberately carries no formulation, strength, dosage or health claim. The ingredient cards hold placeholder text for layout review.",
  },
];
