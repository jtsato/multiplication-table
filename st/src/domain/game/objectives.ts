export type DailyObjective = {
  id: string;
  title: string;
  description: string;
  requiredVisits: number;
};

const OBJECTIVES: DailyObjective[] = [
  { id: "welcome-customers", title: "Portas abertas", description: "Atenda clientes com calma.", requiredVisits: 3 },
  { id: "stock-shelf", title: "Prateleira em ordem", description: "Conclua cinco atendimentos.", requiredVisits: 5 },
  { id: "keep-discovering", title: "Descobertas do dia", description: "Atenda quatro clientes e veja a loja crescer.", requiredVisits: 4 },
];

export function createDailyObjective(seed: number): DailyObjective {
  return OBJECTIVES[Math.abs(Math.floor(seed)) % OBJECTIVES.length];
}
