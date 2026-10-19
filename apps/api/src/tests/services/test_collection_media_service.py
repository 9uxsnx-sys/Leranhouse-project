"""Tests for src/services/courses/collection_media.py."""

from unittest.mock import AsyncMock, Mock, patch

import pytest
from fastapi import HTTPException

from src.db.courses.courses import ThumbnailType
from src.services.courses.collection_media import (
    delete_collection_banner,
    delete_collection_thumbnail,
    update_collection_banner,
    update_collection_thumbnail,
)

UPLOAD_THUMB = "src.services.courses.collection_media.upload_collection_thumbnail"
UPLOAD_BANNER = "src.services.courses.collection_media.upload_collection_banner"
DELETE_THUMB = "src.services.courses.collection_media.delete_collection_thumbnail_file"
DELETE_BANNER = "src.services.courses.collection_media.delete_collection_banner_file"


def _file(name="cover.png"):
    return Mock(filename=name)


class TestCollectionMedia:
    @pytest.mark.asyncio
    async def test_upload_thumbnail_image(
        self, db, org, collection, admin_user, mock_request, bypass_rbac
    ):
        with patch(UPLOAD_THUMB, new_callable=AsyncMock, return_value="cover.png") as up:
            result = await update_collection_thumbnail(
                mock_request,
                collection.collection_uuid,
                admin_user,
                db,
                _file(),
                ThumbnailType.IMAGE,
            )

        up.assert_awaited_once()
        assert result.thumbnail_image == "cover.png"
        assert result.thumbnail_type == ThumbnailType.IMAGE

    @pytest.mark.asyncio
    async def test_upload_thumbnail_without_file_is_rejected(
        self, db, org, collection, admin_user, mock_request, bypass_rbac
    ):
        with pytest.raises(HTTPException) as exc_info:
            await update_collection_thumbnail(
                mock_request, collection.collection_uuid, admin_user, db, None
            )

        assert exc_info.value.status_code == 422

    @pytest.mark.asyncio
    async def test_upload_banner_replaces_previous_file(
        self, db, org, collection, admin_user, mock_request, bypass_rbac
    ):
        collection.banner_image = "old.png"
        db.add(collection)
        db.commit()

        with patch(
            UPLOAD_BANNER, new_callable=AsyncMock, return_value="new.png"
        ), patch(
            DELETE_BANNER, new_callable=AsyncMock
        ) as delete_file:
            result = await update_collection_banner(
                mock_request, collection.collection_uuid, admin_user, db, _file()
            )

        delete_file.assert_awaited_once()
        assert result.banner_image == "new.png"

    @pytest.mark.asyncio
    async def test_delete_thumbnail_clears_both_fields(
        self, db, org, collection, admin_user, mock_request, bypass_rbac
    ):
        collection.thumbnail_image = "cover.png"
        collection.thumbnail_video = "cover.mp4"
        collection.thumbnail_type = ThumbnailType.BOTH
        db.add(collection)
        db.commit()

        with patch(DELETE_THUMB, new_callable=AsyncMock) as delete_file:
            result = await delete_collection_thumbnail(
                mock_request, collection.collection_uuid, admin_user, db
            )

        assert delete_file.await_count == 2
        assert result.thumbnail_image == ""
        assert result.thumbnail_video == ""
        assert result.thumbnail_type == ThumbnailType.IMAGE

    @pytest.mark.asyncio
    async def test_delete_banner(
        self, db, org, collection, admin_user, mock_request, bypass_rbac
    ):
        collection.banner_image = "banner.png"
        db.add(collection)
        db.commit()

        with patch(DELETE_BANNER, new_callable=AsyncMock) as delete_file:
            result = await delete_collection_banner(
                mock_request, collection.collection_uuid, admin_user, db
            )

        delete_file.assert_awaited_once()
        assert result.banner_image == ""
