"use client";

import { LOCALE_VALUES } from "@flowlog/db/constants";
import { Button } from "@flowlog/ui/components/button";
import { Label } from "@flowlog/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@flowlog/ui/components/select";
import { Skeleton } from "@flowlog/ui/components/skeleton";
import { Switch } from "@flowlog/ui/components/switch";
import { Textarea } from "@flowlog/ui/components/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { listToText, textToList } from "@/helpers/parse-list-input";
import { useAccount, useUpdateAccount } from "@/hooks/use-account";

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
		return <Skeleton className="h-64 w-full" />;
	}

	if (account.isError || account.data === null) {
		return (
			<p className="text-destructive text-sm">Could not load your settings.</p>
		);
	}

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
			<section className="grid gap-4 rounded-md border p-4">
				<h2 className="font-medium text-sm">General</h2>
				<div className="flex items-center justify-between">
					<Label htmlFor="locale-select">Language</Label>
					<Select
						value={account.data.locale}
						onValueChange={(locale) =>
							updateAccount.mutate({ locale: locale as "en" | "fr" })
						}
					>
						<SelectTrigger id="locale-select" className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{LOCALE_VALUES.map((locale) => (
								<SelectItem key={locale} value={locale}>
									{locale === "en" ? "English" : "Français"}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center justify-between">
					<div>
						<Label htmlFor="ai-labeling-toggle">Assisted labeling</Label>
						<p className="text-muted-foreground text-xs">
							When your rules and history don't match, send session metadata
							(app, repo, branch, duration — never raw window content) to an AI
							model for a suggested label.
						</p>
					</div>
					<Switch
						id="ai-labeling-toggle"
						checked={account.data.aiLabelingEnabled}
						onCheckedChange={(checked) =>
							updateAccount.mutate({ aiLabelingEnabled: checked })
						}
					/>
				</div>
			</section>

			<form
				onSubmit={handleSaveExclusions}
				className="grid gap-4 rounded-md border p-4"
			>
				<h2 className="font-medium text-sm">Never track</h2>
				<p className="text-muted-foreground text-xs">
					Matching activity is never recorded — not stored, not sent, not
					redacted after the fact. One entry per line; `*` is a wildcard.
				</p>
				<div>
					<Label htmlFor="excluded-apps">App names</Label>
					<Textarea
						id="excluded-apps"
						rows={3}
						placeholder="1Password&#10;Signal"
						value={excludedAppNames}
						onChange={(e) => setExcludedAppNames(e.target.value)}
					/>
				</div>
				<div>
					<Label htmlFor="excluded-titles">Window title patterns</Label>
					<Textarea
						id="excluded-titles"
						rows={3}
						placeholder="*online banking*"
						value={excludedTitlePatterns}
						onChange={(e) => setExcludedTitlePatterns(e.target.value)}
					/>
				</div>
				<div>
					<Label htmlFor="excluded-domains">Browser domains</Label>
					<Textarea
						id="excluded-domains"
						rows={3}
						placeholder="mail.google.com&#10;*.bank.com"
						value={excludedDomains}
						onChange={(e) => setExcludedDomains(e.target.value)}
					/>
				</div>
				<Button
					type="submit"
					disabled={updateAccount.isPending}
					className="w-fit"
				>
					Save
				</Button>
			</form>
		</div>
	);
}
