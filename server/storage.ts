import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { events, eventUsers, photos, textPosts, photoLikes, photoComments, eventAttendees, eventNotificationSettings, brandedLinks, appUsers, type Event, type EventUser, type Photo, type TextPost, type PhotoLike, type PhotoComment, type EventAttendee, type User, type BrandedLink, type PhotoWithUser, type PhotoWithUserAndLikes, type TextPostWithUser, type EventAttendeeWithUser, type AttendeeStats, type PhotoCommentWithUser, type InsertEvent, type InsertEventUser, type InsertPhoto, type InsertTextPost, type InsertPhotoLike, type InsertPhotoComment, type InsertEventAttendee, type InsertUser, type InsertBrandedLink } from "../shared/schema.js";
import { eq, desc, and, sql } from "drizzle-orm";

// HYBRID DATABASE ARCHITECTURE: Coolify PostgreSQL (Production) + Replit Local PostgreSQL (Development)
let primaryClient: postgres.Sql<{}> | null = null;
let fallbackClient: postgres.Sql<{}> | null = null;
let primaryDb: ReturnType<typeof drizzle> | null = null;
let fallbackDb: ReturnType<typeof drizzle> | null = null;

// Initialize Primary Database (Coolify PostgreSQL)
if (process.env.COOLIFY_DATABASE_URL) {
  try {
    console.log("🔧 Initializing Coolify PostgreSQL connection...");
    // Fix malformed URL that includes http:// in hostname or DATABASE_URL: prefix
    let coolifyUrl = process.env.COOLIFY_DATABASE_URL;
    if (coolifyUrl.startsWith('DATABASE_URL:')) {
      coolifyUrl = coolifyUrl.replace('DATABASE_URL:', '');
      console.log("🔧 Removed DATABASE_URL: prefix");
    }
    if (coolifyUrl.includes('@http://')) {
      coolifyUrl = coolifyUrl.replace('@http://', '@');
      console.log("🔧 Fixed malformed Coolify URL");
    }
    // Fix extra slash in hostname
    coolifyUrl = coolifyUrl.replace('/@:', ':');
    console.log("🔧 Fixed hostname format");
    primaryClient = postgres(coolifyUrl);
    primaryDb = drizzle(primaryClient);
    console.log("✅ Coolify PostgreSQL database connection ready");
  } catch (error) {
    console.warn("⚠️ Coolify PostgreSQL connection failed:", error);
  }
}

// Initialize Fallback Database (Local PostgreSQL)
if (process.env.DATABASE_URL) {
  try {
    console.log("🔧 Initializing Replit local PostgreSQL connection...");
    fallbackClient = postgres(process.env.DATABASE_URL);
    fallbackDb = drizzle(fallbackClient);
    console.log("✅ Replit local PostgreSQL connection ready");
  } catch (error) {
    console.error("❌ Local PostgreSQL fallback connection failed:", error);
  }
}

// Ensure at least one connection is available
if (!primaryDb && !fallbackDb) {
  throw new Error("❌ No database connections available. Please check COOLIFY_DATABASE_URL and DATABASE_URL");
}

// Prioritize Coolify database if available, fallback to local
let activeDb = primaryDb || fallbackDb;
const isDatabaseCoolify = !!primaryDb;
console.log(`🔧 Using ${isDatabaseCoolify ? 'Coolify PostgreSQL (Primary)' : 'Replit Local PostgreSQL (Fallback)'} database`);
let usingPrimary = !!primaryDb;

console.log(`🔧 Using ${usingPrimary ? 'Coolify PostgreSQL (Primary)' : 'Replit Local PostgreSQL (Fallback)'} database`);

// FIXED: Single database operation for consistency
async function executeDbOperation<T>(operation: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  // Use the same database consistently - no fallback switching during runtime
  const dbToUse = activeDb;
  const dbType = isDatabaseCoolify ? "Coolify PostgreSQL" : "Local PostgreSQL";
  
  if (!dbToUse) {
    throw new Error("No database connections available");
  }
  
  try {
    console.log(`🔧 Using ${dbType} database`);
    return await operation(dbToUse);
  } catch (error: any) {
    console.error(`❌ ${dbType} operation failed:`, error.message);
    throw error;
  }
}

export interface IStorage {
  // Events
  getEvent(id: string): Promise<Event | undefined>;
  getEventWithOwner(id: string): Promise<(Event & { ownerUsername?: string; ownerIsActive?: boolean }) | undefined>;
  getEventByTitle(title: string): Promise<Event | undefined>;
  getEventByOwner(ownerId: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  
  // Event Users
  getEventUser(id: string): Promise<EventUser | undefined>;
  getEventUserByNameAndEvent(name: string, eventId: string): Promise<EventUser | undefined>;
  createEventUser(user: InsertEventUser): Promise<EventUser>;
  
  // Photos
  getPhotosByEvent(eventId: string): Promise<PhotoWithUser[]>;
  getPhotosByEventWithLikes(eventId: string, currentUserId?: string): Promise<PhotoWithUserAndLikes[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(photoId: string): Promise<void>;
  
  // Photo Likes
  likePhoto(photoId: string, userId: string): Promise<PhotoLike>;
  unlikePhoto(photoId: string, userId: string): Promise<void>;
  getPhotoLikes(photoId: string): Promise<PhotoLike[]>;
  getPhotoLikeCount(photoId: string): Promise<number>;
  isPhotoLikedByUser(photoId: string, userId: string): Promise<boolean>;
  
  // Photo Comments
  getPhotoComments(photoId: string): Promise<PhotoCommentWithUser[]>;
  createPhotoComment(comment: InsertPhotoComment): Promise<PhotoComment>;
  deletePhotoComment(commentId: string): Promise<void>;
  getPhotoCommentCount(photoId: string): Promise<number>;
  
  // Text Posts
  getTextPostsByEvent(eventId: string): Promise<TextPostWithUser[]>;
  createTextPost(post: InsertTextPost): Promise<TextPost>;
  deleteTextPost(postId: string): Promise<void>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // PHASE 2: Event Attendees (RSVP and Check-in System)
  getEventAttendees(eventId: string): Promise<EventAttendeeWithUser[]>;
  getEventAttendeeByUser(eventId: string, userId: string): Promise<EventAttendee | undefined>;
  confirmAttendance(eventId: string, userId: string): Promise<EventAttendee>;
  confirmGuestAttendance(eventId: string, guestData: any): Promise<EventAttendee>;
  updateAttendeeStatus(attendeeId: string, status: string, checkedInBy?: string): Promise<EventAttendee>;
  getAttendeeByQR(qrCode: string): Promise<EventAttendee | undefined>;
  getAttendeeById(attendeeId: string): Promise<EventAttendee | undefined>;
  migrateAttendeesTableForGuests(): Promise<any>;
  getAttendeeStats(eventId: string): Promise<AttendeeStats>;
  generateUniqueQR(eventId: string, userId: string): Promise<string>;
  
  // Branded Links (URL Shortener System)
  getBrandedLinks(): Promise<BrandedLink[]>;
  getBrandedLinkByCode(shortCode: string): Promise<BrandedLink | undefined>;
  createBrandedLink(link: InsertBrandedLink): Promise<BrandedLink>;
  updateBrandedLink(id: string, updates: Partial<BrandedLink>): Promise<BrandedLink>;
  deleteBrandedLink(id: string): Promise<void>;
  incrementLinkClicks(shortCode: string): Promise<void>;
  
  // Migration functions
  migrateAddDateColumns(): Promise<any>;
  executeRawQuery(query: string): Promise<any>;
  executeRawSQL(query: string): Promise<any>;
}

// Initialize default users in the active database
async function initializeDefaultUsers(): Promise<void> {
  const defaultUsers = [
    {
      id: "admin-user-id",
      username: "admin",
      password: "password",
      email: "admin@eventgallery.com",
      fullName: "Administrador Principal",
      isAdmin: true,
      isActive: true
    },
    {
      id: "sofia-user-id",
      username: "sofia",
      password: "sofia01",
      email: "sofia@eventgallery.com",
      fullName: "Sofia Martinez",
      isAdmin: false,
      isActive: true
    },
    {
      id: "javier-user-id",
      username: "javier",
      password: "javier01",
      email: "javier@eventgallery.com",
      fullName: "Javier Rodriguez",
      isAdmin: false,
      isActive: true
    }
  ];

  try {
    const result = await executeDbOperation(async (db) => {
      const existingUsers = await db.select().from(appUsers);
      return existingUsers;
    });
    
    const existingUsernames = result.map(u => u.username);
    const usersToCreate = defaultUsers.filter(u => !existingUsernames.includes(u.username));

    if (usersToCreate.length > 0) {
      console.log(`🔄 Creating ${usersToCreate.length} default users...`);
      
      for (const user of usersToCreate) {
        try {
          await executeDbOperation(async (db) => {
            return await db.insert(appUsers).values(user);
          });
          console.log(`✅ Created user: ${user.username} (${user.fullName})`);
        } catch (error) {
          console.warn(`⚠️ User ${user.username} might already exist:`, error);
        }
      }
    } else {
      console.log("✅ All default users already exist");
    }
  } catch (error) {
    console.error("❌ Error initializing default users:", error);
  }
}

export class DatabaseStorage implements IStorage {
  async getEvent(id: string): Promise<Event | undefined> {
    return await executeDbOperation(async (db) => {
      const result = await db.select({
      id: events.id,
      title: events.title,
      description: events.description,
      coverImageUrl: events.coverImageUrl,
      backgroundType: events.backgroundType,
      backgroundValue: events.backgroundValue,
      ownerId: events.ownerId,
      createdAt: events.createdAt,
      eventDate: events.eventDate,
      eventTime: events.eventTime,
      timezone: events.timezone,
      enableAutoRedirect: events.enableAutoRedirect,
      eventPlace: events.eventPlace,
      eventAddress: events.eventAddress,
      maxCompanions: events.maxCompanions,
    }).from(events).where(eq(events.id, id)).limit(1);
      return result[0];
    });
  }

  async getEventWithOwner(id: string): Promise<(Event & { ownerUsername?: string; ownerIsActive?: boolean }) | undefined> {
    return await executeDbOperation(async (db) => {
      const result = await db.select({
      // Event fields
      id: events.id,
      title: events.title,
      description: events.description,
      coverImageUrl: events.coverImageUrl,
      backgroundType: events.backgroundType,
      backgroundValue: events.backgroundValue,
      ownerId: events.ownerId,
      createdAt: events.createdAt,
      eventDate: events.eventDate,
      eventTime: events.eventTime,
      timezone: events.timezone,
      enableAutoRedirect: events.enableAutoRedirect,
      eventPlace: events.eventPlace,
      eventAddress: events.eventAddress,
      maxCompanions: events.maxCompanions,
      // User fields
      ownerUsername: appUsers.username,
      ownerIsActive: appUsers.isActive
    }).from(events)
      .leftJoin(appUsers, eq(events.ownerId, appUsers.id))
      .where(eq(events.id, id))
      .limit(1);
    
      if (result.length === 0) return undefined;
      
      const event = result[0];
      return {
        ...event,
        ownerUsername: event.ownerUsername ?? undefined,
        ownerIsActive: event.ownerIsActive ?? true
      };
    });
  }

  async getEventByTitle(title: string): Promise<Event | undefined> {
    return await executeDbOperation(async (db) => {
      const result = await db.select({
      id: events.id,
      title: events.title,
      description: events.description,
      coverImageUrl: events.coverImageUrl,
      backgroundType: events.backgroundType,
      backgroundValue: events.backgroundValue,
      ownerId: events.ownerId,
      createdAt: events.createdAt,
      eventDate: events.eventDate,
      eventTime: events.eventTime,
      timezone: events.timezone,
      enableAutoRedirect: events.enableAutoRedirect,
      eventPlace: events.eventPlace,
      eventAddress: events.eventAddress,
      maxCompanions: events.maxCompanions,
      }).from(events).where(eq(events.title, title)).limit(1);
      return result[0];
    });
  }

  async getEventByOwner(ownerId: string): Promise<Event | undefined> {
    return await executeDbOperation(async (db) => {
      console.log('🔍 DATABASE: Getting event by owner with date fields');
      
      const result = await db.select({
      id: events.id,
      title: events.title,
      description: events.description,
      coverImageUrl: events.coverImageUrl,
      backgroundType: events.backgroundType,
      backgroundValue: events.backgroundValue,
      ownerId: events.ownerId,
      createdAt: events.createdAt,
      // MIGRATION COMPLETE: Date fields now included
      eventDate: events.eventDate,
      eventTime: events.eventTime,
      timezone: events.timezone,
      enableAutoRedirect: events.enableAutoRedirect,
      // LOCATION FIELDS: Place and address now included
      eventPlace: events.eventPlace,
      eventAddress: events.eventAddress,
      maxCompanions: events.maxCompanions,
      }).from(events).where(eq(events.ownerId, ownerId)).limit(1);
      return result[0];
    });
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    return await executeDbOperation(async (db) => {
      const result = await db.insert(events).values(event).returning();
      return result[0];
    });
  }

  async getEventById(id: string): Promise<Event | undefined> {
    return await executeDbOperation(async (db) => {
      const result = await db.select({
      id: events.id,
      title: events.title,
      description: events.description,
      coverImageUrl: events.coverImageUrl,
      backgroundType: events.backgroundType,
      backgroundValue: events.backgroundValue,
      ownerId: events.ownerId,
      createdAt: events.createdAt,
      eventDate: events.eventDate,
      eventTime: events.eventTime,
      timezone: events.timezone,
      enableAutoRedirect: events.enableAutoRedirect,
      eventPlace: events.eventPlace,
      eventAddress: events.eventAddress,
      maxCompanions: events.maxCompanions,
      }).from(events).where(eq(events.id, id)).limit(1);
      return result[0];
    });
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    // Update event with all fields including date and location
    console.log('🔍 DATABASE: Updating event with date and location fields:', { 
      eventDate: updates.eventDate, 
      eventTime: updates.eventTime, 
      enableAutoRedirect: updates.enableAutoRedirect,
      eventPlace: updates.eventPlace,
      eventAddress: updates.eventAddress
    });
    
    const safeUpdates = {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.coverImageUrl !== undefined && { coverImageUrl: updates.coverImageUrl }),
      ...(updates.backgroundType !== undefined && { backgroundType: updates.backgroundType }),
      ...(updates.backgroundValue !== undefined && { backgroundValue: updates.backgroundValue }),
      // MIGRATION COMPLETE: Date fields now included
      ...(updates.eventDate !== undefined && { eventDate: updates.eventDate }),
      ...(updates.eventTime !== undefined && { eventTime: updates.eventTime }),
      ...(updates.timezone !== undefined && { timezone: updates.timezone }),
      ...(updates.enableAutoRedirect !== undefined && { enableAutoRedirect: updates.enableAutoRedirect }),
      // LOCATION FIELDS: Place and address now included
      ...(updates.eventPlace !== undefined && { eventPlace: updates.eventPlace }),
      ...(updates.eventAddress !== undefined && { eventAddress: updates.eventAddress }),
    };
    
    console.log('📝 UPDATE EVENT: Applying safe updates:', Object.keys(safeUpdates));
    
    return await executeDbOperation(async (db) => {
      const result = await db.update(events).set(safeUpdates).where(eq(events.id, id)).returning({
      id: events.id,
      title: events.title,
      description: events.description,
      coverImageUrl: events.coverImageUrl,
      backgroundType: events.backgroundType,
      backgroundValue: events.backgroundValue,
      ownerId: events.ownerId,
      createdAt: events.createdAt,
      // MIGRATION COMPLETE: Date fields now included
      eventDate: events.eventDate,
      eventTime: events.eventTime,
      timezone: events.timezone,
      enableAutoRedirect: events.enableAutoRedirect,
      // LOCATION FIELDS: Place and address now included
      eventPlace: events.eventPlace,
      eventAddress: events.eventAddress,
      maxCompanions: events.maxCompanions,
      });
      return result[0];
    });
  }

  async deleteEvent(id: string): Promise<void> {
    return await executeDbOperation(async (db) => {
      await db.delete(events).where(eq(events.id, id));
    });
  }

  async getEventUser(id: string): Promise<EventUser | undefined> {
    return await executeDbOperation(async (db) => {
      const result = await db.select().from(eventUsers).where(eq(eventUsers.id, id)).limit(1);
      return result[0];
    });
  }

  async getEventUserByNameAndEvent(name: string, eventId: string): Promise<EventUser | undefined> {
    return await executeDbOperation(async (db) => {
      const result = await db.select().from(eventUsers)
        .where(and(eq(eventUsers.name, name), eq(eventUsers.eventId, eventId)))
        .limit(1);
      return result[0];
    });
  }

  async createEventUser(user: InsertEventUser): Promise<EventUser> {
    return await executeDbOperation(async (db) => {
      const userId = `${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`;
      const userWithId = { ...user, id: userId };
      
      const result = await db.insert(eventUsers).values(userWithId).returning();
      return result[0];
    });
  }

  async getPhotosForEvent(eventId: string): Promise<PhotoWithUser[]> {
    return this.getPhotosByEvent(eventId);
  }

  async getPhotosByEvent(eventId: string): Promise<PhotoWithUser[]> {
    console.log(`📸 Getting photos for event ${eventId}`);
    
    return await executeDbOperation(async (db) => {
      console.log("🔧 PHOTO READ: Using database for getPhotosByEvent");
      const result = await db.select({
      id: photos.id,
      eventId: photos.eventId,
      userId: photos.userId,
      fileName: photos.fileName,
      originalName: photos.originalName,
      fileUrl: photos.fileUrl,
      fileType: photos.fileType,
      fileSize: photos.fileSize,
      isVideo: photos.isVideo,
      createdAt: photos.createdAt,
      userName: eventUsers.name, // This will be null for guest users
    }).from(photos)
        .leftJoin(eventUsers, eq(photos.userId, eventUsers.id))
        .where(eq(photos.eventId, eventId))
        .orderBy(desc(photos.createdAt));
      
      const formattedResult = result.map(photo => ({
        ...photo,
        userName: photo.userName || this.extractUserNameFromId(photo.userId)
      }));
      
      console.log(`Found ${formattedResult.length} basic photos from ${isDatabaseCoolify ? 'COOLIFY' : 'LOCAL'} database`);
      if (formattedResult.length > 0) {
        console.log("📷 Photo IDs found:", formattedResult.map(p => p.id).slice(0, 5));
      }
      return formattedResult;
    });
  }

  extractUserNameFromId(userId: string): string {
    // GUEST USER NAME EXTRACTION: Convert localStorage-generated user IDs to display names
    // Examples: 'raul-user-id' → 'Raul', 'sofia-user-id' → 'Sofia', 'javier-user-id' → 'Javier'
    // This function is called when userName is null from LEFT JOIN (guest users)
    if (userId.endsWith('-user-id')) {
      const name = userId.replace('-user-id', '');
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    // Fallback for any unexpected user ID format
    return 'Usuario';
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    console.log("📷 Creating photo in database:", {
      eventId: photo.eventId,
      userId: photo.userId,
      fileName: photo.fileName,
      fileUrl: photo.fileUrl?.substring(0, 50) + "..."
    });
    
    return await executeDbOperation(async (db) => {
      console.log("🔧 PHOTO UPLOAD: Using database for createPhoto");
      const result = await db.insert(photos).values(photo).returning();
      // SUCCESS LOG: Confirms photo was saved with database-generated UUID
      console.log("✅ Photo saved to database:", {
        id: result[0].id,
        eventId: result[0].eventId,
        userId: result[0].userId,
        database: isDatabaseCoolify ? 'COOLIFY' : 'LOCAL'
      });
      return result[0];
    });
  }

  async deletePhoto(photoId: string): Promise<void> {
    return await executeDbOperation(async (db) => {
      await db.delete(photos).where(eq(photos.id, photoId));
    });
  }

  async getTextPostsByEvent(eventId: string): Promise<TextPostWithUser[]> {
    return await executeDbOperation(async (db) => {
      // Get all posts for this event
      const posts = await db.select({
        id: textPosts.id,
        eventId: textPosts.eventId,
        userId: textPosts.userId,
        content: textPosts.content,
        createdAt: textPosts.createdAt,
      }).from(textPosts)
        .where(eq(textPosts.eventId, eventId))
        .orderBy(desc(textPosts.createdAt));
    
      // For each post, try to get the user name from event_users, then app_users
      const postsWithUsers: TextPostWithUser[] = [];
      
      for (const post of posts) {
        let userName = 'Usuario Invitado';
        
        if (post.userId) {
          // Try event_users first (where guest names are stored)
          const eventUser = await db.select({ name: eventUsers.name })
            .from(eventUsers)
            .where(eq(eventUsers.id, post.userId))
            .limit(1);
          
          if (eventUser.length > 0 && eventUser[0].name) {
            userName = eventUser[0].name;
          } else {
            // Try app_users for registered users
            const appUser = await db.select({ fullName: appUsers.fullName })
              .from(appUsers)
              .where(eq(appUsers.id, post.userId))
              .limit(1);
            
            if (appUser.length > 0 && appUser[0].fullName) {
              userName = appUser[0].fullName;
            } else {
              // Generate guest name from userId
              userName = `Usuario Invitado ${(post.userId || '').slice(-4)}`;
            }
          }
        }
        
        postsWithUsers.push({
          id: post.id,
          eventId: post.eventId,
          userId: post.userId,
          content: post.content,
          createdAt: post.createdAt,
          userName,
        });
      }
      
      return postsWithUsers;
    });
  }

  async createTextPost(post: InsertTextPost): Promise<TextPost> {
    return await executeDbOperation(async (db) => {
      const result = await db.insert(textPosts).values(post).returning();
      return result[0];
    });
  }

  async deleteTextPost(postId: string): Promise<void> {
    return await executeDbOperation(async (db) => {
      await db.delete(textPosts).where(eq(textPosts.id, postId));
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return await executeDbOperation(async (db) => {
      const result = await db.select().from(appUsers).where(eq(appUsers.id, id)).limit(1);
      return result[0];
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return await executeDbOperation(async (db) => {
      const result = await db.select({
      id: appUsers.id,
      username: appUsers.username,
      password: appUsers.password,
      email: appUsers.email,
      fullName: appUsers.fullName,
      isAdmin: appUsers.isAdmin,
      isActive: appUsers.isActive,
      createdAt: appUsers.createdAt,
    }).from(appUsers).where(eq(appUsers.username, username)).limit(1);
      return result[0];
    });
  }

  async createUser(user: InsertUser): Promise<User> {
    return await executeDbOperation(async (db) => {
      // Generate a unique ID for the user
      const userId = `${user.username}-user-id`;
      const userWithId = { ...user, id: userId };
      
      const result = await db.insert(appUsers).values(userWithId).returning();
      return result[0];
    });
  }

  async getAllUsers(): Promise<User[]> {
    return await executeDbOperation(async (db) => {
      return await db.select().from(appUsers);
    });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return await executeDbOperation(async (db) => {
      const [user] = await db
        .update(appUsers)
        .set(updates)
        .where(eq(appUsers.id, id))
        .returning();
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    });
  }

  async deleteUser(id: string): Promise<void> {
    return await executeDbOperation(async (db) => {
      console.log(`🔍 DETAILED CASCADE DEBUG - User deletion request: ${id}`);
      
      // STEP 1: Verify user exists
      const userExists = await db.select({ 
        id: appUsers.id, 
        username: appUsers.username,
        email: appUsers.email 
      })
        .from(appUsers)
        .where(eq(appUsers.id, id))
        .limit(1);
      
      if (userExists.length === 0) {
        console.log(`❌ DEBUG: User not found in database: ${id}`);
        throw new Error("User not found");
      }
      
      const user = userExists[0];
      console.log(`✅ DEBUG: User found - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
      
      // STEP 2: Check what events will be affected by CASCADE
      const relatedEvents = await db.select({
        id: events.id,
        title: events.title,
        ownerId: events.ownerId
      })
        .from(events)
        .where(eq(events.ownerId, id));
      
      console.log(`📊 DEBUG: Events owned by user: ${relatedEvents.length}`);
      relatedEvents.forEach((event, index) => {
        console.log(`  ${index + 1}. Event ID: ${event.id}, Title: "${event.title}", Owner: ${event.ownerId}`);
      });
      
      // STEP 3: Check constraints in database
      console.log(`🔍 DEBUG: Checking CASCADE constraint configuration...`);
      
      try {
        // Test with parameterized query to avoid SQL injection
        const result = await db.execute(
          sql`SELECT 
              tc.constraint_name,
              rc.delete_rule,
              CASE 
                  WHEN rc.delete_rule = 'CASCADE' THEN 'ENABLED'
                  ELSE 'DISABLED'
              END as cascade_status
          FROM information_schema.table_constraints tc
          JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
          WHERE tc.constraint_name = 'events_owner_id_fkey'`
        );
        
        console.log(`🔧 DEBUG: CASCADE constraint status:`, result);
      } catch (constraintError) {
        console.error(`❌ DEBUG: Error checking constraints:`, constraintError);
      }
      
      // STEP 4: Attempt deletion with detailed error catching
      console.log(`🗑️ DEBUG: Attempting user deletion with SQL execute...`);
      
      try {
        await db.execute(sql`DELETE FROM app_users WHERE id = ${id}`);
        console.log(`✅ DEBUG: User deletion successful via SQL execute`);
      } catch (deleteError) {
        console.error(`❌ DEBUG: SQL execute deletion failed:`, deleteError);
        
        // Additional debug: Try manual cascade deletion
        console.log(`🔄 DEBUG: Attempting manual cascade deletion...`);
        try {
          // First delete related events manually
          const eventsDeleted = await db.delete(events).where(eq(events.ownerId, id));
          console.log(`🗑️ DEBUG: Manually deleted events:`, eventsDeleted);
          
          // Then delete the user
          const userDeleted = await db.delete(appUsers).where(eq(appUsers.id, id));
          console.log(`🗑️ DEBUG: Manually deleted user:`, userDeleted);
          console.log(`✅ DEBUG: Manual cascade deletion successful`);
        } catch (manualError) {
          console.error(`❌ DEBUG: Manual cascade deletion also failed:`, manualError);
          throw manualError;
        }
      }
    });
  }

  async getPhotosByEventWithLikes(eventId: string, currentUserId?: string): Promise<PhotoWithUserAndLikes[]> {
    try {
      // MAIN PHOTO RETRIEVAL FUNCTION: This is the primary function used by frontend
      // It combines photo data, user info, and like information for complete gallery display
      console.log(`Getting photos with likes for event ${eventId}, user ${currentUserId}`);
      
      // STEP 1: Get basic photos with user names (includes guest user support via LEFT JOIN)
      // This call uses the fixed LEFT JOIN query that supports guest users
      const basicPhotos = await this.getPhotosByEvent(eventId);
      console.log(`Found ${basicPhotos.length} basic photos`);
      
      // STEP 2: Enrich each photo with social features (likes)
      // For each photo, add like count and user's like status
      const photosWithLikes = await Promise.all(
        basicPhotos.map(async (photo) => {
          try {
            const likeCount = await this.getPhotoLikeCount(photo.id);
            const commentCount = await this.getPhotoCommentCount(photo.id);
            const isLikedByCurrentUser = currentUserId 
              ? await this.isPhotoLikedByUser(photo.id, currentUserId)
              : false; // Guest users without currentUserId default to not liked
            
            return {
              ...photo,
              likeCount,
              commentCount,
              isLikedByCurrentUser
            };
          } catch (error) {
            // INDIVIDUAL PHOTO ERROR HANDLING: Don't fail entire request if one photo has issues
            // This prevents the gallery from breaking due to corrupted like data
            console.error(`Error processing likes for photo ${photo.id}:`, error);
            return {
              ...photo,
              likeCount: 0,
              commentCount: 0,
              isLikedByCurrentUser: false
            };
          }
        })
      );
      
      console.log(`Returning ${photosWithLikes.length} photos with likes`);
      return photosWithLikes;
    } catch (error) {
      // CRITICAL ERROR LOG: If this fails, no photos will be displayed in gallery
      console.error('Error in getPhotosByEventWithLikes:', error);
      throw error;
    }
  }

  async likePhoto(photoId: string, userId: string): Promise<PhotoLike> {
    return await executeDbOperation(async (db) => {
      const result = await db.insert(photoLikes).values({
        photoId,
        userId
      }).returning();
      return result[0];
    });
  }

  async unlikePhoto(photoId: string, userId: string): Promise<void> {
    return await executeDbOperation(async (db) => {
      await db.delete(photoLikes).where(
        and(eq(photoLikes.photoId, photoId), eq(photoLikes.userId, userId))
      );
    });
  }

  async getPhotoLikes(photoId: string): Promise<PhotoLike[]> {
    return await executeDbOperation(async (db) => {
      const result = await db.select().from(photoLikes)
        .where(eq(photoLikes.photoId, photoId))
        .orderBy(desc(photoLikes.createdAt));
      return result;
    });
  }

  async getPhotoLikeCount(photoId: string): Promise<number> {
    return await executeDbOperation(async (db) => {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(photoLikes)
        .where(eq(photoLikes.photoId, photoId));
      return Number(result[0]?.count || 0);
    });
  }

  async isPhotoLikedByUser(photoId: string, userId: string): Promise<boolean> {
    return await executeDbOperation(async (db) => {
      const result = await db.select().from(photoLikes)
        .where(and(eq(photoLikes.photoId, photoId), eq(photoLikes.userId, userId)))
        .limit(1);
      return result.length > 0;
    });
  }

  // Photo Comments Implementation
  async getPhotoComments(photoId: string): Promise<PhotoCommentWithUser[]> {
    return await executeDbOperation(async (db) => {
      const result = await db.select({
        id: photoComments.id,
        photoId: photoComments.photoId,
        userId: photoComments.userId,
        userName: photoComments.userName,
        comment: photoComments.comment,
        createdAt: photoComments.createdAt
      }).from(photoComments)
        .where(eq(photoComments.photoId, photoId))
        .orderBy(desc(photoComments.createdAt));
      
      return result;
    });
  }

  async createPhotoComment(comment: InsertPhotoComment): Promise<PhotoComment> {
    return await executeDbOperation(async (db) => {
      const result = await db.insert(photoComments).values(comment).returning();
      return result[0];
    });
  }

  async deletePhotoComment(commentId: string): Promise<void> {
    return await executeDbOperation(async (db) => {
      await db.delete(photoComments).where(eq(photoComments.id, commentId));
    });
  }

  async getPhotoCommentCount(photoId: string): Promise<number> {
    return await executeDbOperation(async (db) => {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(photoComments)
        .where(eq(photoComments.photoId, photoId));
      return Number(result[0]?.count || 0);
    });
  }

  async migratePhotosToEvent(fromEventId: string, toEventId: string): Promise<number> {
    return await executeDbOperation(async (db) => {
      try {
        const result = await db.update(photos)
          .set({ eventId: toEventId })
          .where(eq(photos.eventId, fromEventId))
          .returning();
        
        console.log(`🔄 Migrated ${result.length} photos from ${fromEventId} to ${toEventId}`);
        return result.length;
      } catch (error) {
        console.error("Migration error:", error);
        throw error;
      }
    });
  }

  /* 
    DUPLICATE DETECTION FUNCTION
    
    PURPOSE: Find all events associated with a user to detect and clean duplicates
    
    DEBUGGING GUIDE:
    - If personal events not found: Check events.ownerId matches user ID exactly
    - If generic events not detected: Verify LIKE pattern matches event titles
    - If function returns empty: User may have no events or different ID format
    
    DETECTION LOGIC:
    - Personal events: Have ownerId set to user ID (correct format)
    - Generic events: Have ownerId = NULL and title contains username patterns
    
    COMMON ISSUES:
    - ID format mismatch: Ensure userId parameter matches database format
    - Pattern matching: Adjust LIKE patterns if event titles use different naming
    - Database permissions: Verify read access to events table
  */
  async findDuplicateEvents(userId: string): Promise<{ personal: any[], generic: any[] }> {
    return await executeDbOperation(async (db) => {
      try {
        console.log(`🔍 DUPLICATE SEARCH: Starting search for userId=${userId}`);
        
        // Find personal events (with ownerId)
        const personalEvents = await db.select()
          .from(events)
          .where(eq(events.ownerId, userId));
        
        console.log(`🔍 PERSONAL EVENTS FOUND: ${personalEvents.length} events for userId=${userId}`);
        
        // Find generic events created with username patterns
        const genericEvents = await db.select()
          .from(events)
          .where(
            and(
              sql`${events.ownerId} IS NULL`,
              sql`${events.title} LIKE '%${userId}%' OR ${events.title} LIKE '%album%'`
            )
          );
        
        console.log(`🔍 GENERIC EVENTS FOUND: ${genericEvents.length} events matching patterns`);
        
        // DEBUG: Log found events for troubleshooting
        if (personalEvents.length > 0) {
          console.log(`📋 PERSONAL EVENTS:`, personalEvents.map(e => ({ id: e.id, title: e.title, ownerId: e.ownerId })));
        }
        if (genericEvents.length > 0) {
          console.log(`📋 GENERIC EVENTS:`, genericEvents.map(e => ({ id: e.id, title: e.title, ownerId: e.ownerId })));
        }
        
        return { personal: personalEvents, generic: genericEvents };
      } catch (error) {
        console.error(`❌ DUPLICATE SEARCH ERROR: userId=${userId}`, error);
        return { personal: [], generic: [] };
      }
    });
  }

  /* 
    DUPLICATE CLEANUP FUNCTION
    
    PURPOSE: Automatically remove duplicate events while preserving data integrity
    
    CLEANUP STRATEGY:
    1. Find all events for user (personal + generic)
    2. Keep the most recent personal event (by createdAt timestamp)
    3. Migrate photos from duplicate events to the kept event
    4. Delete duplicate events safely
    
    DEBUGGING GUIDE:
    - If cleanup fails: Check CASCADE constraints in database schema
    - If photos lost: Verify migratePhotosToEvent executed before deletion
    - If wrong event kept: Check createdAt timestamps and sorting logic
    - If nothing cleaned: User may have no duplicates (expected behavior)
    
    SAFETY FEATURES:
    - Always migrate photos before deletion
    - Keep most recent event (likely has latest user customizations)
    - Comprehensive logging for audit trail
    - Transaction-like behavior (migrate first, then delete)
  */
  async cleanupDuplicateEvents(userId: string): Promise<{ removed: number, kept: string }> {
    try {
      console.log(`🧹 CLEANUP START: Processing duplicates for userId=${userId}`);
      
      const { personal, generic } = await this.findDuplicateEvents(userId);
      
      if (personal.length === 0) {
        console.log(`⚠️ NO PERSONAL EVENTS: No cleanup needed for userId=${userId}`);
        return { removed: 0, kept: "" };
      }
      
      if (personal.length === 1 && generic.length === 0) {
        console.log(`✅ NO DUPLICATES: User has single personal event, no cleanup needed`);
        return { removed: 0, kept: personal[0].id };
      }
      
      // Keep the most recent personal event (by createdAt timestamp)
      const keepEvent = personal.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      console.log(`📌 KEEPING EVENT: ${keepEvent.id} - "${keepEvent.title}" (created: ${keepEvent.createdAt})`);
      
      // Remove older personal events and all generic events
      const eventsToRemove = [
        ...personal.filter(e => e.id !== keepEvent.id),
        ...generic
      ];
      
      console.log(`🗑️ REMOVING ${eventsToRemove.length} DUPLICATE EVENTS`);
      
      // CRITICAL: Migrate photos before deletion to prevent data loss
      for (const event of eventsToRemove) {
        console.log(`🔄 MIGRATING PHOTOS: from ${event.id} to ${keepEvent.id}`);
        const migratedCount = await this.migratePhotosToEvent(event.id, keepEvent.id);
        console.log(`✅ PHOTOS MIGRATED: ${migratedCount} photos from "${event.title}"`);
        
        // Delete the duplicate event after successful photo migration
        console.log(`🗑️ DELETING EVENT: ${event.id} - "${event.title}"`);
        await executeDbOperation(async (db) => {
          await db.delete(events).where(eq(events.id, event.id));
        });
      }
      
      console.log(`✅ CLEANUP COMPLETED: ${eventsToRemove.length} events removed, kept: ${keepEvent.id}`);
      return { removed: eventsToRemove.length, kept: keepEvent.id };
    } catch (error) {
      console.error(`❌ CLEANUP ERROR: userId=${userId}`, error);
      throw error;
    }
  }

  // MIGRATION FUNCTION: Add date columns to events table
  async migrateAddDateColumns(): Promise<any> {
    return await executeDbOperation(async (db) => {
      try {
        console.log('🔄 MIGRATION: Adding date columns to events table...');
        
        // Check which columns exist first
        const checkColumns = await db.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'events' 
          AND column_name IN ('event_date', 'event_time', 'timezone', 'enable_auto_redirect')
        `);
        
        console.log('📋 EXISTING COLUMNS:', checkColumns);
        
        // Add missing columns one by one
        const existingColumns = checkColumns.map((row: any) => row.column_name);
        
        if (!existingColumns.includes('event_date')) {
          await db.execute(sql`ALTER TABLE events ADD COLUMN event_date TEXT`);
          console.log('✅ Added event_date column');
        }
        
        if (!existingColumns.includes('event_time')) {
          await db.execute(sql`ALTER TABLE events ADD COLUMN event_time TEXT`);
          console.log('✅ Added event_time column');
        }
        
        if (!existingColumns.includes('timezone')) {
          await db.execute(sql`ALTER TABLE events ADD COLUMN timezone TEXT DEFAULT 'America/Mexico_City'`);
          console.log('✅ Added timezone column');
        }
        
        if (!existingColumns.includes('enable_auto_redirect')) {
          await db.execute(sql`ALTER TABLE events ADD COLUMN enable_auto_redirect BOOLEAN DEFAULT false`);
          console.log('✅ Added enable_auto_redirect column');
        }
        
        console.log('✅ MIGRATION: All date columns migration completed');
        return { success: true, existingColumns, addedColumns: 4 - existingColumns.length };
      } catch (error) {
        console.error('❌ MIGRATION ERROR:', error);
        throw error;
      }
    });
  }

  // PHASE 2: Event Attendees Implementation
  async getEventAttendees(eventId: string): Promise<EventAttendeeWithUser[]> {
    return await executeDbOperation(async (db) => {
      try {
        const result = await db.select({
          // Attendee fields
          id: eventAttendees.id,
          eventId: eventAttendees.eventId,
          userId: eventAttendees.userId,
          guestEmail: eventAttendees.guestEmail,
          guestName: eventAttendees.guestName,
          guestWhatsapp: eventAttendees.guestWhatsapp,
          companionsCount: eventAttendees.companionsCount,
          status: eventAttendees.status,
          qrCode: eventAttendees.qrCode,
          confirmedAt: eventAttendees.confirmedAt,
          checkedInAt: eventAttendees.checkedInAt,
          checkedInBy: eventAttendees.checkedInBy,
          createdAt: eventAttendees.createdAt,
          // User fields
          userName: appUsers.username,
          userFullName: appUsers.fullName,
          userEmail: appUsers.email,
        })
          .from(eventAttendees)
          .leftJoin(appUsers, eq(eventAttendees.userId, appUsers.id))
          .where(eq(eventAttendees.eventId, eventId))
          .orderBy(desc(eventAttendees.createdAt));
        
        return result;
      } catch (error) {
        console.error('Error getting event attendees:', error);
        throw error;
      }
    });
  }

  async getEventAttendeeByUser(eventId: string, userId: string): Promise<EventAttendee | undefined> {
    return await executeDbOperation(async (db) => {
      const result = await db.select()
        .from(eventAttendees)
        .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId)))
        .limit(1);
      return result[0];
    });
  }

  async confirmAttendance(eventId: string, userId: string): Promise<EventAttendee> {
    return await executeDbOperation(async (db) => {
      // Check if already confirmed
      const existing = await this.getEventAttendeeByUser(eventId, userId);
      
      if (existing) {
        // Update existing record to confirmed status
        const updated = await db.update(eventAttendees)
          .set({ 
            status: 'confirmed', 
            confirmedAt: new Date(),
            qrCode: await this.generateUniqueQR(eventId, userId)
          })
          .where(eq(eventAttendees.id, existing.id))
          .returning();
        return updated[0];
      } else {
        // Create new confirmation record
        const result = await db.insert(eventAttendees)
          .values({
            eventId,
            userId,
            guestName: userId, // Use userId as fallback name for registered users
            status: 'confirmed',
            confirmedAt: new Date(),
            qrCode: await this.generateUniqueQR(eventId, userId)
          })
          .returning();
        return result[0];
      }
    });
  }

  async updateAttendeeStatus(attendeeId: string, status: string, checkedInBy?: string): Promise<EventAttendee> {
    return await executeDbOperation(async (db) => {
      const updates: any = { status };
      
      if (status === 'present') {
        updates.checkedInAt = new Date();
        if (checkedInBy !== undefined) {
          updates.checkedInBy = checkedInBy; // Can be null for QR/scanner or string for manual admin
        }
      } else if (status === 'confirmed') {
        // When undoing check-in, clear check-in data
        updates.checkedInAt = null;
        updates.checkedInBy = null;
      }
      
      const result = await db.update(eventAttendees)
        .set(updates)
        .where(eq(eventAttendees.id, attendeeId))
        .returning();
      
      if (!result[0]) {
        throw new Error("Attendee not found");
      }
      
      return result[0];
    });
  }

  async getAttendeeByQR(qrCode: string): Promise<EventAttendee | undefined> {
    return await executeDbOperation(async (db) => {
      const result = await db.select()
        .from(eventAttendees)
        .where(eq(eventAttendees.qrCode, qrCode))
        .limit(1);
      return result[0];
    });
  }

  async getAttendeeById(attendeeId: string): Promise<EventAttendee | undefined> {
    return await executeDbOperation(async (db) => {
      const result = await db.select()
        .from(eventAttendees)
        .where(eq(eventAttendees.id, attendeeId))
        .limit(1);
      return result[0];
    });
  }

  async updateEventAttendee(attendeeId: string, updates: any): Promise<EventAttendee> {
    return await executeDbOperation(async (db) => {
      const result = await db.update(eventAttendees)
        .set(updates)
        .where(eq(eventAttendees.id, attendeeId))
        .returning();
      
      if (!result[0]) {
        throw new Error("Attendee not found");
      }
      
      return result[0];
    });
  }

  async getAttendeeStats(eventId: string): Promise<AttendeeStats> {
    return await executeDbOperation(async (db) => {
      const attendees = await db.select()
        .from(eventAttendees)
        .where(eq(eventAttendees.eventId, eventId));
      
      const stats = {
        total: attendees.length,
        pending: attendees.filter(a => a.status === 'pending').length,
        confirmed: attendees.filter(a => a.status === 'confirmed').length,
        present: attendees.filter(a => a.status === 'present').length,
        absent: attendees.filter(a => a.status === 'absent').length,
      };
      
      return stats;
    });
  }

  async generateUniqueQR(eventId: string, userId: string): Promise<string> {
    // Generate unique QR code with format: EVENT_USER_TIMESTAMP
    const timestamp = Date.now();
    const shortEventId = eventId.slice(-8);
    const shortUserId = userId.replace('-user-id', '');
    return `QR_${shortEventId}_${shortUserId}_${timestamp}`;
  }

  // PHASE 2: Guest attendance confirmation (for non-registered attendees)
  async confirmGuestAttendance(eventId: string, guestData: any): Promise<EventAttendee> {
    return await executeDbOperation(async (db) => {
      // Check if guest already confirmed with same email
      const existing = await db.select()
        .from(eventAttendees)
        .where(and(
          eq(eventAttendees.eventId, eventId),
          eq(eventAttendees.guestEmail, guestData.guestEmail)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Update existing guest record
        const updated = await db.update(eventAttendees)
          .set({ 
            status: guestData.status || 'confirmed', 
            confirmedAt: new Date(),
            qrCode: await this.generateGuestQR(eventId, guestData.guestEmail),
            guestName: guestData.guestName,
            guestWhatsapp: guestData.guestWhatsapp,
            companionsCount: guestData.companionsCount || "0"
          })
          .where(eq(eventAttendees.id, existing[0].id))
          .returning();
        return updated[0];
      } else {
        // Create new guest confirmation record
        const result = await db.insert(eventAttendees)
          .values({
            eventId,
            userId: null, // Null for guests
            guestEmail: guestData.guestEmail,
            guestName: guestData.guestName,
            guestWhatsapp: guestData.guestWhatsapp,
            companionsCount: guestData.companionsCount || "0",
            status: guestData.status || 'confirmed',
            confirmedAt: new Date(),
            qrCode: await this.generateGuestQR(eventId, guestData.guestEmail)
          })
          .returning();
        return result[0];
      }
    });
  }

  // Generate unique QR for guest attendees - FRIENDLY FORMAT
  async generateGuestQR(eventId: string, guestEmail: string): Promise<string> {
    const timestamp = Date.now();
    
    // Friendly format: (nombre)(timestamp) - e.g., LENNIN1234
    const name = guestEmail.split('@')[0].slice(0, 6).toUpperCase(); // First 6 chars of email
    const shortTime = timestamp.toString().slice(-4); // Last 4 digits of timestamp for uniqueness
    
    return `${name}${shortTime}`;
  }

  // PHASE 2: Database migration for guest support
  async migrateAttendeesTableForGuests(): Promise<any> {
    try {
      console.log('🔄 MIGRATION: Updating event_attendees table for guest support...');
      
      // Add new columns for guest support
      const alterQueries = [
        // Make user_id nullable for guest attendees
        sql`ALTER TABLE event_attendees ALTER COLUMN user_id DROP NOT NULL`,
        
        // Add guest-specific columns
        sql`ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS guest_email TEXT`,
        sql`ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS guest_name TEXT`,
        sql`ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS guest_whatsapp TEXT`,
        
        // Update constraint to ensure either user_id or guest_email is present
        sql`ALTER TABLE event_attendees ADD CONSTRAINT check_attendee_identity 
            CHECK ((user_id IS NOT NULL) OR (guest_email IS NOT NULL AND guest_name IS NOT NULL))`
      ];

      const results = [];
      for (const query of alterQueries) {
        try {
          await executeDbOperation(async (db) => {
            const result = await db.execute(query);
            // results.push(result as any); // Skip adding to results to avoid type error
            return result;
          });
        } catch (error: any) {
          // Ignore "already exists" errors for idempotent migration
          if (!error.message?.includes('already exists') && !error.message?.includes('already exists')) {
            console.warn('Migration query warning:', error.message);
          }
        }
      }
      
      console.log('✅ MIGRATION: event_attendees table updated for guest support');
      return { success: true, queriesExecuted: alterQueries.length };
    } catch (error) {
      console.error('❌ MIGRATION ERROR:', error);
      throw error;
    }
  }

  // MIGRATION FUNCTION: Add event_attendees table (legacy)
  async migrateAddAttendeeTable(): Promise<any> {
    try {
      console.log('🔄 MIGRATION: Creating event_attendees table...');
      
      return await executeDbOperation(async (db) => {
        const result = await db.execute(sql`
          CREATE TABLE IF NOT EXISTS event_attendees (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
            guest_email TEXT,
            guest_name TEXT,
            guest_whatsapp TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            qr_code TEXT UNIQUE,
            confirmed_at TIMESTAMP,
            checked_in_at TIMESTAMP,
            checked_in_by TEXT REFERENCES app_users(id),
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            CONSTRAINT check_attendee_identity 
              CHECK ((user_id IS NOT NULL) OR (guest_email IS NOT NULL AND guest_name IS NOT NULL))
          )
        `);
        return result;
      });
      
      console.log('✅ MIGRATION: event_attendees table created successfully');
    } catch (error) {
      console.error('❌ MIGRATION ERROR:', error);
      throw error;
    }
  }

  // EMERGENCY MIGRATION METHOD: Execute raw SQL queries
  async executeRawQuery(query: string): Promise<any> {
    try {
      console.log('🛠️ EXECUTING RAW QUERY:', query);
      return await executeDbOperation(async (db) => {
        const result = await db.execute(sql.raw(query));
        return result;
      });
      console.log('✅ RAW QUERY EXECUTED SUCCESSFULLY');
    } catch (error) {
      console.error('❌ RAW QUERY ERROR:', error);
      throw error;
    }
  }

  // Alias for executeRawQuery for URL Shortener system
  async executeRawSQL(query: string): Promise<any> {
    return this.executeRawQuery(query);
  }

  // Direct database access for advanced queries
  getDb() {
    if (!fallbackDb) {
      throw new Error("Local database connection not available");
    }
    return fallbackDb;
  }

  // Notification Settings Implementation - Removed admin notifications functionality

  // ============================================================================= 
  // BRANDED LINKS SYSTEM - URL Shortener Implementation
  // =============================================================================

  async getBrandedLinks(): Promise<BrandedLink[]> {
    return await executeDbOperation(async (db) => {
      const result = await db.select()
        .from(brandedLinks)
        .orderBy(desc(brandedLinks.createdAt));
      return result;
    });
  }

  async getBrandedLinkByCode(shortCode: string): Promise<BrandedLink | undefined> {
    return await executeDbOperation(async (db) => {
      const result = await db.select()
        .from(brandedLinks)
        .where(eq(brandedLinks.shortCode, shortCode))
        .limit(1);
      return result[0];
    });
  }

  async createBrandedLink(link: InsertBrandedLink): Promise<BrandedLink> {
    return await executeDbOperation(async (db) => {
      const result = await db.insert(brandedLinks)
        .values(link)
        .returning();
      return result[0];
    });
  }

  async updateBrandedLink(id: string, updates: Partial<BrandedLink>): Promise<BrandedLink> {
    return await executeDbOperation(async (db) => {
      const result = await db.update(brandedLinks)
        .set(updates)
        .where(eq(brandedLinks.id, id))
        .returning();
      return result[0];
    });
  }

  async deleteBrandedLink(id: string): Promise<void> {
    return await executeDbOperation(async (db) => {
      await db.delete(brandedLinks)
        .where(eq(brandedLinks.id, id));
    });
  }

  async incrementLinkClicks(shortCode: string): Promise<void> {
    return await executeDbOperation(async (db) => {
      // Update click count and last clicked timestamp
      await db.update(brandedLinks)
        .set({
          clicks: sql`(${brandedLinks.clicks}::integer + 1)::text`,
          lastClickedAt: new Date()
        })
        .where(eq(brandedLinks.shortCode, shortCode));
    });
  }
}

// Export storage instance with initialization
export const storage = new DatabaseStorage();

// Initialize users on module load
(async () => {
  try {
    await initializeDefaultUsers();
    console.log("🎉 Default users initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize default users:", error);
  }
})();
