export type StoreId = "bookstore" | "art" | "sports" | "technology";

export type Product = {
  id: string;
  name: string;
  price: number;
  initiallyAvailable: boolean;
  unlockCost?: number;
  visualTier: "small" | "medium" | "large";
};

export type StoreDefinition = {
  id: StoreId;
  name: string;
  tagline: string;
  color: string;
  products: Product[];
};

export type Customer = {
  id: string;
  name: string;
  color: string;
  phrase: string;
  preferredStores: StoreId[];
};

const product = (
  id: string,
  name: string,
  price: number,
  initiallyAvailable: boolean,
  visualTier: Product["visualTier"],
  unlockCost?: number,
): Product => ({ id, name, price, initiallyAvailable, visualTier, unlockCost });

export const STORES: StoreDefinition[] = [
  {
    id: "bookstore",
    name: "Livraria",
    tagline: "Ideias que cabem na mochila",
    color: "#e57a44",
    products: [
      product("bookmark", "Marcador", 2, true, "small"),
      product("magazine", "Revista", 4, true, "small"),
      product("book", "Livro", 7, true, "medium"),
      product("comic", "Quadrinho", 5, false, "small", 80),
      product("notebook", "Caderno", 6, false, "medium", 110),
      product("atlas", "Atlas", 9, false, "large", 150),
    ],
  },
  {
    id: "art",
    name: "Loja de Arte",
    tagline: "Cor, traço e imaginação",
    color: "#bd5b8c",
    products: [
      product("pencil", "Lápis", 1, true, "small"),
      product("brush", "Pincel", 3, true, "small"),
      product("ruler", "Régua", 5, true, "medium"),
      product("drawing-block", "Bloco de desenho", 6, false, "medium", 80),
      product("pencil-case", "Estojo", 8, false, "medium", 110),
      product("small-canvas", "Tela pequena", 10, false, "large", 150),
    ],
  },
  {
    id: "sports",
    name: "Loja de Esportes",
    tagline: "Movimento para todos",
    color: "#3f9c8c",
    products: [
      product("cone", "Cone", 2, true, "small"),
      product("rope", "Corda", 3, true, "small"),
      product("sports-bottle", "Garrafa esportiva", 5, true, "medium"),
      product("shuttlecock", "Peteca", 6, false, "small", 80),
      product("ball", "Bola", 8, false, "medium", 110),
      product("racket", "Raquete", 10, false, "large", 150),
    ],
  },
  {
    id: "technology",
    name: "Tecnologia & Robótica",
    tagline: "Pequenos projetos, grandes ideias",
    color: "#5e78bd",
    products: [
      product("led", "LED para projeto", 1, true, "small"),
      product("connection-cable", "Cabo de conexão", 2, true, "small"),
      product("electronic-button", "Botão eletrônico", 4, true, "medium"),
      product("sensor", "Sensor", 6, false, "small", 80),
      product("mini-motor", "Mini motor", 8, false, "medium", 110),
      product("maker-kit", "Kit maker", 10, false, "large", 150),
    ],
  },
];

export const CUSTOMERS: Customer[] = [
  { id: "lia", name: "Lia", color: "#f5b971", phrase: "Quero alguns itens para o meu projeto.", preferredStores: ["bookstore", "art"] },
  { id: "caio", name: "Caio", color: "#72b7a1", phrase: "Preciso de materiais para uma atividade.", preferredStores: ["sports", "bookstore"] },
  { id: "bia", name: "Bia", color: "#8b83d4", phrase: "Quero montar uma ideia nova.", preferredStores: ["technology", "art"] },
  { id: "theo", name: "Theo", color: "#e9967a", phrase: "Você pode separar estes produtos para mim?", preferredStores: ["sports", "technology"] },
  { id: "nina", name: "Nina", color: "#6eb5d1", phrase: "Hoje vou preparar uma surpresa.", preferredStores: ["bookstore", "technology"] },
  { id: "davi", name: "Davi", color: "#d48aaf", phrase: "Estou procurando algo para criar.", preferredStores: ["art", "sports"] },
];

export function getStore(storeId: StoreId): StoreDefinition {
  const store = STORES.find((candidate) => candidate.id === storeId);
  if (!store) throw new Error(`Loja desconhecida: ${storeId}`);
  return store;
}
