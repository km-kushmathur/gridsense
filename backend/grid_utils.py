"""Grid metric normalization and labeling helpers."""

MOER_SCORE_MAX_LBS_PER_MWH = 1000.0
LOW_EMISSIONS_SCORE_THRESHOLD = 70.0
MODERATE_EMISSIONS_SCORE_THRESHOLD = 40.0

REGION_LABELS: dict[str, str] = {
    "CAISO_NORTH": "Northern California balancing region",
    "CAISO_SOUTH": "Southern California balancing region",
    "ERCOT": "Texas balancing region",
    "ISONE": "New England balancing region",
    "NYISO": "New York balancing region",
    "PJM_DC": "Mid-Atlantic balancing region",
    "PJM": "Mid-Atlantic balancing region",
    "SPP": "Central plains balancing region",
}

REGION_PREFIX_LABELS: dict[str, str] = {
    "CAISO": "California balancing region",
    "ERCOT": "Texas balancing region",
    "MISO": "Midcontinent balancing region",
    "PJM": "Mid-Atlantic balancing region",
    "SPP": "Central plains balancing region",
}


def clean_power_score_from_moer(moer: float) -> float:
    """Normalize MOER onto a 0-100 dashboard scale.

    The dashboard uses a simple clipped linear normalization over a
    0-1000 lbs CO2/MWh reference band:

        score = max(0, min(100, 100 * (1 - moer / 1000)))
    """
    score = 100.0 * (1.0 - (float(moer) / MOER_SCORE_MAX_LBS_PER_MWH))
    return round(max(0.0, min(100.0, score)), 1)


def emissions_band_from_score(score: float) -> str:
    """Return the dashboard status bucket for a normalized score."""
    if score >= LOW_EMISSIONS_SCORE_THRESHOLD:
        return "clean"
    if score >= MODERATE_EMISSIONS_SCORE_THRESHOLD:
        return "moderate"
    return "dirty"


def region_label_for(region: str) -> str:
    """Return a human-friendly label for a balancing region."""
    normalized = (region or "").strip().upper()
    if not normalized:
        return "Local balancing region"
    if normalized in REGION_LABELS:
        return REGION_LABELS[normalized]
    for prefix, label in REGION_PREFIX_LABELS.items():
        if normalized.startswith(prefix):
            return label
    return "Local balancing region"
