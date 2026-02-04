export interface NewsPost {
  id: string;
  title: string;
  description?: string;
  content: string;
  featured: boolean;
  createdAt: string;
}

export const initialNews: NewsPost[] = [
  {
    id: "1",
    title: "Ant League 2026 - Edycja Zimowa",
    description:
      "AoEII ANThology: Ant League to polska liga Age of Empires II Definitive Edition. W każdym roku kalendarzowym planowane są dwie edycje: Wiosenna/Letnia i Jesienna/Zimowa.",
    content:
      "AoEII ANThology: Ant League to polska liga Age of Empires II Definitive Edition, która jest projektem autorskim GwizdeK & newt. W każdym roku kalendarzowym planowane są dwie edycje: Wiosenna/Letnia i Jesienna/Zimowa. Głównym założeniem ligi jest zapewnienie wyrównanego poziomu dla każdego gracza - nie ważne czy jest doświadczony, początkujący czy dopiero stawia pierwsze kroki.",
    featured: true,
    createdAt: "2026-01-01T12:00:00.000Z",
  },
  {
    id: "2",
    title: "Nowy patch - stand ground patrol naprawiony!",
    description:
      "Długo wyczekiwana poprawka do pathfindingu w końcu trafiła do gry.",
    content:
      "Najnowsza aktualizacja do Age of Empires II: DE przynosi szereg istotnych zmian, na które społeczność czekała od dawna.",
    featured: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "3",
    title: "Najlepszy build order dla Franków",
    content:
      "Frankowie to jedna z najbardziej wszechstronnych cywilizacji w Age of Empires II, oferująca silne jednostki kawalerii i solidne ekonomiczne bonusy.",
    featured: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 11).toISOString(),
  },
];
