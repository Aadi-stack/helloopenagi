import json
import asyncio
from typing import Tuple, List, Dict, Any
from sqlalchemy.orm import Session
from backend.models import models


async def process_message(message: str, stack_config: List[Dict[str, Any]], session_id: str, db: Session) -> Tuple[
    str, str]:
    """
    Process a user message using the stack configuration.

    Args:
        message: The user's message
        stack_config: The stack configuration (nodes)
        session_id: The chat session ID
        db: Database session

    Returns:
        Tuple of (response_content, thinking_process)
    """
    # Extract LLM and agent nodes from stack configuration
    llm_nodes = [node for node in stack_config if node.get('type') == 'llmNode']
    agent_nodes = [node for node in stack_config if node.get('type') == 'agentNode']
    tool_nodes = [node for node in stack_config if node.get('type') == 'toolNode']

    # Get previous messages for context
    previous_messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.session_id == session_id
    ).order_by(models.ChatMessage.created_at).all()

    # Format messages for LLM context
    context = []
    for msg in previous_messages:
        context.append({"role": msg.role, "content": msg.content})

    # Add current message
    context.append({"role": "user", "content": message})

    # Thinking process to return for debugging
    thinking = "Processing message with stack configuration:\n"
    thinking += f"- Found {len(llm_nodes)} LLM nodes\n"
    thinking += f"- Found {len(agent_nodes)} agent nodes\n"
    thinking += f"- Found {len(tool_nodes)} tool nodes\n\n"

    # If we have no LLM or agent nodes, return an error
    if not llm_nodes and not agent_nodes:
        return "I don't have any LLMs or agents configured. Please add at least one LLM and one agent to your stack.", thinking

    # Use the first LLM node for processing
    llm = llm_nodes[0] if llm_nodes else None

    # Use the first agent node for role and instructions
    agent = agent_nodes[0] if agent_nodes else None

    # Process with tools if available
    tools_output = ""
    if tool_nodes:
        thinking += "Processing with tools:\n"
        for tool in tool_nodes:
            tool_type = tool.get('data', {}).get('tool_type', 'unknown')
            thinking += f"- Using {tool_type} tool\n"

            # Simulate tool processing
            if tool_type == 'search' or tool_type == 'duckduckgo':
                if message.lower().find('stock') >= 0 or message.lower().find('coca cola') >= 0 or message.lower().find(
                        'pepsi') >= 0:
                    tools_output += "Search results for stocks:\n"
                    tools_output += "- Coca-Cola (KO): $60.43 (+0.5%)\n"
                    tools_output += "- PepsiCo (PEP): $172.98 (-0.2%)\n"
                    tools_output += "- 5-year performance: KO +15%, PEP +25%\n"

    # Simulate LLM processing
    thinking += "\nGenerating response using "
    if llm:
        llm_provider = llm.get('data', {}).get('provider', 'unknown')
        llm_model = llm.get('data', {}).get('model', 'unknown')
        thinking += f"{llm_provider} {llm_model}\n"
    else:
        thinking += "default LLM\n"

    # Generate response based on agent role and tools output
    response = ""

    if agent:
        agent_role = agent.get('data', {}).get('role', '')
        agent_goal = agent.get('data', {}).get('goal', '')
        thinking += f"Using agent role: {agent_role}\n"
        thinking += f"Agent goal: {agent_goal}\n"

        if agent_role:
            response += f"As a {agent_role}, "

    # Generate response based on the message content
    if message.lower().find('stock') >= 0 or message.lower().find('coca cola') >= 0 or message.lower().find(
            'pepsi') >= 0:
        response = """1. Coca-Cola (KO): Coca-Cola's stock has steadily grown over the past 5 years, thanks to diversification into non-soda beverages. The pandemic caused a temporary dip in its stock price, but it has since rebounded. Its consistent dividend payouts make it appealing to long-term investors.

2. PepsiCo (PEP): PepsiCo's stock has shown stable growth, thanks to its diversified portfolio, including food and beverages, which shields it from market volatility. The company's resilience during the pandemic led to a strong recovery, and steady dividends have attracted income-focused investors.

In conclusion, both companies have demonstrated resilience and steady growth over the past 5 years, appealing to growth and income-focused investors."""
    else:
        response = f"""I've processed your request: "{message}"

Here's what I found:
- The topic appears to be about {message.split(" ")[-3:]}
- There are several perspectives to consider
- Based on available information, the most relevant answer would address the core question

Would you like me to elaborate on any specific part of this response?"""

    # Simulate processing delay
    await asyncio.sleep(1)

    return response, thinking

