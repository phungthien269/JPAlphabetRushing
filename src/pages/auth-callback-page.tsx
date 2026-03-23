import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout";
import { Card } from "../components/ui";

export function AuthCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void navigate("/settings", { replace: true });
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [navigate]);

  return (
    <AppShell title={t("auth.title")}>
      <Card className="p-8 text-center text-sm text-[var(--color-text-muted)]">
        {t("auth.returning")}
      </Card>
    </AppShell>
  );
}
