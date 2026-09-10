"use client";

import { DEVICE_PLATFORM_VALUES } from "@flowlog/db/constants";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@flowlog/ui/components/alert";
import { Button } from "@flowlog/ui/components/button";
import {
	Empty,
	EmptyDescription,
	EmptyTitle,
} from "@flowlog/ui/components/empty";
import { Input } from "@flowlog/ui/components/input";
import { Label } from "@flowlog/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@flowlog/ui/components/select";
import { Skeleton } from "@flowlog/ui/components/skeleton";
import { useState } from "react";
import { toast } from "sonner";

import {
	useCreateDevice,
	useDeviceList,
	useRevokeDevice,
} from "@/hooks/use-devices";

function IssuedTokenAlert({
	token,
	onDismiss,
}: {
	token: string;
	onDismiss: () => void;
}) {
	return (
		<Alert className="mb-6">
			<AlertTitle>Copy this token now — it won't be shown again</AlertTitle>
			<AlertDescription>
				<code className="block overflow-x-auto rounded bg-muted p-2 text-[11px]">
					{token}
				</code>
				<Button
					size="sm"
					variant="outline"
					className="mt-2"
					onClick={() => {
						void navigator.clipboard.writeText(token);
						toast.success("Copied to clipboard.");
					}}
				>
					Copy
				</Button>
				<Button
					size="sm"
					variant="ghost"
					className="mt-2 ml-2"
					onClick={onDismiss}
				>
					Done
				</Button>
			</AlertDescription>
		</Alert>
	);
}

function CreateDeviceForm({ onIssued }: { onIssued: (token: string) => void }) {
	const [name, setName] = useState("");
	const [platform, setPlatform] = useState<
		(typeof DEVICE_PLATFORM_VALUES)[number]
	>(DEVICE_PLATFORM_VALUES[0]);
	const createDevice = useCreateDevice();

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		createDevice.mutate(
			{ name, platform },
			{
				onSuccess: (result) => {
					setName("");
					if (result.token) {
						onIssued(result.token);
					}
				},
				onError: (error) => toast.error(error.message),
			},
		);
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="mb-8 grid gap-3 rounded-md border p-4 sm:grid-cols-2"
		>
			<div>
				<Label htmlFor="device-name">Name</Label>
				<Input
					id="device-name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Work laptop"
					required
				/>
			</div>
			<div>
				<Label htmlFor="device-platform">Platform</Label>
				<Select
					value={platform}
					onValueChange={(value) => setPlatform(value as typeof platform)}
				>
					<SelectTrigger id="device-platform" className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{DEVICE_PLATFORM_VALUES.map((value) => (
							<SelectItem key={value} value={value}>
								{value}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<Button
				type="submit"
				disabled={createDevice.isPending}
				className="w-fit sm:col-span-2"
			>
				Generate pairing token
			</Button>
		</form>
	);
}

function DeviceList() {
	const devices = useDeviceList();
	const revokeDevice = useRevokeDevice();

	if (devices.isPending) {
		return <Skeleton className="h-24 w-full" />;
	}

	if (devices.isError) {
		return <p className="text-destructive text-sm">{devices.error.message}</p>;
	}

	if (devices.data.length === 0) {
		return (
			<Empty>
				<EmptyTitle>No devices paired</EmptyTitle>
				<EmptyDescription>
					Generate a token above, then run `flowlog-agent pair --token ...` or
					paste it into the browser extension's settings.
				</EmptyDescription>
			</Empty>
		);
	}

	return (
		<ul className="divide-y rounded-md border">
			{devices.data.map((device) => (
				<li
					key={device.id}
					className="flex items-center justify-between px-4 py-2 text-sm"
				>
					<div>
						<span className="font-medium">{device.name}</span>
						<span className="ml-2 text-muted-foreground">
							{device.platform} · {device.tokenPreview}
						</span>
						{device.revokedAt !== null && (
							<span className="ml-2 text-destructive">revoked</span>
						)}
					</div>
					{device.revokedAt === null && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => revokeDevice.mutate({ id: device.id })}
							disabled={revokeDevice.isPending}
						>
							Revoke
						</Button>
					)}
				</li>
			))}
		</ul>
	);
}

export default function DevicesPageClient() {
	const [issuedToken, setIssuedToken] = useState<string | null>(null);

	return (
		<>
			{issuedToken !== null && (
				<IssuedTokenAlert
					token={issuedToken}
					onDismiss={() => setIssuedToken(null)}
				/>
			)}
			<CreateDeviceForm onIssued={setIssuedToken} />
			<DeviceList />
		</>
	);
}
