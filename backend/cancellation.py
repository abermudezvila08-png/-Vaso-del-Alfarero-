"""Cancellation policy engine.

The reservation countdown starts exactly 24 hours before the reservation
datetime.  Before that window the customer gets a full refund.  Once inside
the 24-hour window the penalty tiers are:

    24 → 20 h before  ➜  10 % penalty
    19 → 12 h before  ➜  20 % penalty
    11 →  0 h before  ➜  45 % penalty

After the reservation time, cancellation is no longer possible online.
Only an admin can cancel within the last 24 hours (in person / by phone).
"""

from datetime import datetime, timedelta

from backend.schemas import CancelInfo


def calculate_cancellation(
    reservation_datetime: datetime,
    now: datetime,
    paid_amount: float,
) -> CancelInfo:
    hours_remaining = (reservation_datetime - now).total_seconds() / 3600

    if hours_remaining <= 0:
        return CancelInfo(
            hours_remaining=0,
            penalty_percentage=100,
            refund_percentage=0,
            refund_amount=0,
            penalty_amount=paid_amount,
            can_cancel_online=False,
            message="La reservación ya ha pasado. No se puede cancelar.",
        )

    if hours_remaining > 24:
        return CancelInfo(
            hours_remaining=round(hours_remaining, 1),
            penalty_percentage=0,
            refund_percentage=100,
            refund_amount=paid_amount,
            penalty_amount=0,
            can_cancel_online=True,
            message="Cancelación con reembolso completo del 100%.",
        )

    if hours_remaining > 20:
        pct = 10
    elif hours_remaining > 12:
        pct = 20
    else:
        pct = 45

    penalty_amount = round(paid_amount * pct / 100, 2)
    refund_amount = round(paid_amount - penalty_amount, 2)

    can_cancel_online = hours_remaining > 24

    return CancelInfo(
        hours_remaining=round(hours_remaining, 1),
        penalty_percentage=pct,
        refund_percentage=100 - pct,
        refund_amount=refund_amount,
        penalty_amount=penalty_amount,
        can_cancel_online=can_cancel_online,
        message=(
            f"Penalización del {pct}%. "
            f"Reembolso: ${refund_amount:.2f} de ${paid_amount:.2f}. "
            "Solo el administrador puede procesar esta cancelación."
        ),
    )
