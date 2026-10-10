const list = (value: string | undefined) => (value ?? "").split(",").map((s) => s.trim()).filter(Boolean);

// Браузер присылает Origin без слэша и пути — приводим адреса из env к тому же виду
// («https://uni-kg.vercel.app/» и «https://uni-kg.vercel.app/ru» → «https://uni-kg.vercel.app»)
const toOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
};

export const env = {
  port: Number(process.env.PORT ?? 5000),
  corsOrigin: list(process.env.CORS_ORIGIN ?? "http://localhost:3000").map(toOrigin),
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
  geminiKey: process.env.GEMINI_API_KEY ?? "",
  // Основная модель + запасные на случай перегрузки/лимитов
  geminiModels: [process.env.GEMINI_MODEL ?? "", ...list(process.env.GEMINI_FALLBACK_MODELS)].filter(Boolean),
};
