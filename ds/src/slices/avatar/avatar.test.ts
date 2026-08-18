import { describe, expect, it } from "vitest";
import {
  AVATARS,
  AVATAR_COLORS,
  DEFAULT_AVATAR_SELECTION,
  avatarSpec,
  colorSpec,
  isAvatarColorId,
  isAvatarId,
  mascotForAvatar,
  migrateAvatarSelection,
  type AvatarSelection,
} from "./avatar";

describe("avatar", () => {
  it("expõe as quatro classes pedidas em ordem estável", () => {
    expect(AVATARS.map((a) => a.id)).toEqual(["fighter", "elf", "cleric", "dwarf"]);
  });

  it("cada classe tem um mascote distinto", () => {
    const mascotes = AVATARS.map((a) => a.mascot);
    expect(new Set(mascotes).size).toBe(AVATARS.length);
    expect(mascotes).toEqual(["wolf", "owl", "phoenix", "badger"]);
  });

  it("a seleção padrão é o Guerreiro com a cor padrão dele", () => {
    expect(DEFAULT_AVATAR_SELECTION).toEqual({
      classId: "fighter",
      colorId: avatarSpec("fighter").defaultColorId,
    });
  });

  it("avatarSpec devolve os dados da classe", () => {
    const elfa = avatarSpec("elf");
    expect(elfa.nameKey).toBe("avatar.class.elf");
    expect(elfa.descriptionKey).toBe("avatar.class.elfDescription");
    expect(elfa.mascot).toBe("owl");
  });

  it("colorSpec devolve a cor e o rótulo", () => {
    expect(colorSpec("forest")).toEqual({
      id: "forest",
      labelKey: "avatar.color.forest",
      hex: "#00875a",
    });
  });

  it("mascotForAvatar liga cada classe ao mascote certo", () => {
    expect(mascotForAvatar("fighter")).toBe("wolf");
    expect(mascotForAvatar("elf")).toBe("owl");
    expect(mascotForAvatar("cleric")).toBe("phoenix");
    expect(mascotForAvatar("dwarf")).toBe("badger");
  });

  it("a paleta predefinida tem seis cores com hex", () => {
    expect(AVATAR_COLORS).toHaveLength(6);
    expect(AVATAR_COLORS.every((c) => /^#[0-9a-f]{6}$/i.test(c.hex))).toBe(true);
  });

  it("isAvatarId e isAvatarColorId reconhecem valores válidos", () => {
    expect(isAvatarId("dwarf")).toBe(true);
    expect(isAvatarId("mage")).toBe(false);
    expect(isAvatarColorId("steel")).toBe(true);
    expect(isAvatarColorId("rainbow")).toBe(false);
  });

  it("migrateAvatarSelection aceita uma seleção válida", () => {
    const selecao: AvatarSelection = { classId: "cleric", colorId: "gold" };
    expect(migrateAvatarSelection(selecao)).toEqual(selecao);
  });

  it("migrateAvatarSelection rejeita valores inválidos", () => {
    expect(() => migrateAvatarSelection(null)).toThrow(/avatar/);
    expect(() => migrateAvatarSelection("texto")).toThrow(/avatar/);
    expect(() => migrateAvatarSelection({ classId: "mage", colorId: "gold" })).toThrow(/classe/);
    expect(() => migrateAvatarSelection({ classId: "cleric", colorId: "rainbow" })).toThrow(/cor/);
  });
});
