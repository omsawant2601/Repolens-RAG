"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import { api, type ChatMessage } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { streamChatMessage } from "@/lib/stream-chat";
import { toast } from "@/components/ui/toast";

export function useChatSessions(repositoryId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chat.sessions(repositoryId),
    queryFn: () => api.listSessions(repositoryId),
    enabled: Boolean(repositoryId) && enabled,
  });
}

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.chat.messages(sessionId ?? ""),
    queryFn: () => api.getMessages(sessionId!),
    enabled: Boolean(sessionId),
  });
}

export function useCreateChatSession(repositoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title?: string) => api.createSession(repositoryId, title),
    onSuccess: (session) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.sessions(repositoryId),
      });
      queryClient.setQueryData(queryKeys.chat.messages(session.id), []);
    },
    onError: (error: Error) => {
      toast.add({
        title: "Could not create chat",
        description: error.message,
        type: "error",
      });
    },
  });
}

export function useStreamChat(sessionId: string | null) {
  const queryClient = useQueryClient();
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [streamStatus, setStreamStatus] = useState("");
  const [streamError, setStreamError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (content: string) => {
      if (!sessionId || !content.trim() || streaming) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const optimisticId = `temp-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: optimisticId,
        role: "USER",
        content: content.trim(),
        citations: [],
        createdAt: new Date().toISOString(),
      };

      const messagesKey = queryKeys.chat.messages(sessionId);
      setStreaming(true);
      setStreamText("");
      setStreamStatus("Searching the indexed repository for relevant code…");
      setStreamError("");

      try {
        queryClient.setQueryData<ChatMessage[]>(
          messagesKey,
          (prev) => {
            const messages = prev ?? [];
            return messages.some((message) => message.id === optimisticId)
              ? messages
              : [...messages, optimistic];
          }
        );

        await streamChatMessage(sessionId, content.trim(), {
          signal: controller.signal,
          onUserMessage: (message) => {
            queryClient.setQueryData<ChatMessage[]>(
              messagesKey,
              (prev) => {
                const messages = (prev ?? []).filter(
                  (item) => item.id !== optimisticId
                );
                return messages.some((item) => item.id === message.id)
                  ? messages
                  : [...messages, message];
              }
            );
          },
          onToken: (token) => {
            setStreamText((prev) => prev + token);
          },
          onStatus: setStreamStatus,
          onAssistantMessage: (message) => {
            queryClient.setQueryData<ChatMessage[]>(
              messagesKey,
              (prev) => {
                const messages = prev ?? [];
                return messages.some((item) => item.id === message.id)
                  ? messages
                  : [...messages, message];
              }
            );
            setStreamText("");
            setStreamStatus("");
          },
        });
        const savedMessages = await api.getMessages(sessionId);
        queryClient.setQueryData(messagesKey, savedMessages);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message =
          err instanceof Error ? err.message : "Unknown error";
        setStreamError(message);
        setStreamStatus("");
        toast.add({
          title: "Message failed",
          description: message,
          type: "error",
        });
        try {
          const savedMessages = await api.getMessages(sessionId);
          queryClient.setQueryData(messagesKey, savedMessages);
        } catch (refreshError) {
          queryClient.setQueryData<ChatMessage[]>(
            messagesKey,
            (prev) => (prev ?? []).filter((m) => m.id !== optimisticId)
          );
          toast.add({
            title: "Could not refresh chat",
            description:
              refreshError instanceof Error
                ? refreshError.message
                : "Unknown error",
            type: "error",
          });
        }
        setStreamText("");
      } finally {
        setStreaming(false);
      }
    },
    [sessionId, streaming, queryClient]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
    setStreamStatus("");
  }, []);

  return { send, stop, streaming, streamText, streamStatus, streamError };
}
