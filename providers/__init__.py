from providers.openai_provider import OpenAIProvider
from providers.openrouter_provider import OpenRouterProvider


def make_provider(name: str):
    if name == "openai":
        return OpenAIProvider()
    if name == "openrouter":
        return OpenRouterProvider()
    raise ValueError(f"Unknown provider: {name}")
