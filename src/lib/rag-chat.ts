import { groq, RAGChat, upstash } from "@upstash/rag-chat"
import { redis } from "./redis"

export const ragChat = new RAGChat({
    model: groq("meta-llama/llama-4-scout-17b-16e-instruct",{
        apiKey: process.env.GROQ_KEY
    }),
    redis: redis,
})