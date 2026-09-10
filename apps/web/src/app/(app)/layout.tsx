import type { Metadata } from "next";

import AppHeader from "@/components/app-header";

export const metadata: Metadata = {
	robots: { index: false, follow: false },
};

export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="grid h-svh grid-rows-[auto_1fr]">
			<AppHeader />
			<main>{children}</main>
		</div>
	);
}
