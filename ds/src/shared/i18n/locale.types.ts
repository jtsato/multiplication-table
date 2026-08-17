export type LocaleCode = "pt-BR" | "en-US";

export type Messages = {
  [key: string]: string | Messages;
};
