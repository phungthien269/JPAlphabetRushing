import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const rootDir = process.cwd();
const sourcePath = path.resolve(rootDir, "src/lib/kana-data.ts");
const outputPath = path.resolve(rootDir, "supabase/seed.sql");
const tempModulePath = path.resolve(rootDir, "scripts/.tmp-kana-data.mjs");

const columns = [
  "id",
  "script_type",
  "character",
  "romaji",
  "meaning_en",
  "meaning_vi",
  "note_en",
  "note_vi",
  "lesson_group",
  "subgroup",
  "vowel_group",
  "sort_order",
  "is_enabled",
];

function escapeSql(value) {
  return String(value).replaceAll("'", "''");
}

function toValueList(item) {
  return [
    `'${escapeSql(item.id)}'`,
    `'${escapeSql(item.scriptType)}'`,
    `'${escapeSql(item.character)}'`,
    `'${escapeSql(item.romaji)}'`,
    `'${escapeSql(item.meaningEn)}'`,
    `'${escapeSql(item.meaningVi)}'`,
    `'${escapeSql(item.noteEn)}'`,
    `'${escapeSql(item.noteVi)}'`,
    `'${escapeSql(item.lessonGroup)}'`,
    `'${escapeSql(item.subgroup)}'`,
    `'${escapeSql(item.vowelGroup)}'`,
    String(item.sortOrder),
    item.isEnabled ? "true" : "false",
  ].join(", ");
}

async function loadLearningItems() {
  const source = await fs.readFile(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  });
  await fs.writeFile(tempModulePath, transpiled.outputText, "utf8");
  try {
    const moduleUrl = `${pathToFileURL(tempModulePath).href}?t=${Date.now()}`;
    const mod = await import(moduleUrl);
    return mod.learningItems;
  } finally {
    await fs.rm(tempModulePath, { force: true });
  }
}

const learningItems = await loadLearningItems();
const valuesSql = learningItems
  .map((item) => `  (${toValueList(item)})`)
  .join(",\n");

const upsertAssignments = columns
  .filter((column) => column !== "id")
  .map((column) => `  ${column} = excluded.${column}`)
  .join(",\n");

const sql = `-- Auto-generated from src/lib/kana-data.ts by scripts/generate-seed.mjs.
-- Regenerate with: npm run seed:generate

insert into public.learning_items (
  ${columns.join(",\n  ")}
)
values
${valuesSql}
on conflict (id) do update set
${upsertAssignments};
`;

await fs.writeFile(outputPath, sql, "utf8");
console.log(`Wrote ${learningItems.length} learning items to ${outputPath}`);
