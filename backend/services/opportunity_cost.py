def calculate_opportunity_cost(amount: float, annual_rate: float, years: int) -> dict:
    """
    Compound interest: FV = PV * (1 + r)^n
    Shows what a purchase amount could become if invested instead.
    """
    rate = annual_rate / 100.0
    projected = amount * ((1 + rate) ** years)

    return {
        "amount": round(amount, 2),
        "projected_value": round(projected, 2),
        "years": years,
        "message": (
            f"This ${amount:,.0f} could become ${projected:,.0f} "
            f"in your investment portfolio over {years} years. "
            f"Still proceed?"
        ),
    }
