import { Flame, ArrowRight } from "lucide-react";
import { Button } from "../ui";

export function FeaturedNews() {
  return (
    <div className="panel">
      <div className="panel-header flex items-center gap-2">
        <Flame className="h-5 w-5" />
        Newsy
      </div>

      <div className="space-y-4">
        <div className="from-primary/20 to-accent/10 border-primary/30 rounded-xl border bg-gradient-to-br p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-foreground mb-2 text-lg font-bold">
                Ant League 2026 - Edycja Zimowa
              </h3>
              <p className="text-foreground/80 mb-4 text-sm">
                AoEII ANThology: Ant League to polska liga Age of Empires II
                Definitive Edition, która jest projektem autorskim GwizdeK &
                newt. W każdym roku kalendarzowym planowane są dwie edycje:
                Wiosenna/Letnia i Jesienna/Zimowa. Głównym założeniem ligi jest
                zapewnienie wyrównanego poziomu dla każdego gracza - nie ważne
                czy jest doświadczony, początkujący czy dopiero stawia pierwsze
                kroki.
              </p>
              <div className="text-accent flex items-center gap-2 text-xs font-semibold">
                <span>📅 1 Styczeń - 14 Kwiecień</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-background/50 border-border/50 hover:border-accent/50 cursor-pointer rounded-lg border p-3 transition-colors">
            <div className="text-foreground text-sm font-semibold">
              Nowy patch - stand ground patrol naprawiony!
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              2 godziny temu
            </div>
          </div>

          <div className="bg-background/50 border-border/50 hover:border-accent/50 cursor-pointer rounded-lg border p-3 transition-colors">
            <div className="text-foreground text-sm font-semibold">
              Robin5Hood opowiada o swojej strategii
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              5 godzin temu
            </div>
          </div>
        </div>

        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full gap-2">
          Wszystkie wiadomości
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
