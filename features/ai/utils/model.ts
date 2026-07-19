import { openai } from "@ai-sdk/openai";
import { CHAT_MODEL_ALLOWLIST } from "@/features/ai/config/limits";

/** Default OpenAI model used when a conversation has no model override. */
export const DEFAULT_CHAT_MODEL = "gpt-4.1-mini";

/**
 * Returns an OpenAI language model instance for chat completions.
 *
 * Per-thread overrides are clamped to {@link CHAT_MODEL_ALLOWLIST} so a
 * conversation row can never select an expensive model.
 *
 * @param modelId - Optional model identifier; falls back to {@link DEFAULT_CHAT_MODEL}.
 */
export function getChatModel(modelId?: string | null) {
    const allowed =
        modelId && (CHAT_MODEL_ALLOWLIST as readonly string[]).includes(modelId);

    return openai(allowed ? modelId : DEFAULT_CHAT_MODEL);
}
