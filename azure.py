import os
import pathlib
import sys
from urllib.parse import urlparse


def ensure_repo_python() -> None:
    """Relaunch with the repo virtualenv if the current interpreter lacks openai."""
    in_virtualenv = getattr(sys, "base_prefix", sys.prefix) != sys.prefix
    try:
        import openai  # noqa: F401
        return
    except ModuleNotFoundError:
        repo_root = pathlib.Path(__file__).resolve().parent
        candidates = [
            repo_root / "venv" / "bin" / "python",
            repo_root / ".venv" / "bin" / "python",
            repo_root / "venv" / "Scripts" / "python.exe",
            repo_root / ".venv" / "Scripts" / "python.exe",
        ]
        for candidate in candidates:
            if candidate.exists() and not in_virtualenv:
                os.execv(str(candidate), [str(candidate), str(repo_root / "azure.py"), *sys.argv[1:]])
        raise


ensure_repo_python()

from openai import AzureOpenAI


AZURE_API_KEY = "INSERT KEY HERE"
AZURE_ENDPOINT = "INSERT ENDPOINT HERE"
AZURE_MODEL = "gpt-5.4-mini"
AZURE_API_VERSION = "2024-12-01-preview"
SUCCESS_PROMPT = "Say 'Azure connection successful' and nothing else."


def require_env(name: str, value: str) -> str:
    """Fail fast with a clear message when required config is missing."""
    if value.strip():
        return value.strip()
    raise ValueError(f"Missing required environment variable: {name}")


def normalize_endpoint(raw_endpoint: str) -> str:
    """Strip any path/query from the Azure endpoint and keep only the base resource URL."""
    parsed = urlparse(raw_endpoint.strip())
    if not parsed.scheme or not parsed.netloc:
        raise ValueError("AZURE_ENDPOINT must be a full URL like https://<resource>.cognitiveservices.azure.com/")
    return f"{parsed.scheme}://{parsed.netloc}/"


def test_azure() -> None:
    """Run a simple Azure OpenAI chat completion request."""
    endpoint = normalize_endpoint(require_env("AZURE_ENDPOINT", AZURE_ENDPOINT))
    api_key = require_env("AZURE_API_KEY", AZURE_API_KEY)
    model = require_env("AZURE_MODEL", AZURE_MODEL)

    client = AzureOpenAI(
        api_version=AZURE_API_VERSION,
        azure_endpoint=endpoint,
        api_key=api_key,
    )

    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": SUCCESS_PROMPT},
        ],
        max_completion_tokens=20,
        model=model,
    )

    message = response.choices[0].message.content
    usage = getattr(response, "usage", None)

    print(f"SUCCESS: {message}")
    print(f"Endpoint: {endpoint}")
    print(f"Model: {model}")
    if usage is not None:
        print(f"Tokens used: {usage.total_tokens}")


def main() -> int:
    """Run the Azure test and print concise output."""
    try:
        test_azure()
        return 0
    except Exception as exc:
        status_code = getattr(exc, "status_code", None)
        if status_code is not None:
            print(f"ERROR ({status_code}): {exc}")
        else:
            print(f"ERROR: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())