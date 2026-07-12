from pydantic import BaseModel
from typing import Optional

class AssetBase(BaseModel):
    tag: str
    name: str
    category: str
    description: Optional[str] = None
    type: Optional[str] = None
    status: str = "available"
    location: Optional[str] = None
    holder: Optional[str] = None
    holderName: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    tag: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    holder: Optional[str] = None
    holderName: Optional[str] = None

class Asset(AssetBase):
    id: int

    class Config:
        from_attributes = True
