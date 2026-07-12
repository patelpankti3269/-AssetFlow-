from sqlalchemy import Column, Integer, String
from database import Base

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    tag = Column(String, index=True)
    name = Column(String, index=True)
    description = Column(String, index=True, nullable=True)
    category = Column(String, index=True)
    type = Column(String, index=True, nullable=True)
    status = Column(String, index=True)
    location = Column(String, index=True, nullable=True)
    holder = Column(String, index=True, nullable=True)
    holderName = Column(String, index=True, nullable=True)
