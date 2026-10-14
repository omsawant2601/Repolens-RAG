package repolens.backend.service.ai;

import java.util.ArrayList;
import java.util.List;

import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.google.genai.Client;
import com.google.genai.types.ContentEmbedding;
import com.google.genai.types.EmbedContentConfig;
import com.google.genai.types.EmbedContentResponse;

@Component
public class GoogleAiStudioEmbeddingModel implements EmbeddingModel, AutoCloseable {

    private final Client client;
    private final String model;
    private final int dimensions;

    public GoogleAiStudioEmbeddingModel(
            @Value("${spring.ai.google.genai.api-key}") String apiKey,
            @Value("${app.ai.embedding.model:gemini-embedding-001}") String model,
            @Value("${app.ai.embedding.dimensions:768}") int dimensions) {
        this.client = Client.builder().apiKey(apiKey).build();
        this.model = model;
        this.dimensions = dimensions;
    }

    @Override
    public EmbeddingResponse call(EmbeddingRequest request) {
        List<String> inputs = request.getInstructions();
        if (inputs.isEmpty()) {
            return new EmbeddingResponse(List.of());
        }

        EmbedContentConfig config = EmbedContentConfig.builder()
                .outputDimensionality(dimensions)
                .build();
        EmbedContentResponse response = client.models.embedContent(model, inputs, config);
        List<ContentEmbedding> embeddings = response.embeddings()
                .orElseThrow(() -> new IllegalStateException("Gemini returned no embeddings"));

        if (embeddings.size() != inputs.size()) {
            throw new IllegalStateException("Gemini returned an unexpected number of embeddings");
        }

        List<Embedding> results = new ArrayList<>(embeddings.size());
        for (int index = 0; index < embeddings.size(); index++) {
            List<Float> values = embeddings.get(index).values()
                    .orElseThrow(() -> new IllegalStateException("Gemini returned an empty embedding"));
            if (values.size() != dimensions) {
                throw new IllegalStateException("Gemini returned an unexpected embedding dimension");
            }

            float[] vector = new float[values.size()];
            for (int valueIndex = 0; valueIndex < values.size(); valueIndex++) {
                vector[valueIndex] = values.get(valueIndex);
            }
            results.add(new Embedding(vector, index));
        }

        return new EmbeddingResponse(results);
    }

    @Override
    public float[] embed(Document document) {
        return embed(getEmbeddingContent(document));
    }

    @Override
    public int dimensions() {
        return dimensions;
    }

    @Override
    public void close() {
        client.close();
    }
}