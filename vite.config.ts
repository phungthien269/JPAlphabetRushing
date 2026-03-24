import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    mode !== "production"
      ? VitePWA({
          registerType: "prompt",
          includeAssets: ["pwa-icon.svg"],
          manifest: {
            name: "Kana Flow",
            short_name: "Kana Flow",
            description: "A serious mobile-first app for learning Hiragana and Katakana.",
            theme_color: "#5fb4ff",
            background_color: "#081120",
            display: "standalone",
            start_url: "/",
            icons: [
              {
                src: "/pwa-icon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "any maskable",
              },
            ],
          },
        })
      : null,
  ],
}));
