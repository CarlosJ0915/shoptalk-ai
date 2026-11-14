// Node ESM resolve hook so tests can import the app's extensionless TS sources.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(
  new URL("./ts-ext-hooks.mjs", import.meta.url),
  pathToFileURL("./"),
);
