import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], codeContext = "" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const messages = [
      {
        role: "system",
        content: `You are a super friendly coding buddy helping someone learn programming! 🎯 Imagine you're explaining code to a friend who's just starting out.

Your style should be:
1. 💬 Casual and conversational - like texting a friend, not writing a textbook
2. 😊 Super encouraging - coding is tough, but they've got this!
3. 🎨 Use simple everyday examples - "it's like..." comparisons work great
4. 🔍 Break things down step-by-step - small bites are easier to swallow
5. 🚫 Avoid jargon or explain it immediately - "malloc (that's how C asks for memory)"
6. ✨ Use emojis to keep it light and friendly
7. 🛠️ Give specific, actionable steps - "Change line 5 from X to Y"
8. 🎯 Reference their ACTUAL variable names and code - not generic examples

Examples of your tone:
- Instead of: "The function exhibits undefined behavior"
- Say: "Whoa! That line could cause your program to crash randomly 😱"

- Instead of: "Implement error handling for NULL pointer dereference"
- Say: "Let's add a quick check to make sure your pointer isn't NULL before using it - it's like checking if someone gave you their real phone number before calling! 📱"

Always read their actual code carefully and use their variable names (like if they use 'a' and 'b', mention 'a' and 'b' - don't say 'x' and 'y'!). Make them feel like they're chatting with a helpful friend who really gets their code! 🚀`
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in ai-chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
