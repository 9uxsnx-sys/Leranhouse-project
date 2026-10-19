from typing import Optional

from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint
from sqlmodel import Field, SQLModel


class PayoutCost(SQLModel, table=True):
    """Manually entered operating costs for one organization and month.

    Gateway fees are not stored here — they are summed from the paid orders of
    the month when the payout report is built.
    """

    __table_args__ = (
        UniqueConstraint("org_id", "month", name="uq_payoutcost_org_month"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    org_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("organization.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    month: str = Field(index=True)  # YYYY-MM
    hosting: int = Field(default=0)
    marketing: int = Field(default=0)
    other: int = Field(default=0)
    creation_date: str = ""
    update_date: str = ""
