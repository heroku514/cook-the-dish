import Anthropic from "@anthropic-ai/sdk";

const MOCK_RECIPES: Record<string, object> = {
  "mapo tofu": {
    dish: { name_en: "Mapo Tofu", name_original: "麻婆豆腐", cuisine: "Sichuan Chinese", servings: 2, prep_time_min: 15, cook_time_min: 15, description: "A fiery Sichuan classic featuring silky tofu in a spicy, numbing chili-bean sauce with ground pork." },
    ingredients: [
      { name: "firm tofu", name_original: "豆腐", quantity: 1, unit: "block", weight_g: 400, category: "protein", is_specialty: false, substitutes: ["silken tofu", "extra firm tofu"], notes: "Cut into 1-inch cubes, blanch in salted water for 2 minutes" },
      { name: "ground pork", name_original: "猪肉末", quantity: 150, unit: "gram", weight_g: 150, category: "protein", is_specialty: false, substitutes: ["ground beef", "ground chicken", "crumbled tempeh"], notes: null },
      { name: "doubanjiang (chili bean paste)", name_original: "豆瓣酱", quantity: 2, unit: "tablespoon", weight_g: 36, category: "sauce", is_specialty: true, substitutes: ["gochujang + miso paste", "sambal oelek + soy sauce"], notes: "Pixian brand preferred" },
      { name: "Sichuan peppercorns", name_original: "花椒", quantity: 1, unit: "tablespoon", weight_g: 5, category: "spice", is_specialty: true, substitutes: ["black peppercorns + lemon zest", "Japanese sansho pepper"], notes: "Toast and grind fresh for best flavor" },
      { name: "scallions", name_original: "葱", quantity: 3, unit: "stalk", weight_g: 30, category: "produce", is_specialty: false, substitutes: ["chives", "leek greens"], notes: "Separate white and green parts" },
      { name: "garlic", name_original: "蒜", quantity: 4, unit: "clove", weight_g: 16, category: "produce", is_specialty: false, substitutes: ["garlic paste"], notes: "Finely minced" },
      { name: "fresh ginger", name_original: "姜", quantity: 1, unit: "inch piece", weight_g: 10, category: "produce", is_specialty: false, substitutes: ["ginger paste"], notes: "Finely minced" },
      { name: "fermented black beans", name_original: "豆豉", quantity: 1, unit: "tablespoon", weight_g: 12, category: "sauce", is_specialty: true, substitutes: ["black bean sauce", "extra doubanjiang"], notes: "Rinse and roughly chop" },
      { name: "soy sauce", name_original: "酱油", quantity: 1, unit: "tablespoon", weight_g: 15, category: "sauce", is_specialty: false, substitutes: ["tamari", "coconut aminos"], notes: "Light soy sauce preferred" },
      { name: "sesame oil", name_original: "麻油", quantity: 1, unit: "teaspoon", weight_g: 5, category: "staple", is_specialty: false, substitutes: ["toasted sesame oil"], notes: "For finishing" },
      { name: "cornstarch", name_original: "淀粉", quantity: 1, unit: "tablespoon", weight_g: 10, category: "staple", is_specialty: false, substitutes: ["potato starch"], notes: "Mix with 2 tbsp water for slurry" },
      { name: "vegetable oil", name_original: "植物油", quantity: 2, unit: "tablespoon", weight_g: 28, category: "staple", is_specialty: false, substitutes: ["peanut oil"], notes: null },
      { name: "chicken broth", name_original: "鸡汤", quantity: 0.5, unit: "cup", weight_g: 120, category: "staple", is_specialty: false, substitutes: ["vegetable broth", "water + bouillon"], notes: null },
    ],
    steps: [
      "Cut tofu into 1-inch cubes. Blanch in boiling salted water for 2 minutes. Drain and set aside.",
      "Toast Sichuan peppercorns in a dry pan over medium heat for 2 minutes until fragrant. Grind to a powder.",
      "Heat vegetable oil in a wok over high heat. Add ground pork, stir-fry until browned and crispy (3-4 minutes).",
      "Push pork aside. Add doubanjiang and fermented black beans to the oil. Stir-fry 1 minute until oil turns red.",
      "Add garlic, ginger, and white parts of scallions. Stir-fry 30 seconds.",
      "Pour in chicken broth and soy sauce. Bring to a simmer.",
      "Gently add tofu. Simmer 3-4 minutes, stirring carefully to coat.",
      "Drizzle in cornstarch slurry while stirring. Cook until sauce thickens (1-2 minutes).",
      "Remove from heat. Finish with sesame oil, ground Sichuan peppercorn, and scallion greens. Serve with rice.",
    ],
  },
  "pad thai": {
    dish: { name_en: "Pad Thai", name_original: "ผัดไทย", cuisine: "Thai", servings: 2, prep_time_min: 20, cook_time_min: 10, description: "Thailand's iconic stir-fried rice noodle dish with shrimp, egg, peanuts, and a tangy-sweet tamarind sauce." },
    ingredients: [
      { name: "rice noodles", name_original: "เส้นจันท์", quantity: 200, unit: "gram", weight_g: 200, category: "grain", is_specialty: false, substitutes: ["rice vermicelli", "linguine"], notes: "Flat, about 3mm wide. Soak in room-temperature water 30 minutes." },
      { name: "shrimp", name_original: "กุ้ง", quantity: 200, unit: "gram", weight_g: 200, category: "protein", is_specialty: false, substitutes: ["chicken breast", "firm tofu", "chicken thigh"], notes: "Peeled and deveined" },
      { name: "tamarind paste", name_original: "มะขาม", quantity: 2, unit: "tablespoon", weight_g: 30, category: "sauce", is_specialty: true, substitutes: ["lime juice + brown sugar", "rice vinegar + molasses"], notes: "Seedless concentrate preferred" },
      { name: "fish sauce", name_original: "น้ำปลา", quantity: 2, unit: "tablespoon", weight_g: 30, category: "sauce", is_specialty: true, substitutes: ["soy sauce + lime juice", "Worcestershire sauce"], notes: "Squid or Tiparos brand" },
      { name: "palm sugar", name_original: "น้ำตาลปี๊บ", quantity: 2, unit: "tablespoon", weight_g: 25, category: "staple", is_specialty: true, substitutes: ["brown sugar", "coconut sugar"], notes: "Shave or chop before using" },
      { name: "eggs", quantity: 2, unit: "large", weight_g: 100, category: "protein", is_specialty: false, substitutes: ["extra firm tofu (scrambled)"], notes: null },
      { name: "bean sprouts", name_original: "ถั่วงอก", quantity: 1, unit: "cup", weight_g: 100, category: "produce", is_specialty: false, substitutes: ["shredded cabbage"], notes: "Fresh, reserve some for garnish" },
      { name: "garlic chives", name_original: "กุ้ยช่าย", quantity: 4, unit: "stalk", weight_g: 20, category: "produce", is_specialty: true, substitutes: ["scallions", "regular chives"], notes: "Cut into 1-inch pieces" },
      { name: "roasted peanuts", quantity: 3, unit: "tablespoon", weight_g: 30, category: "other", is_specialty: false, substitutes: ["cashews"], notes: "Roughly chopped, for topping" },
      { name: "lime", quantity: 1, unit: "whole", weight_g: 60, category: "produce", is_specialty: false, substitutes: ["lemon"], notes: "Cut into wedges" },
      { name: "dried shrimp", name_original: "กุ้งแห้ง", quantity: 2, unit: "tablespoon", weight_g: 10, category: "protein", is_specialty: true, substitutes: ["omit"], notes: "Soak 10 minutes, chop" },
      { name: "vegetable oil", quantity: 2, unit: "tablespoon", weight_g: 28, category: "staple", is_specialty: false, substitutes: ["peanut oil"], notes: null },
    ],
    steps: [
      "Soak rice noodles in room-temperature water for 30 minutes until pliable. Drain.",
      "Mix tamarind paste, fish sauce, and palm sugar in a small bowl. Stir until sugar dissolves.",
      "Heat oil in a wok over high heat. Cook shrimp 1 minute per side until pink. Remove and set aside.",
      "In the same wok, crack eggs and scramble until just set (30 seconds).",
      "Add drained noodles and tamarind sauce. Toss constantly for 2 minutes until noodles absorb the sauce.",
      "Return shrimp to wok. Add dried shrimp, half the bean sprouts, and garlic chives. Toss 1 minute.",
      "Transfer to plates. Top with remaining bean sprouts, crushed peanuts, and lime wedges.",
    ],
  },
  "carbonara": {
    dish: { name_en: "Spaghetti Carbonara", name_original: null, cuisine: "Italian", servings: 2, prep_time_min: 10, cook_time_min: 15, description: "A Roman classic of spaghetti tossed in a silky sauce of eggs, Pecorino Romano, guanciale, and black pepper." },
    ingredients: [
      { name: "spaghetti", quantity: 200, unit: "gram", weight_g: 200, category: "grain", is_specialty: false, substitutes: ["rigatoni", "bucatini"], notes: "Bronze-cut preferred for better sauce adhesion" },
      { name: "guanciale", quantity: 150, unit: "gram", weight_g: 150, category: "protein", is_specialty: true, substitutes: ["pancetta", "thick-cut bacon"], notes: "Cut into small strips or lardons" },
      { name: "Pecorino Romano", quantity: 80, unit: "gram", weight_g: 80, category: "dairy", is_specialty: true, substitutes: ["Parmesan", "Grana Padano"], notes: "Finely grated, plus extra for serving" },
      { name: "egg yolks", quantity: 4, unit: "large", weight_g: 60, category: "protein", is_specialty: false, substitutes: ["3 whole eggs"], notes: "Room temperature" },
      { name: "whole egg", quantity: 1, unit: "large", weight_g: 50, category: "protein", is_specialty: false, substitutes: [], notes: "Room temperature" },
      { name: "black pepper", quantity: 2, unit: "teaspoon", weight_g: 4, category: "spice", is_specialty: false, substitutes: [], notes: "Freshly cracked, coarsely ground" },
      { name: "salt", quantity: 1, unit: "tablespoon", weight_g: 15, category: "staple", is_specialty: false, substitutes: [], notes: "For pasta water — it should taste like the sea" },
    ],
    steps: [
      "Bring a large pot of generously salted water to a boil. Cook spaghetti until 1 minute shy of al dente.",
      "While pasta cooks, whisk egg yolks, whole egg, and most of the Pecorino in a bowl. Add generous black pepper.",
      "Cook guanciale in a cold skillet over medium heat, rendering fat until pieces are golden and crisp (5-7 minutes). Remove from heat.",
      "Reserve 1 cup pasta water. Drain spaghetti and add directly to the guanciale skillet (off heat).",
      "Toss pasta in the rendered fat for 30 seconds. Let cool 1 minute so eggs won't scramble.",
      "Pour egg-cheese mixture over pasta, tossing vigorously. Add splashes of pasta water until sauce is silky and coats each strand.",
      "Serve immediately with extra Pecorino and a generous crack of black pepper.",
    ],
  },
  "chicken tikka masala": {
    dish: { name_en: "Chicken Tikka Masala", name_original: null, cuisine: "Indian", servings: 2, prep_time_min: 20, cook_time_min: 30, description: "Tender marinated chicken pieces in a rich, creamy tomato-spice sauce — a beloved British-Indian classic." },
    ingredients: [
      { name: "chicken thighs", quantity: 500, unit: "gram", weight_g: 500, category: "protein", is_specialty: false, substitutes: ["chicken breast"], notes: "Boneless skinless, cut into bite-sized pieces" },
      { name: "plain yogurt", quantity: 0.5, unit: "cup", weight_g: 120, category: "dairy", is_specialty: false, substitutes: ["Greek yogurt", "coconut yogurt"], notes: "For marinade" },
      { name: "garam masala", quantity: 2, unit: "teaspoon", weight_g: 5, category: "spice", is_specialty: true, substitutes: ["curry powder + pinch of cinnamon"], notes: null },
      { name: "turmeric", quantity: 1, unit: "teaspoon", weight_g: 3, category: "spice", is_specialty: false, substitutes: [], notes: "Ground" },
      { name: "cumin", quantity: 1, unit: "teaspoon", weight_g: 3, category: "spice", is_specialty: false, substitutes: [], notes: "Ground" },
      { name: "crushed tomatoes", quantity: 400, unit: "gram", weight_g: 400, category: "produce", is_specialty: false, substitutes: ["tomato passata", "diced tomatoes"], notes: "One 14-oz can" },
      { name: "heavy cream", quantity: 0.5, unit: "cup", weight_g: 120, category: "dairy", is_specialty: false, substitutes: ["coconut cream", "cashew cream"], notes: null },
      { name: "garlic", quantity: 4, unit: "clove", weight_g: 16, category: "produce", is_specialty: false, substitutes: ["garlic paste"], notes: "Minced" },
      { name: "fresh ginger", quantity: 1, unit: "inch piece", weight_g: 10, category: "produce", is_specialty: false, substitutes: ["ginger paste"], notes: "Grated" },
      { name: "onion", quantity: 1, unit: "large", weight_g: 200, category: "produce", is_specialty: false, substitutes: ["shallots"], notes: "Finely diced" },
      { name: "butter", quantity: 2, unit: "tablespoon", weight_g: 28, category: "dairy", is_specialty: false, substitutes: ["ghee", "oil"], notes: null },
      { name: "vegetable oil", quantity: 1, unit: "tablespoon", weight_g: 14, category: "staple", is_specialty: false, substitutes: [], notes: null },
      { name: "fresh cilantro", quantity: 0.25, unit: "cup", weight_g: 10, category: "produce", is_specialty: false, substitutes: ["parsley"], notes: "Chopped, for garnish" },
    ],
    steps: [
      "Marinate chicken in yogurt, half the garam masala, turmeric, and cumin for at least 30 minutes (or overnight).",
      "Heat oil in a large skillet over high heat. Sear marinated chicken pieces until charred on edges (4-5 minutes). Remove and set aside.",
      "In the same pan, melt butter over medium heat. Sauté onion until softened and golden (5 minutes).",
      "Add garlic and ginger. Cook 1 minute until fragrant.",
      "Pour in crushed tomatoes and remaining garam masala. Simmer 10 minutes, stirring occasionally.",
      "Stir in heavy cream. Return chicken to the sauce. Simmer 10 minutes until chicken is cooked through and sauce thickens.",
      "Taste and adjust salt. Garnish with cilantro. Serve with basmati rice or naan bread.",
    ],
  },
  "beef pho": {
    dish: { name_en: "Beef Pho", name_original: "Phở Bò", cuisine: "Vietnamese", servings: 2, prep_time_min: 15, cook_time_min: 25, description: "An aromatic Vietnamese noodle soup with rice noodles, thinly sliced beef, and a fragrant star anise-infused broth." },
    ingredients: [
      { name: "beef sirloin", quantity: 250, unit: "gram", weight_g: 250, category: "protein", is_specialty: false, substitutes: ["flank steak", "eye of round"], notes: "Freeze 30 min for paper-thin slicing" },
      { name: "rice noodles", name_original: "bánh phở", quantity: 200, unit: "gram", weight_g: 200, category: "grain", is_specialty: false, substitutes: ["rice vermicelli"], notes: "Flat, medium width. Soak per package." },
      { name: "beef broth", quantity: 1, unit: "liter", weight_g: 1000, category: "staple", is_specialty: false, substitutes: ["bone broth"], notes: "Low sodium preferred" },
      { name: "star anise", quantity: 3, unit: "whole", weight_g: 5, category: "spice", is_specialty: true, substitutes: ["five-spice powder (1/2 tsp)"], notes: null },
      { name: "cinnamon stick", quantity: 1, unit: "stick", weight_g: 5, category: "spice", is_specialty: false, substitutes: ["1/2 tsp ground cinnamon"], notes: null },
      { name: "fish sauce", name_original: "nước mắm", quantity: 2, unit: "tablespoon", weight_g: 30, category: "sauce", is_specialty: true, substitutes: ["soy sauce"], notes: null },
      { name: "onion", quantity: 1, unit: "large", weight_g: 200, category: "produce", is_specialty: false, substitutes: [], notes: "Halve and char cut-side in a dry pan" },
      { name: "fresh ginger", quantity: 3, unit: "inch piece", weight_g: 30, category: "produce", is_specialty: false, substitutes: [], notes: "Halve and char in a dry pan" },
      { name: "bean sprouts", name_original: "giá đỗ", quantity: 1, unit: "cup", weight_g: 100, category: "produce", is_specialty: false, substitutes: [], notes: "Fresh, for serving" },
      { name: "Thai basil", name_original: "húng quế", quantity: 0.5, unit: "cup", weight_g: 15, category: "produce", is_specialty: true, substitutes: ["Italian basil", "mint"], notes: "For serving" },
      { name: "lime", quantity: 1, unit: "whole", weight_g: 60, category: "produce", is_specialty: false, substitutes: ["lemon"], notes: "Cut into wedges" },
      { name: "hoisin sauce", name_original: "tương đen", quantity: 2, unit: "tablespoon", weight_g: 30, category: "sauce", is_specialty: true, substitutes: ["oyster sauce + sugar"], notes: "For dipping" },
      { name: "sriracha", quantity: 1, unit: "tablespoon", weight_g: 15, category: "sauce", is_specialty: false, substitutes: ["chili garlic sauce"], notes: "To taste" },
    ],
    steps: [
      "Char onion halves and ginger in a dry skillet over high heat until blackened in spots (5 minutes). Set aside.",
      "Bring beef broth to a boil. Add charred onion, ginger, star anise, cinnamon stick, and fish sauce. Simmer 20 minutes.",
      "Meanwhile, soak or cook rice noodles according to package directions. Drain.",
      "Slice beef sirloin paper-thin against the grain (freezing 30 minutes first makes this easier).",
      "Strain broth, discarding solids. Return to pot and keep at a rolling boil.",
      "Divide cooked noodles between bowls. Arrange raw beef slices on top.",
      "Ladle boiling broth over the beef — the heat will cook the thin slices instantly.",
      "Serve with a plate of bean sprouts, Thai basil, lime wedges, hoisin sauce, and sriracha.",
    ],
  },
};

const RECIPE_ALIASES: Record<string, string> = {
  "麻婆豆腐": "mapo tofu",
  "日式咖喱": "chicken tikka masala",
  "japanese curry": "chicken tikka masala",
  "tikka masala": "chicken tikka masala",
  "tacos al pastor": "pad thai",
  "bibimbap": "beef pho",
  "pho": "beef pho",
  "spaghetti carbonara": "carbonara",
};

const FALLBACK_RECIPE = {
  dish: { name_en: "Home-Style Stir Fry", name_original: null, cuisine: "Asian Fusion", servings: 2, prep_time_min: 15, cook_time_min: 10, description: "A quick and versatile stir-fry with tender chicken, crisp vegetables, and a savory soy-ginger sauce." },
  ingredients: [
    { name: "chicken breast", quantity: 300, unit: "gram", weight_g: 300, category: "protein", is_specialty: false, substitutes: ["tofu", "shrimp"], notes: "Sliced thin against the grain" },
    { name: "broccoli", quantity: 2, unit: "cup", weight_g: 200, category: "produce", is_specialty: false, substitutes: ["snap peas", "green beans"], notes: "Cut into small florets" },
    { name: "bell pepper", quantity: 1, unit: "large", weight_g: 150, category: "produce", is_specialty: false, substitutes: ["zucchini"], notes: "Sliced" },
    { name: "garlic", quantity: 3, unit: "clove", weight_g: 12, category: "produce", is_specialty: false, substitutes: ["garlic paste"], notes: "Minced" },
    { name: "fresh ginger", quantity: 1, unit: "inch piece", weight_g: 10, category: "produce", is_specialty: false, substitutes: ["ginger paste"], notes: "Grated" },
    { name: "soy sauce", quantity: 3, unit: "tablespoon", weight_g: 45, category: "sauce", is_specialty: false, substitutes: ["tamari", "coconut aminos"], notes: null },
    { name: "sesame oil", quantity: 1, unit: "teaspoon", weight_g: 5, category: "staple", is_specialty: false, substitutes: [], notes: "For finishing" },
    { name: "cornstarch", quantity: 1, unit: "tablespoon", weight_g: 10, category: "staple", is_specialty: false, substitutes: ["potato starch"], notes: "Mix with 2 tbsp water" },
    { name: "vegetable oil", quantity: 2, unit: "tablespoon", weight_g: 28, category: "staple", is_specialty: false, substitutes: ["peanut oil"], notes: null },
    { name: "rice", quantity: 1, unit: "cup", weight_g: 200, category: "grain", is_specialty: false, substitutes: ["noodles"], notes: "Steamed, for serving" },
  ],
  steps: [
    "Cook rice according to package directions.",
    "Mix soy sauce, sesame oil, and cornstarch slurry in a small bowl.",
    "Heat vegetable oil in a wok over high heat. Stir-fry chicken until golden (3-4 minutes). Remove.",
    "Add broccoli and bell pepper. Stir-fry 2 minutes until crisp-tender.",
    "Add garlic and ginger. Cook 30 seconds.",
    "Return chicken, pour sauce over. Toss until thickened and everything is coated (1 minute).",
    "Serve immediately over steamed rice.",
  ],
};

const CATEGORY_PRICES: Record<string, { mainstream: number; ethnic: number; organic: number }> = {
  produce:  { mainstream: 1.49, ethnic: 1.19, organic: 2.49 },
  protein:  { mainstream: 5.99, ethnic: 5.49, organic: 9.99 },
  dairy:    { mainstream: 3.49, ethnic: 3.29, organic: 5.49 },
  spice:    { mainstream: 3.99, ethnic: 3.49, organic: 5.99 },
  sauce:    { mainstream: 3.49, ethnic: 2.99, organic: 5.49 },
  grain:    { mainstream: 2.49, ethnic: 1.99, organic: 3.99 },
  staple:   { mainstream: 2.99, ethnic: 2.49, organic: 4.49 },
  other:    { mainstream: 2.99, ethnic: 2.49, organic: 3.99 },
};

const CATEGORY_AISLES: Record<string, string> = {
  produce: "Produce",
  protein: "Meat & Seafood",
  dairy: "Dairy",
  spice: "Spices",
  sauce: "Sauces & Condiments",
  grain: "Pasta & Grains",
  staple: "Baking & Pantry",
  other: "General Grocery",
};

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function mockPrice(name: string, category: string, storeType: string): number {
  const base = CATEGORY_PRICES[category]?.[storeType as keyof typeof CATEGORY_PRICES.produce] ?? 2.99;
  const variance = ((simpleHash(name + storeType) % 100) - 50) / 100;
  return Math.round((base + base * variance * 0.3) * 100) / 100;
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function findRecipe(userMessage: string): object {
  const dishMatch = userMessage.match(/cook "(.+?)"/i);
  const dishName = dishMatch?.[1] ?? "";
  const normalized = dishName.trim().toLowerCase();

  if (MOCK_RECIPES[normalized]) return MOCK_RECIPES[normalized];

  const aliasKey = RECIPE_ALIASES[normalized];
  if (aliasKey && MOCK_RECIPES[aliasKey]) return MOCK_RECIPES[aliasKey];

  for (const key of Object.keys(MOCK_RECIPES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return MOCK_RECIPES[key];
    }
  }

  for (const [alias, target] of Object.entries(RECIPE_ALIASES)) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return MOCK_RECIPES[target];
    }
  }

  const servingsMatch = userMessage.match(/for (\d+) people/);
  const servings = servingsMatch ? parseInt(servingsMatch[1]) : 2;

  return {
    ...FALLBACK_RECIPE,
    dish: {
      ...FALLBACK_RECIPE.dish,
      name_en: dishName || "Home-Style Stir Fry",
      servings,
    },
  };
}

interface ParsedIngredient {
  id: string;
  name: string;
  isSpecialty: boolean;
  category: string;
}

interface ParsedStore {
  id: string;
  name: string;
  type: string;
}

function parseProductRequest(userMessage: string): { ingredients: ParsedIngredient[]; stores: ParsedStore[] } {
  const ingredients: ParsedIngredient[] = [];
  const stores: ParsedStore[] = [];

  const ingRegex = /- (ing-\d+): (.+?)(?:\s*\([^)]*\))?, .+?, specialty=(true|false)/g;
  let m;
  while ((m = ingRegex.exec(userMessage)) !== null) {
    const name = m[2].trim();
    const category = guessCategory(name);
    ingredients.push({ id: m[1], name, isSpecialty: m[3] === "true", category });
  }

  const storeRegex = /- (store-[\w-]+): .+? \(.+?\), (\w+) store/g;
  while ((m = storeRegex.exec(userMessage)) !== null) {
    const nameMatch = userMessage.match(new RegExp(`${m[1]}: (.+?) \\(`));
    stores.push({ id: m[1], name: nameMatch?.[1] ?? m[1], type: m[2] });
  }

  return { ingredients, stores };
}

function guessCategory(name: string): string {
  const lower = name.toLowerCase();
  if (/chicken|beef|pork|shrimp|tofu|egg|fish/.test(lower)) return "protein";
  if (/garlic|ginger|onion|pepper|broccoli|bean sprout|lime|basil|cilantro|scallion|chive/.test(lower)) return "produce";
  if (/cheese|cream|yogurt|butter|milk|pecorino|parmesan/.test(lower)) return "dairy";
  if (/cumin|turmeric|garam|pepper|cinnamon|star anise|sichuan/.test(lower)) return "spice";
  if (/sauce|paste|fish sauce|soy|hoisin|sriracha|tamarind/.test(lower)) return "sauce";
  if (/noodle|rice|spaghetti|pasta/.test(lower)) return "grain";
  if (/oil|salt|sugar|starch|broth/.test(lower)) return "staple";
  return "other";
}

function generateProductMatches(userMessage: string): object[] {
  const { ingredients, stores } = parseProductRequest(userMessage);
  const matches: object[] = [];

  for (const ing of ingredients) {
    for (const store of stores) {
      const storeType = store.type === "ethnic" ? "ethnic" : store.type === "organic" ? "organic" : "mainstream";

      if (ing.isSpecialty && storeType === "mainstream") {
        matches.push({
          ingredient_id: ing.id,
          ingredient_name: ing.name,
          store_id: store.id,
          product_name: `${ing.name} (not available)`,
          brand: "",
          size: "",
          price: 0,
          price_per_unit: "",
          aisle: "",
          in_stock: false,
          match_score: 0,
          match_notes: `${store.name} does not carry this specialty item`,
        });
        continue;
      }

      const price = mockPrice(ing.name, ing.category, storeType);
      const score = ing.isSpecialty && storeType === "ethnic" ? 0.95 : 0.85;
      const aisle = CATEGORY_AISLES[ing.category] ?? "General Grocery";

      matches.push({
        ingredient_id: ing.id,
        ingredient_name: ing.name,
        store_id: store.id,
        product_name: capitalize(ing.name),
        brand: storeType === "organic" ? "365 Organic" : storeType === "ethnic" ? "Imported" : "Store Brand",
        size: "1 pkg",
        price,
        price_per_unit: `$${price.toFixed(2)}/pkg`,
        aisle,
        in_stock: true,
        match_score: score,
        match_notes: ing.isSpecialty && storeType === "ethnic" ? "Best match — specialty store carries authentic version" : "Good match",
      });
    }
  }

  return matches;
}

class MockMessages {
  async create(params: Record<string, unknown>): Promise<{ content: { type: string; text: string }[] }> {
    const messages = params.messages as { role: string; content: string }[];
    const userMessage = messages?.[0]?.content ?? "";

    let responseJson: object | object[];

    if (userMessage.includes("I want to cook")) {
      responseJson = findRecipe(userMessage);
      console.log("[MOCK] Returning recipe response");
    } else {
      responseJson = generateProductMatches(userMessage);
      console.log(`[MOCK] Returning ${(responseJson as object[]).length} product matches`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(responseJson) }],
    };
  }
}

class MockAnthropicClient {
  messages = new MockMessages();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAnthropicClient(): any {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new MockAnthropicClient();
  }
  return new Anthropic();
}
