export type LocaleCode =
  | "pt-BR"
  | "en-US"
  | "es-ES"
  | "fr-FR"
  | "de-DE"
  | "ja-JP"
  | "ko-KR"
  | "zh-CN";

export type Messages = {
  [key: string]: string | Messages;
};
