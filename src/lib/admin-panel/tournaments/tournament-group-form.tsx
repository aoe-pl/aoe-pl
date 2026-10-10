"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DrawerFooter } from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { locales } from "@/lib/locales";
import { parseGroupName, ROTATION_SYMBOL } from "@/lib/tournaments/group-grid";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, type Locale } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  tournamentGroupFormSchema,
  type TournamentGroup,
  type TournamentGroupFormSchema,
  type TournamentGroupSubmitData,
  type TournamentGroupWithParticipants,
} from "./tournament";
import { TournamentMatchModeSelector } from "./tournament-match-mode-selector";
import { TournamentParticipantsSelector } from "./tournament-participants-selector";

type TournamentGroupFormProps = {
  initialData?: TournamentGroupWithParticipants;
  onSubmit: (data: TournamentGroupSubmitData) => void;
  onCancel: () => void;
  groups?: TournamentGroup[];
  isPending?: boolean;
  tournamentId: string;
  defaultIsTeamBased: boolean;
};

export function TournamentGroupForm({
  initialData,
  onSubmit,
  onCancel,
  groups = [],
  isPending,
  tournamentId,
  defaultIsTeamBased,
}: TournamentGroupFormProps) {
  const { data: participants } = api.tournaments.participants.list.useQuery({
    tournamentId,
    includeUser: true,
  });

  const { data: matchModes = [] } = api.tournaments.matchMode.list.useQuery();
  const [activeLocale, setActiveLocale] = useState<Locale>(locales.default);
  const t = useTranslations("admin.tournaments.groups.form");

  const form = useForm<TournamentGroupFormSchema>({
    resolver: zodResolver(tournamentGroupFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      translations: Object.fromEntries(
        locales.supported.map((locale) => [
          locale,
          {
            description:
              initialData?.translations.find((tr) => tr.locale === locale)
                ?.description ?? "",
          },
        ]),
      ),
      displayOrder: initialData?.displayOrder ?? groups.length,
      isTeamBased: initialData?.isTeamBased ?? defaultIsTeamBased,
      isMixed: initialData?.isMixed ?? false,
      isRotational: initialData?.isRotational ?? false,
      matchModeId: initialData?.matchModeId ?? "",
      color: initialData?.color ?? "",
      civDraftPresetUrl: initialData?.civDraftPresetUrl ?? "",
      mapDraftPresetUrl: initialData?.mapDraftPresetUrl ?? "",
      participantIds:
        initialData?.TournamentGroupParticipant?.map(
          (p) => p.tournamentParticipantId,
        ) ?? [],
    },
  });

  // Rotation groups are created by picking two existing groups; the name and
  // the "isRotational" flag are derived from that selection.
  const rotationCandidates = groups.filter(
    (g) => !g.isRotational && g.id !== initialData?.id,
  );

  const findGroupIdForPart = (part: { base: string; index: number }) => {
    const wanted = part.base.trim().toLowerCase();
    const match = groups.find((g) => {
      const parsed = parseGroupName(g.name);
      return (
        !parsed.rotation &&
        parsed.base.trim().toLowerCase() === wanted &&
        parsed.index === part.index
      );
    });
    return match?.id ?? "";
  };

  const initialRotationParts =
    initialData?.isRotational === true
      ? parseGroupName(initialData.name).parts
      : [];

  const [isRotation, setIsRotation] = useState(
    initialData?.isRotational ?? false,
  );
  const [rotationAId, setRotationAId] = useState(() =>
    initialRotationParts[0] ? findGroupIdForPart(initialRotationParts[0]) : "",
  );
  const [rotationBId, setRotationBId] = useState(() =>
    initialRotationParts[1] ? findGroupIdForPart(initialRotationParts[1]) : "",
  );

  // Compose the group name ("<A> 🔄 <B>") whenever the rotation selection
  // changes so the form never submits an incomplete rotation name.
  useEffect(() => {
    if (!isRotation) return;
    const a = groups.find((g) => g.id === rotationAId);
    const b = groups.find((g) => g.id === rotationBId);
    if (a && b) {
      form.setValue("name", `${a.name} ${ROTATION_SYMBOL} ${b.name}`, {
        shouldValidate: true,
      });
    }
  }, [isRotation, rotationAId, rotationBId, groups, form]);

  // A rotation is invalid when it is enabled but does not reference two
  // distinct groups.
  const rotationIncomplete =
    isRotation &&
    (rotationAId.length === 0 ||
      rotationBId.length === 0 ||
      rotationAId === rotationBId);

  // No tournament-level default anymore: default to the first available
  // match mode so every group carries an explicit one.
  useEffect(() => {
    if (!form.getValues("matchModeId") && matchModes.length > 0) {
      form.setValue("matchModeId", matchModes[0]!.id);
    }
  }, [matchModes, form]);

  const handleSubmit = (data: TournamentGroupFormSchema) => {
    onSubmit({
      ...data,
      // TODO: Add team based tournament currently we only set team based when we create mix teams!
      // team based should be isTeamBased: data.isTeamBased === defaultTeamBased ? undefined : data.isTeamBased,
      // because it should by default inherit from tournament team based setting!
      // if adding it remember to update the tournament form! src/lib/admin-panel/tournaments/tournament-form.tsx
      isTeamBased: data.isMixed,
      // when team based are support isMixed is always false when not team based group!
      isMixed: data.isMixed,
      isRotational: isRotation,
      color: data.color ?? undefined,
      participantIds: data.participantIds ?? [],
      translations: locales.supported.map((locale) => ({
        locale,
        description: data.translations[locale]?.description ?? "",
      })),
    });
  };

  return (
    <ScrollArea className="h-[60vh] px-4">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit(handleSubmit)(e);
          }}
          className="space-y-6"
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        isRotation
                          ? t("rotation_name_placeholder")
                          : "Enter group name"
                      }
                      readOnly={isRotation}
                      {...field}
                    />
                  </FormControl>
                  {isRotation && (
                    <FormDescription>{t("rotation_name_hint")}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 rounded-md border p-4">
              <div className="flex flex-row items-start space-y-0 space-x-3">
                <Checkbox
                  checked={isRotation}
                  onCheckedChange={(value) => setIsRotation(value === true)}
                />
                <div className="space-y-1 leading-none">
                  <FormLabel>{t("rotation_label")}</FormLabel>
                  <FormDescription>{t("rotation_description")}</FormDescription>
                </div>
              </div>

              {isRotation && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FormLabel>{t("rotation_first_group")}</FormLabel>
                    <Select
                      value={rotationAId.length > 0 ? rotationAId : undefined}
                      onValueChange={setRotationAId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("rotation_select_first")} />
                      </SelectTrigger>
                      <SelectContent>
                        {rotationCandidates.map((group) => (
                          <SelectItem
                            key={group.id}
                            value={group.id}
                          >
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <FormLabel>{t("rotation_second_group")}</FormLabel>
                    <Select
                      value={rotationBId.length > 0 ? rotationBId : undefined}
                      onValueChange={setRotationBId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("rotation_select_second")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {rotationCandidates.map((group) => (
                          <SelectItem
                            key={group.id}
                            value={group.id}
                          >
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(!rotationAId || !rotationBId) && (
                    <p className="text-destructive text-xs sm:col-span-2">
                      {t("rotation_incomplete")}
                    </p>
                  )}
                  {rotationAId && rotationAId === rotationBId && (
                    <p className="text-destructive text-xs sm:col-span-2">
                      {t("rotation_same_group")}
                    </p>
                  )}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="translations"
              render={() => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <div className="flex gap-1">
                    {locales.supported.map((locale) => (
                      <Button
                        key={locale}
                        type="button"
                        variant={
                          activeLocale === locale ? "default" : "secondary"
                        }
                        size="sm"
                        onClick={() => setActiveLocale(locale)}
                      >
                        {locale.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                  {locales.supported.map((locale) => (
                    <div
                      key={locale}
                      className={activeLocale === locale ? "" : "hidden"}
                    >
                      <FormField
                        control={form.control}
                        name={`translations.${locale}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Enter group description"
                                className="min-h-20"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="matchModeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Match Mode</FormLabel>
                  <FormControl>
                    <TournamentMatchModeSelector
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Match mode (Best of / Play All) for this group&apos;s
                    matches.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Order in which this group appears in the tournament
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* TODO: Add team based tournament */}
            {/* <FormField
              control={form.control}
              name="isTeamBased"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Team Based</FormLabel>
                    <FormDescription>
                      Override tournament's team-based setting. If not set, the
                      tournament's default will be used.
                    </FormDescription>
                  </div>
                </FormItem>
              )} */}
            {/* /> */}

            <FormField
              control={form.control}
              name="isMixed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Mixed Teams</FormLabel>
                    <FormDescription>
                      Enable mixed teams where team compositions can change for
                      each game. Players can be grouped into different teams for
                      each match.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Color</FormLabel>
                  <FormControl>
                    <Input
                      type="color"
                      placeholder="#000000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Choose a color to visually distinguish this group
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="civDraftPresetUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Civilization Draft Preset URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://aoe2cm.net/preset/xxxxx"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    aoe2cm preset used to generate the civilization draft for
                    this group&apos;s matches.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mapDraftPresetUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Map Draft Preset URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://aoe2cm.net/preset/xxxxx"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    aoe2cm preset used to generate the map draft for this
                    group&apos;s matches.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="participantIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Participants</FormLabel>
                  <FormControl>
                    <TournamentParticipantsSelector
                      value={field.value ?? []}
                      onChange={field.onChange}
                      participants={participants ?? []}
                      isLoading={!participants}
                      initialParticipantData={
                        initialData?.TournamentGroupParticipant
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Select participants to include in this group
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DrawerFooter className="flex-row justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending === true || rotationIncomplete}
            >
              {isPending ? "Saving..." : initialData ? "Update" : "Create"}
            </Button>
          </DrawerFooter>
        </form>
      </Form>
    </ScrollArea>
  );
}
