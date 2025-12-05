#!/usr/bin/env python3
"""
╔═══════════════════════════════════════════════════════════════════════════╗
║          DEEPSEEK CLI v3.2 - WidgeTDC Agent Integration                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Usage: python deepseek-cli.py "Your prompt here"                         ║
║         python deepseek-cli.py -f code.ts "Fix errors in this file"       ║
║         python deepseek-cli.py --task "Generate tests for X"              ║
╚═══════════════════════════════════════════════════════════════════════════╝
"""

import os
import sys
import argparse
import json
from pathlib import Path
from datetime import datetime

# Load API key from .env or environment
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / '.env')
load_dotenv(Path(__file__).parent.parent / '.env.local')

from openai import OpenAI

# DeepSeek V3.2 configuration
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', 'sk-a3f8e6b48271466b981396dc97fd904a')
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
DEEPSEEK_MODEL = "deepseek-chat"  # or "deepseek-coder" for code tasks

# Agent inbox paths
AGENT_INBOX = Path(__file__).parent.parent / 'agents' / 'deepseek' / 'inbox'
TEAM_CHAT = Path(__file__).parent.parent / 'agents' / 'team-chat.json'

def create_client():
    """Create DeepSeek API client"""
    return OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url=DEEPSEEK_BASE_URL
    )

def send_message(prompt: str, system_prompt: str = None, files: list = None, model: str = DEEPSEEK_MODEL):
    """Send a message to DeepSeek and get response"""
    client = create_client()
    
    messages = []
    
    # System prompt
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    else:
        messages.append({
            "role": "system", 
            "content": """You are DeepSeek, a powerful AI coding assistant integrated with WidgeTDC.
You are part of a multi-agent team with Claude and Gemini.
Your specialties: Rapid code generation, test creation, mathematical analysis, algorithm optimization.
Always provide working code with proper TypeScript types when relevant.
Be concise but thorough. Focus on implementation."""
        })
    
    # Add file contents if provided
    if files:
        file_content = ""
        for file_path in files:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    file_content += f"\n\n--- FILE: {file_path} ---\n{content}\n--- END FILE ---\n"
        if file_content:
            prompt = f"Files provided:\n{file_content}\n\nTask: {prompt}"
    
    messages.append({"role": "user", "content": prompt})
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
            max_tokens=4000
        )
        return {
            "success": True,
            "content": response.choices[0].message.content,
            "model": model,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "model": model
        }

def check_inbox():
    """Check for tasks in the agent inbox"""
    if not AGENT_INBOX.exists():
        return []
    
    tasks = []
    for file in AGENT_INBOX.glob('*.json'):
        with open(file, 'r', encoding='utf-8') as f:
            task = json.load(f)
            tasks.append({"file": str(file), "task": task})
    return tasks

def log_to_team_chat(message: str, msg_type: str = "status"):
    """Log a message to team chat"""
    chat_entry = {
        "timestamp": datetime.now().isoformat(),
        "agent": "deepseek",
        "type": msg_type,
        "message": message
    }
    
    chat_log = []
    if TEAM_CHAT.exists():
        with open(TEAM_CHAT, 'r', encoding='utf-8') as f:
            try:
                chat_log = json.load(f)
            except:
                chat_log = []
    
    chat_log.append(chat_entry)
    
    # Keep last 100 messages
    if len(chat_log) > 100:
        chat_log = chat_log[-100:]
    
    with open(TEAM_CHAT, 'w', encoding='utf-8') as f:
        json.dump(chat_log, f, indent=2)
    
    return chat_entry

def main():
    parser = argparse.ArgumentParser(
        description='DeepSeek CLI v3.2 - WidgeTDC Agent',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python deepseek-cli.py "Explain React 19 concurrent features"
  python deepseek-cli.py -f src/component.tsx "Add proper TypeScript types"
  python deepseek-cli.py --task "Generate unit tests for KnowledgeCompiler"
  python deepseek-cli.py --check-inbox
  python deepseek-cli.py --coder "Write a binary search in TypeScript"
        """
    )
    
    parser.add_argument('prompt', nargs='?', help='The prompt to send to DeepSeek')
    parser.add_argument('-f', '--files', nargs='+', help='Files to include in context')
    parser.add_argument('--task', action='store_true', help='Mark as task (logs to team chat)')
    parser.add_argument('--coder', action='store_true', help='Use deepseek-coder model')
    parser.add_argument('--check-inbox', action='store_true', help='Check agent inbox for tasks')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    parser.add_argument('-s', '--system', help='Custom system prompt')
    
    args = parser.parse_args()
    
    # Check inbox mode
    if args.check_inbox:
        tasks = check_inbox()
        if args.json:
            print(json.dumps(tasks, indent=2))
        else:
            if tasks:
                print(f"📬 Found {len(tasks)} tasks in inbox:")
                for t in tasks:
                    print(f"  - {t['file']}: {t['task'].get('subject', 'No subject')}")
            else:
                print("📭 Inbox is empty")
        return
    
    # Require prompt for other modes
    if not args.prompt:
        parser.print_help()
        return
    
    # Select model
    model = "deepseek-coder" if args.coder else DEEPSEEK_MODEL
    
    # Log task start if flagged
    if args.task:
        log_to_team_chat(f"🚀 Starting task: {args.prompt[:50]}...", "task_start")
    
    print(f"🤖 DeepSeek ({model}) processing...\n")
    
    # Send to DeepSeek
    result = send_message(
        prompt=args.prompt,
        system_prompt=args.system,
        files=args.files,
        model=model
    )
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        if result["success"]:
            print("=" * 60)
            print(result["content"])
            print("=" * 60)
            print(f"\n📊 Tokens: {result['usage']['total_tokens']} (prompt: {result['usage']['prompt_tokens']}, completion: {result['usage']['completion_tokens']})")
            
            if args.task:
                log_to_team_chat(f"✅ Task completed: {args.prompt[:50]}...", "task_complete")
        else:
            print(f"❌ Error: {result['error']}")
            if args.task:
                log_to_team_chat(f"❌ Task failed: {result['error']}", "error")

if __name__ == "__main__":
    main()
