"""
DeepSeek Test Script
Kør med: python test_deepseek.py
"""

from openai import OpenAI

# Setup client
client = OpenAI(
    api_key="sk-a3f8e6b48271466b981396dc97fd904a",
    base_url="https://api.deepseek.com/v1"
)

def chat(prompt):
    """Chat med DeepSeek"""
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

# Test it
if __name__ == "__main__":
    print("🌊 Testing DeepSeek...")
    print()
    
    response = chat("Forklar quantum computing på dansk")
    
    print("🤖 DeepSeek:")
    print(response)
