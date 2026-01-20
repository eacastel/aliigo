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
        theme?: string;
        // allow data-* attrs
        [key: `data-${string}`]: string | undefined;
      };
    }
  }
}

export {};
