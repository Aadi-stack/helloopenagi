"""
Client library for interacting with the OpenAGI API.
This can be used in the Next.js frontend to communicate with the FastAPI backend.
"""

import requests
from typing import Dict, List, Any, Optional


class OpenAGIClient:
    def __init__(self, base_url: str = "http://localhost:3000", token: Optional[str] = None):
        """
        Initialize the OpenAGI client.

        Args:
            base_url: The base URL of the OpenAGI API
            token: Optional authentication token
        """
        self.base_url = base_url
        self.token = token
        self.headers = {"Content-Type": "application/json"}
        if token:
            self.headers["Authorization"] = f"Bearer {token}"

    def set_token(self, token: str):
        """
        Set the authentication token.

        Args:
            token: The authentication token
        """
        self.token = token
        self.headers["Authorization"] = f"Bearer {token}"

    def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Log in to the OpenAGI API.

        Args:
            email: The user's email
            password: The user's password

        Returns:
            The authentication token
        """
        response = requests.post(
            f"{self.base_url}/token",
            data={"username": email, "password": password},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        response.raise_for_status()
        data = response.json()
        self.set_token(data["access_token"])
        return data

    def register(self, name: str, email: str, password: str) -> Dict[str, Any]:
        """
        Register a new user.

        Args:
            name: The user's name
            email: The user's email
            password: The user's password

        Returns:
            The user data
        """
        response = requests.post(
            f"{self.base_url}/register",
            json={"name": name, "email": email, "password": password},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def get_user(self) -> Dict[str, Any]:
        """
        Get the current user's data.

        Returns:
            The user data
        """
        response = requests.get(
            f"{self.base_url}/users/me",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def create_stack(self, name: str, description: str, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> \
    Dict[str, Any]:
        """
        Create a new stack.

        Args:
            name: The stack name
            description: The stack description
            nodes: The stack nodes
            edges: The stack edges

        Returns:
            The created stack
        """
        response = requests.post(
            f"{self.base_url}/stacks",
            json={"name": name, "description": description, "nodes": nodes, "edges": edges},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def get_stacks(self) -> List[Dict[str, Any]]:
        """
        Get all stacks.

        Returns:
            The list of stacks
        """
        response = requests.get(
            f"{self.base_url}/stacks",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def get_stack(self, stack_id: str) -> Dict[str, Any]:
        """
        Get a stack by ID.

        Args:
            stack_id: The stack ID

        Returns:
            The stack
        """
        response = requests.get(
            f"{self.base_url}/stacks/{stack_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def update_stack(self, stack_id: str, **kwargs) -> Dict[str, Any]:
        """
        Update a stack.

        Args:
            stack_id: The stack ID
            **kwargs: The fields to update

        Returns:
            The updated stack
        """
        response = requests.put(
            f"{self.base_url}/stacks/{stack_id}",
            json=kwargs,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def delete_stack(self, stack_id: str) -> Dict[str, Any]:
        """
        Delete a stack.

        Args:
            stack_id: The stack ID

        Returns:
            The deletion status
        """
        response = requests.delete(
            f"{self.base_url}/stacks/{stack_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def chat(self, stack_id: str, message: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Send a chat message.

        Args:
            stack_id: The stack ID
            message: The message
            history: Optional conversation history

        Returns:
            The chat response
        """
        response = requests.post(
            f"{self.base_url}/chat",
            json={"stack_id": stack_id, "message": message, "history": history},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def search_duckduckgo(self, query: str, max_results: Optional[int] = None) -> Dict[str, Any]:
        """
        Search DuckDuckGo.

        Args:
            query: The search query
            max_results: Optional maximum number of results

        Returns:
            The search results
        """
        data = {"query": query}
        if max_results is not None:
            data["max_results"] = max_results

        response = requests.post(
            f"{self.base_url}/tools/duckduckgo",
            json=data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def get_weather(self, location: str, units: Optional[str] = None) -> Dict[str, Any]:
        """
        Get weather information.

        Args:
            location: The location
            units: Optional units (metric or imperial)

        Returns:
            The weather information
        """
        data = {"location": location}
        if units is not None:
            data["units"] = units

        response = requests.post(
            f"{self.base_url}/tools/weather",
            json=data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def process_openagi(self, config: Dict[str, Any], input_text: str) -> Dict[str, Any]:
        """
        Process an OpenAGI request.

        Args:
            config: The OpenAGI configuration
            input_text: The input text

        Returns:
            The OpenAGI response
        """
        response = requests.post(
            f"{self.base_url}/openagi",
            json={"config": config, "input": input_text},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

