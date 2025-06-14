"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BracketType,
  bracketTypesLabels,
  stageTypesLabels,
  TournamentStageType,
  type TournamentStage,
  type TournamentStageFormSchema,
} from "./tournament";
import { Alert, AlertDescription } from "@/components/ui/alert";

type TournamentStageData = TournamentStageFormSchema & {
  id?: string;
};

interface TournamentStageFormProps {
  initialData?: TournamentStage;
  onSubmit: (data: TournamentStageData) => void;
  onCancel: () => void;
  stages?: TournamentStage[];
  isPending?: boolean;
}

const stageTypes: { value: TournamentStageType; label: string }[] = [
  { value: TournamentStageType.GROUP, label: stageTypesLabels.GROUP },
  { value: TournamentStageType.BRACKET, label: stageTypesLabels.BRACKET },
];

const bracketTypes: { value: BracketType; label: string }[] = [
  {
    value: BracketType.SINGLE_ELIMINATION,
    label: bracketTypesLabels.SINGLE_ELIMINATION,
  },
  {
    value: BracketType.DOUBLE_ELIMINATION,
    label: bracketTypesLabels.DOUBLE_ELIMINATION,
  },
];

export function TournamentStageForm({
  initialData,
  onSubmit,
  onCancel,
  stages,
  isPending,
}: TournamentStageFormProps) {
  const form = useForm<TournamentStageData>({
    defaultValues: {
      id: initialData?.id ?? "0",
      name: initialData?.name ?? "",
      type: initialData?.type ?? "GROUP",
      isActive: initialData?.isActive ?? false,
      description: initialData?.description ?? "",
      bracketType: initialData?.bracketType ?? "SINGLE_ELIMINATION",
      bracketSize: initialData?.bracketSize ?? 16,
      isSeeded: initialData?.isSeeded ?? true,
    },
  });

  const stageType = form.watch("type");
  const isActiveStage = form.watch("isActive");

  // Check if there are other active stages
  const hasOtherActiveStages = !stages
    ? false
    : stages.some((stage) => {
        if (initialData?.id !== undefined && stage.id === initialData.id) {
          return false; // Don't count the stage being edited
        }
        return stage.isActive;
      });

  const handleSubmit = (data: TournamentStageData) => {
    // Clean up bracket-specific fields if not a bracket stage
    if (data.type !== "BRACKET") {
      const cleanedData = { ...data };
      delete cleanedData.bracketType;
      delete cleanedData.bracketSize;
      onSubmit(cleanedData);
    } else {
      onSubmit(data);
    }
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
                  <FormLabel>Stage Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter stage name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stageTypes.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose between group stage or bracket elimination
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter stage description"
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {stageType === "BRACKET" && (
              <>
                <FormField
                  control={form.control}
                  name="bracketType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bracket Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select bracket type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bracketTypes.map((type) => (
                            <SelectItem
                              key={type.value}
                              value={type.value}
                            >
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Single elimination removes players after one loss,
                        double elimination gives a second chance
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bracketSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bracket Size</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="16"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Number of participants in this bracket stage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isSeeded"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Seeded Bracket</FormLabel>
                        <FormDescription>
                          Participants will be seeded based on their ranking
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active Stage</FormLabel>
                    <FormDescription>
                      This stage is currently active in the tournament
                    </FormDescription>
                    {isActiveStage && hasOtherActiveStages && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          ⚠️ Setting this stage as active will automatically
                          deactivate other active stages.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </FormItem>
              )}
            />
          </div>

          <DrawerFooter className="px-0">
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending
                ? "Saving..."
                : initialData
                  ? "Update Stage"
                  : "Add Stage"}
            </Button>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </Form>
    </ScrollArea>
  );
}
