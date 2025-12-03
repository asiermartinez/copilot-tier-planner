"use client";
import { ThemeProvider, BaseStyles } from "@primer/react";
import { PlannerProvider, ScenarioProvider } from "@/contexts";
import "@/css/global.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Suppress hydration warning because the Primer `focus-visible` polyfill
    // changes class names during hydration
    <html suppressHydrationWarning={true}>
      <body>
        <ThemeProvider colorMode="light">
          <BaseStyles>
            <ScenarioProvider>
              <PlannerProvider>
                <div className="root">{children}</div>
              </PlannerProvider>
            </ScenarioProvider>
          </BaseStyles>
        </ThemeProvider>
      </body>
    </html>
  );
}
