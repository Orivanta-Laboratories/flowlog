"use client";

import { Button } from "@flowlog/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@flowlog/ui/components/card";
import { Input } from "@flowlog/ui/components/input";
import { Label } from "@flowlog/ui/components/label";
import { Switch } from "@flowlog/ui/components/switch";
import { cn } from "@flowlog/ui/lib/utils";
import { useEffect, useState } from "react";

import { useAccount, useUpdateAccount } from "@/hooks/use-account";

const DAYS = [
	{ index: 0, full: "Sunday", short: "Sun" },
	{ index: 1, full: "Monday", short: "Mon" },
	{ index: 2, full: "Tuesday", short: "Tue" },
	{ index: 3, full: "Wednesday", short: "Wed" },
	{ index: 4, full: "Thursday", short: "Thu" },
	{ index: 5, full: "Friday", short: "Fri" },
	{ index: 6, full: "Saturday", short: "Sat" },
] as const;

const DEFAULT_START_MINUTE = 540;
const DEFAULT_END_MINUTE = 1020;

const time = (minutes: number) =>
	`${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const minutes = (value: string) => {
	const [h, m] = value.split(":").map(Number);
	return (h ?? 0) * 60 + (m ?? 0);
};

export function WorkScheduleForm() {
	const account = useAccount();
	const update = useUpdateAccount();
	const [schedule, setSchedule] = useState({
		enabled: false,
		timezone: "UTC",
		days: [1, 2, 3, 4, 5],
		startMinute: DEFAULT_START_MINUTE,
		endMinute: DEFAULT_END_MINUTE,
	});

	useEffect(() => {
		setSchedule(
			account.data?.workSchedule ?? {
				enabled: false,
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				days: [1, 2, 3, 4, 5],
				startMinute: DEFAULT_START_MINUTE,
				endMinute: DEFAULT_END_MINUTE,
			},
		);
	}, [account.data?.workSchedule]);

	const isOvernight = schedule.endMinute < schedule.startMinute;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Working hours</CardTitle>
				<CardDescription>
					Set your shift once and Flowlog collects inside it and pauses outside
					it. Leave this off to start and pause tracking yourself.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					className="grid gap-6"
					onSubmit={(event) => {
						event.preventDefault();
						update.mutate({ workSchedule: schedule });
					}}
				>
					<div className="flex items-start justify-between gap-4">
						<div className="min-w-0">
							<Label htmlFor="schedule-enabled" className="text-sm">
								Pause outside working hours
							</Label>
							<p className="mt-1 text-muted-foreground text-xs">
								Activity outside your shift is never queued or uploaded.
							</p>
						</div>
						<Switch
							id="schedule-enabled"
							checked={schedule.enabled}
							onCheckedChange={(enabled) =>
								setSchedule({ ...schedule, enabled })
							}
						/>
					</div>

					<fieldset
						className="grid gap-2"
						disabled={!schedule.enabled}
						aria-describedby="workdays-hint"
					>
						<legend className="font-medium text-sm">Workdays</legend>
						<p id="workdays-hint" className="text-muted-foreground text-xs">
							Pick the days your shift runs.
						</p>
						<div className="flex flex-wrap gap-1.5">
							{DAYS.map((day) => {
								const checked = schedule.days.includes(day.index);
								return (
									<label
										key={day.index}
										className={cn(
											"cursor-pointer rounded-md border px-3 py-1.5 font-medium text-xs transition-colors duration-200 ease-fluid",
											"has-focus-visible:ring-2 has-focus-visible:ring-ring",
											checked
												? "border-primary bg-primary text-primary-foreground"
												: "border-border bg-background text-muted-foreground hover:bg-muted",
											!schedule.enabled && "cursor-not-allowed opacity-50",
										)}
									>
										<input
											type="checkbox"
											className="sr-only"
											checked={checked}
											onChange={(event) =>
												setSchedule({
													...schedule,
													days: event.target.checked
														? [...schedule.days, day.index]
														: schedule.days.filter(
																(value) => value !== day.index,
															),
												})
											}
										/>
										<span className="sr-only">{day.full}</span>
										<span aria-hidden="true">{day.short}</span>
									</label>
								);
							})}
						</div>
					</fieldset>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-1.5">
							<Label htmlFor="shift-start">Shift starts</Label>
							<Input
								id="shift-start"
								type="time"
								required
								disabled={!schedule.enabled}
								value={time(schedule.startMinute)}
								onChange={(event) =>
									setSchedule({
										...schedule,
										startMinute: minutes(event.target.value),
									})
								}
							/>
						</div>
						<div className="grid gap-1.5">
							<Label htmlFor="shift-end">Shift ends</Label>
							<Input
								id="shift-end"
								type="time"
								required
								disabled={!schedule.enabled}
								value={time(schedule.endMinute)}
								onChange={(event) =>
									setSchedule({
										...schedule,
										endMinute: minutes(event.target.value),
									})
								}
							/>
							{isOvernight && (
								<p className="text-muted-foreground text-xs">
									This shift runs past midnight into the next day.
								</p>
							)}
						</div>
					</div>

					<div className="grid gap-1.5">
						<Label htmlFor="shift-zone">Timezone</Label>
						<Input
							id="shift-zone"
							required
							disabled={!schedule.enabled}
							value={schedule.timezone}
							onChange={(event) =>
								setSchedule({ ...schedule, timezone: event.target.value })
							}
						/>
						<p className="text-muted-foreground text-xs">
							An IANA name, for example Africa/Kigali or Europe/London.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<Button
							className="w-fit"
							disabled={update.isPending || account.isPending}
							type="submit"
						>
							Save working hours
						</Button>
						{update.isSuccess && (
							<p role="status" className="text-muted-foreground text-sm">
								Saved. Devices pick this up on their next settings refresh.
							</p>
						)}
						{update.isError && (
							<p role="alert" className="text-destructive text-sm">
								Check your timezone, days, and hours, then try again.
							</p>
						)}
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
