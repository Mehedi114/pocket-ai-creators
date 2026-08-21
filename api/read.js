import { callAI } from "./_providers.js";
import { readUrl } from "./_tools.js";

/**
 * যেকোনো URL পড়ে বিশ্লেষণ — ব্লগ, নিউজ, প্রতিযোগীর পেজ, প্রোডাক্ট পেজ, PDF।
 * YouTube Research এর মতো, কিন্তু গোটা ইন্টারনেটের জন্য।
 */

const MODES = {
    summary: {
        label: "Summary",
        instruction: `
একটা পরিষ্কার সারসংক্ষেপ দাও:
1. এক লাইনে মূল বক্তব্য
2. ৫-৮টি মূল পয়েন্ট
3. গুরুত্বপূর্ণ সংখ্যা/তথ্য (থাকলে)
4. লেখাটির উদ্দেশ্য ও টার্গেট পাঠক
5. কী বাদ পড়েছে বা দুর্বল`
    },
    content: {
        label: "Content Ideas",
        instruction: `
একজন কনটেন্ট ক্রিয়েটরের দৃষ্টিতে বিশ্লেষণ করো:
1. এখান থেকে বানানো যায় এমন ১০টি ভিডিও/পোস্ট আইডিয়া
2. প্রতিটির জন্য একটা হুক
3. কোন অ্যাঙ্গেলটা সবচেয়ে কম ব্যবহৃত
4. কোন তথ্যগুলো ভিডিওতে সরাসরি ব্যবহার করা যাবে
5. কী কী যাচাই করে নিতে হবে`
    },
    competitor: {
        label: "Competitor Teardown",
        instruction: `
প্রতিযোগী বিশ্লেষণ করো:
1. এরা কী অফার করছে ও কাকে টার্গেট করছে
2. পজিশনিং ও মূল বার্তা
3. শক্তি
4. দুর্বলতা ও ফাঁকফোকর
5. এদের থেকে আলাদা হওয়ার ৫টি কংক্রিট উপায়
6. এদের কপিরাইটিং থেকে শেখার মতো ৩টি জিনিস`
    },
    rewrite: {
        label: "Rewrite for me",
        instruction: `
এই কনটেন্টকে ক্রিয়েটরের নিজের ভাষায় নতুন করে লেখো:
1. একটি মৌলিক, সাবলীল আর্টিকেল/স্ক্রিপ্ট (কপি নয় — নতুন করে লেখা)
2. একটি YouTube স্ক্রিপ্ট ভার্সন
3. একটি সোশ্যাল পোস্ট ভার্সন
মূল তথ্য ঠিক রেখো, কিন্তু বাক্য ও গঠন সম্পূর্ণ নিজের।`
    },
    facts: {
        label: "Fact Extract",
        instruction: `
শুধু যাচাইযোগ্য তথ্য বের করো:
1. সব সংখ্যা, তারিখ, পরিসংখ্যান (উৎসসহ)
2. উদ্ধৃতি
3. নাম ও প্রতিষ্ঠান
4. দাবি যেগুলো প্রমাণ ছাড়া বলা হয়েছে
কিছু বানাবে না। পেজে না থাকলে "পেজে নেই" লেখো।`
    }
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { url, mode = "summary", question } = req.body || {};

        if (!url || !String(url).trim()) {
            return res.status(400).json({ error: "একটি URL দিন।" });
        }

        const page = await readUrl(String(url).trim());

        if (!page.content || page.content.length < 120) {
            return res.status(422).json({
                error: "পেজটি থেকে যথেষ্ট টেক্সট পাওয়া যায়নি (হয়তো লগইন লাগে বা পুরোটা ভিডিও/ছবি)।"
            });
        }

        const selected = MODES[mode] || MODES.summary;

        const task = question
            ? `ব্যবহারকারীর প্রশ্ন: ${question}\n\nশুধু পেজের তথ্য ব্যবহার করে উত্তর দাও।`
            : selected.instruction;

        const outcome = await callAI({
            system:
                "You are Pocket AI, a sharp research analyst for content creators. " +
                "Only use the supplied page content. Never invent facts. " +
                "Reply in natural Bangla unless the user asks otherwise.",
            prompt: `
পেজ: ${page.title}
URL: ${page.url}
${page.truncated ? "(দ্রষ্টব্য: পেজটি বড়, শুরুর অংশ দেওয়া হলো)\n" : ""}
--- পেজের কনটেন্ট ---
${page.content}
--- শেষ ---

${task}
`,
            temperature: 0.6,
            maxTokens: 3000
        });

        return res.status(200).json({
            success: true,
            page: {
                url: page.url,
                title: page.title,
                chars: page.chars,
                truncated: page.truncated
            },
            mode,
            modeLabel: selected.label,
            result: outcome.text,
            engine: {
                provider: outcome.provider,
                providerLabel: outcome.providerLabel,
                model: outcome.model,
                attempts: outcome.attempts || null
            },
            reader: "Jina Reader"
        });
    } catch (error) {
        console.error("Read API Error:", error);
        return res.status(error?.status || 500).json({
            error: error?.message || "পেজ পড়া ব্যর্থ হয়েছে।"
        });
    }
}
