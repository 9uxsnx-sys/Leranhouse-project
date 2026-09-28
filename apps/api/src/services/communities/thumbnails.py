import os
import logging
from fastapi import UploadFile
from src.services.utils.upload_content import upload_file
from config.config import get_learnhouse_config

logger = logging.getLogger(__name__)


async def upload_community_thumbnail(
    thumbnail_file: UploadFile,
    org_uuid: str,
    community_uuid: str,
) -> str:
    """Upload a thumbnail image for a community with file validation."""
    return await upload_file(
        file=thumbnail_file,
        directory=f"communities/{community_uuid}/thumbnails",
        type_of_dir="orgs",
        uuid=org_uuid,
        allowed_types=["image"],
        filename_prefix="thumbnail",
    )


async def delete_community_thumbnail_file(
    org_uuid: str,
    community_uuid: str,
    filename: str,
) -> None:
    """Delete a community thumbnail file from storage."""
    learnhouse_config = get_learnhouse_config()
    content_delivery = learnhouse_config.hosting_config.content_delivery.type
    file_path = f"content/orgs/{org_uuid}/communities/{community_uuid}/thumbnails/{filename}"

    if content_delivery == "filesystem":
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.debug("Deleted thumbnail file: %s", file_path)
        except OSError as e:
            logger.error("Failed to delete thumbnail file %s: %s", file_path, e)

    elif content_delivery == "s3api":
        import boto3
        import botocore.config

        try:
            s3 = boto3.client(
                "s3",
                endpoint_url=learnhouse_config.hosting_config.content_delivery.s3api.endpoint_url,
                config=botocore.config.Config(connect_timeout=10, read_timeout=60, retries={"max_attempts": 2}),
            )
            bucket_name = learnhouse_config.hosting_config.content_delivery.s3api.bucket_name or "learnhouse-media"
            s3.delete_object(Bucket=bucket_name, Key=file_path)
            logger.debug("Deleted S3 thumbnail: %s", file_path)
        except Exception as e:
            logger.error("Failed to delete S3 thumbnail %s: %s", file_path, e)
