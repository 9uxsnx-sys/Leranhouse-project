from datetime import datetime
from typing import List
from uuid import uuid4
from fastapi import HTTPException, Request, status
from sqlmodel import Session, col, select
from src.db.courses.course_updates import (
    CourseUpdate,
    CourseUpdateCreate,
    CourseUpdateRead,
    CourseUpdateUpdate,
)
from src.db.courses.courses import Course
from src.db.organizations import Organization
from src.db.users import AnonymousUser, PublicUser
from src.security.rbac import (
    AccessAction,
    check_catalog_read_access,
    check_resource_access,
)
from src.services.webhooks.dispatch import dispatch_webhooks
from src.services.notifications import notify


async def _parent_course(
    db_session: Session, course_id: int
) -> Course:
    """Resolve the course that owns an update, so RBAC runs on the course."""
    course = db_session.exec(select(Course).where(Course.id == course_id)).first()
    if not course or course.id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course does not exist"
        )
    return course


async def create_update(
    request: Request,
    course_uuid: str,
    update_object: CourseUpdateCreate,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
) -> CourseUpdateRead:

    # CHekc if org exists
    statement_org = select(Organization).where(Organization.id == update_object.org_id)
    org = db_session.exec(statement_org).first()

    if not org or org.id is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Organization does not exist"
        )

    statement = select(Course).where(Course.course_uuid == course_uuid)
    course = db_session.exec(statement).first()

    if not course or course.id is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Course does not exist"
        )

    # RBAC check
    await check_resource_access(request, db_session, current_user, course.course_uuid, AccessAction.UPDATE)

    # Generate UUID
    courseupdate_uuid = str(f"courseupdate_{uuid4()}")

    update = CourseUpdate(
        **update_object.model_dump(),
        course_id=course.id,
        courseupdate_uuid=courseupdate_uuid,
        creation_date=str(datetime.now()),
        update_date=str(datetime.now()),
    )

    db_session.add(update)

    db_session.commit()
    db_session.refresh(update)

    await dispatch_webhooks(
        event_name="course_update_published",
        org_id=update_object.org_id,
        data={
            "courseupdate_uuid": update.courseupdate_uuid,
            "course_uuid": course_uuid,
        },
    )
    notify(
        event_name="course_update_published",
        org_id=update_object.org_id,
        data={
            "course_uuid": course_uuid,
        },
        db_session=db_session,
    )

    return CourseUpdateRead(**update.model_dump())


# Update Course Update
async def update_update(
    request: Request,
    courseupdate_uuid: str,
    update_object: CourseUpdateUpdate,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
) -> CourseUpdateRead:
    statement = select(CourseUpdate).where(
        CourseUpdate.courseupdate_uuid == courseupdate_uuid
    )
    update = db_session.exec(statement).first()

    if not update or update.id is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Update does not exist"
        )

    # RBAC check — the course owns the permission, not the update row
    course = await _parent_course(db_session, update.course_id)
    await check_resource_access(
        request, db_session, current_user, course.course_uuid, AccessAction.UPDATE
    )

    for key, value in update_object.model_dump().items():
        if value is not None:
            setattr(update, key, value)

    db_session.add(update)

    db_session.commit()
    db_session.refresh(update)

    return CourseUpdateRead(**update.model_dump())


# Delete Course Update
async def delete_update(
    request: Request,
    courseupdate_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
):
    statement = select(CourseUpdate).where(
        CourseUpdate.courseupdate_uuid == courseupdate_uuid
    )
    update = db_session.exec(statement).first()

    if not update or update.id is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Update does not exist"
        )

    # RBAC check — the course owns the permission, not the update row
    course = await _parent_course(db_session, update.course_id)
    await check_resource_access(
        request, db_session, current_user, course.course_uuid, AccessAction.DELETE
    )

    db_session.delete(update)
    db_session.commit()

    return {"message": "Update deleted successfully"}


# Get Course Updates by Course ID
async def get_updates_by_course_uuid(
    request: Request,
    course_uuid: str,
    current_user: PublicUser | AnonymousUser,
    db_session: Session,
) -> List[CourseUpdateRead]:
    # FInd if course exists
    statement = select(Course).where(Course.course_uuid == course_uuid)
    course = db_session.exec(statement).first()

    if not course or course.id is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Course does not exist"
        )

    # Announcements are course metadata: a published paid course stays readable
    # as a product page, every other case follows the normal access rules.
    await check_catalog_read_access(
        request,
        db_session,
        current_user,
        course.course_uuid,
        published=course.published,
        access_type=course.access_type,
    )

    statement = (
        select(CourseUpdate)
        .where(CourseUpdate.course_id == course.id)
        .order_by(col(CourseUpdate.creation_date).desc())
    )  # https://sqlmodel.tiangolo.com/tutorial/where/#type-annotations-and-errors
    updates = db_session.exec(statement).all()

    return [CourseUpdateRead(**update.model_dump()) for update in updates]
