"""Shared runtime settings helpers for GridSense."""

import os


def env_flag(name: str, default: bool = False) -> bool:
    """Read a boolean environment flag."""
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def use_mock_data() -> bool:
    """Return whether local mock mode is enabled."""
    return env_flag("USE_MOCK_DATA", default=False)
