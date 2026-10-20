from typing import List, Literal
from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from src.core.events.database import get_db_session
from src.db.collections import (
    CollectionCourseRead,
    CollectionCreate,
    CollectionMembersPage,
    CollectionRead,
    CollectionUpdate,
)
from src.db.courses.courses import ThumbnailType
from src.security.auth import get_current_user
from src.services.users.users import PublicUser
from src.services.courses.collection_media import (
    delete_collection_banner,
    delete_collection_thumbnail,
    update_collection_banner,
    update_collection_thumbnail,
)
from src.services.courses.collection_access import (
    bulk_enroll_collection_users,
    bulk_unenroll_collection_users,
    claim_collection,
    list_collection_access_users,
)
from src.services.courses.collections import (
    add_course_to_collection,
    add_resource_to_collection,
    create_collection,
    get_collection,
    get_collection_courses,
    get_collection_members_page,
    get_collections,
    remove_course_from_collection,
    remove_resource_from_collection,
    update_collection,
    delete_collection,
)


router = APIRouter()


@router.post(
    "/",
    response_model=CollectionRead,
    summary="Create collection",
    description="Create a new collection of courses within an organization.",
    responses={
        200: {"description": "Collection created.", "model": CollectionRead},
        403: {"description": "Caller lacks permission to create collections in this org"},
        422: {"description": "Invalid collection payload"},
    },
)
async def api_create_collection(
    request: Request,
    collection_object: CollectionCreate,
    org_id: int,
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
) -> CollectionRead:
    """
    Create new Collection
    """
    return await create_collection(
        request, collection_object, current_user, db_session, org_id=org_id
    )


@router.get(
    "/{collection_uuid}",
    response_model=CollectionRead,
    summary="Get collection",
    description="Get a single collection by its UUID.",
    responses={
        200: {"description": "Collection details.", "model": CollectionRead},
        404: {"description": "Collection not found"},
    },
)
async def api_get_collection(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
) -> CollectionRead:
    """
    Get single collection by ID
    """
    return await get_collection(request, collection_uuid, current_user, db_session)


@router.get(
    "/org/{org_id}/page/{page}/limit/{limit}",
    response_model=List[CollectionRead],
    summary="List collections for org",
    description="Get collections for an organization, paginated by `page` and `limit`.",
    responses={
        200: {"description": "Paginated list of collections for the organization."},
    },
)
async def api_get_collections_by(
    request: Request,
    page: int,
    limit: int,
    org_id: str,
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
) -> List[CollectionRead]:
    """
    Get collections by page and limit
    """
    return await get_collections(request, org_id, current_user, db_session, page, limit)


@router.get(
    "/{collection_uuid}/courses",
    response_model=List[CollectionCourseRead],
    summary="List collection members",
    description=(
        "List the members of a collection (courses and podcasts), with lesson "
        "or episode counts. The path keeps its historical name."
    ),
    responses={
        200: {"description": "Courses in the collection."},
        404: {"description": "Collection not found"},
    },
)
async def api_get_collection_courses(
    request: Request,
    collection_uuid: str,
    search: str = "",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
) -> List[CollectionCourseRead]:
    return await get_collection_courses(
        request,
        collection_uuid,
        current_user,
        db_session,
        search=search,
        page=page,
        limit=limit,
    )


@router.get(
    "/{collection_uuid}/members",
    response_model=CollectionMembersPage,
    summary="Paginated collection members",
    description=(
        "Paginated members table used by the dashboard Content tab. "
        "`filter=linked` lists current members; `filter=available` lists the "
        "organization courses and podcasts that can still be added."
    ),
    responses={
        200: {"description": "Page of members or addable resources."},
        404: {"description": "Collection not found"},
    },
)
async def api_get_collection_members(
    request: Request,
    collection_uuid: str,
    filter_by: str = Query(default="linked", alias="filter"),
    search: str = "",
    kind: str = "",
    status: str = "",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
) -> CollectionMembersPage:
    return await get_collection_members_page(
        request,
        collection_uuid,
        current_user,
        db_session,
        filter_by=filter_by,
        search=search,
        kind=kind,
        status=status,
        page=page,
        limit=limit,
    )


def _parse_user_ids(user_ids: str) -> list[int]:
    ids: list[int] = []
    for raw in user_ids.split(","):
        raw = raw.strip()
        if not raw:
            continue
        try:
            ids.append(int(raw))
        except ValueError:
            continue
    return ids


@router.get(
    "/{collection_uuid}/access/users",
    summary="List collection access users",
    description=(
        "List learners who claimed a collection (`filter=enrolled`), or "
        "organization members that are not listed yet (`filter=available`). "
        "Supports search and pagination."
    ),
)
async def api_list_collection_access_users(
    request: Request,
    collection_uuid: str,
    filter: Literal["enrolled", "available"] = Query(default="enrolled"),
    search: str = "",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
):
    return await list_collection_access_users(
        request,
        collection_uuid,
        current_user,
        db_session,
        list_filter=filter,
        search=search,
        page=page,
        limit=limit,
    )


@router.post(
    "/{collection_uuid}/access/users",
    summary="Link users to a collection",
    description="Add organization members to the collection inventory.",
)
async def api_bulk_enroll_collection_users(
    request: Request,
    collection_uuid: str,
    user_ids: str = Query(description="Comma-separated user ids"),
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
):
    return await bulk_enroll_collection_users(
        request,
        collection_uuid,
        _parse_user_ids(user_ids),
        current_user,
        db_session,
    )


@router.delete(
    "/{collection_uuid}/access/users",
    summary="Unlink users from a collection",
    description="Remove users from the collection inventory.",
)
async def api_bulk_unenroll_collection_users(
    request: Request,
    collection_uuid: str,
    user_ids: str = Query(description="Comma-separated user ids"),
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
):
    return await bulk_unenroll_collection_users(
        request,
        collection_uuid,
        _parse_user_ids(user_ids),
        current_user,
        db_session,
    )


@router.post(
    "/{collection_uuid}/claim",
    summary="Claim a collection",
    description="Add the current learner to the collection inventory (idempotent).",
)
async def api_claim_collection(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
):
    return await claim_collection(
        request, collection_uuid, current_user, db_session
    )


@router.post(
    "/{collection_uuid}/courses",
    response_model=CollectionRead,
    summary="Add course to collection",
    description="Add a course to a collection. Private (`users_only`) courses are rejected.",
    responses={
        200: {"description": "Course added.", "model": CollectionRead},
        404: {"description": "Collection or course not found"},
        409: {"description": "Course is already part of the collection"},
        422: {"description": "Course is private"},
    },
)
async def api_add_collection_course(
    request: Request,
    collection_uuid: str,
    course_uuid: str,
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
) -> CollectionRead:
    return await add_course_to_collection(
        request, collection_uuid, course_uuid, current_user, db_session
    )


@router.delete(
    "/{collection_uuid}/courses",
    response_model=CollectionRead,
    summary="Remove course from collection",
    description="Remove a course from a collection.",
    responses={
        200: {"description": "Course removed.", "model": CollectionRead},
        404: {"description": "Collection, course or membership not found"},
        422: {"description": "A paid collection must keep at least one course"},
    },
)
async def api_remove_collection_course(
    request: Request,
    collection_uuid: str,
    course_uuid: str,
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
) -> CollectionRead:
    return await remove_course_from_collection(
        request, collection_uuid, course_uuid, current_user, db_session
    )


@router.post(
    "/{collection_uuid}/resources",
    response_model=CollectionRead,
    summary="Add a resource to a collection",
    description=(
        "Add a course (`course_…`) or a podcast (`podcast_…`) to a collection. "
        "Private (`users_only`) resources are rejected."
    ),
    responses={
        200: {"description": "Resource added.", "model": CollectionRead},
        404: {"description": "Collection or resource not found"},
        409: {"description": "Resource is already part of the collection"},
        422: {"description": "Resource is private or the bundle would be invalid"},
    },
)
async def api_add_collection_resource(
    request: Request,
    collection_uuid: str,
    resource_uuid: str,
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
) -> CollectionRead:
    return await add_resource_to_collection(
        request, collection_uuid, resource_uuid, current_user, db_session
    )


@router.delete(
    "/{collection_uuid}/resources",
    response_model=CollectionRead,
    summary="Remove a resource from a collection",
    description="Remove a course or podcast from a collection.",
    responses={
        200: {"description": "Resource removed.", "model": CollectionRead},
        404: {"description": "Collection or membership not found"},
        422: {"description": "A paid collection must keep at least one item"},
    },
)
async def api_remove_collection_resource(
    request: Request,
    collection_uuid: str,
    resource_uuid: str,
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
) -> CollectionRead:
    return await remove_resource_from_collection(
        request, collection_uuid, resource_uuid, current_user, db_session
    )


@router.put(
    "/{collection_uuid}/thumbnail",
    response_model=CollectionRead,
    summary="Update collection thumbnail",
    description="Upload or replace a collection cover image or video.",
    responses={
        200: {"description": "Thumbnail updated.", "model": CollectionRead},
        404: {"description": "Collection not found"},
        422: {"description": "Invalid thumbnail file"},
    },
)
async def api_update_collection_thumbnail(
    request: Request,
    collection_uuid: str,
    thumbnail_type: ThumbnailType = Form(default=ThumbnailType.IMAGE),
    thumbnail: UploadFile | None = File(default=None),
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
) -> CollectionRead:
    return await update_collection_thumbnail(
        request, collection_uuid, current_user, db_session, thumbnail, thumbnail_type
    )


@router.delete(
    "/{collection_uuid}/thumbnail",
    response_model=CollectionRead,
    summary="Delete collection thumbnail",
    description="Remove the cover image and video from a collection.",
    responses={
        200: {"description": "Thumbnail deleted.", "model": CollectionRead},
        404: {"description": "Collection not found"},
    },
)
async def api_delete_collection_thumbnail(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
) -> CollectionRead:
    return await delete_collection_thumbnail(
        request, collection_uuid, current_user, db_session
    )


@router.put(
    "/{collection_uuid}/banner",
    response_model=CollectionRead,
    summary="Update collection banner",
    description="Upload or replace a collection banner image.",
    responses={
        200: {"description": "Banner updated.", "model": CollectionRead},
        404: {"description": "Collection not found"},
        422: {"description": "Invalid banner file"},
    },
)
async def api_update_collection_banner(
    request: Request,
    collection_uuid: str,
    banner: UploadFile | None = File(default=None),
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
) -> CollectionRead:
    return await update_collection_banner(
        request, collection_uuid, current_user, db_session, banner
    )


@router.delete(
    "/{collection_uuid}/banner",
    response_model=CollectionRead,
    summary="Delete collection banner",
    description="Remove the banner image from a collection.",
    responses={
        200: {"description": "Banner deleted.", "model": CollectionRead},
        404: {"description": "Collection not found"},
    },
)
async def api_delete_collection_banner(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
) -> CollectionRead:
    return await delete_collection_banner(
        request, collection_uuid, current_user, db_session
    )


@router.put(
    "/{collection_uuid}",
    response_model=CollectionRead,
    summary="Update collection",
    description="Update a collection by its UUID. Omitted fields are left untouched.",
    responses={
        200: {"description": "Collection updated.", "model": CollectionRead},
        403: {"description": "Caller lacks permission to update this collection"},
        404: {"description": "Collection not found"},
        422: {"description": "Invalid access configuration"},
    },
)
async def api_update_collection(
    request: Request,
    collection_object: CollectionUpdate,
    collection_uuid: str,
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
) -> CollectionRead:
    """
    Update collection by ID
    """
    return await update_collection(
        request, collection_object, collection_uuid, current_user, db_session
    )


@router.delete(
    "/{collection_uuid}",
    summary="Delete collection",
    description="Delete a collection by its UUID. The collection is permanently removed.",
    responses={
        200: {"description": "Collection deleted."},
        403: {"description": "Caller lacks permission to delete this collection"},
        404: {"description": "Collection not found"},
    },
)
async def api_delete_collection(
    request: Request,
    collection_uuid: str,
    current_user: PublicUser = Depends(get_current_user),
    db_session=Depends(get_db_session),
):
    """
    Delete collection by ID
    """

    return await delete_collection(request, collection_uuid, current_user, db_session)
