"""Shared runtime settings helpers for GridSense."""

import os
from urllib.parse import urlparse


def env_flag(name: str, default: bool = False) -> bool:
    """Read a boolean environment flag."""
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def use_mock_data() -> bool:
    """Return whether local mock mode is enabled."""
    return env_flag("USE_MOCK_DATA", default=False)


def env_first(*names: str, default: str = "") -> str:
    """Return the first configured environment variable from the provided names."""
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value
    return default


def azure_openai_base_url() -> str:
    """Return an OpenAI-compatible Azure base URL for the v1 API."""
    explicit_base_url = env_first("AZURE_OPENAI_BASE_URL", "OPENAI_BASE_URL")
    if explicit_base_url:
        return explicit_base_url.rstrip("/") + ("" if explicit_base_url.rstrip("/").endswith("/openai/v1") else "/openai/v1")

    endpoint = env_first("AZURE_OPENAI_ENDPOINT", "AZURE_AI_ENDPOINT")
    if not endpoint:
        return ""

    parsed = urlparse(endpoint)
    if not parsed.scheme or not parsed.netloc:
        return ""

    return f"{parsed.scheme}://{parsed.netloc}/openai/v1/"


def azure_openai_api_key() -> str:
    """Return the configured Azure OpenAI API key."""
    return env_first("AZURE_OPENAI_API_KEY", "AZURE_AI_KEY", "OPENAI_API_KEY")


def azure_openai_deployment() -> str:
    """Return the Azure deployment name used for nudge generation."""
    return env_first("AZURE_OPENAI_DEPLOYMENT", "AZURE_AI_MODEL", "OPENAI_MODEL", default="gpt-5.4-mini")


def azure_openai_configured() -> bool:
    """Return whether Azure OpenAI runtime settings are present."""
    return bool(azure_openai_base_url() and azure_openai_api_key() and azure_openai_deployment())
