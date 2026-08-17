import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MonsterAvatar } from "./MonsterAvatar";
import { MONSTER_SPRITE_IDS, type MonsterSpriteId } from "./sprite-ids";

describe("MonsterAvatar", () => {
  it("expõe o título como rótulo acessível (role img)", () => {
    render(<MonsterAvatar monsterId="tiamat" title="Tiamat" />);
    expect(screen.getByRole("img", { name: "Tiamat" })).toBeInTheDocument();
  });

  it("é decorativo quando não há título", () => {
    const { container } = render(<MonsterAvatar monsterId="avenger" />);
    expect(container.querySelector("svg[aria-hidden='true']")).toBeInTheDocument();
  });

  it("aplica o tamanho informado (quadrado)", () => {
    const { container } = render(<MonsterAvatar monsterId="avenger" size={72} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("height", "72");
    expect(svg).toHaveAttribute("width", "72");
  });

  it("cada monstro tem um sprite com classe própria", () => {
    for (const id of MONSTER_SPRITE_IDS) {
      const { container } = render(<MonsterAvatar monsterId={id} />);
      expect(container.querySelector(`.monster-avatar--${id}`)).toBeInTheDocument();
    }
  });

  it("os sprites dos 10 monstros são visualmente distintos", () => {
    const sprites = MONSTER_SPRITE_IDS.map(
      (id) => render(<MonsterAvatar monsterId={id} />).container.innerHTML,
    );
    for (let i = 0; i < sprites.length; i += 1) {
      for (let j = i + 1; j < sprites.length; j += 1) {
        expect(sprites[i]).not.toBe(sprites[j]);
      }
    }
  });

  it("o catálogo de sprites cobre os 10 monstros do jogo", () => {
    expect(MONSTER_SPRITE_IDS).toEqual([
      "avenger",
      "tiamat",
      "shadow-demon",
      "decay",
      "keleog",
      "darkling",
      "lizardmen",
      "bullywugs",
      "warduke",
      "beholder",
    ]);
    const unique = new Set<MonsterSpriteId>(MONSTER_SPRITE_IDS);
    expect(unique.size).toBe(MONSTER_SPRITE_IDS.length);
  });
});
