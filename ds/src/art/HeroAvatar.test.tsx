import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroAvatar } from "./HeroAvatar";

describe("HeroAvatar", () => {
  it("expõe o título como rótulo acessível (role img)", () => {
    render(<HeroAvatar title="Guerreiro" />);
    expect(screen.getByRole("img", { name: "Guerreiro" })).toBeInTheDocument();
  });

  it("é decorativo quando não há título", () => {
    const { container } = render(<HeroAvatar />);
    expect(container.querySelector("svg[aria-hidden='true']")).toBeInTheDocument();
  });

  it("aplica o tamanho informado (proporção 3:4)", () => {
    const { container } = render(<HeroAvatar size={96} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("height", "96");
    expect(svg).toHaveAttribute("width", "72");
  });

  it("tem uma silhueta distinta para cada classe", () => {
    const classes = ["fighter", "elf", "cleric", "dwarf"] as const;
    const renderizados = classes.map((avatarId) => {
      const { container } = render(<HeroAvatar avatarId={avatarId} />);
      return container.querySelector("svg")?.innerHTML;
    });
    expect(new Set(renderizados).size).toBe(classes.length);
    expect(classes.map((c) => `hero-avatar--${c}`).every((c) => !!c)).toBe(true);
  });

  it("aplica a cor personalizada da roupa/armadura", () => {
    const vermelho = render(<HeroAvatar avatarId="fighter" colorId="crimson" />);
    const azul = render(<HeroAvatar avatarId="fighter" colorId="royal" />);
    expect(vermelho.container.innerHTML).not.toBe(azul.container.innerHTML);
    expect(azul.container.innerHTML).toContain("#0052cc");
  });
});
