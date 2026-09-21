import uuid
from app.db.session import SessionLocal
from app.models.organizations import User, Organization, PlanEnum, RoleEnum
from app.models.billing import UserEntitlement, UsageEvent

SUPER_ADMIN_EMAILS = {"rcraghul12@gmail.com"}
SUPER_ADMIN_CLERK_IDS = {"user_3HpP6350OcHxY6bu77tdXEtihSE"}

def migrate_and_isolate_organizations():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Total users found: {len(users)}")

        for user in users:
            email_clean = (user.email or "").strip().lower()
            is_super = email_clean in SUPER_ADMIN_EMAILS or user.clerk_user_id in SUPER_ADMIN_CLERK_IDS

            # 1. If super admin: assign to dedicated SuperAdmin Workspace
            if is_super:
                super_org = db.query(Organization).filter(Organization.name == "SuperAdmin Workspace").first()
                if not super_org:
                    super_org = Organization(
                        name="SuperAdmin Workspace",
                        plan=PlanEnum.enterprise
                    )
                    db.add(super_org)
                    db.flush()

                user.org_id = super_org.id
                user.role = RoleEnum.admin

                # Super admin entitlement
                ent = db.query(UserEntitlement).filter(UserEntitlement.org_id == super_org.id).first()
                if not ent:
                    ent = UserEntitlement(
                        org_id=super_org.id,
                        user_id=user.id,
                        plan="enterprise",
                        status="active",
                        free_usage_limit=3,
                        free_usage_used=0,
                        paid_credits=9999
                    )
                    db.add(ent)
                else:
                    ent.plan = "enterprise"
                    ent.user_id = user.id
                db.flush()
                print(f"Super admin configured: {user.email} (Org: {super_org.id})")
                continue

            # 2. Non-super admin user: check if their current org is shared with other users
            current_org = db.query(Organization).filter(Organization.id == user.org_id).first()
            other_users_count = db.query(User).filter(User.org_id == user.org_id, User.id != user.id).count()

            # If org is shared or missing or is 'Dev Default Org', give user their own dedicated workspace
            needs_new_org = (
                current_org is None or 
                other_users_count > 0 or 
                (current_org and current_org.name == "Dev Default Org" and user.email != "namasivayaravishankar@gmail.com")
            )

            if needs_new_org:
                name_prefix = email_clean.split('@')[0] if email_clean else "User"
                new_org = Organization(
                    name=f"{name_prefix}'s Workspace",
                    plan=PlanEnum.trial
                )
                db.add(new_org)
                db.flush()

                # Move any user-specific usage events to the new org
                db.query(UsageEvent).filter(UsageEvent.user_id == user.id).update(
                    {UsageEvent.org_id: new_org.id},
                    synchronize_session=False
                )

                user.org_id = new_org.id
                target_org_id = new_org.id
                print(f"Created dedicated org for {user.email}: {new_org.id}")
            else:
                target_org_id = user.org_id
                # Ensure plan is not enterprise for standard users
                if current_org and current_org.plan == PlanEnum.enterprise:
                    current_org.plan = PlanEnum.trial

            # Calculate user's actual consumed actions from usage_events
            consumed_events = db.query(UsageEvent).filter(
                UsageEvent.user_id == user.id,
                UsageEvent.status.in_(["reserved", "completed"])
            ).count()

            ent = db.query(UserEntitlement).filter(UserEntitlement.org_id == target_org_id).first()
            if not ent:
                ent = UserEntitlement(
                    org_id=target_org_id,
                    user_id=user.id,
                    plan="free",
                    status="active",
                    free_usage_limit=3,
                    free_usage_used=consumed_events,
                    paid_credits=0
                )
                db.add(ent)
            else:
                ent.user_id = user.id
                if ent.free_usage_used < consumed_events:
                    ent.free_usage_used = consumed_events

            print(f"User {user.email}: org={target_org_id}, used={ent.free_usage_used}/{ent.free_usage_limit}")

        db.commit()
        print("Migration and isolation completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error during migration: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_and_isolate_organizations()
