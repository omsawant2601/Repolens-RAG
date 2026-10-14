package repolens.backend.service.ai;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.google.genai.errors.ApiException;

import repolens.backend.dto.ChatMessageResponse;
import repolens.backend.dto.CitationDto;
import repolens.backend.entity.ChatMessage;
import repolens.backend.entity.MessageRole;
import repolens.backend.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.util.retry.Retry;

/**
 * Generation step: call the Spring AI chat model and stream tokens to the browser over SSE.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ChatStreamHandler {

    private final ChatModel chatModel;
    private final ChatMessageRepository chatMessageRepository;
    private final CitationMapper citationMapper;

    public SseEmitter stream(
            UUID sessionId,
            ChatMessageResponse savedUserMessage,
            List<CitationDto> citations,
            String systemPrompt,
            String userPrompt) {

        SseEmitter emitter = new SseEmitter(RagSettings.STREAM_TIMEOUT_MS);
        StringBuilder fullReply = new StringBuilder();
        AtomicBoolean receivedToken = new AtomicBoolean();

        try {
            emitter.send(SseEmitter.event()
                    .name("user_message")
                    .data(savedUserMessage));
            emitter.send(SseEmitter.event()
                    .name("status")
                    .data(
                            Map.of("message", "Generating an answer from repository context."),
                            MediaType.APPLICATION_JSON));

            ChatClient.builder(chatModel)
                    .build()
                    .prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .stream()
                    .content()
                    .retryWhen(Retry.backoff(2, Duration.ofSeconds(1))
                            .maxBackoff(Duration.ofSeconds(4))
                            .filter(error -> !receivedToken.get()
                                    && isRetryableProviderError(error))
                            .doBeforeRetry(retry -> log.warn(
                                    "Retrying chat generation after transient provider error ({}/2)",
                                    retry.totalRetries() + 1)))
                    .subscribe(
                            token -> {
                                receivedToken.set(true);
                                appendToken(emitter, fullReply, token);
                            },
                            error -> failStream(emitter, error),
                            () -> completeStream(emitter, sessionId, fullReply, citations));
        } catch (Exception ex) {
            failStream(emitter, ex);
        }

        return emitter;
    }

    private boolean isRetryableProviderError(Throwable error) {
        ApiException apiException = findProviderException(error);
        if (apiException == null) {
            return false;
        }
        return apiException.code() == 503
                || (apiException.code() == 429 && !isQuotaExceeded(apiException));
    }

    private ApiException findProviderException(Throwable error) {
        Throwable current = error;
        while (current != null) {
            if (current instanceof ApiException apiException) {
                return apiException;
            }
            current = current.getCause();
        }
        return null;
    }

    private boolean isQuotaExceeded(ApiException error) {
        String message = error.message();
        return message != null
                && (message.toLowerCase().contains("quota")
                        || message.toLowerCase().contains("exceeded your current"));
    }

    private void appendToken(SseEmitter emitter, StringBuilder fullReply, String token) {
        fullReply.append(token);
        try {
            emitter.send(SseEmitter.event()
                    .name("token")
                    .data(token, MediaType.APPLICATION_JSON));
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private void completeStream(
            SseEmitter emitter,
            UUID sessionId,
            StringBuilder fullReply,
            List<CitationDto> citations) {
        try {
            if (fullReply.isEmpty()) {
                throw new IllegalStateException("The AI provider returned an empty response.");
            }

            ChatMessage assistant = chatMessageRepository.save(ChatMessage.builder()
                    .sessionId(sessionId)
                    .role(MessageRole.ASSISTANT)
                    .content(fullReply.toString())
                    .citations(citationMapper.toJson(citations))
                    .build());

            emitter.send(SseEmitter.event()
                    .name("assistant_message")
                    .data(toMessageResponse(assistant)));
            emitter.send(SseEmitter.event().name("done").data("[DONE]"));
            emitter.complete();
        } catch (Exception ex) {
            failStream(emitter, ex);
        }
    }

    private void failStream(SseEmitter emitter, Throwable error) {
        log.error("Chat response generation failed", error);
        ApiException providerError = findProviderException(error);
        String message = providerError != null ? providerError.message() : error.getMessage();
        if (providerError != null && providerError.code() == 429 && isQuotaExceeded(providerError)) {
            message = "Gemini API quota exceeded. Wait for the quota reset or enable billing for the Google AI project.";
        } else if (message == null || message.isBlank()) {
            message = "Check the backend logs for details.";
        }

        try {
            emitter.send(SseEmitter.event()
                    .name("error")
                    .data(Map.of("message", message)));
            emitter.complete();
        } catch (Exception sendError) {
            log.debug("Could not send chat error event to the client", sendError);
            emitter.completeWithError(sendError);
        }
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getRole(),
                message.getContent(),
                citationMapper.fromJson(message.getCitations()),
                message.getCreatedAt());
    }
}
