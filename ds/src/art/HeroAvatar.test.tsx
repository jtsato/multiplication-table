import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroAvatar } from "./HeroAvatar";

describe("HeroAvatar", () => {
  it("expõe o título como rótulo acessível (role img)", () => {
    render(<HeroAvatar title="Herói" />);
    expect(screen.getByRole("img", { name: "Herói" })).toBeInTheDocument();
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

  it("distingue a silhueta do herói e da heroína", () => {
    const heroi = render(<HeroAvatar variant="hero" />);
    const heroina = render(<HeroAvatar variant="heroine" />);
    expect(heroi.container.querySelector(".hero-avatar--hero")).toBeInTheDocument();
    expect(heroina.container.querySelector(".hero-avatar--heroine")).toBeInTheDocument();
    expect(heroina.container.innerHTML).not.toBe(heroi.container.innerHTML);
  });
});
