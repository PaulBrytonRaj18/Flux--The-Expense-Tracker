from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    icon = Column(String, nullable=False, default="\U0001F4E6")
    color = Column(String, nullable=False, default="#00e5ff")
    budget_limit = Column(Float, nullable=False, default=0.0)

    expenses = relationship("Expense", back_populates="category")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    description = Column(String, nullable=False, default="")
    date = Column(DateTime, nullable=False, default=datetime.utcnow)
    satisfaction_score = Column(Integer, nullable=False, default=3)
    is_recurring = Column(Boolean, nullable=False, default=False)
    recurring_id = Column(String, nullable=True)

    category = relationship("Category", back_populates="expenses")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, nullable=False, default=0.0)
    deadline = Column(String, nullable=True)
    icon = Column(String, nullable=False, default="\U0001F3AF")


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    balance = Column(Float, nullable=False, default=5000.0)
    committed_bills = Column(Float, nullable=False, default=1200.0)
    goal_savings = Column(Float, nullable=False, default=500.0)
    privacy_mode = Column(Boolean, nullable=False, default=False)
    investment_rate = Column(Float, nullable=False, default=7.0)
    user_age = Column(Integer, nullable=False, default=28)
    retirement_age = Column(Integer, nullable=False, default=60)
