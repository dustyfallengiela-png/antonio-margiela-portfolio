import { Fragment } from "react";

/** Divide o texto em palavras mascaradas para animações de reveal. */
export default function Words({ text, wordClass }: { text: string; wordClass?: (w: string, i: number) => string | undefined }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="mask">
            <span className={wordClass?.(w, i)}>{w}</span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </>
  );
}
