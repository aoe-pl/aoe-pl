"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorToast } from "@/components/ui/error-toast-content";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { Check, NotebookPen, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ProfileAdminNoteSectionProps {
  userId: string;
  currentNote: string | null;
}

export function ProfileAdminNoteSection({
  userId,
  currentNote,
}: ProfileAdminNoteSectionProps) {
  const t = useTranslations("profile.admin_note");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentNote ?? "");

  const { mutate, isPending } = api.users.updateAdminNote.useMutation({
    onSuccess: () => {
      toast.success(t("save_success"));
      setEditing(false);
      router.refresh();
    },
    onError: (err) => toast.error(<ErrorToast message={err.message} />),
  });

  const handleSave = () => {
    mutate({ userId, note: value });
  };

  const handleCancel = () => {
    setValue(currentNote ?? "");
    setEditing(false);
  };

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4" />
            {t("title")}
          </span>
          {!editing && (
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
          <div className="space-y-2">
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t("placeholder")}
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isPending}
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                {t("save")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isPending}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : currentNote ? (
          <p className="text-sm whitespace-pre-wrap">{currentNote}</p>
        ) : (
          <p className="text-muted-foreground text-sm">{t("none")}</p>
        )}
      </CardContent>
    </Card>
  );
}
