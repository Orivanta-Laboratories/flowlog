"use client";

import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@flowlog/ui/components/alert";
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
import { Skeleton } from "@flowlog/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { devicePlatformName } from "@/helpers/readable-names";
import { useApproveDevicePairing } from "@/hooks/use-devices";
import { orpc } from "@/utils/orpc";

export default function DeviceConnectPageClient({
	pairingId,
}: {
	pairingId: string;
}) {
	const [name, setName] = useState("My computer");
	const approvePairing = useApproveDevicePairing();
	const request = useQuery(
		orpc.device.pairing.get.queryOptions({
			input: { pairingId },
			retry: false,
		}),
	);

	if (approvePairing.isSuccess) {
		return (
			<Alert>
				<CheckCircle2 aria-hidden="true" />
				<AlertTitle>{approvePairing.data.deviceName} is connected</AlertTitle>
				<AlertDescription className="grid gap-3">
					<p>
						You can close this tab and go back to your device. It starts sending
						activity on its next check in.
					</p>
					<Button
						render={<Link href="/devices" />}
						nativeButton={false}
						size="sm"
						variant="outline"
						className="w-fit"
					>
						See your devices
					</Button>
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Approve this device?</CardTitle>
				<CardDescription>
					Only approve if you started this request. An approved device can send
					activity to your account until you revoke it.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						approvePairing.mutate({ pairingId, name });
					}}
					className="grid gap-4"
				>
					<dl className="grid gap-1 bg-muted/50 px-3 py-2 text-sm">
						<dt className="text-muted-foreground text-xs">
							Device asking to connect
						</dt>
						<dd className="font-medium">
							{request.isPending ? (
								<Skeleton className="h-4 w-32" />
							) : request.data ? (
								devicePlatformName(request.data.platform)
							) : (
								"Unknown"
							)}
						</dd>
					</dl>

					{request.isError && (
						<p role="alert" className="text-destructive text-sm">
							This request expired or was already approved. Start again from
							your device.
						</p>
					)}

					<div className="grid gap-1.5">
						<Label htmlFor="device-name">Name this device</Label>
						<Input
							id="device-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							required
						/>
						<p className="text-muted-foreground text-xs">
							You'll see this name in your device list.
						</p>
					</div>

					<div className="flex flex-wrap gap-2">
						<Button
							type="submit"
							disabled={approvePairing.isPending || !request.data}
						>
							Approve and connect
						</Button>
						<Button
							render={<Link href="/devices" />}
							nativeButton={false}
							variant="ghost"
						>
							Cancel
						</Button>
					</div>

					{approvePairing.isError && (
						<p role="alert" className="text-destructive text-sm">
							{approvePairing.error.message}
						</p>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
