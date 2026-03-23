import { Check, Filter, Layers3 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/layout";
import { Badge, Button, Card, EmptyState, ProgressBar, SectionHeader } from "../components/ui";
import { getItemsByScript, selectionCategories } from "../lib/kana-data";
import { cn } from "../lib/utils";
import type { ScriptType, VariantType } from "../types";
import { useAppStore } from "../store/use-app-store";

function categoryLabel(t: ReturnType<typeof useTranslation>["t"], category: VariantType) {
  return t(`selection.categories.${category}`);
}

export function SelectionPage() {
  const { t } = useTranslation();
  const { script = "hiragana" } = useParams<{ script: ScriptType }>();
  const navigate = useNavigate();
  const language = useAppStore((state) => state.snapshot.preferences.language);
  const selectedIds = useAppStore((state) => state.selectedIds);
  const setSelectedIds = useAppStore((state) => state.setSelectedIds);
  const toggleSelectedId = useAppStore((state) => state.toggleSelectedId);
  const setSelectedScript = useAppStore((state) => state.setSelectedScript);
  const setCurrentMode = useAppStore((state) => state.setCurrentMode);

  const scriptItems = useMemo(() => getItemsByScript(script), [script]);
  const groupedByCategory = useMemo(
    () =>
      selectionCategories.map((category) => ({
        category,
        items: scriptItems.filter((item) => item.subgroup === category),
      })),
    [scriptItems],
  );

  const groupedByRow = useMemo(() => {
    const groups = new Map<string, typeof scriptItems>();
    for (const item of scriptItems) {
      const existing = groups.get(item.lessonGroup) ?? [];
      existing.push(item);
      groups.set(item.lessonGroup, existing);
    }
    return [...groups.entries()].map(([group, items]) => ({ group, items }));
  }, [scriptItems]);

  const selectedScriptIds = useMemo(
    () => selectedIds.filter((id) => scriptItems.some((item) => item.id === id)),
    [scriptItems, selectedIds],
  );
  const selectedCount = useMemo(
    () => selectedScriptIds.length,
    [selectedScriptIds],
  );
  const selectedScriptIdSet = useMemo(() => new Set(selectedScriptIds), [selectedScriptIds]);
  const selectedCategoryCount = useMemo(
    () => groupedByCategory.filter(({ items }) => items.some((item) => selectedScriptIdSet.has(item.id))).length,
    [groupedByCategory, selectedScriptIdSet],
  );
  const selectedRowCount = useMemo(
    () => groupedByRow.filter(({ items }) => items.some((item) => selectedScriptIdSet.has(item.id))).length,
    [groupedByRow, selectedScriptIdSet],
  );
  const selectionRatio = scriptItems.length > 0 ? (selectedCount / scriptItems.length) * 100 : 0;

  return (
    <AppShell
      title={t("selection.title")}
      subtitle={t("selection.subtitle")}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setSelectedIds(scriptItems.map((item) => item.id))}>
            {t("common.selectAll")}
          </Button>
          <Button variant="ghost" onClick={() => setSelectedIds([])}>
            {t("common.clearAll")}
          </Button>
        </div>
      }
    >
      <section className="space-y-4">
        <Card className="space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <Badge>{script === "hiragana" ? t("scripts.hiragana") : t("scripts.katakana")}</Badge>
              <div className="space-y-1">
                <div className="font-[var(--font-heading)] text-lg font-semibold">{t("common.selectedCount", { count: selectedCount })}</div>
                <div className="text-sm text-[var(--color-text-muted)]">
                  {t("selection.scopeSummary", {
                    characters: selectedCount,
                    rows: selectedRowCount,
                    categories: selectedCategoryCount,
                  })}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={selectedCount === 0}
                onClick={() => {
                  setSelectedScript(script);
                  setCurrentMode("study");
                  void navigate(`/study/${script}`);
                }}
              >
                {t("common.startStudy")}
              </Button>
              <Button
                variant="secondary"
                disabled={selectedCount === 0}
                onClick={() => {
                  setSelectedScript(script);
                  setCurrentMode("review");
                  void navigate(`/review/${script}`);
                }}
              >
                {t("common.startReview")}
              </Button>
            </div>
          </div>
          <ProgressBar value={selectionRatio} />
          {selectedCount === 0 ? (
            <p className="text-sm text-[var(--color-danger)]">{t("common.selectionRequired")}</p>
          ) : null}
        </Card>

        <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
          <Card className="space-y-4 p-4">
            <SectionHeader title={t("selection.selectedScope")} description={t("selection.helper")} />
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {groupedByCategory
                  .filter((entry) => entry.items.length > 0)
                  .map(({ category, items }) => (
                    <Button
                      key={category}
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const ids = new Set(selectedIds);
                        for (const item of items) ids.add(item.id);
                        setSelectedIds([...ids]);
                      }}
                    >
                      <Filter className="mr-1 h-3.5 w-3.5" />
                      {categoryLabel(t, category)}
                    </Button>
                  ))}
              </div>
              <div className="space-y-2">
                {groupedByRow.map(({ group, items }) => (
                  <div key={group} className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] px-3 py-2">
                    <div>
                      <div className="font-medium">{group}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        {items.length} {t("common.itemsLabel")}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const ids = new Set(selectedIds);
                        for (const item of items.slice(0, 5)) ids.add(item.id);
                        setSelectedIds([...ids]);
                      }}
                    >
                      <Layers3 className="mr-1 h-3.5 w-3.5" />
                      {t("selection.rowQuickSelect")}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="space-y-4 p-4">
            <SectionHeader title={script === "hiragana" ? t("scripts.hiragana") : t("scripts.katakana")} />
            {scriptItems.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {scriptItems.map((item) => {
                  const active = selectedIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSelectedId(item.id)}
                      className={cn(
                        "rounded-[1.25rem] border p-4 text-left transition duration-200 cursor-pointer",
                        active
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/12 shadow-[0_0_0_1px_var(--color-accent)]"
                          : "border-[var(--color-border)] bg-white/50 hover:bg-white/70 dark:bg-slate-950/20 dark:hover:bg-slate-950/30",
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <Badge className="capitalize">{categoryLabel(t, item.subgroup)}</Badge>
                        {active ? <Check className="h-4 w-4 text-[var(--color-accent-strong)]" /> : null}
                      </div>
                      <div className="kana-text text-4xl">{item.character}</div>
                      <div className="mt-3 text-sm font-medium">{item.romaji}</div>
                      <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {language === "vi" ? item.noteVi : item.noteEn}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState title={t("selection.noItemsTitle")} description={t("selection.noItems")} />
            )}
          </Card>
        </div>

        <div className="flex justify-end">
          <Link to="/scripts">
            <Button variant="ghost">{t("common.back")}</Button>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
