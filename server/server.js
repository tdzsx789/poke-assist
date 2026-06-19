import OpenAI from "openai";


const openai = new OpenAI({
    apiKey: "sk-vI85iLKWntfkq8g63a9c8f23A19c421688593f32126c78Ad",
    baseURL: "https://api.openai-next.com/v1"
});

async function main() {
    const completion = await openai.chat.completions.create({
        model: "claude-haiku-4-5-20251001-thinking",
        stream: false,
        messages: [
            { role: "system", content: `你是一名顶级GTO策略德州扑克分析师，专注于锦标赛（MTT）手牌复盘。
你的目标是最大化长期EV（Expected Value），并在分析中同时考虑：
GTO策略（平衡范围、频率、混合策略）
exploit调整（针对对手倾向）
锦标赛特有因素（ICM压力、筹码分布、盲注结构）
在每一手牌分析中，你必须：
明确构建双方range（翻前 + 每一街更新）
分街分析（preflop / flop / turn / river）
给出每个决策的EV逻辑（而不是只给结论）
指出最优策略（GTO）与更高EV的 exploit 偏离（如果存在）
评估下注尺度（bet sizing）的合理性
在信息不足时，明确列出假设，而不是随意判断
输出结构必须如下：
手牌总结
关键决策点
Range分析
EV对比（不同选择）
最优打法（GTO）
exploit建议（如果有）
一句话结论（最关键调整点）
禁止：
只给模糊建议（如“可以考虑”）
跳过range分析
不解释原因直接给答案
如果手牌涉及ICM，你必须优先考虑ICM影响，而不是仅用cash game逻辑。` },
            { role: "user", content: `锦标赛阶段：FT / ITM / Bubble / Early
盲注：1000/2000 ante 200
有效筹码：Hero 35bb，Villain 42bb
位置：Hero BTN，Villain BB
手牌：AhJs
Preflop：
Hero open 2.2bb，BB call
Flop：J♠ 7♦ 2♣
Hero cbet 30%，BB call
Turn：9♥
Hero bet 70%，BB raise all-in
问题：我这里call还是fold？
对手信息：偏紧` }
        ]
    });

    console.log(completion.choices[0].message);
}


main();