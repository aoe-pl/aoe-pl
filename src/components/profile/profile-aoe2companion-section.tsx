"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { Check, ExternalLink, Link2, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ProfileAoe2CompanionSectionProps {
  currentUrl: string | null;
  isEditable: boolean;
}

export function ProfileAoe2CompanionSection({
  currentUrl,
  isEditable,
}: ProfileAoe2CompanionSectionProps) {
  const t = useTranslations("profile.aoe2companion");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentUrl ?? "");

  const { mutate, isPending } = api.users.updateOwnAoe2CompanionUrl.useMutation(
    {
      onSuccess: () => {
        toast.success(t("save_success"));
        setEditing(false);
        router.refresh();
      },
      onError: (err) => toast.error(<ErrorToast message={err.message} />),
    },
  );

  const handleSave = () => {
    mutate({ url: value });
  };

  const handleCancel = () => {
    setValue(currentUrl ?? "");
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            {t("title")}
          </span>
          {isEditable && !editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t("placeholder")}
              className="flex-1"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isPending}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : currentUrl ? (
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent flex items-center gap-2 text-sm hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {currentUrl}
          </a>
        ) : (
          <p className="text-muted-foreground text-sm">{t("none")}</p>
        )}
      </CardContent>
    </Card>
  );
}
