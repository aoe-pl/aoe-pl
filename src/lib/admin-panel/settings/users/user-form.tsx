"use client";

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import type { User } from "@prisma/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DrawerFooter } from "@/components/ui/drawer";
import { UserRolesCombobox } from "./user-roles-combobox";
import { api } from "@/trpc/react";

const userFormSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional(),
  color: z.string().optional(),
  adminComment: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
});

export type UserFormSchema = z.infer<typeof userFormSchema>;

interface UserFormProps {
  initialData?: User;
  onSubmit: (data: UserFormSchema) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function UserForm({
  initialData,
  onSubmit,
  onCancel,
  isPending,
}: UserFormProps) {
  const t = useTranslations("admin.settings.users.form");
  
  // Get user's current roles
  const { data: userRoles, refetch: refetchRoles } = api.roles.getUserRoles.useQuery(
    { userId: initialData?.id ?? "" },
    { 
      enabled: !!initialData?.id,
      refetchOnMount: true,
    }
  );

  const form = useForm<UserFormSchema>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      color: initialData?.color ?? "",
      adminComment: initialData?.adminComment ?? "",
      roleIds: [],
    },
  });

  // Update roleIds when userRoles data loads
  useEffect(() => {
    if (userRoles) {
      form.setValue("roleIds", userRoles.map(ur => ur.roleId));
    }
  }, [userRoles, form]);

  // Refetch roles when initialData changes (form is reopened)
  useEffect(() => {
    if (initialData?.id) {
      void refetchRoles();
    }
  }, [initialData?.id, refetchRoles]);

  const handleSubmit = (data: UserFormSchema) => {
    onSubmit(data);
  };

  return (
    <ScrollArea className="h-[60vh] px-4">
      <div className="space-y-6 p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("name_placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("email_placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("color")}</FormLabel>
                  <FormControl>
                    <Input
                      type="color"
                      placeholder={t("color_placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("color_help")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adminComment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin_comment")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("admin_comment_placeholder")}
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("admin_comment_help")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("roles")}</FormLabel>
                  <FormControl>
                    <UserRolesCombobox
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder={t("roles_placeholder")}
                    />
                  </FormControl>
                  <FormDescription>{t("roles_help")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DrawerFooter className="flex-row justify-end">
              <Button
                type="submit"
                disabled={isPending}
              >
                {isPending ? t("updating") : t("update")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
            </DrawerFooter>
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
}