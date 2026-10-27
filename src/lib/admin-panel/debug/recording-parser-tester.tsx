"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RecordingParser } from "@/lib/recording-parser/RecordingParser";
import type { ParsedRecording } from "@/lib/recording-parser/types";
import { AlertCircle, Bug, FileUp, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";

export function RecordingParserTester() {
  const t = useTranslations("admin.debug.recordings");
  const parser = useMemo(() => new RecordingParser(), []);
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedRecording | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setFileName(file.name);
    setParsed(null);
    setError(null);

    if (!file.name.endsWith(".aoe2record")) {
      setError(t("invalid_file"));
      return;
    }

    setParsing(true);

    try {
      setParsed(await parser.parse(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("parse_error"));
    } finally {
      setParsing(false);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setParsed(null);
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-medieval-gold flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Bug className="h-6 w-6" />
          {t("page_title")}
        </h1>
        <p className="text-muted-foreground">{t("page_description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("select_file")}</CardTitle>
          <CardDescription>{t("file_hint")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".aoe2record"
            disabled={parsing}
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
            className="file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 w-full max-w-md cursor-pointer rounded-md border bg-transparent text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:px-3 file:py-2 file:font-medium"
          />
          {fileName !== null && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={parsing}
            >
              {t("clear")}
            </Button>
          )}
        </CardContent>
      </Card>

      {parsing && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("parsing")}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="border-medieval-danger bg-medieval-danger/10 text-medieval-danger flex items-start gap-2 rounded-md border p-4 text-sm"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">{t("parse_error")}</p>
            <p className="break-all">{error}</p>
          </div>
        </div>
      )}

      {parsed && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileUp className="h-5 w-5" />
                {t("parsed_data")}
              </CardTitle>
              <CardDescription className="break-all">
                {fileName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Value
                  label={t("file_name")}
                  value={parsed.fileName}
                />
                <Value
                  label={t("map")}
                  value={`${parsed.map} (${parsed.mapId})`}
                />
                <Value
                  label={t("date")}
                  value={parsed.date}
                />
                <Value
                  label={t("duration")}
                  value={parsed.length}
                />
                <Value
                  label={t("winner")}
                  value={
                    parsed.winner === null
                      ? t("winner_none")
                      : t("winner_player", { number: parsed.winner })
                  }
                />
                <Value
                  label={t("world_time")}
                  value={String(parsed.worldTime)}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <PlayerData
                  title={t("player1")}
                  player={parsed.player1Data}
                  labels={{
                    name: t("name"),
                    profileId: t("profile_id"),
                    civ: t("civ"),
                    civId: t("civ_id"),
                  }}
                  isWinner={parsed.winner === 1}
                  winnerLabel={t("winner")}
                />
                <PlayerData
                  title={t("player2")}
                  player={parsed.player2Data}
                  labels={{
                    name: t("name"),
                    profileId: t("profile_id"),
                    civ: t("civ"),
                    civId: t("civ_id"),
                  }}
                  isWinner={parsed.winner === 2}
                  winnerLabel={t("winner")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("raw_json")}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted/50 max-h-[32rem] overflow-auto rounded-md p-4 text-xs">
                {JSON.stringify(parsed, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium uppercase">
        {label}
      </p>
      <p className="break-all">{value}</p>
    </div>
  );
}

function PlayerData({
  title,
  player,
  labels,
  isWinner,
  winnerLabel,
}: {
  title: string;
  player: ParsedRecording["player1Data"];
  labels: { name: string; profileId: string; civ: string; civId: string };
  isWinner: boolean;
  winnerLabel: string;
}) {
  return (
    <div className="bg-muted/30 space-y-3 rounded-md border p-4">
      <h3 className="text-medieval-gold flex items-center gap-2 font-semibold">
        {title}
        {isWinner && (
          <span className="bg-medieval-gold text-medieval-wood rounded px-2 py-0.5 text-xs font-semibold">
            {winnerLabel}
          </span>
        )}
      </h3>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs uppercase">
            {labels.name}
          </dt>
          <dd className="break-all">{player.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs uppercase">
            {labels.profileId}
          </dt>
          <dd>{player.profileId}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs uppercase">
            {labels.civ}
          </dt>
          <dd>
            {player.civ} ({player.civId})
          </dd>
        </div>
      </dl>
    </div>
  );
}
