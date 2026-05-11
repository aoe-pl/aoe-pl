"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

interface RegistrationPanelProps {
  tournamentId: string;
  isLoggedIn: boolean;
  isAlreadyRegistered: boolean;
}

export function RegistrationPanel({
  tournamentId,
  isLoggedIn,
  isAlreadyRegistered,
}: RegistrationPanelProps) {
  const t = useTranslations("tournaments.registration");
  const locale = useLocale();
  const [registered, setRegistered] = useState(false);
  const [formData, setFormData] = useState<
    Record<string, string | number | boolean>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: fields = [] } =
    api.tournaments.registrationFields.list.useQuery(
      { tournamentId },
      { enabled: isLoggedIn && !isAlreadyRegistered },
    );

  const { mutate: register, isPending } =
    api.tournaments.participants.register.useMutation({
      onSuccess: () => setRegistered(true),
    });

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-4 rounded-md">
        {t("must_be_logged_in")}
      </div>
    );
  }

  if (isAlreadyRegistered) {
    return (
      <div className="flex items-center gap-4 rounded-md">
        {t("already_registered")}
      </div>
    );
  }

  if (registered) {
    return (
      <div className="flex items-center gap-4 rounded-md">
        {t("register_success")}
      </div>
    );
  }

  function validate() {
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      const val = formData[field.id];

      if (field.required && (val == null || val === "")) {
        newErrors[field.id] = t("field_required_error");
      } else if (
        field.type === "NUMBER" &&
        val !== undefined &&
        val !== "" &&
        isNaN(Number(val))
      ) {
        newErrors[field.id] = t("field_number_error");
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    register({ tournamentId, formData });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {fields.map((field) => {
        const fieldLabel =
          field.translations.find((tr) => tr.locale === locale)?.label ?? "";

        return (
          <div
            key={field.id}
            className="space-y-1"
          >
            <Label htmlFor={`reg-${field.id}`}>
              {fieldLabel}
              {field.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>

            <FieldInput
              field={field}
              value={formData[field.id]}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, [field.id]: value }));

                if (value.toString().length >= 60) {
                  setErrors((prev) => ({
                    ...prev,
                    [field.id]: t("field_text_max_length_error"),
                  }));
                } else if (errors[field.id]) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next[field.id];
                    return next;
                  });
                }
              }}
            />

            {errors[field.id] && (
              <p className="text-destructive text-sm">{errors[field.id]}</p>
            )}
          </div>
        );
      })}

      <Button
        type="submit"
        disabled={isPending}
      >
        {isPending ? t("registering") : t("register")}
      </Button>
    </form>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: { id: string; type: string };
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
}) {
  if (field.type === "BOOLEAN") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={`reg-${field.id}`}
          checked={!!value}
          onCheckedChange={(v) => onChange(!!v)}
        />
      </div>
    );
  }

  return (
    <Input
      id={`reg-${field.id}`}
      type={field.type === "NUMBER" ? "number" : "text"}
      maxLength={field.type === "STRING" ? 60 : undefined}
      value={!!value ? String(value) : ""}
      onChange={(e) => {
        const raw = e.target.value;

        if (field.type === "NUMBER" && raw !== "" && isNaN(Number(raw))) {
          return;
        }

        const parsed =
          field.type === "NUMBER" && raw !== "" ? Number(raw) : raw;

        onChange(parsed);
      }}
    />
  );
}
