import axios from 'axios'

export const generateAltText = async (imageUrl, context) => {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openrouter/free',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an SEO and accessibility expert specializing in e-commerce product photography.
Analyze this product image and generate alt text in 3 variations:
1. SHORT (under 60 chars) — for thumbnails, icons, small placements
2. STANDARD (60–100 chars) — for product listing pages
3. DETAILED (100–125 chars) — for product detail pages

Rules:
- Describe what is visually present: product type, color, material, shape, key features
- Include natural keywords relevant to the product
- Do NOT start with "image of" or "picture of"
- Do NOT use punctuation at the end
- No marketing language ("stunning", "beautiful", "amazing")
- Be factual and descriptive
${context ? `Product context: ${context}` : ''}

Return ONLY raw JSON. No markdown, no backticks, no explanation.
Start with { and end with }

{
  "short": "...",
  "standard": "...",
  "detailed": "..."
}`,
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
          'X-Title': 'E-commerce App',
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    )

    const content = response.data.choices[0]?.message?.content
    if (!content) return null

    // Extract JSON safely — handles any extra text the model adds
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in response:', content)
      return null
    }

    return JSON.parse(jsonMatch[0]) // Return parsed object, not string
  } catch (error) {
    if (error.response) {
      console.error('OpenRouter Error:', error.response.data)
    } else {
      console.error('AI Connection Error:', error.message)
    }
    return null
  }
}
