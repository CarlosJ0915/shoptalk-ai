// Appends ".ts" when a specifier fails to resolve inside src/lib or src (Next-style extensionless imports).
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL &&
      context.parentURL.includes("/src/") &&
      !specifier.endsWith(".ts")
    ) {
      const candidate = new URL(specifier + ".ts", context.parentURL).href;
      if (existsSync(fileURLToPath(candidate))) {
        return { url: candidate, shortCircuit: true };
      }
    }
    throw err;
  }
}
