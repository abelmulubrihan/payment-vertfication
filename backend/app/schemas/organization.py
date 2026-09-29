from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationResponse(OrganizationBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BranchBase(BaseModel):
    name: str
    code: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None

class BranchCreate(BranchBase):
    restaurant_id: Optional[str] = None

class BranchResponse(BranchBase):
    id: str
    restaurant_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RestaurantBase(BaseModel):
    name: str
    code: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class RestaurantCreate(RestaurantBase):
    organization_id: Optional[str] = None

class RestaurantResponse(RestaurantBase):
    id: str
    organization_id: str
    branches: List[BranchResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
