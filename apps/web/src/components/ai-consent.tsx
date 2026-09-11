"use client";

import { Button } from "@flowlog/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@flowlog/ui/components/card";
import { toast } from "sonner";

import { useAccount, useUpdateAccount } from "@/hooks/use-account";

export function AiConsent() {
	const account = useAccount();
	const update = useUpdateAccount();

	if (!account.data || account.data.aiConsentAt) {
		return null;
	}

	function choose(aiLabelingEnabled: boolean) {
		update.mutate(
			{ aiLabelingEnabled },
			{
				onSuccess: () =>
					toast.success(
						aiLabelingEnabled
							? "Assisted labeling is on. Change it any time in Settings."
							: "Nothing will be sent to a cloud model.",
					),
			},
		);
	}

	return (
		<Card className="mb-6 ring-primary/25">
			<CardHeader>
				<CardTitle>One choice before you start</CardTitle>
				<CardDescription>
					Your rules and your own past labels always run locally. This is only
					about the cloud model.
				</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-4">
				<p className="max-w-prose text-muted-foreground text-sm">
					When no rule or past label matches a block, Flowlog can ask Google
					Gemini for a suggested description, using app and website names,
					window and tab titles, repositories, branches, commit subjects, and
					durations. Sensitive-text filtering reduces what gets sent but won't
					catch everything, and you review every suggestion before it counts.
				</p>
				<p className="max-w-prose text-muted-foreground text-sm">
					Decline and tracking, your rules, and manual review all keep working.
					Either way you can change this in Settings.
				</p>
				<div className="flex flex-wrap gap-2">
					<Button disabled={update.isPending} onClick={() => choose(true)}>
						Use AI suggestions
					</Button>
					<Button
						variant="outline"
						disabled={update.isPending}
						onClick={() => choose(false)}
					>
						Keep my activity out of it
					</Button>
				</div>
				{update.isError && (
					<p role="alert" className="text-destructive text-sm">
						Your choice could not be saved. Try again.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
