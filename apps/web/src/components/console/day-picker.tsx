"use client";

import { Button } from "@flowlog/ui/components/button";
import { Calendar } from "@flowlog/ui/components/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@flowlog/ui/components/popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

import {
	addDaysToDateInputValue,
	toDateInputValue,
} from "@/helpers/format-time";

function fromDateInputValue(value: string): Date {
	const [year, month, day] = value.split("-").map(Number);
	return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function describeDay(value: string, today: string): string {
	if (value === today) {
		return "Today";
	}
	if (value === addDaysToDateInputValue(today, -1)) {
		return "Yesterday";
	}
	return fromDateInputValue(value).toLocaleDateString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

export function DayPicker({
	value,
	onChange,
}: {
	value: string;
	onChange: (value: string) => void;
}) {
	const [open, setOpen] = React.useState(false);
	const contentRef = React.useRef<HTMLDivElement>(null);
	const today = toDateInputValue(new Date());
	const selected = fromDateInputValue(value);
	const isToday = value === today;

	return (
		<div className="flex items-center gap-1">
			<Button
				variant="outline"
				size="icon-sm"
				aria-label="Previous day"
				onClick={() => onChange(addDaysToDateInputValue(value, -1))}
			>
				<ChevronLeft />
			</Button>

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger
					render={
						<Button
							variant="outline"
							size="sm"
							className="min-w-36 justify-start"
						/>
					}
				>
					<CalendarDays data-icon="inline-start" aria-hidden="true" />
					<span>{describeDay(value, today)}</span>
				</PopoverTrigger>
				<PopoverContent
					ref={contentRef}
					align="start"
					className="w-auto p-0"
					initialFocus={() =>
						contentRef.current?.querySelector<HTMLElement>(
							'button[data-selected-single="true"]',
						) ??
						contentRef.current?.querySelector<HTMLElement>(
							"button[data-day]",
						) ??
						null
					}
				>
					<Calendar
						mode="single"
						autoFocus
						captionLayout="dropdown"
						defaultMonth={selected}
						selected={selected}
						disabled={{ after: new Date() }}
						onSelect={(date) => {
							if (date === undefined) {
								return;
							}
							onChange(toDateInputValue(date));
							setOpen(false);
						}}
					/>
				</PopoverContent>
			</Popover>

			<Button
				variant="outline"
				size="icon-sm"
				aria-label="Next day"
				disabled={isToday}
				onClick={() => onChange(addDaysToDateInputValue(value, 1))}
			>
				<ChevronRight />
			</Button>

			{!isToday && (
				<Button variant="ghost" size="sm" onClick={() => onChange(today)}>
					Jump to today
				</Button>
			)}
		</div>
	);
}
