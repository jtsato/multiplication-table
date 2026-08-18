import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MascotAvatar } from "./MascotAvatar";

describe("MascotAvatar", () => {
  it("expõe o título como rótulo acessível", () => {
    render(<MascotAvatar mascotId="wolf" title="Lobo" />);
    expect(screen.getByRole("img", { name: "Lobo" })).toBeInTheDocument();
  });

  it("é decorativo quando não há título", () => {
    const { container } = render(<MascotAvatar mascotId="owl" />);
    expect(container.querySelector("svg[aria-hidden='true']")).toBeInTheDocument();
  });

  it("aplica o tamanho informado", () => {
    const { container } = render(<MascotAvatar mascotId="phoenix" size={24} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
  });

  it("cada mascote tem um sprite distinto", () => {
    const ids = ["wolf", "owl", "phoenix", "badger"] as const;
    const sprites = ids.map((mascotId) => {
      const { container } = render(<MascotAvatar mascotId={mascotId} />);
      return container.querySelector("svg")?.innerHTML;
    });
    expect(new Set(sprites).size).toBe(ids.length);
  });
});
