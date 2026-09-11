import MarketingFooter from "@/components/marketing-footer";
import MarketingHeader from "@/components/marketing-header";

export default function MarketingLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="flex min-h-svh flex-col">
			<a
				href="#marketing-main"
				className="fixed -top-20 left-2 z-50 rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground text-sm transition-[top] duration-150 ease-fluid focus:top-2"
			>
				Skip to content
			</a>
			<MarketingHeader />
			<main id="marketing-main" tabIndex={-1} className="flex-1 outline-none">
				{children}
			</main>
			<MarketingFooter />
		</div>
	);
}
