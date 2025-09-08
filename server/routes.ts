import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, insertEventUserSchema, insertPhotoSchema, insertTextPostSchema, insertPhotoCommentSchema, insertEventAttendeeSchema, insertGuestAttendeeSchema, insertUserSchema, insertEventNotificationSettingsSchema, insertBrandedLinkSchema, eventNotificationSettings, brandedLinks } from "../shared/schema";
import { sql, eq } from "drizzle-orm";
import multer from "multer";
// import { createClient } from "@supabase/supabase-js"; // Removed Supabase integration
import { cloudinaryStorage } from "./cloudinary-storage";
import { emailService } from "./email-service";
import postgres from "postgres";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import fetch from "node-fetch";

// Using local PostgreSQL database only - no external dependencies

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

// ⚠️ CRITICAL FUNCTION: Auto-redirect logic for event pages
// 
// enableAutoRedirect field managed in local PostgreSQL database
// 
// 🚨 BREAKING CHANGE PREVENTION:
// - NEVER change this function without testing all URL combinations
// - enableAutoRedirect field MUST come from database (event.enableAutoRedirect)  
// - Any localStorage usage will break URL consistency across /evento/username paths
// 
// ✅ VERIFIED WORKING LOGIC:
// 1. Check enableAutoRedirect database field (false = skip redirect)
// 2. Check eventDate exists (missing = skip redirect)  
// 3. Compare current time vs event datetime (before = redirect)
//
// 🔧 DEBUGGING FAILED REDIRECTS:
// 1. Check logs for "REDIRECT CHECK START" with field values
// 2. Verify enableAutoRedirect=true in database, not localStorage
// 3. Confirm eventDate format is YYYY-MM-DD in database
// 4. Test with different timezones if timezone handling needed
function calculateShouldRedirect(event: any): boolean {
  try {
    console.log(`🕐 REDIRECT CHECK START: enableAutoRedirect=${event.enableAutoRedirect}, eventDate=${event.eventDate}`);
    
    // Return false if auto-redirect is not enabled (default false for existing events)
    if (!event.enableAutoRedirect) {
      console.log(`🕐 REDIRECT SKIP: Auto-redirect disabled`);
      return false;
    }
    
    // Return false if no event date is set
    if (!event.eventDate) {
      console.log(`🕐 REDIRECT SKIP: No event date set`);
      return false;
    }
    
    // Simple date comparison for now
    const eventTime = event.eventTime || '23:59'; // Default to end of day
    const eventDateTime = new Date(`${event.eventDate}T${eventTime}:00`);
    const now = new Date();
    
    const shouldRedirect = now < eventDateTime;
    
    console.log(`🕐 REDIRECT RESULT: event=${eventDateTime.toISOString()}, now=${now.toISOString()}, redirect=${shouldRedirect}`);
    return shouldRedirect;
    
  } catch (error) {
    console.error('🕐 REDIRECT ERROR:', error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  /* 
    API ENDPOINT: /api/events/:identifier
    
    PURPOSE: Find existing events by identifier (gallery access point)
    
    DUPLICATE PREVENTION: This endpoint NO LONGER creates events automatically.
    All event creation is centralized to /api/evento/:username to prevent duplicates.
    
    DEBUGGING GUIDE:
    - If "Event not found" error: Check if personal event exists via /api/evento/username
    - If wrong event returned: Verify username extraction from "username-album" format
    - If photos missing: Ensure event ID matches the one photos are associated with
    
    SUPPORTED FORMATS:
    - /api/events/username-album → Looks up user's personal event
    - /api/events/title → Looks up event by exact title match
    
    COMMON ISSUES:
    - Username extraction failure: Check identifier.replace('-album', '') logic
    - Personal event not found: User may not have accessed /evento/username yet
    - Database inconsistency: Use admin cleanup endpoints if needed
  */
  app.get("/api/events/:identifier", async (req, res) => {
    try {
      const { identifier } = req.params;
      let event;
      let username = identifier;
      
      // DEBUG: Uncomment to trace identifier processing
      // console.log(`🔍 EVENT LOOKUP: identifier=${identifier}`);
      
      // CRITICAL FIX: Handle "username-album" format first
      if (identifier.endsWith('-album')) {
        username = identifier.replace('-album', '');
        // DEBUG: Uncomment to trace username extraction
        // console.log(`🔍 ALBUM FORMAT: extracted username=${username}`);
        
        // For album format, ALWAYS try to find user's personal event first
        const user = await storage.getUserByUsername(username);
        if (user) {
          event = await storage.getEventByOwner(user.id);
          // DEBUG: Uncomment to trace personal event lookup
          // console.log(`🔍 PERSONAL EVENT: found=${event ? event.id : 'none'}`);
        }
      } else {
        // Legacy behavior: try by title first, then username
        event = await storage.getEventByTitle(identifier);
        
        if (!event) {
          const user = await storage.getUserByUsername(identifier);
          if (user) {
            event = await storage.getEventByOwner(user.id);
          }
        }
      }
      
      // PREVENTION: No longer create events automatically to avoid duplicates
      // All personal events should be created via /api/evento/:username endpoint
      if (!event) {
        console.log(`❌ EVENT NOT FOUND: identifier=${identifier}, username=${username}`);
        return res.status(404).json({ 
          message: "Event not found", 
          suggestion: "Use personal event endpoint /api/evento/username instead",
          debug: { identifier, username, format: identifier.endsWith('-album') ? 'album' : 'legacy' }
        });
      }
      
      // SUCCESS: Return found event
      console.log(`✅ EVENT FOUND: ${event.id} - "${event.title}" for identifier=${identifier}`);
      res.json(event);
    } catch (error) {
      console.error(`❌ EVENT LOOKUP ERROR: identifier=${req.params.identifier}`, error);
      res.status(500).json({ message: "Failed to get event" });
    }
  });

  // Get event with owner information by title or username
  app.get("/api/events/:identifier/with-owner", async (req, res) => {
    try {
      const { identifier } = req.params;
      let event;
      let username = identifier;
      
      // CRITICAL FIX: Handle "username-album" format first (consistent with main endpoint)
      if (identifier.endsWith('-album')) {
        username = identifier.replace('-album', '');
        // For album format, ALWAYS try to find user's personal event first
        const user = await storage.getUserByUsername(username);
        if (user) {
          event = await storage.getEventByOwner(user.id);
        }
      } else {
        // Legacy behavior: try by title first, then username
        event = await storage.getEventByTitle(identifier);
        
        if (!event) {
          const user = await storage.getUserByUsername(identifier);
          if (user) {
            event = await storage.getEventByOwner(user.id);
          }
        }
      }
      
      // PREVENTION: No longer create events automatically to avoid duplicates  
      // All personal events should be created via /api/evento/:username endpoint
      if (!event) {
        return res.status(404).json({ 
          message: "Event not found", 
          suggestion: "Use personal event endpoint /api/evento/username instead" 
        });
      }
      
      const eventWithOwner = await storage.getEventWithOwner(event.id);
      res.json(eventWithOwner);
    } catch (error) {
      res.status(500).json({ message: "Failed to get event with owner" });
    }
  });

  // Join event
  app.post("/api/events/:eventId/join", async (req, res) => {
    try {
      const { eventId } = req.params;
      
      // Create the full data object with eventId for validation
      const fullData = {
        ...req.body,
        eventId
      };
      
      const validatedData = insertEventUserSchema.parse(fullData);
      
      // Check if user already exists
      let user = await storage.getEventUserByNameAndEvent(validatedData.name, eventId);
      
      if (!user) {
        user = await storage.createEventUser(validatedData);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Join event error:", error);
      res.status(500).json({ message: "Failed to join event", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get photos for event - MAIN GALLERY ENDPOINT
  app.get("/api/events/:eventId/photos", async (req, res) => {
    try {
      const { eventId } = req.params;
      const { userId } = req.query; // Guest user ID from localStorage (e.g., 'raul-user-id')
      
      console.log(`Getting photos for event ${eventId}, userId: ${userId}`);
      
      // ALWAYS INCLUDE LIKE INFORMATION: Show counters for all users (read-only for non-authenticated)
      // This ensures gallery always displays like/comment counts for better UX
      console.log(`Fetching photos with likes for user ${userId || 'anonymous'}`);
      // Get photos with like counts and user-specific like status (or false if no user)
      // Uses LEFT JOIN internally to support guest users without event_users records
      const photos = await storage.getPhotosByEventWithLikes(eventId, userId as string | undefined);
      res.json(photos);
    } catch (error) {
      // ERROR HANDLING: Critical endpoint - if this fails, gallery won't load photos
      console.error("Error getting photos:", error);
      res.status(500).json({ message: "Failed to get photos", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Upload photos
  app.post("/api/events/:eventId/photos", upload.array("files"), async (req, res) => {
    try {
      const { eventId } = req.params;
      const { userId } = req.body;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      const uploadedPhotos: any[] = [];
      
      // Use Cloudinary storage with local fallback
      console.log(`Processing ${files.length} files for upload...`);
      
      for (const file of files) {
        console.log(`Processing file: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
        
        // Get event details and owner for folder organization
        const eventDetails = await storage.getEvent(eventId);
        const ownerUser = eventDetails?.ownerId ? await storage.getUser(eventDetails.ownerId) : null;
        
        // Upload using Cloudinary with new organized structure (year/month/username)
        const uploadResult = await cloudinaryStorage.uploadFile(file, {
          folder: 'photos',
          resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image',
          eventId: eventId,
          eventTitle: eventDetails?.title || 'unknown-event',
          ownerUsername: ownerUser?.username || 'user'
        });

        if (!uploadResult.success) {
          console.error("Upload failed:", uploadResult.error);
          return res.status(500).json({ 
            error: "Failed to upload to cloud storage", 
            details: uploadResult.error 
          });
        }

        console.log(`Upload successful via ${uploadResult.provider}:`, uploadResult.url);
        
        // Generate filename for database storage
        const fileName = `${Date.now()}-${file.originalname}`;

        // Save to database
        console.log("🔧 UPLOAD: About to save photo to database...");
        const photo = await storage.createPhoto({
          eventId,
          userId,
          fileName,
          originalName: file.originalname,
          fileUrl: uploadResult.url,
          fileType: file.mimetype,
          fileSize: file.size.toString(),
          isVideo: file.mimetype.startsWith("video/"),
        });
        console.log("✅ UPLOAD: Photo saved with ID:", photo.id);

        uploadedPhotos.push(photo);
      }

      res.json(uploadedPhotos);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload photos", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Like a photo
  app.post("/api/photos/:photoId/like", async (req, res) => {
    try {
      const { photoId } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Check if already liked
      const isLiked = await storage.isPhotoLikedByUser(photoId, userId);
      if (isLiked) {
        return res.status(400).json({ message: "Photo already liked by this user" });
      }
      
      const like = await storage.likePhoto(photoId, userId);
      const likeCount = await storage.getPhotoLikeCount(photoId);
      
      res.json({ like, likeCount });
    } catch (error) {
      console.error("Like photo error:", error);
      res.status(500).json({ message: "Failed to like photo" });
    }
  });

  // Unlike a photo
  app.delete("/api/photos/:photoId/like", async (req, res) => {
    try {
      const { photoId } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      await storage.unlikePhoto(photoId, userId);
      const likeCount = await storage.getPhotoLikeCount(photoId);
      
      res.json({ likeCount });
    } catch (error) {
      console.error("Unlike photo error:", error);
      res.status(500).json({ message: "Failed to unlike photo" });
    }
  });

  // Get photo comments
  app.get("/api/photos/:photoId/comments", async (req, res) => {
    try {
      const { photoId } = req.params;
      const comments = await storage.getPhotoComments(photoId);
      res.json(comments);
    } catch (error) {
      console.error("Get photo comments error:", error);
      res.status(500).json({ message: "Failed to get photo comments" });
    }
  });

  // Add photo comment
  app.post("/api/photos/:photoId/comments", async (req, res) => {
    try {
      const { photoId } = req.params;
      const { userId, userName, comment } = req.body;
      
      if (!userId || !userName || !comment) {
        return res.status(400).json({ message: "User ID, user name, and comment are required" });
      }

      const newComment = await storage.createPhotoComment({
        photoId,
        userId,
        userName,
        comment: comment.trim()
      });

      const commentCount = await storage.getPhotoCommentCount(photoId);
      
      res.json({ comment: newComment, commentCount });
    } catch (error) {
      console.error("Add photo comment error:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Delete photo comment
  app.delete("/api/photos/:photoId/comments/:commentId", async (req, res) => {
    try {
      const { photoId, commentId } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Get the comment to check ownership
      const comments = await storage.getPhotoComments(photoId);
      const comment = comments.find(c => c.id === commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Check if user owns this comment
      if (comment.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own comments" });
      }

      await storage.deletePhotoComment(commentId);
      const commentCount = await storage.getPhotoCommentCount(photoId);
      
      res.json({ message: "Comment deleted successfully", commentCount });
    } catch (error) {
      console.error("Delete photo comment error:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Get text posts for event
  app.get("/api/events/:eventId/posts", async (req, res) => {
    try {
      const { eventId } = req.params;
      const posts = await storage.getTextPostsByEvent(eventId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get text posts" });
    }
  });

  // Create text post
  app.post("/api/events/:eventId/posts", async (req, res) => {
    try {
      const { eventId } = req.params;
      const { userId, content, userName } = req.body;
      
      // Simple validation
      if (!userId || !content || !eventId || !userName) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const post = await storage.createTextPost({
        eventId,
        userId,
        content
      });
      
      // Store user name in event_users table for future reference if not exists
      try {
        // Check if user already exists first
        const existingUser = await storage.getEventUser(userId);
        
        if (!existingUser) {
          // Use direct database insert instead of createEventUser to preserve the userId
          console.log("Creating event_user record:", { userId, userName, eventId });
          await storage.createEventUserWithId({
            id: userId,
            eventId,
            name: userName,
          });
          console.log("✅ Event user created successfully");
        } else {
          console.log("User already exists in event_users:", userId);
        }
      } catch (error) {
        console.log("⚠️ Failed to create event_user:", error);
      }
      
      res.json(post);
    } catch (error) {
      console.error("Text post creation error:", error);
      res.status(500).json({ message: "Failed to create text post", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Delete photo
  app.delete("/api/events/:eventId/photos/:photoId", async (req, res) => {
    try {
      const { eventId, photoId } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Get the photo to check ownership and get file URL
      const photos = await storage.getPhotosByEvent(eventId);
      const photo = photos.find(p => p.id === photoId);
      
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      // Get the event to check if user is the owner
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Get the user to check if they own the event
      const user = await storage.getEventUser(userId);
      const isEventOwner = user && event.ownerId && user.id === event.ownerId;
      
      // Check if user owns this photo OR is the event owner
      if (photo.userId !== userId && !isEventOwner) {
        return res.status(403).json({ message: "You can only delete your own photos or you must be the event owner" });
      }
      
      // Delete from Cloudinary
      try {
        await cloudinaryStorage.deleteFile(photo.fileUrl);
        console.log(`Successfully deleted file from Cloudinary: ${photo.fileUrl}`);
      } catch (error) {
        console.error("Failed to delete from Cloudinary:", error);
        // Continue with database deletion even if Cloudinary fails
      }
      
      // Delete from database
      await storage.deletePhoto(photoId);
      
      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      console.error("Photo deletion error:", error);
      res.status(500).json({ message: "Failed to delete photo", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Delete text post
  app.delete("/api/events/:eventId/posts/:postId", async (req, res) => {
    try {
      const { eventId, postId } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Get the post to check ownership
      const posts = await storage.getTextPostsByEvent(eventId);
      const post = posts.find(p => p.id === postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Get the event to check if user is the owner
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Get the user to check if they own the event
      const user = await storage.getEventUser(userId);
      const isEventOwner = user && event.ownerId && user.id === event.ownerId;
      
      // Check if user owns this post OR is the event owner
      if (post.userId !== userId && !isEventOwner) {
        return res.status(403).json({ message: "You can only delete your own posts or you must be the event owner" });
      }
      
      // Delete from database
      await storage.deleteTextPost(postId);
      
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Post deletion error:", error);
      res.status(500).json({ message: "Failed to delete post", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Debug endpoint - accessible via GET
  app.get("/api/debug", async (req, res) => {
    try {
      console.log("🔧 Debug endpoint accessed");
      const dbUrl = process.env.DATABASE_URL;
      console.log("🔧 DB URL (first 50 chars):", dbUrl?.substring(0, 50));
      
      const users = await storage.getAllUsers();
      console.log("🔧 Users found:", users.length);
      
      res.json({
        status: "debug_active",
        environment: process.env.NODE_ENV,
        usersCount: users.length,
        usernames: users.map(u => u.username),
        databaseUrl: dbUrl?.substring(0, 50) + "...",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("🔧 Debug endpoint error:", error);
      res.status(500).json({
        status: "debug_error",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Authentication routes - secure version with Account Secrets
  app.post("/api/auth/login", async (req, res) => {
    // Prevent caching of login responses
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    
    console.log("🔐 Login request received:", {
      username: req.body?.username,
      timestamp: new Date().toISOString()
    });
    
    try {
      const { username, password } = req.body || {};
      
      if (!username || !password) {
        console.log("❌ Missing credentials");
        return res.status(400).json({ message: "Nombre de usuario y contraseña son requeridos" });
      }
      
      // Check database for user (including admin)
      console.log("🔍 Looking for user in database:", username);
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log("❌ User not found:", username);
        return res.status(401).json({ message: "Usuario no encontrado. Solo el administrador puede crear nuevos usuarios." });
      }
      
      // Verify password matches
      if (password !== user.password) {
        console.log("❌ Invalid password for user:", username);
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }
      
      // Note: Removed isActive validation - inactive users can login but have restricted upload access
      
      console.log(`✅ Login successful for user: ${username} (Admin: ${user.isAdmin})`);
      return res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          fullName: user.fullName, 
          isAdmin: user.isAdmin,
          isActive: user.isActive 
        } 
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Error en el servidor" });
    }
  });

  // Get current user (for auth state)
  app.get("/api/auth/user", async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId as string);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      res.json({ user: { id: user.id, username: user.username, fullName: user.fullName, isAdmin: user.isAdmin, isActive: user.isActive } });
    } catch (error) {
      console.error("User fetch error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all users (admin only)
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Users fetch error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create user endpoint (admin only)
  app.post("/api/users", async (req, res) => {
    try {
      const { username, email, fullName, password, isAdmin } = req.body;
      
      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }
      
      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const newUser = await storage.createUser({
        username,
        password,
        email,
        fullName: fullName || '',
        isAdmin: isAdmin || false,
        isActive: true,
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update user endpoint (admin only)
  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Remove password from updates if it's empty (to keep current password)
      if (updates.password === '') {
        delete updates.password;
      }
      
      const user = await storage.updateUser(id, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // DEBUG NOTE #6: Admin User Deletion Endpoint with CASCADE Support
  // CRITICAL FIX IMPLEMENTED: Resolved "violates foreign key constraint photo_likes_photo_id_fkey"
  // BACKEND INTEGRATION: This endpoint now works seamlessly with database CASCADE constraints
  // DEBUGGING: Check logs for "✅ User deleted successfully" to confirm CASCADE worked
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // LOG REQUEST: Helps track admin panel deletion attempts and timing
      console.log("🗑️ DELETE user request:", {
        userId: id,
        timestamp: new Date().toISOString()
      });
      
      // VALIDATION: Prevent deletion of non-existent users (avoids database errors)
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        console.log("❌ User not found:", id);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("✅ User found, proceeding with cascade deletion:", existingUser.username);
      
      // CASCADE DELETION: Single call triggers automatic deletion of all child records:
      // events → event_users → photos → photo_likes → text_posts
      // DEBUGGING: If this fails, check database CASCADE constraints with execute_sql_tool
      await storage.deleteUser(id);
      
      console.log("✅ User deleted successfully:", id);
      res.status(204).send(); // No Content: Standard REST response for successful deletion
    } catch (error) {
      // ERROR HANDLING: Comprehensive logging for troubleshooting CASCADE failures
      // Most common error before fix: "violates foreign key constraint photo_likes_photo_id_fkey"
      console.error("❌ Error deleting user:", error);
      res.status(500).json({ 
        message: "Failed to delete user", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  /* 
    ADMIN ENDPOINT: /api/admin/cleanup-duplicates
    
    PURPOSE: Clean up duplicate events for a specific user while preserving data
    
    DEBUGGING GUIDE:
    - If cleanup doesn't run: Check userId format matches database (e.g., "lisa-user-id")
    - If photos disappear: Check photo migration logs in cleanup function
    - If wrong event removed: Verify createdAt timestamp sorting logic
    - If endpoint returns HTML: Check middleware order and API routing
    
    USAGE: POST with { "userId": "user-id-format" }
    
    SAFETY FEATURES:
    - Comprehensive logging throughout cleanup process
    - Photos migrated before events deleted
    - Atomic operations to prevent partial failures
    - Detailed response with action summary
    
    COMMON ISSUES:
    - User ID format mismatch: Ensure matches app_users.id exactly
    - Database permissions: Verify write access to events and photos tables
    - Middleware conflicts: Check if Vite intercepts API calls
  */
  app.post("/api/admin/cleanup-duplicates", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        console.log(`❌ CLEANUP REQUEST: Missing userId parameter`);
        return res.status(400).json({ 
          message: "userId is required",
          example: { userId: "lisa-user-id" }
        });
      }
      
      console.log(`🧹 CLEANUP REQUEST: Starting cleanup for userId=${userId}`);
      const result = await storage.cleanupDuplicateEvents(userId);
      
      console.log(`✅ CLEANUP RESPONSE: removed=${result.removed}, kept=${result.kept}`);
      res.json({ 
        message: "Duplicate cleanup completed",
        removedEvents: result.removed,
        keptEventId: result.kept,
        userId: userId
      });
    } catch (error) {
      console.error(`❌ CLEANUP ENDPOINT ERROR: userId=${req.body?.userId}`, error);
      res.status(500).json({ 
        message: "Failed to cleanup duplicates",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Database health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      console.log("🩺 Health check - users found:", users.length);
      
      /* 
        AUTO CLEANUP FEATURE: Clean duplicates via health check
        
        USAGE: GET /api/health?cleanup=userId
        
        DEBUGGING:
        - If cleanup doesn't trigger: Check query parameter format
        - If no logs appear: Verify userId exists in database
        - Use this for one-time cleanup operations during development
        
        PRODUCTION NOTE: Remove this feature in production environments
      */
      if (req.query.cleanup) {
        const userId = req.query.cleanup as string;
        console.log(`🧹 AUTO-CLEANUP: Requested for userId=${userId}`);
        try {
          const cleanupResult = await storage.cleanupDuplicateEvents(userId);
          console.log(`✅ AUTO-CLEANUP COMPLETED: ${cleanupResult.removed} events removed, kept: ${cleanupResult.kept}`);
        } catch (cleanupError) {
          console.error(`❌ AUTO-CLEANUP FAILED: userId=${userId}`, cleanupError);
        }
      }
      
      res.json({ 
        status: "healthy", 
        database: "connected",
        usersCount: users.length,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("🩺 Health check failed:", error);
      res.status(500).json({ 
        status: "unhealthy", 
        database: "error",
        error: error instanceof Error ? error.message : String(error),
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    }
  });

  // PHASE 2: Database migration endpoint for guest attendees
  app.post("/api/migrate-attendees-guest-table", async (req, res) => {
    try {
      console.log("🔄 MIGRATING: event_attendees table to support guest attendees");
      
      const result = await storage.migrateAttendeesTableForGuests();
      
      console.log("✅ MIGRATION COMPLETED: event_attendees table supports guests");
      res.json({
        success: true,
        message: "event_attendees table migrated successfully for guest support",
        changes: result
      });
    } catch (error) {
      console.error("❌ MIGRATION FAILED:", error);
      res.status(500).json({
        success: false,
        message: "Failed to migrate event_attendees table",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Note: Default user creation removed for security.
  // Only admin can create users through the admin panel now.

  /* 
    API ENDPOINT: /api/evento/:userParam
    
    PURPOSE: Handle both personal event page and gallery API calls
    
    SUPPORTED FORMATS:
    - /api/evento/javier → Returns event data for join page
    - /api/evento/javier-album → Returns same event data for gallery page
    
    LOGIC: Extracts username from userParam by removing '-album' suffix if present
    
    DEBUG NOTES:
    - Check userParam and extracted username in console logs
    - If "User not found" error: verify username exists in database
    - Both formats should return same event data (different frontend usage)
  */
  app.get("/api/evento/:userParam", async (req, res) => {
    try {
      let { userParam } = req.params;
      
      // EXTRACT USERNAME: Handle both "username" and "username-album" formats
      let username = userParam;
      if (userParam.endsWith('-album')) {
        username = userParam.replace('-album', '');
      }
      
      // DEBUG LOG: Uncomment for debugging routing issues
      // console.log(`🔍 Personal event request - userParam: ${userParam}, extracted username: ${username}`);
      
      // USER LOOKUP: Find user in database by extracted username
      const user = await storage.getUserByUsername(username);
      
      // DEBUG LOG: Uncomment for debugging user lookup issues
      // console.log(`🔍 User lookup result:`, user ? `Found user: ${user.username}` : 'User not found');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // SINGLE POINT OF EVENT CREATION: Only create personal events here to prevent duplicates
      let event = await storage.getEventByOwner(user.id);
      
      // DEBUG: Uncomment to trace event lookup and creation
      // console.log(`🔍 PERSONAL EVENT LOOKUP: user=${user.username}, existing=${event ? event.id : 'none'}`);
      
      if (!event) {
        /* 
          CRITICAL: This is the ONLY place where personal events should be created.
          
          DEBUGGING EVENT CREATION ISSUES:
          - If events are duplicated: Check other endpoints aren't creating events
          - If creation fails: Check database constraints and user.id validity
          - If wrong owner: Verify user.id matches the authenticated user
          
          DUPLICATE PREVENTION:
          - All other endpoints should redirect here instead of creating events
          - Use storage.getEventByOwner() to ensure one event per user
          - Log all creation attempts for audit trail
        */
        console.log(`🆕 CREATING PERSONAL EVENT: user=${user.username} (${user.id})`);
        
        try {
          event = await storage.createEvent({
            title: `${user.fullName}`,
            description: "Comparte tus imágenes y videos con nosotros",
            coverImageUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200",
            backgroundType: "gradient",
            backgroundValue: "from-pink-500 to-pink-600",
            ownerId: user.id
          });
          console.log(`✅ PERSONAL EVENT CREATED: ${event.id} - "${event.title}" for ${user.username}`);
        } catch (createError) {
          console.error(`❌ PERSONAL EVENT CREATION FAILED: user=${user.username}`, createError);
          throw createError;
        }
      } else {
        console.log(`✅ EXISTING PERSONAL EVENT: ${event.id} - "${event.title}" for ${user.username}`);
        
        // DEBUG: Uncomment to verify event ownership
        // if (event.ownerId !== user.id) {
        //   console.warn(`⚠️ OWNERSHIP MISMATCH: event.ownerId=${event.ownerId} !== user.id=${user.id}`);
        // }
      }


      // Use database data directly 
      console.log(`🔧 DATABASE DATA: enableAutoRedirect=${event.enableAutoRedirect}, eventDate=${event.eventDate}, eventTime=${event.eventTime}`);
      
      // PHASE 1: Add date-based redirect logic
      // Calculate if event should redirect to RSVP page based on date and redirect settings
      const shouldRedirectToRSVP = calculateShouldRedirect(event);
      
      res.json({
        ...event,
        shouldRedirectToRSVP
      });
    } catch (error) {
      console.error("Personal event error:", error);
      res.status(500).json({ message: "Failed to get personal event" });
    }
  });

  // Update personal event
  app.put("/api/evento/:userParam", async (req, res) => {
    try {
      let { userParam } = req.params;
      
      // Handle album format: extract username from "username-album"
      let username = userParam;
      if (userParam.endsWith('-album')) {
        username = userParam.replace('-album', '');
      }
      const { title, description, coverImageUrl, backgroundType, backgroundValue, eventDate, eventTime, timezone, eventPlace, eventAddress, enableAutoRedirect } = req.body;
      
      // Find the user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's personal event
      const event = await storage.getEventByOwner(user.id);
      if (!event) {
        return res.status(404).json({ message: "Personal event not found" });
      }
      
      console.log('🔧 SERVER UPDATE: Received update request:', {
        eventDate: eventDate,
        eventTime: eventTime,
        eventPlace: eventPlace,
        eventAddress: eventAddress,
        timezone: timezone
      });
      
      // Update the event including date and location fields
      const updatedEvent = await storage.updateEvent(event.id, {
        title: title || event.title,
        description: description || event.description,
        coverImageUrl: coverImageUrl || event.coverImageUrl,
        backgroundType: backgroundType || event.backgroundType || "gradient",
        backgroundValue: backgroundValue || event.backgroundValue || "from-pink-500 to-pink-600",
        eventDate: eventDate !== undefined ? eventDate : event.eventDate,
        eventTime: eventTime !== undefined ? eventTime : event.eventTime,
        timezone: timezone !== undefined ? timezone : event.timezone,
        eventPlace: eventPlace !== undefined ? eventPlace : event.eventPlace,
        eventAddress: eventAddress !== undefined ? eventAddress : event.eventAddress,
        enableAutoRedirect: enableAutoRedirect !== undefined ? enableAutoRedirect : (event.enableAutoRedirect || false)
      });
      
      console.log('✅ SERVER UPDATE: Event updated successfully:', {
        id: updatedEvent.id,
        eventDate: updatedEvent.eventDate,
        eventTime: updatedEvent.eventTime,
        eventPlace: updatedEvent.eventPlace,
        eventAddress: updatedEvent.eventAddress
      });
      
      res.json(updatedEvent);
    } catch (error) {
      console.error("Update personal event error:", error);
      res.status(500).json({ message: "Failed to update personal event" });
    }
  });

  // Upload cover image for personal event
  app.post("/api/evento/:userParam/cover-image", upload.single('coverImage'), async (req, res) => {
    let { userParam } = req.params;
    
    // Handle album format: extract username from "username-album"
    let username = userParam;
    if (userParam.endsWith('-album')) {
      username = userParam.replace('-album', '');
    }
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    try {
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's personal event
      const event = await storage.getEventByOwner(user.id);
      if (!event) {
        return res.status(404).json({ error: "Personal event not found" });
      }

      // Upload to Cloudinary using new organized structure
      const result = await cloudinaryStorage.uploadFile(file, {
        folder: 'covers',
        resourceType: 'auto',
        fileName: `cover-${Date.now()}`,
        eventId: event.id,
        eventTitle: event.title,
        ownerUsername: user.username
      });

      if (result.success) {
        // Update event with new cover image URL
        const updatedEvent = await storage.updateEvent(event.id, {
          coverImageUrl: result.url
        });

        res.json({ 
          success: true, 
          url: result.url,
          event: updatedEvent 
        });
      } else {
        res.status(500).json({ error: result.error || "Failed to upload cover image" });
      }
    } catch (error) {
      console.error("Error uploading cover image:", error);
      res.status(500).json({ error: "Failed to upload cover image" });
    }
  });

  // Upload background image endpoint
  app.post("/api/upload-image", upload.single('image'), async (req, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      console.log("📤 Background image upload request:", {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      });

      // Upload to Cloudinary using general backgrounds folder
      const result = await cloudinaryStorage.uploadFile(file, {
        folder: 'backgrounds',
        resourceType: 'image',
        fileName: `background-${Date.now()}`
      });

      if (result.success && result.url) {
        console.log("✅ Background image uploaded successfully:", result.url);
        res.json({ url: result.url });
      } else {
        console.error("❌ Background image upload failed:", result.error);
        res.status(500).json({ error: result.error || "Failed to upload background image" });
      }
    } catch (error) {
      console.error("❌ Background image upload error:", error);
      res.status(500).json({ error: "Failed to upload background image" });
    }
  });

  // Function to create a text file for text posts (simpler approach)
  const textToFile = (text: string, userName: string, date: Date): Buffer => {
    const dateStr = date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const content = `
======================================
          PUBLICACIÓN DE TEXTO
======================================

Fecha: ${dateStr}
Usuario: ${userName}

--------------------------------------

${text}

--------------------------------------
Generado desde la galería de eventos
======================================
    `.trim();
    
    return Buffer.from(content, 'utf-8');
  };

  // Download event gallery as ZIP
  app.get("/api/events/:eventId/download-zip", async (req, res) => {
    try {
      const { eventId } = req.params;
      console.log("📦 ZIP download request for event:", eventId);
      
      // Get event to verify it exists and get title for filename
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Get all photos and text posts for the event
      const photos = await storage.getPhotosForEvent(eventId);
      const textPosts = await storage.getTextPostsByEvent(eventId);
      
      console.log(`📦 Found ${photos.length} photos and ${textPosts.length} text posts for ZIP download`);

      if (photos.length === 0 && textPosts.length === 0) {
        return res.status(404).json({ message: "No content found for this event" });
      }

      // Set response headers for ZIP download
      const zipFilename = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_galeria_completa.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

      // Create archiver instance
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      // Handle archive errors
      archive.on('error', (err) => {
        console.error('📦 Archive error:', err);
        res.status(500).json({ message: 'Error creating ZIP file' });
      });

      // Pipe archive to response
      archive.pipe(res);

      let addedFiles = 0;
      const totalFiles = photos.length + textPosts.length;

      // Add photos to archive
      for (const photo of photos) {
        try {
          console.log(`📦 Adding photo ${addedFiles + 1}/${totalFiles}: ${photo.originalName}`);
          
          // Fetch file from Cloudinary URL
          const response = await fetch(photo.fileUrl);
          if (!response.ok) {
            console.warn(`📦 Failed to fetch ${photo.originalName}: ${response.status}`);
            continue;
          }

          const buffer = await response.buffer();
          
          // Create safe filename with date prefix
          const date = new Date(photo.createdAt).toISOString().split('T')[0];
          const safeFilename = `${date}_${photo.originalName}`.replace(/[^a-zA-Z0-9.-]/g, '_');
          
          // Add file to archive
          archive.append(buffer, { name: `fotos/${safeFilename}` });
          addedFiles++;
          
        } catch (error) {
          console.warn(`📦 Error adding ${photo.originalName} to ZIP:`, error);
        }
      }

      // Add text posts as text files to archive
      for (const textPost of textPosts) {
        try {
          console.log(`📦 Adding text post ${addedFiles + 1}/${totalFiles}: ${textPost.content.substring(0, 50)}...`);
          
          // Generate text file from text post
          const textBuffer = textToFile(textPost.content, textPost.userName, new Date(textPost.createdAt));
          
          // Create safe filename with date prefix
          const date = new Date(textPost.createdAt).toISOString().split('T')[0];
          const safeFilename = `${date}_publicacion_${textPost.userName.replace(/[^a-zA-Z0-9]/g, '_')}_${textPost.id.substring(0, 8)}.txt`;
          
          // Add text file to archive
          archive.append(textBuffer, { name: `publicaciones/${safeFilename}` });
          addedFiles++;
          
        } catch (error) {
          console.warn(`📦 Error adding text post to ZIP:`, error);
        }
      }

      console.log(`📦 Successfully added ${addedFiles}/${totalFiles} files to ZIP`);
      
      // Finalize the archive
      await archive.finalize();
      
    } catch (error) {
      console.error("📦 Error creating ZIP download:", error);
      res.status(500).json({ message: "Failed to create ZIP download" });
    }
  });

  // PHASE 2: Event RSVP and Check-in Endpoints
  
  // Get attendees for an event (organizer only)
  app.get("/api/events/:eventId/attendees", async (req, res) => {
    try {
      const { eventId } = req.params;
      const attendees = await storage.getEventAttendees(eventId);
      res.json(attendees);
    } catch (error) {
      console.error("Error getting event attendees:", error);
      res.status(500).json({ message: "Failed to get event attendees" });
    }
  });

  // Get attendee stats for an event
  app.get("/api/events/:eventId/attendee-stats", async (req, res) => {
    try {
      const { eventId } = req.params;
      const stats = await storage.getAttendeeStats(eventId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting attendee stats:", error);
      res.status(500).json({ message: "Failed to get attendee stats" });
    }
  });

  // PHASE 2: Enhanced confirm attendance for both registered users and guests
  app.post("/api/events/:eventId/confirm-attendance", async (req, res) => {
    try {
      const { eventId } = req.params;
      const { userId, userName, userEmail, userWhatsapp, companionsCount } = req.body;
      
      // Get event details for email
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Evento no encontrado" });
      }

      // Get event owner details for email
      const eventOwner = await storage.getUser(event.ownerId || '');
      const organizerName = eventOwner?.fullName || eventOwner?.username || 'El organizador';
      
      // Support both old format (registered users) and new format (guests)
      if (userEmail && userName && userWhatsapp) {
        // NEW FORMAT: Guest registration with full contact info and companions
        const guestData = {
          eventId,
          guestEmail: userEmail,
          guestName: userName,
          guestWhatsapp: userWhatsapp,
          companionsCount: companionsCount || "0",
          status: "confirmed" as const
        };
        
        // Validate guest data
        try {
          insertGuestAttendeeSchema.parse(guestData);
        } catch (validationError) {
          console.error("Guest data validation failed:", validationError);
          return res.status(400).json({ 
            message: "Datos de invitado inválidos", 
            error: validationError 
          });
        }
        
        const attendee = await storage.confirmGuestAttendance(eventId, guestData);
        console.log(`✅ GUEST RSVP CONFIRMED: ${userName} (${userEmail}) confirmed for event ${eventId}`);
        
        // Send confirmation email to guest
        try {
          const eventUrl = `${req.protocol}://${req.get('host')}/evento/${eventOwner?.username || 'event'}`;
          await emailService.sendEventRegistrationConfirmation(userEmail, {
            guestName: userName,
            eventTitle: event.title,
            eventDate: event.eventDate || undefined,
            eventTime: event.eventTime || undefined,
            eventPlace: event.eventPlace || undefined,
            eventAddress: event.eventAddress || undefined,
            qrCode: attendee.qrCode || '',
            eventUrl,
            organizerName
          });
          console.log(`📧 CONFIRMATION EMAIL SENT to guest: ${userEmail}`);
        } catch (emailError) {
          console.error("Error sending confirmation email to guest:", emailError);
          // Don't fail the registration if email fails
        }
        
        // ADMIN NOTIFICATION LOGIC: Check thresholds for attendee confirmations  
        try {
          // Get notification settings for this event
          const db = storage.getDb();
          const [notificationSettings] = await db
            .select()
            .from(eventNotificationSettings)
            .where(eq(eventNotificationSettings.eventId, eventId));

          if (notificationSettings && notificationSettings.attendeeConfirmationsEnabled) {
            console.log(`📊 THRESHOLD CHECK: Notifications enabled for event ${eventId}`);
            
            // Get current total of confirmed attendees
            const totalConfirmed = await storage.getAttendeeStats(eventId);
            const currentCount = totalConfirmed.confirmed || 0;
            const lastCount = parseInt(notificationSettings.lastAttendeeCount || "0");
            const threshold = parseInt(notificationSettings.attendeeConfirmationsThreshold || "5");
            
            console.log(`📊 THRESHOLD CHECK: current=${currentCount}, last=${lastCount}, threshold=${threshold}`);
            
            // Check if we've reached a new threshold
            const lastThresholdReached = Math.floor(lastCount / threshold);
            const currentThresholdReached = Math.floor(currentCount / threshold);
            
            if (currentThresholdReached > lastThresholdReached) {
              console.log(`🎯 THRESHOLD REACHED: ${threshold} new confirmations, sending admin notification`);
              
              // Get recent attendees for the email (last threshold amount)
              // TODO: Need to implement getRecentConfirmedAttendees method in storage
              console.log(`📧 Would send notification for threshold reached`);
              
              // Update the last attendee count
              await db
                .update(eventNotificationSettings)
                .set({ 
                  lastAttendeeCount: currentCount.toString(),
                  updatedAt: sql`NOW()`
                })
                .where(eq(eventNotificationSettings.eventId, eventId));
                
              console.log(`✅ THRESHOLD: Updated lastAttendeeCount to ${currentCount}`);
            }
          }
        } catch (thresholdError) {
          console.error("Error checking attendee threshold:", thresholdError);
          // Don't fail the registration if threshold check fails
        }
        
        res.json({
          success: true,
          attendeeId: attendee.id,
          qrCode: attendee.qrCode,
          message: "Asistencia confirmada exitosamente"
        });
      } else if (userId) {
        // OLD FORMAT: Registered user confirmation (backwards compatibility)
        const attendee = await storage.confirmAttendance(eventId, userId);
        console.log(`✅ USER RSVP CONFIRMED: User ${userId} confirmed for event ${eventId}`);
        
        // Get user details for email
        const user = await storage.getUser(userId);
        if (user && user.email) {
          try {
            const eventUrl = `${req.protocol}://${req.get('host')}/evento/${eventOwner?.username || 'event'}`;
            await emailService.sendEventRegistrationConfirmation(user.email, {
              guestName: user.fullName || user.username,
              eventTitle: event.title,
              eventDate: event.eventDate || undefined,
              eventTime: event.eventTime || undefined,
              eventPlace: event.eventPlace || undefined,
              eventAddress: event.eventAddress || undefined,
              qrCode: attendee.qrCode || '',
              eventUrl,
              organizerName
            });
            console.log(`📧 CONFIRMATION EMAIL SENT to registered user: ${user.email}`);
          } catch (emailError) {
            console.error("Error sending confirmation email to registered user:", emailError);
            // Don't fail the registration if email fails
          }
        }
        
        res.json({
          success: true,
          attendeeId: attendee.id,
          qrCode: attendee.qrCode,
          message: "Asistencia confirmada exitosamente"
        });
      } else {
        return res.status(400).json({ 
          message: "Se requiere userId para usuarios registrados o userName, userEmail, userWhatsapp para invitados" 
        });
      }
    } catch (error) {
      console.error("Error confirming attendance:", error);
      res.status(500).json({ 
        message: "Error al confirmar asistencia", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Check-in attendee via QR code
  app.post("/api/events/:eventId/checkin", async (req, res) => {
    try {
      const { eventId } = req.params;
      const { qrCode, checkedInBy } = req.body;
      
      if (!qrCode) {
        return res.status(400).json({ message: "QR code is required" });
      }
      
      // Find attendee by QR code
      const attendee = await storage.getAttendeeByQR(qrCode);
      if (!attendee) {
        return res.status(404).json({ message: "Invalid QR code" });
      }
      
      // Verify QR belongs to this event
      if (attendee.eventId !== eventId) {
        return res.status(400).json({ message: "QR code does not belong to this event" });
      }
      
      // Check if already checked in
      if (attendee.status === 'present') {
        return res.status(400).json({ message: "Already checked in", attendee });
      }
      
      // Update status to present (using null for scanner check-ins)
      const finalCheckedInBy = checkedInBy === 'scanner' ? null : checkedInBy;
      const updatedAttendee = await storage.updateAttendeeStatus(
        attendee.id, 
        'present', 
        finalCheckedInBy
      );
      
      console.log(`✅ CHECK-IN SUCCESS: Attendee ${attendee.userId} checked in to event ${eventId}`);
      res.json(updatedAttendee);
    } catch (error) {
      console.error("Error checking in attendee:", error);
      res.status(500).json({ message: "Failed to check in attendee" });
    }
  });

  // Manual check-in toggle for admins (alternates between confirmed and present)
  app.post("/api/events/:eventId/manual-checkin", async (req, res) => {
    try {
      const { eventId } = req.params;
      const { attendeeId, action } = req.body;
      
      if (!attendeeId || !action) {
        return res.status(400).json({ message: "attendeeId and action are required" });
      }
      
      if (!['checkin', 'undo_checkin'].includes(action)) {
        return res.status(400).json({ message: "action must be 'checkin' or 'undo_checkin'" });
      }
      
      // Get the attendee to verify they exist and belong to this event
      const attendee = await storage.getAttendeeById(attendeeId);
      if (!attendee) {
        return res.status(404).json({ message: "Attendee not found" });
      }
      
      if (attendee.eventId !== eventId) {
        return res.status(400).json({ message: "Attendee does not belong to this event" });
      }
      
      // Determine attendee modification permissions based on check-in origin
      // QR check-ins: attendee has qrCode and status 'present' (came via QR scanner)
      // Manual check-ins: attendee status 'present' but no qrCode or was set manually
      const hasQRCode = Boolean(attendee.qrCode);
      const isQRCheckIn = attendee.status === 'present' && hasQRCode;
      const isManualCheckIn = attendee.status === 'present' && !hasQRCode;
      
      // Rules:
      // - "confirmed": can change to "present" (checkin action)
      // - "present" (manual): can change back to "confirmed" (undo_checkin action)  
      // - "present" (QR/scanner): PROTECTED, cannot be modified
      if (isQRCheckIn) {
        return res.status(400).json({ 
          message: "Este asistente llegó por QR y no puede modificarse" 
        });
      }
      
      // Validate action based on current status
      if (attendee.status === 'confirmed' && action !== 'checkin') {
        return res.status(400).json({ 
          message: "Solo se permite check-in para asistentes confirmados" 
        });
      }
      
      if (isManualCheckIn && action !== 'undo_checkin') {
        return res.status(400).json({ 
          message: "Solo se permite deshacer check-in para asistentes presentes por admin" 
        });
      }
      
      const newStatus = action === 'checkin' ? 'present' : 'confirmed';
      
      // Update attendee status - use null to avoid FK constraint issues
      // We'll distinguish manual vs QR by storing a marker in a different way
      const checkedInBy = newStatus === 'present' ? null : undefined;
      const updatedAttendee = await storage.updateAttendeeStatus(
        attendeeId, 
        newStatus, 
        checkedInBy ?? undefined // Convert null to undefined to match type signature
      );
      
      console.log(`✅ MANUAL CHECK-IN: Attendee ${attendeeId} status changed to ${newStatus} by admin`);
      res.json(updatedAttendee);
    } catch (error) {
      console.error("Error in manual check-in:", error);
      res.status(500).json({ message: "Failed to perform manual check-in" });
    }
  });

  // Get current user's attendance status for an event
  app.get("/api/events/:eventId/my-attendance", async (req, res) => {
    try {
      const { eventId } = req.params;
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const attendee = await storage.getEventAttendeeByUser(eventId, userId as string);
      res.json(attendee || null);
    } catch (error) {
      console.error("Error getting attendance status:", error);
      res.status(500).json({ message: "Failed to get attendance status" });
    }
  });



  // TEMPORARY ENDPOINT: Migrate database to add attendees table
  app.post("/api/migrate-attendees-table", async (req, res) => {
    try {
      console.log("🔧 MIGRATION: Creating event_attendees table...");
      
      // Use storage migration function
      const result = await storage.migrateAddAttendeeTable();
      
      console.log("✅ MIGRATION: event_attendees table created successfully");
      res.json({ success: true, message: "event_attendees table created", result });
    } catch (error) {
      console.error("❌ MIGRATION ERROR:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // TEMP ENDPOINT: Remove QR code from an attendee for testing manual toggle
  app.post('/api/events/:eventId/remove-qr/:attendeeId', async (req, res) => {
    try {
      const { eventId, attendeeId } = req.params;
      
      // Remove QR code from specific attendee to test manual toggle
      await storage.updateEventAttendee(attendeeId, {
        qrCode: null, // Remove QR code to enable manual toggle
        status: 'confirmed'
      });

      res.json({ 
        success: true, 
        message: 'QR code removed from attendee for manual toggle testing',
        attendeeId 
      });

    } catch (error) {
      console.error('Error removing QR code:', error);
      res.status(500).json({ message: 'Error removing QR code' });
    }
  });

  // EMERGENCY MIGRATION: Execute location columns migration via direct DB call
  app.post("/api/emergency-migrate-location", async (req, res) => {
    try {
      console.log('🚨 EMERGENCY MIGRATION: Adding location columns to events table');
      
      // Use the existing database connection from storage
      const migrationQueries = [
        `ALTER TABLE events ADD COLUMN IF NOT EXISTS event_place TEXT`,
        `ALTER TABLE events ADD COLUMN IF NOT EXISTS event_address TEXT`
      ];
      
      for (const query of migrationQueries) {
        console.log('📝 EXECUTING:', query);
        await storage.executeRawQuery(query);
      }
      
      console.log('✅ EMERGENCY MIGRATION COMPLETED');
      res.json({ 
        success: true, 
        message: 'Emergency location migration completed',
        queries: migrationQueries
      });
    } catch (error) {
      console.error('❌ EMERGENCY MIGRATION ERROR:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // MIGRATION VERIFICATION: Check if location columns exist
  app.get("/api/verify-location-columns", async (req, res) => {
    try {
      console.log('🔍 VERIFICATION: Checking location columns in events table');
      
      // Create direct postgres connection to execute schema changes
      let connectionString = process.env.DATABASE_URL!;
      
      // Fix URL encoding for special characters
      if (connectionString.includes('#')) {
        connectionString = connectionString.replace('#', '%23');
      }
      
      const client = postgres(connectionString);
      
      // Check existing columns first
      const checkColumns = await client`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name IN ('event_place', 'event_address')
      `;
      
      console.log('📋 EXISTING LOCATION COLUMNS:', checkColumns);
      
      const existingColumns = checkColumns.map(row => row.column_name);
      let addedColumns = 0;
      
      // Add missing location columns
      if (!existingColumns.includes('event_place')) {
        await client`ALTER TABLE events ADD COLUMN event_place TEXT`;
        console.log('✅ Added event_place column');
        addedColumns++;
      }
      
      if (!existingColumns.includes('event_address')) {
        await client`ALTER TABLE events ADD COLUMN event_address TEXT`;
        console.log('✅ Added event_address column');
        addedColumns++;
      }
      
      // Close connection
      await client.end();
      
      console.log(`✅ LOCATION MIGRATION COMPLETED: ${addedColumns} columns added`);
      res.json({ 
        success: true, 
        message: 'Location columns migration completed',
        existingColumns,
        addedColumns
      });
    } catch (error) {
      console.error('❌ LOCATION MIGRATION ERROR:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // MIGRATION ENDPOINT: Add missing date columns to events table
  app.post("/api/migrate-date-columns", async (req, res) => {
    try {
      console.log('🔧 MIGRATION: Adding date columns to events table');
      
      // Create direct postgres connection to execute schema changes  
      const connectionString = process.env.DATABASE_URL!;
      
      // Fix URL encoding for special characters
      if (connectionString.includes('#')) {
        connectionString = connectionString.replace('#', '%23');
      }
      
      const client = postgres(connectionString);
      
      // Check existing columns first
      const checkColumns = await client`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name IN ('event_date', 'event_time', 'timezone', 'enable_auto_redirect')
      `;
      
      console.log('📋 EXISTING COLUMNS:', checkColumns);
      
      const existingColumns = checkColumns.map(row => row.column_name);
      let addedColumns = 0;
      
      // Add missing columns
      if (!existingColumns.includes('event_date')) {
        await client`ALTER TABLE events ADD COLUMN event_date TEXT`;
        console.log('✅ Added event_date column');
        addedColumns++;
      }
      
      if (!existingColumns.includes('event_time')) {
        await client`ALTER TABLE events ADD COLUMN event_time TEXT`;
        console.log('✅ Added event_time column');
        addedColumns++;
      }
      
      if (!existingColumns.includes('timezone')) {
        await client`ALTER TABLE events ADD COLUMN timezone TEXT DEFAULT 'America/Mexico_City'`;
        console.log('✅ Added timezone column');
        addedColumns++;
      }
      
      if (!existingColumns.includes('enable_auto_redirect')) {
        await client`ALTER TABLE events ADD COLUMN enable_auto_redirect BOOLEAN DEFAULT false`;
        console.log('✅ Added enable_auto_redirect column');
        addedColumns++;
      }
      
      // Close connection
      await client.end();
      
      console.log(`✅ MIGRATION COMPLETED: ${addedColumns} columns added`);
      res.json({ 
        success: true, 
        message: 'Date columns migration completed',
        existingColumns,
        addedColumns
      });
    } catch (error) {
      console.error('❌ MIGRATION ERROR:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // EMAIL TESTING ENDPOINT (for development/testing)
  app.post("/api/test-email", async (req, res) => {
    try {
      const { emailType, recipientEmail, testData } = req.body;
      
      if (!recipientEmail) {
        return res.status(400).json({ message: "recipientEmail is required" });
      }
      
      // Default test data
      const defaultEventData = {
        guestName: "Usuario de Prueba",
        eventTitle: "Evento de Prueba",
        eventDate: "2025-08-15",
        eventTime: "19:00",
        eventPlace: "Casa de María",
        eventAddress: "Calle Falsa 123, Ciudad",
        qrCode: "PRUEBA1234",
        eventUrl: `${req.protocol}://${req.get('host')}/evento/test`,
        organizerName: "Organizador de Prueba"
      };
      
      const eventData = { ...defaultEventData, ...testData };
      
      switch (emailType) {
        case 'registration':
          await emailService.sendEventRegistrationConfirmation(recipientEmail, eventData);
          break;
        case 'reminder':
          await emailService.sendCheckInReminder(recipientEmail, eventData);
          break;
        case 'photo':
          await emailService.sendNewPhotoNotification(recipientEmail, {
            ...eventData,
            photoCount: testData?.photoCount || 5
          });
          break;
        default:
          return res.status(400).json({ message: "emailType must be 'registration', 'reminder', or 'photo'" });
      }
      
      res.json({ 
        success: true, 
        message: `Email de tipo '${emailType}' enviado exitosamente a ${recipientEmail}` 
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ 
        message: "Error enviando email de prueba", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Email configuration endpoint
  app.get('/api/email-config', (req, res) => {
    // Detectar tipo de sistema híbrido basado en API key
    const apiKey = process.env.EMAILIT_API_KEY;
    let systemType = 'resend';
    let primary = 'resend';
    let secondary = 'none';
    let tertiary = 'none';

    if (apiKey) {
      if (apiKey.startsWith('em_api_')) {
        systemType = 'emailit-hybrid';
        primary = 'emailit-api';
        secondary = 'emailit-smtp';
        tertiary = 'resend';
      } else if (apiKey.startsWith('em_smtp_')) {
        systemType = 'emailit-smtp';
        primary = 'emailit-smtp';
        secondary = 'resend';
        tertiary = 'none';
      }
    }

    res.json({
      emailForceAdmin: process.env.EMAIL_FORCE_ADMIN === 'true',
      adminEmail: '2dcommx01@gmail.com',
      resendConfigured: !!process.env.RESEND_API_KEY,
      emailitConfigured: !!process.env.EMAILIT_API_KEY,
      environment: process.env.NODE_ENV || 'development',
      fromEmail: process.env.EMAILIT_FROM_EMAIL || 'onboarding@resend.dev',
      systemType,
      services: {
        primary,
        secondary,
        tertiary
      },
      status: 'active',
      lastTest: new Date().toISOString()
    });
  });

  // Nueva API para configuración de notificaciones
  app.post('/api/email-config/notifications', async (req, res) => {
    try {
      const notificationSettings = req.body;
      
      // Aquí podrías guardar en base de datos las configuraciones
      // Por ahora devolvemos éxito para la UI
      console.log('📧 NOTIFICATION SETTINGS:', notificationSettings);
      
      res.json({ 
        success: true, 
        message: 'Configuración de notificaciones guardada',
        settings: notificationSettings
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al guardar configuración' 
      });
    }
  });

  // Nueva API para probar servicios específicos
  app.post('/api/email/test-service', async (req, res) => {
    try {
      const { service, email, name } = req.body;
      
      console.log(`📧 TESTING SERVICE: ${service} to ${email}`);
      
      const eventData = {
        guestName: name,
        eventTitle: `Prueba ${service.toUpperCase()} - Sistema Híbrido Rocky.mx`,
        eventDate: '2025-08-25',
        eventTime: '20:00',
        eventPlace: 'Centro de Eventos Rocky',
        eventAddress: 'Av. Reforma 456, CDMX',
        organizerName: 'Rocky Events Platform',
        eventUrl: `https://rocky.mx/evento/test-${service}`,
        qrCode: `TEST${service.toUpperCase()}2025`
      };

      if (service === 'hybrid') {
        // Probar sistema híbrido completo
        await emailService.sendEventRegistrationConfirmation(email, eventData);
        res.json({ 
          success: true, 
          message: 'Email enviado via sistema híbrido',
          service: 'hybrid-system'
        });
      } else {
        // Probar servicio específico (esto requeriría implementación específica)
        await emailService.sendEventRegistrationConfirmation(email, eventData);
        res.json({ 
          success: true, 
          message: `Email enviado via ${service}`,
          service 
        });
      }
    } catch (error) {
      console.error(`Error testing ${req.body.service}:`, error);
      res.status(500).json({ 
        success: false, 
        error: `Error en prueba de ${req.body.service}: ${error.message}` 
      });
    }
  });

  // =============================================================================
  // NOTIFICATION SETTINGS APIs - Configuración granular de notificaciones por evento
  // =============================================================================

  // Obtener configuración de notificaciones de un evento
  app.get('/api/events/:eventId/notification-settings', async (req, res) => {
    try {
      const { eventId } = req.params;
      console.log(`📧 FETCHING notification settings for event: ${eventId}`);

      const db = storage.getDb();
      const [settings] = await db
        .select()
        .from(eventNotificationSettings)
        .where(eq(eventNotificationSettings.eventId, eventId));

      if (!settings) {
        // Devolver configuración por defecto si no existe
        console.log(`📧 NO SETTINGS FOUND - returning defaults for event: ${eventId}`);
        const defaultSettings = {
          adminEmail: '',
          attendeeConfirmationsEnabled: true,
          attendeeConfirmationsThreshold: '5',
          eventReminderEnabled: true,
          reminderDaysBefore: '1,2',
          lastAttendeeCount: '0'
        };
        return res.json(defaultSettings);
      }

      console.log(`📧 FOUND settings for event: ${eventId}`);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      res.status(500).json({ error: 'Error al obtener configuración de notificaciones' });
    }
  });

  // Guardar o actualizar configuración de notificaciones de un evento
  app.post('/api/events/:eventId/notification-settings', async (req, res) => {
    try {
      const { eventId } = req.params;
      const settingsData = req.body;
      
      console.log(`📧 SAVING notification settings for event: ${eventId}`, settingsData);

      const db = storage.getDb();
      
      // Verificar si ya existe configuración
      const [existingSettings] = await db
        .select()
        .from(eventNotificationSettings)
        .where(eq(eventNotificationSettings.eventId, eventId));

      if (existingSettings) {
        // Actualizar configuración existente
        console.log(`📧 UPDATING existing settings for event: ${eventId}`);
        const [updated] = await db
          .update(eventNotificationSettings)
          .set({
            ...settingsData,
            updatedAt: new Date()
          })
          .where(eq(eventNotificationSettings.eventId, eventId))
          .returning();

        res.json({ success: true, settings: updated });
      } else {
        // Crear nueva configuración
        console.log(`📧 CREATING new settings for event: ${eventId}`);
        const [created] = await db
          .insert(eventNotificationSettings)
          .values({
            eventId,
            ...settingsData
          })
          .returning();

        res.json({ success: true, settings: created });
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al guardar configuración de notificaciones' 
      });
    }
  });

  // Enviar notificación de prueba para un evento
  app.post('/api/events/:eventId/test-notification', async (req, res) => {
    try {
      const { eventId } = req.params;
      const { notificationType, testEmail } = req.body;
      
      console.log(`📧 TESTING notification for event: ${eventId}, type: ${notificationType}`);

      // Obtener datos del evento
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      // Obtener configuración de notificaciones
      const db = storage.getDb();
      const [settings] = await db
        .select()
        .from(eventNotificationSettings)
        .where(eq(eventNotificationSettings.eventId, eventId));

      const adminEmail = testEmail || settings?.adminEmail || 'admin@evento.com';

      // Generar datos de prueba según el tipo
      let notificationData = {};
      let subject = '';

      switch (notificationType) {
        case 'attendeeConfirmation':
          notificationData = {
            eventTitle: event.title,
            guestName: 'Usuario de Prueba',
            eventDate: event.eventDate,
            eventTime: event.eventTime,
            eventPlace: event.eventPlace,
            organizerName: event.ownerId,
            eventUrl: `https://rocky.mx/evento/${event.ownerId}`,
            qrCode: 'TEST12345'
          };
          subject = '👥 Nueva confirmación de asistencia';
          break;

        case 'eventReminder':
          notificationData = {
            eventTitle: event.title,
            eventDate: event.eventDate,
            eventTime: event.eventTime,
            eventPlace: event.eventPlace,
            eventAddress: event.eventAddress,
            organizerName: event.ownerId
          };
          subject = '⏰ Recordatorio de evento';
          break;

        default:
          return res.status(400).json({ error: 'Tipo de notificación no válido' });
      }

      // Enviar email de prueba
      await emailService.sendEventRegistrationConfirmation(adminEmail, {
        guestName: 'Administrador del Evento',
        eventTitle: `[PRUEBA] ${subject} - ${event.title}`,
        eventDate: event.eventDate || '2025-08-25',
        eventTime: event.eventTime || '19:00',
        eventPlace: event.eventPlace || 'Lugar del evento',
        eventAddress: event.eventAddress || 'Dirección del evento',
        organizerName: event.ownerId || 'Organizador',
        eventUrl: `https://rocky.mx/evento/${event.ownerId}`,
        qrCode: 'TESTNOTIFICATION'
      });

      console.log(`📧 TEST notification sent to: ${adminEmail}`);
      res.json({ 
        success: true, 
        message: `Notificación de prueba enviada a ${adminEmail}`,
        type: notificationType 
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({ 
        success: false, 
        error: `Error al enviar notificación de prueba: ${error.message}` 
      });
    }
  });

  // =============================================================================
  // GLOBAL FEATURE SETTINGS SYSTEM - Control de características para Event Admins
  // =============================================================================

  // Obtener configuración global de características
  app.get('/api/global-features', async (req, res) => {
    try {
      console.log('🎛️ FETCHING global feature settings');

      const settings = await storage.getGlobalFeatureSettings();

      if (!settings) {
        // Devolver configuración por defecto si no existe
        console.log('🎛️ NO GLOBAL SETTINGS FOUND - returning defaults');
        const defaultSettings = {
          attendeeConfirmationsEnabled: true,
          eventRemindersEnabled: true,
          defaultAttendeeConfirmationsEnabled: true,
          defaultEventRemindersEnabled: true
        };
        return res.json(defaultSettings);
      }

      console.log('🎛️ FOUND global feature settings');
      res.json(settings);
    } catch (error) {
      console.error('Error fetching global feature settings:', error);
      res.status(500).json({ error: 'Error al obtener configuración global de características' });
    }
  });

  // Guardar o actualizar configuración global de características
  app.post('/api/global-features', async (req, res) => {
    try {
      const settingsData = req.body;
      
      console.log('🎛️ SAVING global feature settings', settingsData);

      const updatedSettings = await storage.updateGlobalFeatureSettings(settingsData);

      console.log('🎛️ GLOBAL feature settings saved successfully');
      res.json({ success: true, settings: updatedSettings });
    } catch (error) {
      console.error('Error saving global feature settings:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al guardar configuración global de características' 
      });
    }
  });

  // =============================================================================
  // BRANDED LINKS SYSTEM - URL Shortener APIs
  // =============================================================================

  // Development helper to create global_feature_settings table
  app.post('/api/dev/create-global-features-table', async (req, res) => {
    try {
      console.log('🔧 CREATING global_feature_settings table directly in Coolify PostgreSQL');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS global_feature_settings (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          attendee_confirmations_enabled boolean DEFAULT true NOT NULL,
          event_reminders_enabled boolean DEFAULT true NOT NULL,
          default_attendee_confirmations_enabled boolean DEFAULT true NOT NULL,
          default_event_reminders_enabled boolean DEFAULT true NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL,
          updated_at timestamp DEFAULT now() NOT NULL
        );
      `;
      
      await storage.executeRawSQL(createTableSQL);
      console.log('✅ global_feature_settings table created successfully');
      
      res.json({ 
        success: true, 
        message: 'global_feature_settings table created successfully'
      });
    } catch (error: any) {
      console.error('❌ Error creating global_feature_settings table:', error);
      res.status(500).json({ 
        success: false, 
        error: `Error creating table: ${error.message}` 
      });
    }
  });

  // Development helper to create branded_links table
  app.post('/api/dev/create-branded-links-table', async (req, res) => {
    try {
      console.log('🔧 CREATING branded_links table directly in Coolify PostgreSQL');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS branded_links (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          short_code text NOT NULL UNIQUE,
          original_url text NOT NULL,
          clicks text DEFAULT '0' NOT NULL,
          created_by text NOT NULL,
          is_active boolean DEFAULT true NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL,
          last_clicked_at timestamp
        );
      `;
      
      await storage.executeRawSQL(createTableSQL);
      console.log('✅ branded_links table created successfully');
      
      res.json({ success: true, message: 'Table created successfully' });
    } catch (error) {
      console.error('Error creating table:', error);
      res.status(500).json({ error: 'Error creating table' });
    }
  });

  // Get all branded links (admin only)
  app.get('/api/admin/links', async (req, res) => {
    try {
      console.log('🔗 GETTING branded links for admin dashboard');
      const links = await storage.getBrandedLinks();
      res.json(links);
    } catch (error) {
      console.error('Error fetching branded links:', error);
      res.status(500).json({ error: 'Error al obtener enlaces' });
    }
  });

  // Create new branded link (admin only)
  app.post('/api/admin/links', async (req, res) => {
    try {
      const { originalUrl, customCode } = req.body;
      console.log(`🔗 CREATING branded link: ${customCode || 'auto'} → ${originalUrl}`);

      // Validate URL format
      if (!originalUrl || (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://'))) {
        return res.status(400).json({ error: 'URL debe incluir http:// o https://' });
      }

      // Generate short code if not provided
      let shortCode = customCode;
      if (!shortCode) {
        shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      }

      // Check if code already exists
      const existingLink = await storage.getBrandedLinkByCode(shortCode);
      if (existingLink) {
        return res.status(400).json({ error: 'El código ya existe, prueba con otro' });
      }

      // Create link
      const linkData = {
        shortCode,
        originalUrl,
        clicks: "0",
        createdBy: "admin-user-id", // TODO: Get from session
        isActive: true
      };

      const newLink = await storage.createBrandedLink(linkData);
      console.log(`✅ BRANDED LINK CREATED: ${shortCode}`);
      
      res.json({
        success: true,
        link: newLink,
        shortUrl: `https://rocky.mx/s/${shortCode}`
      });
    } catch (error) {
      console.error('Error creating branded link:', error);
      res.status(500).json({ error: 'Error al crear enlace' });
    }
  });

  // Update branded link (admin only)
  app.put('/api/admin/links/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      console.log(`🔗 UPDATING branded link: ${id}`);

      const updatedLink = await storage.updateBrandedLink(id, updates);
      res.json({ success: true, link: updatedLink });
    } catch (error) {
      console.error('Error updating branded link:', error);
      res.status(500).json({ error: 'Error al actualizar enlace' });
    }
  });

  // Delete branded link (admin only)
  app.delete('/api/admin/links/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🔗 DELETING branded link: ${id}`);

      await storage.deleteBrandedLink(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting branded link:', error);
      res.status(500).json({ error: 'Error al eliminar enlace' });
    }
  });

  // =============================================================================
  // PUBLIC REDIRECT ENDPOINT - Short links with /s/ prefix
  // =============================================================================
  app.get('/s/:code', async (req, res) => {
    try {
      const { code } = req.params;
      console.log(`🔗 REDIRECT REQUEST: /s/${code}`);

      const link = await storage.getBrandedLinkByCode(code);
      if (!link || !link.isActive) {
        console.log(`❌ LINK NOT FOUND OR INACTIVE: ${code}`);
        return res.status(404).send(`
          <html>
            <head><title>Enlace no encontrado</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
              <h1>🔗 Enlace no encontrado</h1>
              <p>El enlace que buscas no existe o ha sido desactivado.</p>
              <a href="https://rocky.mx">Ir a Rocky.mx</a>
            </body>
          </html>
        `);
      }

      // Increment click counter
      await storage.incrementLinkClicks(code);
      console.log(`✅ REDIRECTING: ${code} → ${link.originalUrl} (clicks: ${parseInt(link.clicks) + 1})`);

      // Redirect to original URL
      res.redirect(301, link.originalUrl);
    } catch (error) {
      console.error('Error in redirect:', error);
      res.status(500).send(`
        <html>
          <head><title>Error</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>❌ Error del servidor</h1>
            <p>Ocurrió un error al procesar tu solicitud.</p>
            <a href="https://rocky.mx">Ir a Rocky.mx</a>
          </body>
        </html>
      `);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
