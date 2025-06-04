"use client";

import { useState } from "react";
import {
  Form,
  FormMessage,
  FormDescription,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";

// Mock data - replace with actual API calls later
const mockTournamentSeries = [
  {
    id: "1",
    name: "Age of Empires Championship",
    description: "Premier competitive series",
    displayOrder: 1,
    ownerId: "user1",
    ownerName: "Admin User",
  },
  {
    id: "2",
    name: "Community Cup Series",
    description: "Monthly community tournaments",
    displayOrder: 2,
    ownerId: "user2",
    ownerName: "Tournament Organizer",
  },
  {
    id: "3",
    name: "Weekly Tournaments",
    description: "Regular weekly competitions",
    displayOrder: 3,
    ownerId: "user1",
    ownerName: "Admin User",
  },
];

const mockUsers = [
  { id: "user1", name: "Admin User" },
  { id: "user2", name: "Tournament Organizer" },
  { id: "user3", name: "Community Manager" },
];

type TournamentSeriesFormData = {
  name: string;
  description: string;
  displayOrder: number;
  ownerId: string;
};

interface TournamentSeriesSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TournamentSeriesSelector({
  value,
  onChange,
}: TournamentSeriesSelectorProps) {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const seriesForm = useForm<TournamentSeriesFormData>({
    defaultValues: {
      name: "",
      description: "",
      displayOrder: mockTournamentSeries.length + 1,
      ownerId: "",
    },
  });

  const onCreateSeries = (data: TournamentSeriesFormData) => {
    console.log("Creating tournament series:", data);
    // Here you would normally create the series via API
    // For now, just close the drawer and reset form
    setDrawerOpen(false);
    seriesForm.reset({
      name: "",
      description: "",
      displayOrder: mockTournamentSeries.length + 1,
      ownerId: "",
    });
  };

  const selectedSeries = mockTournamentSeries.find(
    (series) => series.id === value,
  );

  const handleCreateNewClick = () => {
    setOpen(false);
    setDrawerOpen(true);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedSeries
              ? selectedSeries.name
              : "Select tournament series..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search tournament series..." />
            <CommandList>
              <CommandEmpty>No tournament series found.</CommandEmpty>
              <CommandGroup>
                {mockTournamentSeries.map((series) => (
                  <CommandItem
                    key={series.id}
                    value={series.name}
                    onSelect={() => {
                      onChange(series.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === series.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{series.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {series.description}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={handleCreateNewClick}
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new tournament series
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Drawer is now outside the Popover */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create New Tournament Series</DrawerTitle>
            <DrawerDescription>
              Add a new tournament series to organize your tournaments.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <Form {...seriesForm}>
              <form
                onSubmit={seriesForm.handleSubmit(onCreateSeries)}
                className="space-y-4"
              >
                <FormField
                  control={seriesForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Series Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter series name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={seriesForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter series description"
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={seriesForm.control}
                  name="ownerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select owner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={seriesForm.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : 1,
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Order in which this series appears in lists
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
          <DrawerFooter>
            <Button onClick={seriesForm.handleSubmit(onCreateSeries)}>
              Create Series
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
