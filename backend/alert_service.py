"""ntfy-based push alert service for GridSense."""

from __future__ import annotations

import httpx


class AlertService:
    """Send GridSense notifications through ntfy.sh."""

    BASE_URL = "https://ntfy.sh"
    TITLE_PREFIX = "GridSense -"

    async def _publish(
        self,
        topic: str,
        title: str,
        tags: str,
        body: str,
        priority: str = "default",
    ) -> bool:
        """Publish a message to an ntfy topic."""
        headers = {
            "Title": title,
            "Priority": priority,
            "Tags": tags,
            "Markdown": "yes",
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/{topic}",
                    content=body,
                    headers=headers,
                    timeout=10.0,
                )
        except Exception:
            return False

        return response.is_success

    async def send_alert(
        self,
        topic: str,
        city: str,
        grid_stress: float,
        clean_power_score: float,
        best_window: str,
    ) -> bool:
        """Send a live grid alert."""
        priority = "high" if grid_stress > 85 else "default"
        tags = "warning" if grid_stress > 85 else "electric_plug"
        body = (
            f"Grid stress in {city} just hit {round(grid_stress)}%.\n"
            f"Current carbon score: {round(clean_power_score)}/100.\n"
            f"Best window to run appliances: {best_window}.\n"
            "[tap to open GridSense]"
        )
        return await self._publish(
            topic=topic,
            title=f"{self.TITLE_PREFIX} {city} Grid Alert",
            tags=tags,
            body=body,
            priority=priority,
        )

    async def send_welcome(self, topic: str, city: str) -> bool:
        """Send the initial subscription confirmation message."""
        body = (
            f"You're now watching the {city} grid.\n"
            "We'll alert you when stress exceeds 70%."
        )
        return await self._publish(
            topic=topic,
            title=f"{self.TITLE_PREFIX} {city} Grid Alert",
            tags="electric_plug",
            body=body,
            priority="default",
        )

    async def send_test(self, topic: str, city: str) -> bool:
        """Send a fixed-value test alert."""
        body = (
            f"[TEST] Grid stress in {city} just hit 72%.\n"
            "Current carbon score: 80/100.\n"
            "Best window to run appliances: 2 am - 4 am.\n"
            "[tap to open GridSense]"
        )
        return await self._publish(
            topic=topic,
            title=f"{self.TITLE_PREFIX} {city} Grid Alert",
            tags="white_check_mark",
            body=body,
            priority="default",
        )
