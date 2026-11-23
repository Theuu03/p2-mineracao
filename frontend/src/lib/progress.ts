import { modules } from "@/lib/course";

const STORAGE_KEY = "texto-em-dados-progress-v1";

export type Attempt = { moduleSlug: string; score: number; passed: boolean; completedAt: string };
export type LearningProgress = { completedModules: string[]; attempts: Attempt[] };

const emptyProgress: LearningProgress = { completedModules: [], attempts: [] };

export function readProgress(): LearningProgress {
  if (typeof window === "undefined") return emptyProgress;
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!saved || typeof saved !== "object") return emptyProgress;
    const value = saved as Partial<LearningProgress>;
    const validSlugs = new Set(modules.map((item) => item.slug));
    return {
      completedModules: Array.isArray(value.completedModules)
        ? [...new Set(value.completedModules.filter((slug): slug is string => typeof slug === "string" && validSlugs.has(slug)))]
        : [],
      attempts: Array.isArray(value.attempts)
        ? value.attempts.filter((attempt): attempt is Attempt =>
            Boolean(attempt && typeof attempt === "object" && validSlugs.has(attempt.moduleSlug) && Number.isFinite(attempt.score) && typeof attempt.passed === "boolean" && typeof attempt.completedAt === "string"),
          ).slice(-100)
        : [],
    };
  } catch {
    return emptyProgress;
  }
}

export function recordAttempt(attempt: Attempt) {
  const current = readProgress();
  const attempts = [...current.attempts, attempt].slice(-100);
  const completedModules = attempt.passed
    ? [...new Set([...current.completedModules, attempt.moduleSlug])]
    : current.completedModules;
  const next = { completedModules, attempts };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearProgress() {
  window.localStorage.removeItem(STORAGE_KEY);
  return emptyProgress;
}
