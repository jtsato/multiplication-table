import { deleteDB } from "idb";
import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";
import { ProfileRepository } from "../infrastructure/storage/repository";

let repository: ProfileRepository | undefined;

afterEach(async () => {
  await repository?.close();
  await deleteDB("lojinha-maluca");
  repository = undefined;
});

describe("app bootstrap", () => {
  it("shows profile selection and opens profile creation", async () => {
    repository = new ProfileRepository();
    render(<App repository={repository} />);

    expect(await screen.findByRole("heading", { name: "Quem vai jogar?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /criar novo jogador/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Criar perfil" })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/como você quer ser chamado/i)).toBeInTheDocument();
  });
});
