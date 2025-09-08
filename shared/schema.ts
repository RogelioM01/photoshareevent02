import { pgTable, text, serial, timestamp, uuid, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appUsers = pgTable("app_users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull().default(""),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  backgroundType: text("background_type").default("gradient"), // 'gradient' | 'image'
  backgroundValue: text("background_value").default("from-pink-500 to-pink-600"), // gradient class or image URL
  eventDate: text("event_date"), // ISO date string (YYYY-MM-DD) - optional for existing events
  eventTime: text("event_time"), // Time string (HH:MM) - optional for existing events
  timezone: text("timezone").default("America/Mexico_City"), // IANA timezone identifier
  eventPlace: text("event_place"), // Place type (e.g., "Casa", "Restaurante", "Parque") - optional for existing events
  eventAddress: text("event_address"), // Specific address or location details - optional for existing events
  enableAutoRedirect: boolean("enable_auto_redirect").default(false), // Auto-redirect to RSVP page before event date
  maxCompanions: text("max_companions").default("2"), // Maximum companions allowed per attendee (configurable by organizer)
  ownerId: text("owner_id").references(() => appUsers.id, { onDelete: "cascade" }), // CASCADE: Si se elimina el usuario, se eliminan sus eventos
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventUsers = pgTable("event_users", {
  id: text("id").primaryKey(), // Changed to text to match user IDs
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(), // CASCADE: Si se elimina el evento, se eliminan los usuarios del evento
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const photos = pgTable("photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(), // CASCADE: Si se elimina el evento, se eliminan sus fotos
  userId: text("user_id"), // NULLABLE: No foreign key - allows guest users without restrictions
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: text("file_size").notNull(),
  isVideo: boolean("is_video").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const textPosts = pgTable("text_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(), // CASCADE: Si se elimina el evento, se eliminan sus publicaciones de texto
  userId: text("user_id"), // NULLABLE: No foreign key - allows guest users without restrictions
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const photoLikes = pgTable("photo_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  photoId: uuid("photo_id").references(() => photos.id, { onDelete: "cascade" }).notNull(), // CASCADE: Si se elimina la foto, se eliminan todos sus likes
  userId: text("user_id"), // NULLABLE: No foreign key - allows guest users without restrictions
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const photoComments = pgTable("photo_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  photoId: uuid("photo_id").references(() => photos.id, { onDelete: "cascade" }).notNull(), // CASCADE: Si se elimina la foto, se eliminan todos sus comentarios
  userId: text("user_id"), // NULLABLE: No foreign key - allows guest users without restrictions
  userName: text("user_name").notNull(), // Denormalized for performance
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// PHASE 2: Enhanced Event Attendees Table for RSVP and Check-in System
// Support for both registered users and guest attendees
export const eventAttendees = pgTable("event_attendees", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(), // CASCADE: Si se elimina el evento, se eliminan todas las confirmaciones
  
  // USER IDENTIFICATION - Flexible system for registered users and guests
  userId: text("user_id"), // Optional reference to app_users.id for registered users (nullable for guests)
  guestEmail: text("guest_email"), // Primary identifier for guest attendees
  guestName: text("guest_name").notNull(), // Display name (required for all attendees)
  guestWhatsapp: text("guest_whatsapp"), // Contact info for guest attendees
  
  // COMPANIONS SYSTEM - Phase 1: Field for number of companions
  companionsCount: integer("companions_count").default(0), // Number of companions this attendee will bring
  
  // Attendance status: 'pending' -> 'confirmed' -> 'present' or 'absent'
  status: text("status").notNull().default("pending"), // 'pending' | 'confirmed' | 'present' | 'absent'
  qrCode: text("qr_code").unique(), // Unique QR code for each attendee (generated after confirmation)
  confirmedAt: timestamp("confirmed_at"), // When user confirmed attendance
  checkedInAt: timestamp("checked_in_at"), // When user was checked in at the event
  checkedInBy: text("checked_in_by").references(() => appUsers.id), // Who performed the check-in (usually event owner)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Event Notification Settings - Configuración granular de notificaciones por evento
export const eventNotificationSettings = pgTable("event_notification_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull().unique(), // CASCADE: Si se elimina el evento, se elimina su configuración
  
  // Email de administrador para recibir notificaciones (puede ser diferente al email del owner)
  adminEmail: text("admin_email").notNull(),
  
  // Configuración de notificaciones granulares
  attendeeConfirmationsEnabled: boolean("attendee_confirmations_enabled").default(true).notNull(),
  attendeeConfirmationsThreshold: integer("attendee_confirmations_threshold").default(5).notNull(), // Cada X confirmaciones (5/10/20)
  
  eventReminderEnabled: boolean("event_reminder_enabled").default(true).notNull(),
  reminderDaysBefore: text("reminder_days_before").default("1,2").notNull(), // Días antes del evento (separados por coma)
  
  // Contadores para tracking de umbrales
  lastAttendeeCount: integer("last_attendee_count").default(0).notNull(), // Conteo de confirmaciones para tracking de umbrales
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sistema de Enlaces Cortos Rocky.mx - URL Shortener
export const brandedLinks = pgTable("branded_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  shortCode: text("short_code").notNull().unique(), // Código único: "ABC123", "boda-maria", etc.
  originalUrl: text("original_url").notNull(), // URL completa: "https://google.com", "https://rocky.mx/evento/javier"
  clicks: text("clicks").default("0").notNull(), // Contador de clicks (usando text por consistencia)
  createdBy: text("created_by").references(() => appUsers.id, { onDelete: "cascade" }).notNull(), // Admin que lo creó
  isActive: boolean("is_active").default(true).notNull(), // Permite desactivar links
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastClickedAt: timestamp("last_clicked_at"), // Timestamp del último click (nullable)
});

// Global Feature Settings - Control de características para Event Admins desde Superadmin
export const globalFeatureSettings = pgTable("global_feature_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Control de características visibles en event admin dashboard
  attendeeConfirmationsEnabled: boolean("attendee_confirmations_enabled").default(true).notNull(),
  eventRemindersEnabled: boolean("event_reminders_enabled").default(true).notNull(),
  
  // Valores por defecto para nuevos eventos
  defaultAttendeeConfirmationsEnabled: boolean("default_attendee_confirmations_enabled").default(true).notNull(),
  defaultEventRemindersEnabled: boolean("default_event_reminders_enabled").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertEventUserSchema = createInsertSchema(eventUsers).omit({
  createdAt: true,
}).partial({ id: true }); // Make id optional since it's generated in storage

export const insertBrandedLinkSchema = createInsertSchema(brandedLinks).omit({
  id: true,
  createdAt: true,
  lastClickedAt: true,
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
});

export const insertTextPostSchema = createInsertSchema(textPosts).omit({
  id: true,
  createdAt: true,
});

export const insertPhotoLikeSchema = createInsertSchema(photoLikes).omit({
  id: true,
  createdAt: true,
});

export const insertPhotoCommentSchema = createInsertSchema(photoComments).omit({
  id: true,
  createdAt: true,
});

export const insertEventAttendeeSchema = createInsertSchema(eventAttendees).omit({
  id: true,
  createdAt: true,
  qrCode: true, // QR codes are generated server-side
});

// PHASE 2: Guest Registration Schema with Companions Support
export const insertGuestAttendeeSchema = createInsertSchema(eventAttendees).omit({
  id: true,
  createdAt: true,
  qrCode: true,
  userId: true, // Guests don't have user accounts
}).extend({
  guestEmail: z.string().email("Email válido requerido"),
  guestName: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  guestWhatsapp: z.string().min(10, "WhatsApp debe tener al menos 10 dígitos"),
  companionsCount: z.string().regex(/^\d+$/, "Número de acompañantes debe ser un número").default("0"),
});

export const insertUserSchema = createInsertSchema(appUsers).omit({
  id: true,
  createdAt: true,
});

export const insertEventNotificationSettingsSchema = createInsertSchema(eventNotificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGlobalFeatureSettingsSchema = createInsertSchema(globalFeatureSettings).omit({
  id: true,
  updatedAt: true,
});

export type Event = typeof events.$inferSelect;
export type EventUser = typeof eventUsers.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type TextPost = typeof textPosts.$inferSelect;
export type PhotoLike = typeof photoLikes.$inferSelect;
export type PhotoComment = typeof photoComments.$inferSelect;
export type EventAttendee = typeof eventAttendees.$inferSelect;
export type User = typeof appUsers.$inferSelect;
export type EventNotificationSettings = typeof eventNotificationSettings.$inferSelect;
export type BrandedLink = typeof brandedLinks.$inferSelect;
export type GlobalFeatureSettings = typeof globalFeatureSettings.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertEventUser = z.infer<typeof insertEventUserSchema>;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type InsertTextPost = z.infer<typeof insertTextPostSchema>;
export type InsertPhotoLike = z.infer<typeof insertPhotoLikeSchema>;
export type InsertPhotoComment = z.infer<typeof insertPhotoCommentSchema>;
export type InsertEventAttendee = z.infer<typeof insertEventAttendeeSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertEventNotificationSettings = z.infer<typeof insertEventNotificationSettingsSchema>;
export type InsertBrandedLink = z.infer<typeof insertBrandedLinkSchema>;
export type InsertGlobalFeatureSettings = z.infer<typeof insertGlobalFeatureSettingsSchema>;

// Extended types with user information
export type PhotoWithUser = Photo & { userName: string };
export type TextPostWithUser = TextPost & { userName: string };
export type PhotoWithUserAndLikes = PhotoWithUser & { 
  likeCount: number; 
  isLikedByCurrentUser: boolean;
  commentCount: number;
};

export type PhotoCommentWithUser = PhotoComment & {
  userName: string;
};

// Extended attendee types for RSVP system
export type EventAttendeeWithUser = EventAttendee & { 
  userName?: string | null;
  userFullName?: string | null;
  userEmail?: string | null;
};

export type AttendeeStats = {
  total: number;
  pending: number;
  confirmed: number;
  present: number;
  absent: number;
};
