import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

export const labelSuggestionModel: LanguageModel = google("gemini-2.5-flash");
