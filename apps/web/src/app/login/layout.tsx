import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Sign in",
};

export default function LoginLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="flex min-h-svh flex-col">
			<header className="px-4 py-4">
				<Link href="/" className="font-semibold text-sm tracking-tight">
					Flowlog
				</Link>
			</header>
			<main className="flex flex-1 items-center justify-center px-4 pb-16">
				{children}
			</main>
		</div>
	);
}
