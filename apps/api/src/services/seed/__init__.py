"""Demo data seeder.

Fills a fresh `demo` organization with believable courses, people, community
activity, payments, notifications and analytics so the platform can be demoed
as if it had been running for months.
"""

from src.services.seed.runner import SeedError, run_demo_seed

__all__ = ["SeedError", "run_demo_seed"]
