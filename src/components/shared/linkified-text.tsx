import { Fragment } from "react";
import { linkify } from "@/lib/utils/linkify";

/**
 * Renders a plain-text body with bare URLs as real anchors. Escaping is React's
 * — this never builds HTML from the string.
 */
export function LinkifiedText({ body }: { body: string }) {
  return (
    <>
      {linkify(body).map((part, index) =>
        part.type === "link" ? (
          <a
            key={index}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            // `break-all` so a long product URL wraps inside the bubble instead
            // of forcing the thread wider.
            className="break-all font-medium underline underline-offset-2 hover:no-underline"
          >
            {part.value}
          </a>
        ) : (
          <Fragment key={index}>{part.value}</Fragment>
        ),
      )}
    </>
  );
}
