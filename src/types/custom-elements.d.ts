import type React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "aliigo-widget": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "embed-key"?: string;
        variant?: "floating" | "inline" | "hero";
        "api-base"?: string;
        locale?: string;
        "session-token"?: string;

        // theme JSON string (you pass previewThemeJson)
        theme?: string;

        // new: dashboard preview positioning
        "floating-mode"?: "fixed" | "absolute";

        // allow data-* attrs
        [key: `data-${string}`]: string | undefined;
      };
    }
  }
}

export {};
