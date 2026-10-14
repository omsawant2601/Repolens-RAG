package repolens.backend.service.ai;

import java.util.List;

import repolens.backend.dto.CitationDto;

public record RetrievedContext(
        List<CitationDto> citations,
        String contextText) {
}
