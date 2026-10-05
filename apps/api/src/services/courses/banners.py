import os
import logging
from fastapi import UploadFile
from src.services.utils.upload_content import upload_file
from config.config import get_learnhouse_config

logger = logging.getLogger(__name__)


async def upload_course_banner(
    banner_file: UploadFile,
    org_uuid: str,
    course_uuid: str,
) -> str:
    """Upload a banner image for a course with file validation."""
    return await upload_file(
        file=banner_file,
        directory=f"courses/{course_uuid}/banners",
        type_of_dir="orgs",
        uuid=org_uuid,
        allowed_types=["image"],
        filename_prefix="banner",
    )


async def delete_course_banner_file(
    org_uuid: str,
    course_uuid: str,
    filename: str,
) -> None:
    """Delete a course banner file from storage."""
    learnhouse_config = get_learnhouse_config()
    content_delivery = learnhouse_config.hosting_config.content_delivery.type
    file_path = f"content/orgs/{org_uuid}/courses/{course_uuid}/banners/{filename}"

    if content_delivery == "filesystem":
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.debug("Deleted banner file: %s", file_path)
        except OSError as e:
            logger.error("Failed to delete banner file %s: %s", file_path, e)

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
            logger.debug("Deleted S3 banner: %s", file_path)
        except Exception as e:
            logger.error("Failed to delete S3 banner %s: %s", file_path, e)
