"""
Real OpenAGI integration module
"""
import os
import json
import requests
from typing import Dict, List, Any, Optional, Union
from logging_config import logger


class OpenAGI:
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the OpenAGI framework with the provided configuration.

        Args:
            config: A dictionary containing the OpenAGI configuration
        """
        self.config = config
        self.llm_config = config.get("llm", {})
        self.agent_config = config.get("agent", {})
        self.tools_config = config.get("tools", [])

        # Initialize LLM client based on the type
        self.llm_client = self._initialize_llm_client()

        # Initialize tools
        self.tools = self._initialize_tools()

        logger.info(f"OpenAGI initialized with agent type: {self.agent_config.get('type')}")

    def _initialize_llm_client(self):
        """Initialize the appropriate LLM client based on configuration"""
        llm_type = self.llm_config.get("type", "")

        if "openai" in llm_type:
            from openai import OpenAI
            api_key = self.llm_config.get("api_key") or os.environ.get("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OpenAI API key is required")

            return OpenAI(api_key=api_key)

        elif "anthropic" in llm_type:
            from anthropic import Anthropic
            api_key = self.llm_config.get("api_key") or os.environ.get("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("Anthropic API key is required")

            return Anthropic(api_key=api_key)

        elif "huggingface" in llm_type or "hf-" in llm_type:
            from huggingface_hub import InferenceClient
            api_key = self.llm_config.get("api_key") or os.environ.get("HF_API_KEY")
            if not api_key:
                raise ValueError("Hugging Face API key is required")

            return InferenceClient(token=api_key)

        else:
            raise ValueError(f"Unsupported LLM type: {llm_type}")

    def _initialize_tools(self):
        """Initialize tools based on configuration"""
        tools = []

        for tool_config in self.tools_config:
            tool_type = tool_config.get("type", "")

            if "duckduckgo" in tool_type:
                from tools.search import DuckDuckGoSearch
                tools.append(DuckDuckGoSearch(tool_config))

            elif "weather" in tool_type:
                from tools.weather import WeatherAPI
                tools.append(WeatherAPI(tool_config))

            elif "github" in tool_type:
                from tools.github import GitHubTool
                tools.append(GitHubTool(tool_config))

            elif "gmail" in tool_type:
                from tools.gmail import GmailTool
                tools.append(GmailTool(tool_config))

        return tools

    def process(self, input_text: str, history: Optional[List[Dict[str, str]]] = None) -> str:
        """
        Process the input through the OpenAGI framework.

        Args:
            input_text: The user input to process
            history: Optional conversation history

        Returns:
            The response from the OpenAGI framework
        """
        # Convert history to the format expected by the LLM
        formatted_history = self._format_history(history or [])

        # Get agent type
        agent_type = self.agent_config.get("type", "conversational-agent")

        # Process based on agent type
        if agent_type == "conversational-agent":
            return self._process_conversational(input_text, formatted_history)
        elif agent_type == "research-agent":
            return self._process_research(input_text, formatted_history)
        elif agent_type == "coding-agent":
            return self._process_coding(input_text, formatted_history)
        else:
            return self._process_generic(input_text, formatted_history)

    def _format_history(self, history: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Format conversation history for the LLM"""
        formatted_history = []

        for message in history:
            role = message.get("role", "user")
            content = message.get("content", "")

            if role in ["user", "assistant", "system"]:
                formatted_history.append({"role": role, "content": content})

        return formatted_history

    def _process_conversational(self, input_text: str, history: List[Dict[str, str]]) -> str:
        """Process input with a conversational agent"""
        llm_type = self.llm_config.get("type", "")

        # Create system message
        system_prompt = self.agent_config.get("system_prompt", "You are a helpful assistant.")

        if "openai" in llm_type:
            messages = [{"role": "system", "content": system_prompt}]
            messages.extend(history)
            messages.append({"role": "user", "content": input_text})

            response = self.llm_client.chat.completions.create(
                model=self.llm_config.get("model", "gpt-4"),
                messages=messages,
                temperature=self.llm_config.get("temperature", 0.7),
                max_tokens=self.llm_config.get("max_tokens", 1000)
            )

            return response.choices[0].message.content

        elif "anthropic" in llm_type:
            # Format messages for Anthropic
            formatted_messages = []
            for msg in history:
                if msg["role"] == "user":
                    formatted_messages.append({"role": "user", "content": msg["content"]})
                elif msg["role"] == "assistant":
                    formatted_messages.append({"role": "assistant", "content": msg["content"]})

            formatted_messages.append({"role": "user", "content": input_text})

            response = self.llm_client.messages.create(
                model=self.llm_config.get("model", "claude-3-opus-20240229"),
                system=system_prompt,
                messages=formatted_messages,
                temperature=self.llm_config.get("temperature", 0.7),
                max_tokens=self.llm_config.get("max_tokens", 1000)
            )

            return response.content[0].text

        elif "huggingface" in llm_type or "hf-" in llm_type:
            # Format for Hugging Face
            model_id = self.llm_config.get("model_id", "meta-llama/Llama-3-8b-chat-hf")

            # Construct prompt
            prompt = f"{system_prompt}\n\n"
            for msg in history:
                if msg["role"] == "user":
                    prompt += f"User: {msg['content']}\n"
                elif msg["role"] == "assistant":
                    prompt += f"Assistant: {msg['content']}\n"

            prompt += f"User: {input_text}\nAssistant: "

            response = self.llm_client.text_generation(
                prompt=prompt,
                model=model_id,
                temperature=self.llm_config.get("temperature", 0.7),
                max_new_tokens=self.llm_config.get("max_tokens", 1000)
            )

            return response

        else:
            raise ValueError(f"Unsupported LLM type: {llm_type}")

    def _process_research(self, input_text: str, history: List[Dict[str, str]]) -> str:
        """Process input with a research agent"""
        # First, use search tools to gather information
        search_results = []
        for tool in self.tools:
            if hasattr(tool, 'search'):
                results = tool.search(input_text)
                search_results.extend(results)

        # Limit to top 5 results
        search_results = search_results[:5]

        # Format search results
        search_context = "Search results:\n"
        for i, result in enumerate(search_results, 1):
            search_context += f"{i}. {result.get('title', 'No title')}: {result.get('snippet', 'No snippet')}\n"

        # Create a prompt with search results
        research_prompt = f"""You are a research assistant. Use the following search results to answer the user's question.

{search_context}

User's question: {input_text}

Provide a comprehensive answer based on the search results. If the search results don't contain enough information, say so and provide the best answer you can."""

        # Process with LLM
        return self._process_conversational(research_prompt, [])

    def _process_coding(self, input_text: str, history: List[Dict[str, str]]) -> str:
        """Process input with a coding agent"""
        coding_prompt = f"""You are a coding assistant. The user is asking for help with code. 

User's request: {input_text}

Provide a detailed response with code examples where appropriate. Make sure your code is correct, efficient, and follows best practices."""

        # Process with LLM
        return self._process_conversational(coding_prompt, history)

    def _process_generic(self, input_text: str, history: List[Dict[str, str]]) -> str:
        """Process input with a generic agent"""
        # Use tools if available
        tool_results = []
        for tool in self.tools:
            if hasattr(tool, 'process'):
                try:
                    result = tool.process(input_text)
                    if result:
                        tool_results.append(result)
                except Exception as e:
                    logger.error(f"Error using tool {tool.__class__.__name__}: {str(e)}")

        # Format tool results
        tool_context = ""
        if tool_results:
            tool_context = "Tool results:\n" + "\n".join(tool_results) + "\n\n"

        # Create a prompt with tool results
        generic_prompt = f"""{tool_context}User's request: {input_text}

Provide a helpful response based on the available information."""

        # Process with LLM
        return self._process_conversational(generic_prompt, history)

