import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: {
		default: "Flowlog — the timesheet that fills itself in",
		template: "%s · Flowlog",
	},
	description:
		"Flowlog turns the apps, windows, and git branches you already work in into a suggested timesheet, so you confirm your day instead of reconstructing it from memory.",
	keywords: [
		"automatic time tracking",
		"timesheet software",
		"git aware time tracking",
		"freelancer time tracking",
		"developer time tracking",
	],
	applicationName: "Flowlog",
	openGraph: {
		type: "website",
		siteName: "Flowlog",
		title: "Flowlog — the timesheet that fills itself in",
		description:
			"Flowlog turns the apps, windows, and git branches you already work in into a suggested timesheet, so you confirm your day instead of reconstructing it from memory.",
	},
	twitter: {
		card: "summary",
		title: "Flowlog — the timesheet that fills itself in",
		description:
			"Flowlog turns the apps, windows, and git branches you already work in into a suggested timesheet.",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
