from enum import unique, StrEnum
from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import mapped_column, relationship, declarative_base, Mapped
from sqlalchemy import ForeignKey, DateTime, Boolean, ARRAY, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

Base = declarative_base()

@unique
class ManipulativeTechniques(StrEnum):
    PERSUASION_OR_SEDUCTION = "Persuasion or Seduction"
    SHAMING_OR_BELITTLEMENT = "Shaming or Belittlement"
    RATIONALIZATION = "Rationalization"
    ACCUSATION = "Accusation"
    INTIMIDATION = "Intimidation"
    PLAYING_VICTIM_ROLE = "Playing Victim Role"
    PLAYING_SERVANT_ROLE = "Playing Servant Role"
    EVASION = "Evasion"
    BRANDISHING_ANGER = "Brandishing Anger"
    DENIAL = "Denial"
    FEIGNING_INNOCENCE = "Feigning Innocence"


@unique
class Vulnerabilities(StrEnum):
    DEPENDENCY = "Dependency"
    NAIVETE = "Naivete"
    LOW_SELF_ESTEEM = "Low self-esteem"
    OVER_RESPONSIBILITY = "Over-responsibility"
    OVER_INTELLECTUALIZATION = "Over-intellectualization"


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[UUID] = mapped_column(PGUUID, primary_key=True, index=True)
    user_email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    user_name: Mapped[str] = mapped_column(String, nullable=False)
    user_password: Mapped[str] = mapped_column(String, nullable=False)
    
    # Relationships
    sent_messages = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")


class Message(Base):
    __tablename__ = "messages"

    # Base Entry
    message_id: Mapped[UUID] = mapped_column(PGUUID, primary_key=True, index=True)
    sender_id: Mapped[UUID] = mapped_column(PGUUID, ForeignKey("users.user_id"), index=True)
    receiver_id: Mapped[UUID] = mapped_column(PGUUID, ForeignKey("users.user_id"), index=True)
    content: Mapped[str] = mapped_column(String, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(tz=timezone.utc))

    # AI detection
    is_manipulative: Mapped[bool] = mapped_column(Boolean, default=False)
    techniques: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    vulnerabilities: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    
    # Relationships
    sender = relationship("User", back_populates="sent_messages", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])