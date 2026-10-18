"""Payment foundation and three-mode resource access

Adds the Free / Restricted / Paid access model to courses and podcasts, plus the
payment tables used by the Chargily integration:

  paymentconfig · paymentorder · resourceentitlement · paymentwebhookevent

Revision ID: p0a1y2m3e4n5
Revises: c1d2e3f4a5b6
Create Date: 2026-10-17 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'p0a1y2m3e4n5'
down_revision: Union[str, None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# PostgreSQL enum types store the Python enum *names* (uppercase).
ENUMS = {
    'accesstypeenum': ('PUBLIC', 'USERS_ONLY', 'PAID'),
    'paymentproviderenum': ('CHARGILY',),
    'paymentmodeenum': ('TEST', 'LIVE'),
    'paymentmethodenum': ('EDAHABIA', 'CIB', 'CHARGILY_APP'),
    'paymentorderstatusenum': (
        'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELED',
        'EXPIRED', 'REFUNDED', 'PARTIALLY_REFUNDED',
    ),
    'entitlementsourceenum': ('PURCHASE', 'MANUAL', 'USERGROUP', 'FREE'),
    'entitlementstatusenum': ('ACTIVE', 'REVOKED'),
    'webhookeventstatusenum': ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED'),
}


def upgrade() -> None:
    bind = op.get_bind()

    for name, values in ENUMS.items():
        postgresql.ENUM(*values, name=name).create(bind, checkfirst=True)

    access_type = postgresql.ENUM(*ENUMS['accesstypeenum'], name='accesstypeenum', create_type=False)

    # ── Access columns on course and podcast ────────────────────────────────
    for table in ('course', 'podcast'):
        op.add_column(table, sa.Column('access_type', access_type, nullable=False, server_default='PUBLIC'))
        op.add_column(table, sa.Column('price_amount', sa.Integer(), nullable=True))
        op.add_column(table, sa.Column('price_currency', sa.String(), nullable=False, server_default='DZD'))

    # Backfill: existing public rows are Free, the rest become Restricted.
    for table in ('course', 'podcast'):
        op.execute(f"UPDATE {table} SET access_type = 'USERS_ONLY' WHERE public = false")
        op.execute(f"UPDATE {table} SET access_type = 'PUBLIC' WHERE public = true")

    # ── paymentconfig ───────────────────────────────────────────────────────
    op.create_table(
        'paymentconfig',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('org_id', sa.Integer(), sa.ForeignKey('organization.id', ondelete='CASCADE'), nullable=False),
        sa.Column('provider', postgresql.ENUM(*ENUMS['paymentproviderenum'], name='paymentproviderenum', create_type=False), nullable=False, server_default='CHARGILY'),
        sa.Column('mode', postgresql.ENUM(*ENUMS['paymentmodeenum'], name='paymentmodeenum', create_type=False), nullable=False, server_default='TEST'),
        sa.Column('public_key', sa.String(), nullable=True),
        sa.Column('secret_key_encrypted', sa.String(), nullable=True),
        sa.Column('webhook_secret_encrypted', sa.String(), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('creation_date', sa.String(), nullable=False, server_default=''),
        sa.Column('update_date', sa.String(), nullable=False, server_default=''),
        sa.UniqueConstraint('org_id', 'provider', name='uq_paymentconfig_org_provider'),
    )
    op.create_index('ix_paymentconfig_org_id', 'paymentconfig', ['org_id'])

    # ── paymentorder ────────────────────────────────────────────────────────
    op.create_table(
        'paymentorder',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('order_uuid', sa.String(), nullable=False),
        sa.Column('org_id', sa.Integer(), sa.ForeignKey('organization.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id', ondelete='CASCADE'), nullable=False),
        sa.Column('resource_uuid', sa.String(), nullable=False),
        sa.Column('resource_type', sa.String(), nullable=False, server_default='course'),
        sa.Column('resource_name', sa.String(), nullable=True),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(), nullable=False, server_default='DZD'),
        sa.Column('price_snapshot', postgresql.JSONB(), nullable=True),
        sa.Column('payment_method', postgresql.ENUM(*ENUMS['paymentmethodenum'], name='paymentmethodenum', create_type=False), nullable=True),
        sa.Column('status', postgresql.ENUM(*ENUMS['paymentorderstatusenum'], name='paymentorderstatusenum', create_type=False), nullable=False, server_default='PENDING'),
        sa.Column('chargily_checkout_id', sa.String(), nullable=True),
        sa.Column('chargily_payment_id', sa.String(), nullable=True),
        sa.Column('checkout_url', sa.String(), nullable=True),
        sa.Column('idempotency_key', sa.String(), nullable=True),
        sa.Column('customer_name', sa.String(), nullable=True),
        sa.Column('customer_email', sa.String(), nullable=True),
        sa.Column('customer_phone', sa.String(), nullable=True),
        sa.Column('fees', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('fees_on_merchant', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('failure_code', sa.String(), nullable=True),
        sa.Column('failure_message', sa.String(), nullable=True),
        sa.Column('provider_payload', postgresql.JSONB(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('creation_date', sa.String(), nullable=False, server_default=''),
        sa.Column('update_date', sa.String(), nullable=False, server_default=''),
    )
    op.create_index('ix_paymentorder_order_uuid', 'paymentorder', ['order_uuid'], unique=True)
    op.create_index('ix_paymentorder_org_id', 'paymentorder', ['org_id'])
    op.create_index('ix_paymentorder_user_id', 'paymentorder', ['user_id'])
    op.create_index('ix_paymentorder_resource_uuid', 'paymentorder', ['resource_uuid'])
    op.create_index('ix_paymentorder_status', 'paymentorder', ['status'])
    op.create_index('ix_paymentorder_chargily_checkout_id', 'paymentorder', ['chargily_checkout_id'], unique=True)
    op.create_index('ix_paymentorder_idempotency_key', 'paymentorder', ['idempotency_key'], unique=True)
    op.create_index('ix_paymentorder_status_created', 'paymentorder', ['status', 'creation_date'])
    op.create_index('ix_paymentorder_org_created', 'paymentorder', ['org_id', 'creation_date'])

    # ── resourceentitlement ─────────────────────────────────────────────────
    op.create_table(
        'resourceentitlement',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('org_id', sa.Integer(), sa.ForeignKey('organization.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id', ondelete='CASCADE'), nullable=False),
        sa.Column('resource_uuid', sa.String(), nullable=False),
        sa.Column('resource_type', sa.String(), nullable=False, server_default='course'),
        sa.Column('source', postgresql.ENUM(*ENUMS['entitlementsourceenum'], name='entitlementsourceenum', create_type=False), nullable=False, server_default='PURCHASE'),
        sa.Column('order_id', sa.Integer(), sa.ForeignKey('paymentorder.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', postgresql.ENUM(*ENUMS['entitlementstatusenum'], name='entitlementstatusenum', create_type=False), nullable=False, server_default='ACTIVE'),
        sa.Column('valid_from', sa.DateTime(), nullable=True),
        sa.Column('valid_until', sa.DateTime(), nullable=True),
        sa.Column('granted_by', sa.Integer(), sa.ForeignKey('user.id', ondelete='SET NULL'), nullable=True),
        sa.Column('granted_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
        sa.Column('revoke_reason', sa.String(), nullable=True),
    )
    op.create_index('ix_resourceentitlement_org_id', 'resourceentitlement', ['org_id'])
    op.create_index('ix_resourceentitlement_user_id', 'resourceentitlement', ['user_id'])
    op.create_index('ix_resourceentitlement_resource_uuid', 'resourceentitlement', ['resource_uuid'])
    op.create_index('ix_resourceentitlement_status', 'resourceentitlement', ['status'])
    op.create_index('ix_resourceentitlement_user_resource_status', 'resourceentitlement', ['user_id', 'resource_uuid', 'status'])
    op.create_index('ix_resourceentitlement_resource_status', 'resourceentitlement', ['resource_uuid', 'status'])
    # One active entitlement per user/resource; revoked rows stay for the audit trail.
    op.create_index(
        'uq_resourceentitlement_active_user_resource',
        'resourceentitlement',
        ['user_id', 'resource_uuid'],
        unique=True,
        postgresql_where=sa.text("status = 'ACTIVE'"),
    )

    # ── paymentwebhookevent ─────────────────────────────────────────────────
    op.create_table(
        'paymentwebhookevent',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('event_id', sa.String(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False, server_default=''),
        sa.Column('status', postgresql.ENUM(*ENUMS['webhookeventstatusenum'], name='webhookeventstatusenum', create_type=False), nullable=False, server_default='RECEIVED'),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('raw_payload', postgresql.JSONB(), nullable=True),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.Column('received_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_paymentwebhookevent_event_id', 'paymentwebhookevent', ['event_id'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_paymentwebhookevent_event_id', table_name='paymentwebhookevent')
    op.drop_table('paymentwebhookevent')

    op.drop_index('uq_resourceentitlement_active_user_resource', table_name='resourceentitlement')
    op.drop_index('ix_resourceentitlement_resource_status', table_name='resourceentitlement')
    op.drop_index('ix_resourceentitlement_user_resource_status', table_name='resourceentitlement')
    op.drop_index('ix_resourceentitlement_status', table_name='resourceentitlement')
    op.drop_index('ix_resourceentitlement_resource_uuid', table_name='resourceentitlement')
    op.drop_index('ix_resourceentitlement_user_id', table_name='resourceentitlement')
    op.drop_index('ix_resourceentitlement_org_id', table_name='resourceentitlement')
    op.drop_table('resourceentitlement')

    for index in (
        'ix_paymentorder_org_created', 'ix_paymentorder_status_created',
        'ix_paymentorder_idempotency_key', 'ix_paymentorder_chargily_checkout_id',
        'ix_paymentorder_status', 'ix_paymentorder_resource_uuid',
        'ix_paymentorder_user_id', 'ix_paymentorder_org_id',
        'ix_paymentorder_order_uuid',
    ):
        op.drop_index(index, table_name='paymentorder')
    op.drop_table('paymentorder')

    op.drop_index('ix_paymentconfig_org_id', table_name='paymentconfig')
    op.drop_table('paymentconfig')

    for table in ('course', 'podcast'):
        op.drop_column(table, 'price_currency')
        op.drop_column(table, 'price_amount')
        op.drop_column(table, 'access_type')

    bind = op.get_bind()
    for name in ENUMS:
        postgresql.ENUM(name=name).drop(bind, checkfirst=True)
