import os
import asyncio
import json
import google.generativeai as genai


genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")


async def get_evaluation():
    try:
        response = await model.generate_content_async(
            "What time is it?",
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        print(json.loads(response.text))
    except Exception as e:
        print(e)


asyncio.run(get_evaluation())
