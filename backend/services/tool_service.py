import os
import json
import httpx
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()


class ToolService:
    """Service for interacting with various tools"""

    @staticmethod
    async def search_duckduckgo(query: str, max_results: int = 5) -> List[Dict[str, str]]:
        """
        Search the web using DuckDuckGo

        Args:
            query: The search query
            max_results: Maximum number of results to return

        Returns:
            List of search results with title, link, and snippet
        """
        # DuckDuckGo doesn't have an official API, so we'll use a third-party API
        url = f"https://api.duckduckgo.com/?q={query}&format=json&pretty=1"

        async with httpx.AsyncClient() as client:
            response = await client.get(url)

            if response.status_code != 200:
                raise Exception(f"Error from DuckDuckGo API: {response.text}")

            result = response.json()

            # Extract and format results
            formatted_results = []

            # Add abstract if available
            if result.get("Abstract"):
                formatted_results.append({
                    "title": result.get("Heading", "Abstract"),
                    "link": result.get("AbstractURL", ""),
                    "snippet": result.get("Abstract", "")
                })

            # Add related topics
            for topic in result.get("RelatedTopics", [])[:max_results - len(formatted_results)]:
                if "Text" in topic and "FirstURL" in topic:
                    formatted_results.append({
                        "title": topic.get("Text", "").split(" - ")[0],
                        "link": topic.get("FirstURL", ""),
                        "snippet": topic.get("Text", "")
                    })

            return formatted_results

    @staticmethod
    async def github_search(query: str, token: Optional[str] = None, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Search GitHub repositories

        Args:
            query: The search query
            token: GitHub personal access token
            max_results: Maximum number of results to return

        Returns:
            List of repository information
        """
        token = token or os.getenv("GITHUB_TOKEN")

        headers = {}
        if token:
            headers["Authorization"] = f"token {token}"

        url = f"https://api.github.com/search/repositories?q={query}&sort=stars&order=desc&per_page={max_results}"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)

            if response.status_code != 200:
                raise Exception(f"Error from GitHub API: {response.text}")

            result = response.json()

            # Extract and format results
            formatted_results = []

            for repo in result.get("items", [])[:max_results]:
                formatted_results.append({
                    "name": repo.get("full_name", ""),
                    "description": repo.get("description", ""),
                    "url": repo.get("html_url", ""),
                    "stars": repo.get("stargazers_count", 0),
                    "language": repo.get("language", ""),
                    "updated_at": repo.get("updated_at", "")
                })

            return formatted_results

    @staticmethod
    async def weather_info(location: str, api_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Get weather information for a location

        Args:
            location: The location to get weather for
            api_key: OpenWeatherMap API key

        Returns:
            Weather information
        """
        api_key = api_key or os.getenv("OPENWEATHERMAP_API_KEY")

        if not api_key:
            raise ValueError("OpenWeatherMap API key is required")

        url = f"https://api.openweathermap.org/data/2.5/weather?q={location}&appid={api_key}&units=metric"

        async with httpx.AsyncClient() as client:
            response = await client.get(url)

            if response.status_code != 200:
                raise Exception(f"Error from OpenWeatherMap API: {response.text}")

            result = response.json()

            # Extract and format results
            weather = {
                "location": result.get("name", ""),
                "country": result.get("sys", {}).get("country", ""),
                "temperature": result.get("main", {}).get("temp", 0),
                "feels_like": result.get("main", {}).get("feels_like", 0),
                "humidity": result.get("main", {}).get("humidity", 0),
                "description": result.get("weather", [{}])[0].get("description", ""),
                "icon": result.get("weather", [{}])[0].get("icon", ""),
                "wind_speed": result.get("wind", {}).get("speed", 0),
                "timestamp": result.get("dt", 0)
            }

            return weather

