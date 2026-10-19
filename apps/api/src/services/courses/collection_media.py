import logging
import os

from fastapi import HTTPException, Request, UploadFile
from sqlmodel import Session, select

from config.config import get_learnhouse_config
from src.db.collections import Collection, CollectionRead
from src.db.courses.courses import ThumbnailType
from src.db.organizations import Organization
from src.db.users import AnonymousUser, PublicUser
from src.security.rbac import check_resource_access, AccessAction
from src.services.courses.collections import _build_read
from src.services.utils.upload_content import upload_file

logger = logging.getLogger(__name__)


####################################################
# Storage
####################################################


async def upload_collection_thumbnail(
    thumbnail_file: UploadFile, org_uuid: str, collection_uuid: str
) -> str:
    """Upload a collection thumbnail with file validation."""
    return await upload_file(
        file=thumbnail_file,
        directory=f"collections/{collection_uuid}/thumbnails",
        type_of_dir="orgs",
        uuid=org_uuid,
        allowed_types=["image", "video"],
        filename_prefix="thumbnail",
    )


async def delete_collection_thumbnail_file(
    org_uuid: str, collection_uuid: str, filename: str
) -> None:
    _delete_media_file(
        f"content/orgs/{org_uuid}/collections/{collection_uuid}/thumbnails/{filename}",
        "thumbnail",
    )


async def upload_collection_banner(
    banner_file: UploadFile, org_uuid: str, collection_uuid: str
) -> str:
    """Upload a collection banner image with file validation."""
    return await upload_file(
        file=banner_file,
        directory=f"collections/{collection_uuid}/banners",
        type_of_dir="orgs",
        uuid=org_uuid,
        allowed_types=["image"],
        filename_prefix="banner",
    )


async def delete_collection_banner_file(
    org_uuid: str, collection_uuid: str, filename: str
) -> None:
    _delete_media_file(
        f"content/orgs/{org_uuid}/collections/{collection_uuid}/banners/{filename}",
        "banner",
    )


def _delete_media_file(file_path: str, kind: str) -> None:
    learnhouse_config = get_learnhouse_config()
    content_delivery = learnhouse_config.hosting_config.content_delivery.type

    if content_delivery == "filesystem":
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.debug("Deleted collection %s file: %s", kind, file_path)
        except OSError as e:
            logger.error("Failed to delete collection %s %s: %s", kind, file_path, e)

    elif content_delivery == "s3api":
        import boto3
        import botocore.config

        try:
            s3 = boto3.client(
                "s3",
                endpoint_url=learnhouse_config.hosting_config.content_delivery.s3api.endpoint_url,
                config=botocore.config.Config(
                    connect_timeout=10, read_timeout=60, retries={"max_attempts": 2}
                ),
            )
            bucket_name = (
                learnhouse_config.hosting_config.content_delivery.s3api.bucket_name
                or "learnhouse-media"
            )
            s3.delete_object(Bucket=bucket_name, Key=file_path)
            logger.debug("Deleted S3 collection %s: %s", kind, file_path)
        except Exception as e:
            logger.error("Failed to delete S3 collection %s %s: %s", kind, file_path, e)


####################################################
# Endpoints
####################################################


def _get_collection_or_404(db_session: Session, collection_uuid: str) -> Collection:
    collection = db_session.exec(
        select(Collection).where(Collection.collection_uuid == collection_uuid)
    ).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    return collection


def _get_org_uuid(db_session: Session, org_id: int) -> str:
    org = db_session.exec(
        select(Organization).where(Organization.id == org_id)
    ).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org.org_uuid


async def update_collection_thumbnail(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
    thumbnail_file: UploadFile | None = None,
    thumbnail_type: ThumbnailType = ThumbnailType.IMAGE,
) -> CollectionRead:
    collection = _get_collection_or_404(db_session, collection_uuid)

    await check_resource_access(
        request, db_session, current_user, collection.collection_uuid, AccessAction.UPDATE
    )

    if not thumbnail_file or not thumbnail_file.filename:
        raise HTTPException(status_code=422, detail="A thumbnail file is required")

    org_uuid = _get_org_uuid(db_session, int(collection.org_id))
    name_in_disk = await upload_collection_thumbnail(
        thumbnail_file, org_uuid, collection.collection_uuid
    )

    if thumbnail_type == ThumbnailType.IMAGE:
        collection.thumbnail_image = name_in_disk
        collection.thumbnail_type = (
            ThumbnailType.IMAGE if not collection.thumbnail_video else ThumbnailType.BOTH
        )
    elif thumbnail_type == ThumbnailType.VIDEO:
        collection.thumbnail_video = name_in_disk
        collection.thumbnail_type = (
            ThumbnailType.VIDEO if not collection.thumbnail_image else ThumbnailType.BOTH
        )

    db_session.add(collection)
    db_session.commit()
    db_session.refresh(collection)

    return _build_read(db_session, collection, include_unpublished=True)


async def delete_collection_thumbnail(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
) -> CollectionRead:
    collection = _get_collection_or_404(db_session, collection_uuid)

    await check_resource_access(
        request, db_session, current_user, collection.collection_uuid, AccessAction.UPDATE
    )

    org_uuid = _get_org_uuid(db_session, int(collection.org_id))

    if collection.thumbnail_image:
        await delete_collection_thumbnail_file(
            org_uuid, collection.collection_uuid, collection.thumbnail_image
        )
    if collection.thumbnail_video:
        await delete_collection_thumbnail_file(
            org_uuid, collection.collection_uuid, collection.thumbnail_video
        )

    collection.thumbnail_image = ""
    collection.thumbnail_video = ""
    collection.thumbnail_type = ThumbnailType.IMAGE

    db_session.add(collection)
    db_session.commit()
    db_session.refresh(collection)

    return _build_read(db_session, collection, include_unpublished=True)


async def update_collection_banner(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
    banner_file: UploadFile | None = None,
) -> CollectionRead:
    collection = _get_collection_or_404(db_session, collection_uuid)

    await check_resource_access(
        request, db_session, current_user, collection.collection_uuid, AccessAction.UPDATE
    )

    if not banner_file or not banner_file.filename:
        raise HTTPException(status_code=422, detail="A banner file is required")

    org_uuid = _get_org_uuid(db_session, int(collection.org_id))

    # Replace: delete the previous file before storing the new one.
    if collection.banner_image:
        await delete_collection_banner_file(
            org_uuid, collection.collection_uuid, collection.banner_image
        )

    collection.banner_image = await upload_collection_banner(
        banner_file, org_uuid, collection.collection_uuid
    )

    db_session.add(collection)
    db_session.commit()
    db_session.refresh(collection)

    return _build_read(db_session, collection, include_unpublished=True)


async def delete_collection_banner(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
) -> CollectionRead:
    collection = _get_collection_or_404(db_session, collection_uuid)

    await check_resource_access(
        request, db_session, current_user, collection.collection_uuid, AccessAction.UPDATE
    )

    org_uuid = _get_org_uuid(db_session, int(collection.org_id))

    if collection.banner_image:
        await delete_collection_banner_file(
            org_uuid, collection.collection_uuid, collection.banner_image
        )

    collection.banner_image = ""

    db_session.add(collection)
    db_session.commit()
    db_session.refresh(collection)

    return _build_read(db_session, collection, include_unpublished=True)
