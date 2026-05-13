"use client";

import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Calendar24Props {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  timeValue?: string;
  onTimeChange?: (time: string) => void;
  disabled?: boolean;
  className?: string;
  dateLabel?: string;
  timeLabel?: string;
}

export function Calendar24({
  date,
  onDateChange,
  timeValue,
  onTimeChange,
  disabled = false,
  className,
  dateLabel = "Date",
  timeLabel = "Time",
}: Calendar24Props) {
  const [open, setOpen] = React.useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (onDateChange) {
      onDateChange(selectedDate);
    }
    setOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onTimeChange) {
      onTimeChange(e.target.value);
    }
  };

  const formatDisplayDate = (date: Date | undefined) => {
    if (!date) return "Select date";
    return format(date, "MMM dd, yyyy");
  };

  const formatTimeValue = (date: Date | undefined) => {
    if (!date) return timeValue ?? "";
    return format(date, "HH:mm:ss");
  };

  return (
    <div className={`flex gap-4 ${className}`}>
      <div className="flex flex-col gap-3">
        <Label
          htmlFor="date-picker"
          className="px-1"
        >
          {dateLabel}
        </Label>
        <Popover
          open={open}
          onOpenChange={setOpen}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="w-32 justify-between font-normal"
              disabled={disabled}
            >
              {formatDisplayDate(date)}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="start"
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={handleDateSelect}
              disabled={(date) =>
                date < new Date(new Date().setHours(0, 0, 0, 0))
              }
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-3">
        <Label
          htmlFor="time-picker"
          className="px-1"
        >
          {timeLabel}
        </Label>
        <Input
          type="time"
          id="time-picker"
          step="1"
          value={formatTimeValue(date)}
          onChange={handleTimeChange}
          disabled={disabled}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}
