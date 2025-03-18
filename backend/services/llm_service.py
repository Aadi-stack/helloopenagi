import os
import json
import httpx
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()


class LLMService:
    """Service for interacting with various LLM providers"""

    @staticmethod
    async def generate_with_openai(
            prompt: str,
            messages: List[Dict[str, str]],
            model: str = "gpt-3.5-turbo",
            api_key: Optional[str] = None,
            api_base: Optional[str] = None,
            max_tokens: int = 1000,
            temperature: float = 0.7
    ) -> str:
        """
        Generate text using OpenAI API

        Args:
            prompt: The system prompt
            messages: List of message objects with role and content
            model: The model to use
            api_key: OpenAI API key (falls back to env var)
            api_base: OpenAI API base URL (falls back to default)
            max_tokens: Maximum tokens to generate
            temperature: Temperature for generation

        Returns:
            Generated text
        """
        api_key = api_key or os.getenv("OPENAI_API_KEY")
        api_base = api_base or "https://api.openai.com/v1"

        if not api_key:
            raise ValueError("OpenAI API key is required")

        # Prepare the messages
        formatted_messages = [{"role": "system", "content": prompt}]
        formatted_messages.extend(messages)

        # Prepare the request
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }

        payload = {
            "model": model,
            "messages": formatted_messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        # Make the request
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{api_base}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60.0
            )

            if response.status_code != 200:
                raise Exception(f"Error from OpenAI API: {response.text}")

            result = response.json()
            return result["choices"][0]["message"]["content"]

    @staticmethod
    async def generate_with_huggingface(
            prompt: str,
            messages: List[Dict[str, str]],
            model: str = "mistralai/Mistral-7B-Instruct-v0.2",
            api_key: Optional[str] = None,
            api_base: Optional[str] = None,
            max_tokens: int = 1000,
            temperature: float = 0.7
    ) -> str:
        """
        Generate text using Hugging Face Inference API

        Args:
            prompt: The system prompt
            messages: List of message objects with role and content
            model: The model to use
            api_key: Hugging Face API key (falls back to env var)
            api_base: Hugging Face API base URL (falls back to default)
            max_tokens: Maximum tokens to generate
            temperature: Temperature for generation

        Returns:
            Generated text
        """
        api_key = api_key or os.getenv("HUGGINGFACE_API_KEY")
        api_base = api_base or "https://api-inference.huggingface.co/models"

        if not api_key:
            raise ValueError("Hugging Face API key is required")

        # Format the prompt based on the model
        formatted_prompt = f"{prompt}\n\n"

        for message in messages:
            if message["role"] == "user":
                formatted_prompt += f"User: {message['content']}\n"
            elif message["role"] == "assistant":
                formatted_prompt += f"Assistant: {message['content']}\n"

        formatted_prompt += "Assistant: "

        # Prepare the request
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "inputs": formatted_prompt,
            "parameters": {
                "max_new_tokens": max_tokens,
                "temperature": temperature,
                "return_full_text": False
            }
        }

        # Make the request
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{api_base}/{model}",
                headers=headers,
                json=payload,
                timeout=60.0
            )

            if response.status_code != 200:
                raise Exception(f"Error from Hugging Face API: {response.text}")

            result = response.json()

            # Handle different response formats
            if isinstance(result, list) and len(result) > 0:
                if "generated_text" in result[0]:
                    return result[0]["generated_text"]
                return result[0]

            return result.get("generated_text", str(result))

    @staticmethod
    async def generate_with_anthropic(
            prompt: str,
            messages: List[Dict[str, str]],
            model: str = "claude-3-opus-20240229",
            api_key: Optional[str] = None,
            max_tokens: int = 1000,
            temperature: float = 0.7
    ) -> str:
        """
        Generate text using Anthropic API

        Args:
            prompt: The system prompt
            messages: List of message objects with role and content
            model: The model to use
            api_key: Anthropic API key (falls back to env var)
            max_tokens: Maximum tokens to generate
            temperature: Temperature for generation

        Returns:
            Generated text
        """
        api_key = api_key or os.getenv("ANTHROPIC_API_KEY")

        if not api_key:
            raise ValueError("Anthropic API key is required")

        # Format messages for Anthropic
        formatted_messages = []

        for message in messages:
            role = "user" if message["role"] == "user" else "assistant"
            formatted_messages.append({
                "role": role,
                "content": message["content"]
            })

        # Prepare the request
        headers = {
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01"
        }

        payload = {
            "model": model,
            "messages": formatted_messages,
            "system": prompt,
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        # Make the request
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=payload,
                timeout=60.0
            )

            if response.status_code != 200:
                raise Exception(f"Error from Anthropic API: {response.text}")

            result = response.json()
            return result["content"][0]["text"]

