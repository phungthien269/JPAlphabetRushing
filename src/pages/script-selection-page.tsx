import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout";
import { Badge, Card } from "../components/ui";
import { learningItems } from "../lib/kana-data";
import { useAppStore } from "../store/use-app-store";

export function ScriptSelectionPage() {
  const { t } = useTranslation();
  const setSelectedScript = useAppStore((state) => state.setSelectedScript);

  return (
    <AppShell title={t("scripts.title")} subtitle={t("scripts.subtitle")}>
      <div className="grid gap-4 md:grid-cols-2">
        {(["hiragana", "katakana"] as const).map((scriptType) => {
          const total = learningItems.filter((item) => item.scriptType === scriptType).length;
          return (
            <Link key={scriptType} to={`/scripts/${scriptType}/select`} onClick={() => setSelectedScript(scriptType)}>
              <Card className="h-full space-y-4 p-6 transition duration-200 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <Badge>{scriptType === "hiragana" ? t("scripts.hiragana") : t("scripts.katakana")}</Badge>
                  <ArrowRight className="h-5 w-5 text-[var(--color-text-muted)]" />
                </div>
                <div className="kana-text text-5xl">{scriptType === "hiragana" ? "あ か さ た" : "ア カ サ タ"}</div>
                <p className="text-sm text-[var(--color-text-muted)]">{t("scripts.itemCount", { count: total })}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
