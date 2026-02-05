import type React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "aliigo-widget": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "embed-key"?: string;
        variant?: "floating" | "inline" | "hero" | string;

        // session modes
        "embed-key"?: string;
        "session-token"?: string;

        // config
        "api-base"?: string;
        locale?: "en" | "es" | string;
        brand?: string;
        theme?: string; // JSON string: {"headerBg":"#111827 #fff", ...}

        // floating
        "floating-mode"?: "fixed" | "absolute" | string;
        "start-open"?: boolean | "true" | "false";

        // allow any other attrs without fighting TS
        [key: string]: any;
      };
    }
  }
}

export {};
