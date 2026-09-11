"use client";

import { Button } from "@flowlog/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@flowlog/ui/components/card";
import { Label } from "@flowlog/ui/components/label";
import { Skeleton } from "@flowlog/ui/components/skeleton";
import { Switch } from "@flowlog/ui/components/switch";
import { Textarea } from "@flowlog/ui/components/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { WorkScheduleForm } from "@/components/work-schedule";
import { listToText, textToList } from "@/helpers/parse-list-input";
import { useAccount, useUpdateAccount } from "@/hooks/use-account";

const EXCLUSION_FIELDS = [
	{
		id: "excluded-apps",
		label: "App names",
		placeholder: "1Password\nSignal",
		hint: "Matched against the name of the focused application.",
	},
	{
		id: "excluded-titles",
		label: "Window title patterns",
		placeholder: "*online banking*",
		hint: "Matched against the window or tab title.",
	},
	{
		id: "excluded-domains",
		label: "Browser domains",
		placeholder: "mail.google.com\n*.bank.com",
		hint: "Matched against the site the extension sees.",
	},
] as const;

export default function SettingsPageClient() {
	const account = useAccount();
	const updateAccount = useUpdateAccount();

	const [excludedAppNames, setExcludedAppNames] = useState("");
	const [excludedTitlePatterns, setExcludedTitlePatterns] = useState("");
	const [excludedDomains, setExcludedDomains] = useState("");

	useEffect(() => {
		if (account.data === undefined || account.data === null) {
			return;
		}
		setExcludedAppNames(listToText(account.data.excludedAppNames));
		setExcludedTitlePatterns(listToText(account.data.excludedTitlePatterns));
		setExcludedDomains(listToText(account.data.excludedDomains));
	}, [account.data]);

	if (account.isPending) {
		return (
			<div
				className="grid gap-4"
				role="status"
				aria-busy="true"
				aria-label="Loading settings"
			>
				<Skeleton className="h-64 w-full" />
				<Skeleton className="h-32 w-full" />
			</div>
		);
	}

	if (account.isError || account.data === null) {
		return (
			<p role="alert" className="text-destructive text-sm">
				Could not load your settings. Try refreshing the page.
			</p>
		);
	}

	const exclusionValues: Record<string, [string, (value: string) => void]> = {
		"excluded-apps": [excludedAppNames, setExcludedAppNames],
		"excluded-titles": [excludedTitlePatterns, setExcludedTitlePatterns],
		"excluded-domains": [excludedDomains, setExcludedDomains],
	};

	function handleSaveExclusions(event: React.FormEvent) {
		event.preventDefault();
		updateAccount.mutate(
			{
				excludedAppNames: textToList(excludedAppNames),
				excludedTitlePatterns: textToList(excludedTitlePatterns),
				excludedDomains: textToList(excludedDomains),
			},
			{
				onSuccess: () => toast.success("Exclusions saved."),
				onError: (error) => toast.error(error.message),
			},
		);
	}

	return (
		<div className="grid gap-8">
			<WorkScheduleForm />

			<Card>
				<CardHeader>
					<CardTitle>Assisted labeling</CardTitle>
					<CardDescription>
						Suggestions from your rules and your own past labels always run
						locally. This setting only controls the cloud model.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-start justify-between gap-4">
						<div className="min-w-0">
							<Label htmlFor="ai-labeling-toggle" className="text-sm">
								Send unmatched blocks to Google Gemini
							</Label>
							<p className="mt-1 max-w-prose text-muted-foreground text-xs">
								When no rule or past label matches, Flowlog can send app and
								website names, window and tab titles, the repository, branch,
								commit subjects, and the duration to a cloud model for a
								suggested label. Turn this off and tracking, your rules, and
								manual review all keep working.
							</p>
						</div>
						<Switch
							id="ai-labeling-toggle"
							checked={account.data.aiLabelingEnabled}
							onCheckedChange={(checked) =>
								updateAccount.mutate(
									{ aiLabelingEnabled: checked },
									{
										onSuccess: () =>
											toast.success(
												checked
													? "Assisted labeling is on."
													: "Assisted labeling is off.",
											),
										onError: (error) => toast.error(error.message),
									},
								)
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Never track</CardTitle>
					<CardDescription>
						One entry per line. An asterisk is a wildcard. Connected devices
						apply these after their next settings refresh, and the server
						filters new uploads too.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSaveExclusions} className="grid gap-4">
						{EXCLUSION_FIELDS.map((field) => {
							const entry = exclusionValues[field.id];
							if (entry === undefined) {
								return null;
							}
							const [value, setValue] = entry;
							return (
								<div key={field.id} className="grid gap-1.5">
									<Label htmlFor={field.id}>{field.label}</Label>
									<Textarea
										id={field.id}
										rows={3}
										placeholder={field.placeholder}
										value={value}
										onChange={(event) => setValue(event.target.value)}
									/>
									<p className="text-muted-foreground text-xs">{field.hint}</p>
								</div>
							);
						})}
						<Button
							type="submit"
							disabled={updateAccount.isPending}
							className="w-fit"
						>
							Save exclusions
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
