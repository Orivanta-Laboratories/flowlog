"use client";

import { DEVICE_PLATFORM_VALUES } from "@flowlog/db/constants";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@flowlog/ui/components/alert";
import { Badge } from "@flowlog/ui/components/badge";
import { Button } from "@flowlog/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@flowlog/ui/components/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@flowlog/ui/components/empty";
import { Input } from "@flowlog/ui/components/input";
import { Label } from "@flowlog/ui/components/label";
import { Pagination } from "@flowlog/ui/components/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@flowlog/ui/components/select";
import { Skeleton } from "@flowlog/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@flowlog/ui/components/table";
import { Copy, Globe, Laptop, MonitorSmartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { devicePlatformName } from "@/helpers/readable-names";
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
		<Alert className="mb-4">
			<AlertTitle>Copy this token now, it won't be shown again</AlertTitle>
			<AlertDescription className="grid gap-3">
				<p>
					Run{" "}
					<code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono">
						flowlog-agent pair --token …
					</code>{" "}
					on the machine you want to track.
				</p>
				<code className="block overflow-x-auto rounded-md bg-muted p-3 font-mono text-[11px] leading-relaxed">
					{token}
				</code>
				<div className="flex flex-wrap gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={() => {
							void navigator.clipboard.writeText(token);
							toast.success("Copied to clipboard.");
						}}
					>
						<Copy data-icon="inline-start" aria-hidden="true" />
						Copy token
					</Button>
					<Button size="sm" variant="ghost" onClick={onDismiss}>
						I've saved it
					</Button>
				</div>
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
		<Card className="mb-4">
			<CardHeader>
				<CardTitle>Pair with a token</CardTitle>
				<CardDescription>
					For the desktop agent. The browser extension connects without a token:
					open its settings and choose "Connect your Flowlog account".
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-1.5">
							<Label htmlFor="device-name">Name this device</Label>
							<Input
								id="device-name"
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder="Work laptop"
								required
							/>
						</div>
						<div className="grid gap-1.5">
							<Label htmlFor="device-platform">Platform</Label>
							<Select
								value={platform}
								onValueChange={(value) => setPlatform(value as typeof platform)}
							>
								<SelectTrigger id="device-platform" className="w-full">
									<SelectValue>{devicePlatformName(platform)}</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{DEVICE_PLATFORM_VALUES.map((value) => (
										<SelectItem key={value} value={value}>
											{devicePlatformName(value)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<Button
						type="submit"
						disabled={createDevice.isPending}
						className="w-fit"
					>
						Generate pairing token
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

function DeviceList() {
	const devices = useDeviceList();
	const revokeDevice = useRevokeDevice();
	const [page, setPage] = useState(1);

	if (devices.isPending) {
		return (
			<Skeleton
				role="status"
				className="h-24 w-full"
				aria-label="Loading devices"
			/>
		);
	}

	if (devices.isError) {
		return (
			<p role="alert" className="text-destructive text-sm">
				{devices.error.message}
			</p>
		);
	}

	if (devices.data.length === 0) {
		return (
			<Empty className="ring-1 ring-border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<MonitorSmartphone aria-hidden="true" />
					</EmptyMedia>
					<EmptyTitle>No devices connected</EmptyTitle>
					<EmptyDescription>
						Nothing is being tracked yet. Pair the desktop agent with a token
						above, or connect the browser extension from its settings.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	const pageSize = 8;
	const pageCount = Math.ceil(devices.data.length / pageSize);
	const visibleDevices = devices.data.slice(
		(page - 1) * pageSize,
		page * pageSize,
	);
	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-xs">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="px-5">Device</TableHead>
						<TableHead>Platform</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{visibleDevices.map((device) => {
						const isBrowser = device.platform === "CHROME_EXTENSION";
						const revoked = device.revokedAt !== null;
						return (
							<TableRow key={device.id}>
								<TableCell className="px-5">
									<div className="flex items-center gap-3">
										{isBrowser ? (
											<Globe
												className="size-4 shrink-0 text-muted-foreground"
												aria-hidden="true"
											/>
										) : (
											<Laptop
												className="size-4 shrink-0 text-muted-foreground"
												aria-hidden="true"
											/>
										)}
										<div className="min-w-0">
											<p className="truncate font-medium">{device.name}</p>
										</div>
									</div>
								</TableCell>
								<TableCell>
									{devicePlatformName(device.platform)}{" "}
									<span className="font-mono text-muted-foreground text-xs">
										{device.tokenPreview}
									</span>
								</TableCell>
								<TableCell>
									{revoked ? (
										<Badge variant="destructive">Revoked</Badge>
									) : (
										<Badge variant="outline">Connected</Badge>
									)}
								</TableCell>
								<TableCell className="text-right">
									{!revoked && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => revokeDevice.mutate({ id: device.id })}
											disabled={revokeDevice.isPending}
										>
											Revoke
										</Button>
									)}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
			<Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
		</div>
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
			<h2 className="cn-font-heading mb-3 font-medium text-base">
				Connected devices
			</h2>
			<DeviceList />
		</>
	);
}
