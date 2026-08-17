import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  flattenKeys,
  getStoredLocale,
  storeLocale,
  translate,
} from "./i18n";
import enUS from "./locales/en-US.json";
import ptBR from "./locales/pt-BR.json";

describe("i18n", () => {
  describe("translate", () => {
    it("retorna o valor de uma chave aninhada", () => {
      expect(translate(ptBR, "app.title")).toBe("Batalha da Tabuada");
    });

    it("interpola os parâmetros {{a}} e {{b}}", () => {
      expect(translate(ptBR, "math.question", { a: 6, b: 4 })).toBe("6 × 4 = ?");
    });

    it("mantém o placeholder quando o parâmetro não é fornecido", () => {
      expect(translate(ptBR, "math.question")).toBe("{{a}} × {{b}} = ?");
    });

    it("interpola placeholders com mais de um caractere", () => {
      expect(translate({ saudacao: "Olá, {{nome}}!" }, "saudacao", { nome: "Ana" })).toBe(
        "Olá, Ana!",
      );
    });

    it("retorna a própria chave quando ela não existe", () => {
      expect(translate(ptBR, "app.inexistente")).toBe("app.inexistente");
    });

    it("retorna a chave quando o caminho é profundo e inexistente", () => {
      expect(translate(ptBR, "app.inexistente.sub")).toBe("app.inexistente.sub");
    });

    it("retorna a chave quando o nó não é uma string", () => {
      expect(translate(ptBR, "app")).toBe("app");
    });
  });

  describe("paridade dos idiomas (regra 8)", () => {
    it("en-US tem exatamente as mesmas chaves que pt-BR", () => {
      const ptKeys = flattenKeys(ptBR).sort();
      const enKeys = flattenKeys(enUS).sort();
      expect(enKeys).toEqual(ptKeys);
    });
  });

  describe("flattenKeys", () => {
    it("lista todas as chaves folha de pt-BR", () => {
      const keys = flattenKeys(ptBR);
      expect(keys).toContain("app.title");
      expect(keys).toContain("app.skipToContent");
      expect(keys).toContain("battle.title");
      expect(keys).toContain("battle.correct");
      expect(keys).toContain("battle.almost");
      expect(keys).toContain("battle.combo");
      expect(keys).toContain("battle.super");
      expect(keys).toContain("battle.superButton");
      expect(keys).toContain("battle.victory");
      expect(keys).toContain("battle.defeat");
      expect(keys).toContain("battle.playAgain");
      expect(keys).toContain("math.question");
      expect(keys).toContain("math.alternatives");
      expect(keys).toContain("monster.avenger");
      expect(keys).toContain("monster.tiamat");
      expect(keys).toContain("monster.shadowDemon");
      expect(keys).toContain("monster.decay");
      expect(keys).toContain("monster.keleog");
      expect(keys).toContain("monster.darkling");
      expect(keys).toContain("monster.lizardmen");
      expect(keys).toContain("monster.bullywugs");
      expect(keys).toContain("monster.warduke");
      expect(keys).toContain("monster.beholder");
      expect(keys).toContain("battle.victoryAll");
      expect(keys).toHaveLength(32);
    });
  });

  describe("getStoredLocale", () => {
    it("retorna o padrão quando não há nada armazenado", () => {
      expect(getStoredLocale({ getItem: () => null })).toBe(DEFAULT_LOCALE);
    });

    it("retorna o locale pt-BR armazenado explicitamente", () => {
      expect(getStoredLocale({ getItem: () => "pt-BR" })).toBe("pt-BR");
    });

    it("retorna o locale válido armazenado", () => {
      expect(getStoredLocale({ getItem: () => "en-US" })).toBe("en-US");
    });

    it("ignora valor armazenado inválido", () => {
      expect(getStoredLocale({ getItem: () => "fr-FR" })).toBe(DEFAULT_LOCALE);
    });

    it("não quebra quando o armazenamento falha", () => {
      expect(
        getStoredLocale({
          getItem: () => {
            throw new Error("storage indisponível");
          },
        }),
      ).toBe(DEFAULT_LOCALE);
    });
  });

  describe("storeLocale", () => {
    it("grava o locale sob a chave de armazenamento", () => {
      const items: Record<string, string> = {};
      storeLocale({ setItem: (key, value) => (items[key] = value) }, "en-US");
      expect(items["batalha-da-tabuada.locale"]).toBe("en-US");
    });

    it("não quebra quando o armazenamento falha", () => {
      expect(() =>
        storeLocale(
          {
            setItem: () => {
              throw new Error("quota excedida");
            },
          },
          "en-US",
        ),
      ).not.toThrow();
    });
  });

  it("a chave de armazenamento do locale é estável", () => {
    expect(LOCALE_STORAGE_KEY).toBe("batalha-da-tabuada.locale");
  });
});
