"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api } from "@/trpc/react";
import type {
  TournamentRegistrationField,
  TournamentRegistrationFieldTranslation,
} from "@prisma/client";
import { ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type RegistrationFieldWithTranslations = TournamentRegistrationField & {
  translations: TournamentRegistrationFieldTranslation[];
};

type ParticipantDataDialogProps = {
  participantId: string;
  registrationData: Record<string, unknown>;
  registrationFields: RegistrationFieldWithTranslations[];
  locale: string;
};

// Dialog to use in admin panel, to view/edit participants registration data.
export function ParticipantDataDialog({
  participantId,
  registrationData,
  registrationFields,
  locale,
}: ParticipantDataDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Record<string, string | number | boolean>>(
    () =>
      Object.fromEntries(
        registrationFields.map((field): [string, string | number | boolean] => {
          const val = registrationData[field.id];

          if (field.type === "BOOLEAN") {
            return [field.id, !!val];
          }

          if (field.type === "NUMBER") {
            return [field.id, Number(val)];
          }

          return [field.id, String(val)];
        }),
      ),
  );

  const { mutate: save, isPending } =
    api.tournaments.participants.updateRegistrationData.useMutation({
      onSuccess: () => {
        toast.success("Registration data updated");
        setOpen(false);
        router.refresh();
      },
      onError: () => {
        toast.error("Failed to update registration data");
      },
    });

  function getLabel(field: RegistrationFieldWithTranslations): string {
    return (
      field.translations.find((tr) => tr.locale === locale)?.label ??
      "Missing label!"
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
        >
          <ClipboardList className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registration Data</DialogTitle>
        </DialogHeader>
        {registrationFields.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No registration fields.
          </p>
        ) : (
          <div className="space-y-4 py-2">
            {registrationFields.map((field) => (
              <div
                key={field.id}
                className="grid grid-cols-2 items-center gap-4"
              >
                <span className="text-sm font-medium">{getLabel(field)}</span>
                {field.type === "BOOLEAN" ? (
                  <Switch
                    checked={data[field.id] as boolean}
                    onCheckedChange={(checked) =>
                      setData((prev) => ({ ...prev, [field.id]: checked }))
                    }
                  />
                ) : (
                  <Input
                    type={field.type === "NUMBER" ? "number" : "text"}
                    value={data[field.id] as string}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        [field.id]:
                          field.type === "NUMBER"
                            ? e.target.value === ""
                              ? ""
                              : Number(e.target.value)
                            : e.target.value,
                      }))
                    }
                  />
                )}
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={() => save({ participantId, registrationData: data })}
            disabled={isPending}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
