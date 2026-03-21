"""Static demo site definitions for GridSense."""

from models import SiteAsset, SiteProfile, SiteZone


SITE_PROFILES: dict[str, SiteProfile] = {
    "uva_campus": SiteProfile(
        id="uva_campus",
        name="University of Virginia Campus",
        city="Charlottesville, VA",
        region_hint="PJM",
        timezone="America/New_York",
        lat=38.0356,
        lng=-78.5034,
        summary="Mixed academic, residential, and mobility loads with visible solar and EV flexibility.",
        weather_risks=["Extreme heat", "Thunderstorms", "Cold snaps", "Smoke transport"],
        assumptions=[
            "Residential HVAC dominates late-day peaks.",
            "EV charging clusters can be shifted overnight.",
            "Rooftop solar offsets daytime academic loads when skies are clear.",
        ],
        zones=[
            SiteZone(id="north_res", name="North Residences", kind="residential", x=22, y=26, capacity_kw=5400),
            SiteZone(id="central_core", name="Academic Core", kind="academic", x=49, y=44, capacity_kw=6900),
            SiteZone(id="south_mobility", name="South Mobility Hub", kind="mobility", x=73, y=72, capacity_kw=3100),
            SiteZone(id="energy_park", name="Energy Park", kind="energy", x=18, y=72, capacity_kw=2600),
            SiteZone(id="health_science", name="Health Science Block", kind="critical", x=78, y=28, capacity_kw=4200),
        ],
        assets=[
            SiteAsset(id="ev_deck", name="EV Charging Deck", type="ev_hub", zone_id="south_mobility", flexibility=86),
            SiteAsset(id="alderman_hall", name="Alderman Hall", type="residence_hall", zone_id="north_res", flexibility=48),
            SiteAsset(id="chem_lab", name="Chemistry Research Lab", type="lab", zone_id="central_core", flexibility=22),
            SiteAsset(id="solar_lawn", name="South Lawn Solar Canopy", type="solar_array", zone_id="energy_park", flexibility=68),
            SiteAsset(id="data_center", name="Edge Data Center", type="data_center", zone_id="health_science", flexibility=15),
        ],
    ),
    "downtown_microgrid": SiteProfile(
        id="downtown_microgrid",
        name="Charlottesville Downtown Microgrid",
        city="Charlottesville, VA",
        region_hint="PJM",
        timezone="America/New_York",
        lat=38.0293,
        lng=-78.4767,
        summary="Compact mixed-use district with retail, apartments, and battery-backed municipal loads.",
        weather_risks=["Heat", "Cold", "Flash storms"],
        assumptions=[
            "Retail cooling spikes in the afternoon.",
            "Apartments create morning and evening peaks.",
            "Battery-backed civic loads reduce critical-hour exposure.",
        ],
        zones=[
            SiteZone(id="retail", name="Retail Strip", kind="academic", x=25, y=40, capacity_kw=3400),
            SiteZone(id="apartments", name="Apartment Towers", kind="residential", x=60, y=30, capacity_kw=3900),
            SiteZone(id="civic", name="Civic Services", kind="critical", x=38, y=72, capacity_kw=2200),
            SiteZone(id="mobility", name="Transit + EV Node", kind="mobility", x=74, y=68, capacity_kw=1800),
        ],
        assets=[
            SiteAsset(id="garage_hub", name="Market Street Chargers", type="ev_hub", zone_id="mobility", flexibility=74),
            SiteAsset(id="elm_tower", name="Elm Street Towers", type="residence_hall", zone_id="apartments", flexibility=44),
            SiteAsset(id="town_hall_dc", name="Municipal Data Room", type="data_center", zone_id="civic", flexibility=12),
            SiteAsset(id="civic_solar", name="Civic Rooftop Solar", type="solar_array", zone_id="civic", flexibility=61),
        ],
    ),
}


def list_sites() -> list[SiteProfile]:
    """Return all demo sites."""
    return list(SITE_PROFILES.values())


def get_site(site_id: str) -> SiteProfile:
    """Resolve a demo site by id."""
    return SITE_PROFILES[site_id]
