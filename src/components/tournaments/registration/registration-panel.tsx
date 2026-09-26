"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, parseCompanionProfileUrl } from "@/lib/utils";
import { api } from "@/trpc/react";
import {
  Check,
  CircleCheck,
  LogIn,
  ScrollText,
  ShieldCheck,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

interface RegistrationPanelProps {
  tournamentId: string;
  isLoggedIn: boolean;
  isAlreadyRegistered: boolean;
  hasAoe2CompanionLinked?: boolean;
  intro?: ReactNode;
}

type FormValue = string | number | boolean;

const debounceMs = 2000; //How long to wait after the last change before checking the API.

const inputBaseClassName =
  "h-10 max-w-sm border-[color:var(--medieval-wood-border)] text-[color:var(--medieval-parchment-foreground)] shadow-inner placeholder:text-[color:var(--medieval-gold-muted)]/60 focus-visible:border-[color:var(--medieval-gold)] focus-visible:ring-[color:var(--medieval-gold)]/25 dark:bg-white/5";

export function RegistrationPanel({
  tournamentId,
  isLoggedIn,
  isAlreadyRegistered,
  hasAoe2CompanionLinked = false,
  intro,
}: RegistrationPanelProps) {
  const t = useTranslations("tournaments.registration");
  const tNav = useTranslations("navigation");
  const locale = useLocale();
  const [registered, setRegistered] = useState(false);
  const [formData, setFormData] = useState<Record<string, FormValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: fields = [] } =
    api.tournaments.registrationFields.list.useQuery(
      { tournamentId },
      { enabled: isLoggedIn && !isAlreadyRegistered },
    );

  const { mutate: register, isPending } =
    api.tournaments.participants.register.useMutation({
      onSuccess: () => setRegistered(true),
      onError: (error) => toast.error(error.message),
    });

  // Users who already linked an AoE2Companion profile don't need the field.
  const visibleFields = fields.filter(
    (field) => !(field.slug === "aoe2companion" && hasAoe2CompanionLinked),
  );

  const hasRequiredFields = visibleFields.some((field) => field.required);

  // Verify the AoE2Companion link against the public API, debounced so we don't
  // hammer the (external) API on every keystroke.
  const companionField = visibleFields.find(
    (field) => field.slug === "aoe2companion",
  );
  const companionValue =
    companionField && typeof formData[companionField.id] === "string"
      ? String(formData[companionField.id]).trim()
      : "";
  const companionUrlValid = parseCompanionProfileUrl(companionValue) !== null;
  const [debouncedCompanionUrl, setDebouncedCompanionUrl] = useState("");

  useEffect(() => {
    const handle = setTimeout(
      () => setDebouncedCompanionUrl(companionValue),
      debounceMs,
    );

    return () => clearTimeout(handle);
  }, [companionValue]);

  const companionDebouncing = companionValue !== debouncedCompanionUrl;

  const { data: companionProfile, isFetching: isCheckingCompanion } =
    api.tournaments.registrationFields.companionProfile.useQuery(
      { url: debouncedCompanionUrl },
      {
        enabled: parseCompanionProfileUrl(debouncedCompanionUrl) !== null,
        staleTime: 60_000,
      },
    );

  // Only surface a result once the debounce settled and the fetch finished.
  const companionProfileResolved =
    !companionDebouncing && !isCheckingCompanion ? companionProfile : undefined;
  const companionChecking =
    companionValue.length > 0 &&
    companionUrlValid &&
    (companionDebouncing || isCheckingCompanion);

  // A provided AoE2Companion link must be verified before we allow registration.
  const companionNotReady =
    companionValue.length > 0 &&
    companionUrlValid &&
    (companionChecking || companionProfileResolved === null);

  function validate() {
    const newErrors: Record<string, string> = {};

    for (const field of visibleFields) {
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
      } else if (
        field.slug === "aoe2companion" &&
        typeof val === "string" &&
        val.trim() !== "" &&
        parseCompanionProfileUrl(val) === null
      ) {
        newErrors[field.id] = t("field_companion_url_error");
      } else if (
        field.slug === "aoe2companion" &&
        companionProfileResolved === null
      ) {
        newErrors[field.id] = t("presets.aoe2companion_not_found");
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (companionNotReady) return;

    if (!validate()) return;

    register({ tournamentId, formData });
  }

  function handleFieldChange(id: string, value: FormValue) {
    setFormData((prev) => ({ ...prev, [id]: value }));

    setErrors((prev) => {
      if (!prev[id]) return prev;

      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  let body: ReactNode;

  if (!isLoggedIn) {
    body = (
      <StatusNotice
        icon={<LogIn className="size-6" />}
        title={t("must_be_logged_in")}
        action={
          <Button
            asChild
            variant="gold"
            size="sm"
            className="font-semibold"
          >
            <Link href="/api/auth/signin">{tNav("login")}</Link>
          </Button>
        }
      />
    );
  } else if (isAlreadyRegistered) {
    body = (
      <StatusNotice
        icon={<ShieldCheck className="size-6" />}
        title={t("already_registered")}
      />
    );
  } else if (registered) {
    body = (
      <StatusNotice
        icon={<CircleCheck className="size-6" />}
        title={t("register_success")}
        tone="success"
      />
    );
  } else {
    body = (
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {visibleFields.length > 0 && (
          <div className="panel-inset space-y-5 p-4 sm:p-5">
            {visibleFields.map((field) => {
              const fieldLabel = field.slug
                ? t(`presets.${field.slug}`)
                : (field.translations.find((tr) => tr.locale === locale)
                    ?.label ?? "");

              return (
                <FieldRow
                  key={field.id}
                  field={field}
                  label={fieldLabel}
                  value={formData[field.id]}
                  error={errors[field.id]}
                  companionProfile={
                    field.slug === "aoe2companion"
                      ? companionProfileResolved
                      : undefined
                  }
                  isCheckingCompanion={
                    field.slug === "aoe2companion" && companionChecking
                  }
                  onChange={(value) => handleFieldChange(field.id, value)}
                />
              );
            })}
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          {hasRequiredFields && (
            <p className="text-xs text-[color:var(--medieval-gold-muted)]">
              {t("required_hint")}
            </p>
          )}

          <Button
            type="submit"
            variant="gold"
            size="lg"
            disabled={isPending || companionNotReady}
            className="w-full font-bold tracking-wide sm:w-auto"
          >
            {isPending ? t("registering") : t("register")}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <section className="mx-auto max-w-2xl">
      <header className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--medieval-gold)] text-[color:var(--medieval-wood)] shadow-[0_0_0_3px_rgba(0,0,0,0.3)]">
          <ScrollText className="size-5" />
        </span>
        <h2 className="text-xl leading-tight font-bold text-[color:var(--medieval-gold)]">
          {t("title")}
        </h2>
      </header>

      <div className="mt-4 mb-6 h-px bg-gradient-to-r from-[color:var(--medieval-gold)]/50 via-[color:var(--medieval-wood-border)] to-transparent" />

      {intro && (
        <div className="prose prose-sm prose-invert prose-headings:text-[color:var(--medieval-gold)] prose-a:text-[color:var(--medieval-gold)] prose-li:marker:text-[color:var(--medieval-gold-muted)] mb-6 max-w-none rounded-xl border border-[color:var(--medieval-wood-border)] bg-black/15 p-4">
          {intro}
        </div>
      )}

      {body}
    </section>
  );
}

function FieldRow({
  field,
  label,
  value,
  error,
  companionProfile,
  isCheckingCompanion,
  onChange,
}: {
  field: { id: string; type: string; required: boolean; slug: string | null };
  label: string;
  value: FormValue | undefined;
  error?: string;
  companionProfile?: { profileId: number; name: string } | null;
  isCheckingCompanion?: boolean;
  onChange: (value: FormValue) => void;
}) {
  const t = useTranslations("tournaments.registration");
  const inputId = `reg-${field.id}`;

  const placeholder =
    field.slug === "aoe2companion"
      ? t("presets.aoe2companion_placeholder")
      : undefined;

  const requiredMark = field.required ? (
    <span className="ml-1 text-[color:var(--medieval-gold)]">*</span>
  ) : null;

  if (field.type === "BOOLEAN") {
    const checked = !!value;

    return (
      <div className="space-y-1.5">
        <Label
          htmlFor={inputId}
          className="cursor-pointer text-[color:var(--medieval-parchment-foreground)]"
        >
          {label}
          {requiredMark}
        </Label>

        <Button
          id={inputId}
          type="button"
          variant={checked ? "gold" : "wood"}
          size="sm"
          aria-pressed={checked}
          onClick={() => onChange(!checked)}
          className={cn("gap-2 font-medium", error && "border-red-400/70")}
        >
          {checked ? <Check /> : <X />}
          {checked ? t("yes") : t("no")}
        </Button>

        <FieldError>{error}</FieldError>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={inputId}
        className="text-[color:var(--medieval-parchment-foreground)]"
      >
        {label}
        {requiredMark}
      </Label>

      <Input
        id={inputId}
        type={field.type === "NUMBER" ? "number" : "text"}
        maxLength={field.type === "STRING" ? 60 : undefined}
        placeholder={placeholder}
        value={
          value === undefined || value === null || value === ""
            ? ""
            : String(value)
        }
        onChange={(e) => {
          const raw = e.target.value;

          if (field.type === "NUMBER" && raw !== "" && isNaN(Number(raw))) {
            return;
          }

          onChange(field.type === "NUMBER" && raw !== "" ? Number(raw) : raw);
        }}
        className={cn(
          inputBaseClassName,
          error &&
            "border-red-400/70 focus-visible:border-red-400 focus-visible:ring-red-400/25",
        )}
      />

      <FieldError>{error}</FieldError>

      {field.slug === "aoe2companion" && (
        <CompanionHint
          checking={Boolean(isCheckingCompanion)}
          profile={companionProfile}
        />
      )}
    </div>
  );
}

function CompanionHint({
  checking,
  profile,
}: {
  checking: boolean;
  profile?: { profileId: number; name: string } | null;
}) {
  const t = useTranslations("tournaments.registration");

  if (checking) {
    return (
      <p className="text-xs text-[color:var(--medieval-gold-muted)]">
        {t("presets.aoe2companion_checking")}
      </p>
    );
  }

  if (profile === undefined) return null;

  if (profile === null) {
    return (
      <p className="text-xs text-red-300">
        {t("presets.aoe2companion_not_found")}
      </p>
    );
  }

  return (
    <p className="text-xs text-emerald-300">
      {t("presets.aoe2companion_found", { name: profile.name })}
    </p>
  );
}

function FieldError({ children }: { children?: string }) {
  if (!children) return null;

  return <p className="text-sm text-red-300">{children}</p>;
}

function StatusNotice({
  icon,
  title,
  action,
  tone = "gold",
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  tone?: "gold" | "success";
}) {
  return (
    <div className="panel-inset flex flex-col items-center gap-3 px-6 py-8 text-center">
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          tone === "success"
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-[color:var(--medieval-gold)]/15 text-[color:var(--medieval-gold)]",
        )}
      >
        {icon}
      </span>

      <p className="max-w-md text-sm font-medium text-balance text-[color:var(--medieval-parchment-foreground)]">
        {title}
      </p>

      {action}
    </div>
  );
}
