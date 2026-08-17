import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkipLink } from "./SkipLink";

describe("SkipLink", () => {
  it("renderiza um link para o conteúdo com o rótulo dado", () => {
    render(<SkipLink targetId="conteudo" label="Pular para o conteúdo" />);
    const link = screen.getByRole("link", { name: "Pular para o conteúdo" });
    expect(link).toHaveAttribute("href", "#conteudo");
    expect(link).toBeInTheDocument();
  });
});
