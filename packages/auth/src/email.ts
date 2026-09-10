import { env } from "@flowlog/env/server";
import { Resend } from "resend";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendInvitationEmail(params: {
	to: string;
	organizationName: string;
	inviterName: string;
	acceptUrl: string;
}) {
	const subject = `${params.inviterName} invited you to join ${params.organizationName} on Flowlog`;
	const text = `${params.inviterName} invited you to join ${params.organizationName} on Flowlog.\n\nCreate an account with this email address to accept the invitation:\n${params.acceptUrl}\n\nThis link expires in 7 days.`;

	if (resend === null) {
		console.log(
			`[email] RESEND_API_KEY not set, invitation email not sent. Accept link: ${params.acceptUrl}`,
		);
		return;
	}

	await resend.emails.send({
		from: env.EMAIL_FROM,
		to: params.to,
		subject,
		text,
	});
}
