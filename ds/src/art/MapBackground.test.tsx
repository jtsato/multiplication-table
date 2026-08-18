import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MapBackground } from "./MapBackground";
import { MAP_THEME_IDS } from "../slices/maps/maps";

describe("MapBackground", () => {
  it("renderiza todos os temas de mapa", () => {
    for (const theme of MAP_THEME_IDS) {
      const { container } = render(<MapBackground theme={theme} />);
      expect(container.querySelector(`.map-background--${theme}`)).toBeInTheDocument();
    }
  });

  it("aceita um rótulo acessível", () => {
    const { container } = render(<MapBackground theme="meadow" label="Pradaria" />);
    expect(container.querySelector("svg[role='img']")).toBeInTheDocument();
    expect(container.querySelector("svg[aria-label='Pradaria']")).toBeInTheDocument();
  });
});
