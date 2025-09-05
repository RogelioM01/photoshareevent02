import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event, EventUser } from "@shared/schema";

export function useEvent(eventTitle: string) {
  return useQuery<Event>({
    queryKey: ["/api/events", eventTitle],
    /* 
     * CRITICAL: Explicit queryFn Required
     * 
     * ISSUE FIXED: Default queryClient wasn't making HTTP requests properly
     * SOLUTION: Always provide explicit queryFn for API calls
     * 
     * The default queryFn uses queryKey.join("/") which works for simple cases,
     * but explicit queryFn ensures proper URL construction and error handling.
     * 
     * WITHOUT THIS: Event data won't load and gallery will be empty
     */
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventTitle}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch event: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!eventTitle,
  });
}

export function useEventWithOwner(eventTitle: string) {
  return useQuery<Event & { ownerUsername?: string; ownerIsActive?: boolean }>({
    queryKey: ["/api/events", eventTitle, "with-owner"],
    enabled: !!eventTitle,
  });
}

export function useJoinEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, name }: { eventId: string; name: string }) => {
      const res = await apiRequest(`/api/events/${eventId}/join`, "POST", { name });
      return res.json();
    },
    onSuccess: (data: EventUser) => {
      queryClient.setQueryData(["currentUser"], data);
    },
  });
}
