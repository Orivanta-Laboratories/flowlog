import { isNull, relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import {
	DEVICE_PLATFORM_VALUES,
	EVENT_SOURCE_VALUES,
	PAIRING_REQUEST_STATUS,
	PAIRING_REQUEST_STATUS_VALUES,
	PROJECT_COLOR,
	PROJECT_COLOR_VALUES,
	RULE_FIELD_VALUES,
	RULE_OPERATOR,
	RULE_OPERATOR_VALUES,
	SESSION_STATUS,
	SESSION_STATUS_VALUES,
	SUGGESTION_SOURCE,
	SUGGESTION_SOURCE_VALUES,
} from "../constants";
import { user } from "./auth";

export const eventSourceEnum = pgEnum("event_source", EVENT_SOURCE_VALUES);
export const sessionStatusEnum = pgEnum(
	"session_status",
	SESSION_STATUS_VALUES,
);
export const suggestionSourceEnum = pgEnum(
	"suggestion_source",
	SUGGESTION_SOURCE_VALUES,
);
export const ruleFieldEnum = pgEnum("rule_field", RULE_FIELD_VALUES);
export const ruleOperatorEnum = pgEnum("rule_operator", RULE_OPERATOR_VALUES);
export const devicePlatformEnum = pgEnum(
	"device_platform",
	DEVICE_PLATFORM_VALUES,
);
export const projectColorEnum = pgEnum("project_color", PROJECT_COLOR_VALUES);
export const pairingRequestStatusEnum = pgEnum(
	"pairing_request_status",
	PAIRING_REQUEST_STATUS_VALUES,
);

export const project = pgTable(
	"project",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		clientName: text("client_name"),
		color: projectColorEnum("color").default(PROJECT_COLOR.CHART_1).notNull(),
		billingRateCents: integer("billing_rate_cents"),
		archivedAt: timestamp("archived_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("project_user_id_idx").on(table.userId),
		uniqueIndex("project_user_id_name_uidx")
			.on(table.userId, table.name)
			.where(isNull(table.archivedAt)),
	],
);

export const matchingRule = pgTable(
	"matching_rule",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		projectId: uuid("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		field: ruleFieldEnum("field").notNull(),
		operator: ruleOperatorEnum("operator")
			.default(RULE_OPERATOR.CONTAINS)
			.notNull(),
		value: text("value").notNull(),
		label: text("label"),
		priority: integer("priority").default(0).notNull(),
		archivedAt: timestamp("archived_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("matching_rule_user_id_idx").on(table.userId),
		index("matching_rule_project_id_idx").on(table.projectId),
	],
);

export const device = pgTable(
	"device",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		platform: devicePlatformEnum("platform").notNull(),
		tokenHash: text("token_hash").notNull(),
		tokenPreview: text("token_preview").notNull(),
		lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
		revokedAt: timestamp("revoked_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("device_user_id_idx").on(table.userId),
		uniqueIndex("device_token_hash_uidx").on(table.tokenHash),
	],
);

export const rawEvent = pgTable(
	"raw_event",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		deviceId: uuid("device_id")
			.notNull()
			.references(() => device.id, { onDelete: "cascade" }),
		clientEventId: text("client_event_id").notNull(),
		occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
		source: eventSourceEnum("source").notNull(),
		appName: text("app_name"),
		windowTitle: text("window_title"),
		repoName: text("repo_name"),
		branchName: text("branch_name"),
		commitSubject: text("commit_subject"),
		isIdle: boolean("is_idle").default(false).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("raw_event_user_id_occurred_at_idx").on(
			table.userId,
			table.occurredAt,
		),
		uniqueIndex("raw_event_device_id_client_event_id_uidx").on(
			table.deviceId,
			table.clientEventId,
		),
	],
);

export const activitySession = pgTable(
	"activity_session",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
		endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
		durationSeconds: integer("duration_seconds").notNull(),
		appName: text("app_name").notNull(),
		windowTitle: text("window_title"),
		repoName: text("repo_name"),
		branchName: text("branch_name"),
		commitSubjects: text("commit_subjects").array().default([]).notNull(),
		signalFingerprint: text("signal_fingerprint").notNull(),
		status: sessionStatusEnum("status")
			.default(SESSION_STATUS.SUGGESTED)
			.notNull(),
		suggestedLabel: text("suggested_label"),
		suggestedProjectId: uuid("suggested_project_id").references(
			() => project.id,
			{
				onDelete: "set null",
			},
		),
		suggestionSource: suggestionSourceEnum("suggestion_source")
			.default(SUGGESTION_SOURCE.NONE)
			.notNull(),
		suggestionRationale: text("suggestion_rationale"),
		confidencePercent: integer("confidence_percent").default(0).notNull(),
		finalLabel: text("final_label"),
		projectId: uuid("project_id").references(() => project.id, {
			onDelete: "set null",
		}),
		edited: boolean("edited").default(false).notNull(),
		confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
		archivedAt: timestamp("archived_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("activity_session_user_id_fingerprint_idx").on(
			table.userId,
			table.signalFingerprint,
		),
		index("activity_session_project_id_idx").on(table.projectId),
		uniqueIndex("activity_session_user_id_started_at_uidx").on(
			table.userId,
			table.startedAt,
		),
	],
);

export const devicePairingRequest = pgTable(
	"device_pairing_request",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		platform: devicePlatformEnum("platform").notNull(),
		status: pairingRequestStatusEnum("status")
			.default(PAIRING_REQUEST_STATUS.PENDING)
			.notNull(),
		userId: text("user_id").references(() => user.id, {
			onDelete: "cascade",
		}),
		deviceId: uuid("device_id").references(() => device.id, {
			onDelete: "cascade",
		}),
		tokenHash: text("token_hash"),
		tokenPreview: text("token_preview"),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("device_pairing_request_expires_at_idx").on(table.expiresAt),
	],
);

export const confirmation = pgTable(
	"confirmation",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		activitySessionId: uuid("activity_session_id")
			.notNull()
			.references(() => activitySession.id, { onDelete: "cascade" }),
		signalFingerprint: text("signal_fingerprint").notNull(),
		finalLabel: text("final_label").notNull(),
		finalProjectId: uuid("final_project_id").references(() => project.id, {
			onDelete: "set null",
		}),
		suggestedLabel: text("suggested_label"),
		suggestedProjectId: uuid("suggested_project_id").references(
			() => project.id,
			{
				onDelete: "set null",
			},
		),
		suggestionSource: suggestionSourceEnum("suggestion_source").notNull(),
		confidencePercent: integer("confidence_percent").notNull(),
		edited: boolean("edited").notNull(),
		confirmedAt: timestamp("confirmed_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("confirmation_user_id_fingerprint_idx").on(
			table.userId,
			table.signalFingerprint,
			table.confirmedAt,
		),
		index("confirmation_activity_session_id_idx").on(table.activitySessionId),
	],
);

export const projectRelations = relations(project, ({ many }) => ({
	matchingRules: many(matchingRule),
	activitySessions: many(activitySession),
}));

export const matchingRuleRelations = relations(matchingRule, ({ one }) => ({
	project: one(project, {
		fields: [matchingRule.projectId],
		references: [project.id],
	}),
}));

export const deviceRelations = relations(device, ({ many }) => ({
	rawEvents: many(rawEvent),
}));

export const rawEventRelations = relations(rawEvent, ({ one }) => ({
	device: one(device, {
		fields: [rawEvent.deviceId],
		references: [device.id],
	}),
}));

export const activitySessionRelations = relations(
	activitySession,
	({ one, many }) => ({
		project: one(project, {
			fields: [activitySession.projectId],
			references: [project.id],
		}),
		confirmations: many(confirmation),
	}),
);

export const confirmationRelations = relations(confirmation, ({ one }) => ({
	activitySession: one(activitySession, {
		fields: [confirmation.activitySessionId],
		references: [activitySession.id],
	}),
}));
