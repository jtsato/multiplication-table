import { deleteDB } from "idb";
import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";
import { ProfileRepository } from "../infrastructure/storage/repository";

let repository: ProfileRepository | undefined;
const originalLanguage = window.navigator.language;

/** The app reads navigator.language once per mount, so set it before rendering. */
function setLocale(language: string): void {
  Object.defineProperty(window.navigator, "language", { configurable: true, value: language });
}

afterEach(async () => {
  setLocale(originalLanguage);
  await repository?.close();
  await deleteDB("lojinha-maluca");
  repository = undefined;
});

describe("app bootstrap", () => {
  it("shows profile selection and opens profile creation", async () => {
    setLocale("pt-BR");
    repository = new ProfileRepository();
    render(<App repository={repository} />);

    expect(await screen.findByRole("heading", { name: "Quem vai jogar?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /criar novo jogador/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Criar perfil" })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/como você quer ser chamado/i)).toBeInTheDocument();
  });

  it("uses English copy when the browser locale is en-US", async () => {
    setLocale("en-US");
    repository = new ProfileRepository();
    render(<App repository={repository} />);

    expect(await screen.findByRole("heading", { name: "Who is playing?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create new player/i })).toBeInTheDocument();
  });

  it("translates game content past the entry screen in English", async () => {
    setLocale("en-US");
    repository = new ProfileRepository();
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("button", { name: /create new player/i }));
    fireEvent.change(await screen.findByLabelText(/what would you like to be called/i), {
      target: { value: "Pixel" },
    });
    // Store names, taglines and product copy come from the pt-BR domain content.
    expect(screen.getByRole("button", { name: /bookshop/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    expect(await screen.findByRole("heading", { name: "Bookshop" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start day" })).toBeInTheDocument();
    expect(screen.getByLabelText("Balance $120")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New products" }));
    expect(await screen.findByRole("heading", { name: "Bookmark" })).toBeInTheDocument();
    expect(screen.getByText("Sale price: $2")).toBeInTheDocument();
  });

  it("keeps Portuguese content past the entry screen in pt-BR", async () => {
    setLocale("pt-BR");
    repository = new ProfileRepository();
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("button", { name: /criar novo jogador/i }));
    fireEvent.change(await screen.findByLabelText(/como você quer ser chamado/i), {
      target: { value: "Pixel" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));

    expect(await screen.findByRole("heading", { name: "Livraria" })).toBeInTheDocument();
    expect(screen.getByLabelText("Saldo R$ 120")).toBeInTheDocument();
  });
});
