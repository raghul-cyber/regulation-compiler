from typing import TypeVar, Generic, Type, Any, Optional
from sqlalchemy.orm import Session

ModelType = TypeVar("ModelType")

class BaseService(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get_by_id(self, db: Session, id: Any, org_id: str) -> Optional[ModelType]:
        """
        Retrieves a single record by its ID, explicitly filtering by org_id.
        This provides the first layer of tenant isolation before RLS is applied.
        """
        return db.query(self.model).filter(
            self.model.id == id,
            self.model.org_id == org_id
        ).first()

    def get_all(self, db: Session, org_id: str):
        """
        Retrieves all records for the tenant, explicitly filtering by org_id.
        This provides the first layer of tenant isolation before RLS is applied.
        """
        return db.query(self.model).filter(
            self.model.org_id == org_id
        ).all()
