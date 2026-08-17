import { deleteDB } from "idb";
import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";
import { ProfileRepository } from "../infrastructure/storage/repository";
import { createProfile } from "../domain/profile/profile";

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
  it("opens straight into shop creation when no shop is saved", async () => {
    setLocale("pt-BR");
    repository = new ProfileRepository();
    render(<App repository={repository} />);

    expect(await screen.findByRole("heading", { name: "Criar perfil" })).toBeInTheDocument();
    expect(screen.getByLabelText(/como você quer ser chamado/i)).toBeInTheDocument();
  });

  it("opens straight into the saved shop when one exists", async () => {
    setLocale("pt-BR");
    repository = new ProfileRepository();
    await repository.save(createProfile({ nickname: "Ana", storeId: "art" }));

    render(<App repository={repository} />);

    expect(await screen.findByRole("heading", { name: "Loja de Arte" })).toBeInTheDocument();
    // Sem multi-perfil não há mais troca de jogador.
    expect(screen.queryByRole("button", { name: /trocar jogador/i })).not.toBeInTheDocument();
  });

  it("uses English copy when the browser locale is en-US", async () => {
    setLocale("en-US");
    repository = new ProfileRepository();
    render(<App repository={repository} />);

    expect(await screen.findByRole("heading", { name: "Create profile" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
  });

  it("translates game content past the entry screen in English", async () => {
    setLocale("en-US");
    repository = new ProfileRepository();
    render(<App repository={repository} />);

    fireEvent.change(await screen.findByLabelText(/what would you like to be called/i), {
      target: { value: "Pixel" },
    });
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

    fireEvent.change(await screen.findByLabelText(/como você quer ser chamado/i), {
      target: { value: "Pixel" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));

    expect(await screen.findByRole("heading", { name: "Livraria" })).toBeInTheDocument();
    expect(screen.getByLabelText("Saldo R$ 120")).toBeInTheDocument();
  });

  it("asks for confirmation before wiping the shop", async () => {
    setLocale("pt-BR");
    repository = new ProfileRepository();
    await repository.save(createProfile({ nickname: "Ana", storeId: "bookstore" }));

    render(<App repository={repository} />);
    fireEvent.click(await screen.findByRole("button", { name: /configurações/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Recomeçar do zero" }));

    // Um toque acidental não pode apagar a loja: o primeiro clique só pergunta.
    expect(screen.getByText(/tem certeza\?/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Configurações" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sim, apagar tudo" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Criar perfil" })).toBeInTheDocument();
    });
    expect(await repository.list()).toHaveLength(0);
  });
});
