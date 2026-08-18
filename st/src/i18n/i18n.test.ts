import { describe, expect, it } from "vitest";
import { STORES } from "../content/stores";
import type { Product } from "../content/stores";
import { SUPPORTED_LOCALES, detectLocale, getLocalizedStrings, interpolate } from "./index";
import { ptBR } from "./locales/pt-BR";
import { enUS } from "./locales/en-US";
import { esES } from "./locales/es-ES";
import { frFR } from "./locales/fr-FR";
import { deDE } from "./locales/de-DE";
import { jaJP } from "./locales/ja-JP";
import { koKR } from "./locales/ko-KR";
import { zhCN } from "./locales/zh-CN";
import type { LocaleDefinition, UserLocale } from "./types";

const DEFINITIONS: Record<UserLocale, LocaleDefinition> = {
  "pt-BR": ptBR,
  "en-US": enUS,
  "es-ES": esES,
  "fr-FR": frFR,
  "de-DE": deDE,
  "ja-JP": jaJP,
  "ko-KR": koKR,
  "zh-CN": zhCN,
};

const ALL_PRODUCTS: Product[] = STORES.flatMap((store) => store.products);

/** Um produto qualquer com este id, para exercitar a gramática. */
function productById(id: string): Product {
  const product = ALL_PRODUCTS.find((candidate) => candidate.id === id);
  if (!product) throw new Error(`produto inexistente no catálogo: ${id}`);
  return product;
}

describe("interpolate", () => {
  it("substitui os marcadores", () => {
    expect(interpolate("{{a}} × {{b}}", { a: 3, b: 4 })).toBe("3 × 4");
  });

  it("mantém o marcador quando falta o parâmetro", () => {
    expect(interpolate("Oi {{nome}}", {})).toBe("Oi {{nome}}");
  });
});

describe("detectLocale", () => {
  it("reconhece a variante próxima do idioma pedido", () => {
    expect(detectLocale(["pt-PT"])).toBe("pt-BR");
    expect(detectLocale(["en-GB"])).toBe("en-US");
    expect(detectLocale(["es-MX"])).toBe("es-ES");
    expect(detectLocale(["de-AT"])).toBe("de-DE");
    expect(detectLocale(["zh-Hans"])).toBe("zh-CN");
  });

  it("cai no padrão para idioma sem tradução", () => {
    expect(detectLocale(["it-IT"])).toBe("pt-BR");
    expect(detectLocale([])).toBe("pt-BR");
  });

  it("respeita a ordem de preferência do navegador", () => {
    expect(detectLocale(["it-IT", "ja-JP", "en-US"])).toBe("ja-JP");
  });
});

describe("cobertura dos idiomas", () => {
  const productIds = Object.keys(ptBR.nouns);

  it("o catálogo inteiro tem formas escritas em pt-BR", () => {
    for (const product of ALL_PRODUCTS) {
      expect(ptBR.nouns).toHaveProperty(product.id);
    }
  });

  for (const locale of SUPPORTED_LOCALES) {
    it(`${locale} tem forma escrita para todos os ${productIds.length} produtos`, () => {
      // Checa o dado e não o texto: em espanhol "2 revistas" contém a palavra
      // portuguesa "revista", então comparar a frase renderizada com o nome do
      // domínio acusaria falso positivo em idiomas parentes.
      const { nouns } = DEFINITIONS[locale];
      for (const product of ALL_PRODUCTS) {
        expect(Object.keys(nouns)).toContain(product.id);
        expect(nouns[product.id]?.one.trim().length ?? 0).toBeGreaterThan(0);
        expect(nouns[product.id]?.many.trim().length ?? 0).toBeGreaterThan(0);
      }
    });

    it(`${locale} não tem produto sobrando na tabela de formas`, () => {
      const catalogIds = new Set(ALL_PRODUCTS.map((product) => product.id));
      for (const id of Object.keys(DEFINITIONS[locale].nouns)) {
        expect(catalogIds).toContain(id);
      }
    });

    it(`${locale} não deixa marcador por substituir`, () => {
      const strings = getLocalizedStrings(locale);
      const product = productById("ball");
      const rendered = [
        strings.canBuyNow("X", "Y"),
        strings.missingAmount("X", "Y"),
        strings.purchaseUnavailable("X", "Y"),
        strings.dayClosedNotice(10),
        strings.narrateCorrect(2, 3, 6),
        strings.narrateRetry("dica"),
        strings.customerCounter(1, 5),
        strings.customerArrived("Lia"),
        strings.unitExplain(3, product, "Z"),
        strings.quantityPileLabel(1, 4),
        strings.quantityProgress(1, 4),
        strings.correctAnswer(12),
        strings.quantityQuestion(product),
        strings.hintText({ a: 3, b: 4, answer: 12 }, 2),
      ];
      for (const text of rendered) {
        expect(text).not.toMatch(/\{\{\w+\}\}/);
        expect(text.trim().length).toBeGreaterThan(0);
      }
    });
  }
});

describe("gramática de quantidade", () => {
  const pencil = productById("pencil");
  const book = productById("book");
  const ball = productById("ball");

  it("português concorda em gênero e número", () => {
    const t = getLocalizedStrings("pt-BR");
    expect(t.customerWants(1, productById("ruler")).emphasis).toBe("1 régua");
    expect(t.customerWants(3, productById("ruler")).emphasis).toBe("3 réguas");
    expect(t.quantityQuestion(productById("ruler"))).toBe("Quantas réguas?");
    expect(t.quantityQuestion(pencil)).toBe("Quantos lápis?");
  });

  it("alemão usa o plural irregular escrito", () => {
    const t = getLocalizedStrings("de-DE");
    expect(t.customerWants(3, book).emphasis).toBe("3 Bücher");
    expect(t.customerWants(3, ball).emphasis).toBe("3 Bälle");
    expect(t.quantityQuestion(book)).toBe("Wie viele Bücher?");
  });

  it("japonês usa o contador do formato do objeto, sem plural", () => {
    const t = getLocalizedStrings("ja-JP");
    expect(t.customerWants(3, pencil).emphasis).toBe("えんぴつ3本");
    expect(t.customerWants(3, book).emphasis).toBe("本3冊");
    expect(t.customerWants(3, ball).emphasis).toBe("ボール3個");
    expect(t.quantityQuestion(pencil)).toBe("えんぴつは何本？");
  });

  it("coreano usa contador e não muda no plural", () => {
    const t = getLocalizedStrings("ko-KR");
    expect(t.customerWants(1, pencil).emphasis).toBe("연필 1자루");
    expect(t.customerWants(3, pencil).emphasis).toBe("연필 3자루");
    expect(t.customerWants(3, book).emphasis).toBe("책 3권");
    expect(t.quantityQuestion(book)).toBe("책 몇 권?");
  });

  it("chinês põe o classificador antes do substantivo", () => {
    const t = getLocalizedStrings("zh-CN");
    expect(t.customerWants(3, pencil).emphasis).toBe("3支铅笔");
    expect(t.customerWants(3, book).emphasis).toBe("3本书");
    expect(t.customerWants(3, ball).emphasis).toBe("3个球");
    expect(t.quantityQuestion(pencil)).toBe("几支铅笔？");
  });
});

describe("dinheiro", () => {
  it("cada idioma escreve o valor do seu jeito", () => {
    expect(getLocalizedStrings("pt-BR").money(5)).toBe("R$ 5");
    expect(getLocalizedStrings("en-US").money(5)).toBe("$5");
    expect(getLocalizedStrings("de-DE").money(5)).toBe("5 €");
    expect(getLocalizedStrings("ja-JP").money(5)).toBe("5円");
    expect(getLocalizedStrings("ko-KR").money(5)).toBe("5원");
    expect(getLocalizedStrings("zh-CN").money(5)).toBe("5 元");
  });
});
