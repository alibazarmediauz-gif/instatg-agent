"""add_hashed_password_to_tenants

Revision ID: 1a2b3c4d5e6f
Revises: 04fa4cfd1e8c
Create Date: 2026-03-07 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import app.models

# revision identifiers, used by Alembic.
revision: str = '1a2b3c4d5e6f'
down_revision: Union[str, None] = '04fa4cfd1e8c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('tenants', sa.Column('hashed_password', sa.String(length=255), nullable=True))

def downgrade() -> None:
    op.drop_column('tenants', 'hashed_password')
