# 70 — Natural Language Processing and Voice Interfaces

## 1. NLP Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  NLP and Voice Interfaces                         │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Speech    │  │   NLP       │  │   Voice Assistant        │ │
│  │   Engine    │  │   Pipeline  │  │                         │ │
│  │             │  │             │  │ - STT                   │ │
│  │ - STT      │  │ - Token     │  │ - Intent Recognition    │ │
│  │ - TTS      │  │ - Entity    │  │ - Dialog Management     │ │
│  │ - Wake     │  │ - Sentiment │  │ - Context Awareness     │ │
│  │   Word     │  │ - Lang      │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Conversational     │                        │
│                   │   AI Engine          │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Speech-to-Text Service

```typescript
// nlp/speech/stt.service.ts
@Injectable()
export class STTService {
  async transcribe(audio: Buffer, language: string): Promise<TranscriptionResult> {
    const result = await this.whisper.transcribe({
      audio,
      language,
      model: 'whisper-large-v3',
      responseFormat: 'verbose_json',
      timestampGranularities: ['word', 'segment'],
    });

    return {
      text: result.text,
      language: result.language,
      confidence: result.segments.reduce((sum, s) => sum + s.avg_logprob, 0) / result.segments.length,
      segments: result.segments.map((s) => ({
        start: s.start,
        end: s.end,
        text: s.text,
        confidence: s.avg_logprob,
      })),
    };
  }
}
```

## 3. Text-to-Speech Service

```typescript
// nlp/speech/tts.service.ts
@Injectable()
export class TTSService {
  async synthesize(text: string, voice: string, language: string): Promise<AudioBuffer> {
    const result = await this.elevenLabs.synthesize({
      text,
      voiceId: voice,
      modelId: 'eleven-turbo-v2',
      language,
      outputFormat: 'pcm_22050',
    });

    return Buffer.from(result.audioContent);
  }
}
```

## 4. NLP Pipeline

```typescript
// nlp/pipeline/nlp-pipeline.service.ts
@Injectable()
export class NLPPipelineService {
  async process(text: string, context: ConversationContext): Promise<NLPResult> {
    // Tokenization
    const tokens = await this.tokenize(text);

    // Named Entity Recognition
    const entities = await this.extractEntities(tokens);

    // Intent Classification
    const intent = await this.classifyIntent(text, context);

    // Sentiment Analysis
    const sentiment = await this.analyzeSentiment(text);

    // Dependency Parsing
    const dependencies = await this.parseDependencies(tokens);

    return {
      text,
      tokens,
      entities,
      intent,
      sentiment,
      dependencies,
      confidence: intent.confidence,
    };
  }

  private async classifyIntent(text: string, context: ConversationContext): Promise<Intent> {
    const intents = await this.intentClassifier.classify(text, {
      context: context.history,
      domain: 'vat_declaration',
    });

    return intents[0];
  }
}
```

## 5. Intent Recognition

```typescript
// nlp/intents/intent-recognizer.service.ts
@Injectable()
export class IntentRecognizerService {
  private readonly intents = new Map<string, IntentDefinition>();

  async recognize(text: string): Promise<IntentMatch> {
    const intents = await this.loadIntents();

    const scores = await Promise.all(
      intents.map(async (intent) => ({
        intent: intent.name,
        confidence: await this.scoreIntent(text, intent),
      })),
    );

    scores.sort((a, b) => b.confidence - a.confidence);

    return {
      intent: scores[0].intent,
      confidence: scores[0].confidence,
      alternatives: scores.slice(1, 4),
      entities: await this.extractEntities(text, scores[0].intent),
    };
  }

  private async scoreIntent(text: string, intent: IntentDefinition): Promise<number> {
    const embeddings = await this.getEmbeddings(text);
    const intentEmbedding = await this.getIntentEmbedding(intent);

    return this.cosineSimilarity(embeddings, intentEmbedding);
  }
}
```

## 6. Entity Extraction

```typescript
// nlp/entities/entity-extractor.service.ts
@Injectable()
export class EntityExtractorService {
  async extract(text: string, intent: string): Promise<Entity[]> {
    const entities: Entity[] = [];

    // Extract VAT amounts
    const vatAmounts = this.extractVatAmounts(text);
    entities.push(...vatAmounts);

    // Extract dates
    const dates = this.extractDates(text);
    entities.push(...dates);

    // Extract jurisdictions
    const jurisdictions = this.extractJurisdictions(text);
    entities.push(...jurisdictions);

    // Extract account references
    const accounts = this.extractAccounts(text);
    entities.push(...accounts);

    // Extract invoice numbers
    const invoices = this.extractInvoices(text);
    entities.push(...invoices);

    return entities;
  }

  private extractVatAmounts(text: string): Entity[] {
    const regex = /\b\d+(?:\.\d+)?\s*(?:EUR|USD|GBP)\b/gi;
    const matches = text.match(regex) || [];

    return matches.map((match) => ({
      type: 'vat_amount',
      value: match,
      confidence: 0.95,
    }));
  }

  private extractDates(text: string): Entity[] {
    const regex = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g;
    const matches = text.match(regex) || [];

    return matches.map((match) => ({
      type: 'date',
      value: this.parseDate(match),
      confidence: 0.9,
    }));
  }
}
```

## 7. Voice Assistant

```typescript
// nlp/assistant/voice-assistant.service.ts
@Injectable()
export class VoiceAssistantService {
  private readonly conversationHistory = new Map<string, ConversationContext>();

  async processVoiceInput(userId: string, audio: Buffer): Promise<AssistantResponse> {
    const context = this.getContext(userId);

    // Transcribe audio
    const transcription = await this.stt.transcribe(audio, 'en-US');

    // Process with NLP
    const nlpResult = await this.nlpPipeline.process(transcription.text, context);

    // Execute intent
    const response = await this.executeIntent(userId, nlpResult.intent, nlpResult.entities, context);

    // Generate speech response
    const speech = await this.tts.synthesize(response.text, response.voice, 'en-US');

    // Update context
    this.updateContext(userId, transcription.text, response);

    return {
      text: response.text,
      speech,
      actions: response.actions,
      followUp: response.followUp,
    };
  }

  private async executeIntent(userId: string, intent: string, entities: Entity[], context: ConversationContext): Promise<IntentResponse> {
    switch (intent) {
      case 'check_vat_balance':
        return this.handleVatBalance(userId, entities);
      case 'file_vat_return':
        return this.handleFileVatReturn(userId, entities);
      case 'create_transaction':
        return this.handleCreateTransaction(userId, entities);
      case 'generate_report':
        return this.handleGenerateReport(userId, entities);
      default:
        return {
          text: 'I\'m not sure how to help with that. Could you rephrase?',
          voice: 'default',
        };
    }
  }
}
```

## 8. Conversational UI

```typescript
// apps/web/src/features/assistant/components/voice-assistant.tsx
export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState('');

  const { mutate: processVoice } = useVoiceAssistant();

  const startListening = () => {
    setIsListening(true);
    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognition.stop();
  };

  const handleResult = (audio: Blob) => {
    processVoice(audio, {
      onSuccess: (response) => {
        setMessages((prev) => [
          ...prev,
          { role: 'user', text: transcript },
          { role: 'assistant', text: response.text, audio: response.speech },
        ]);
      },
    });
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <p>{message.text}</p>
              {message.audio && <audio controls src={message.audio} className="mt-2" />}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Button onClick={isListening ? stopListening : startListening} variant={isListening ? 'destructive' : 'default'}>
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Button>
          <Input
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
      </div>
    </div>
  );
}
```

## 9. Multilingual Support

```typescript
// nlp/i18n/translation.service.ts
@Injectable()
export class TranslationService {
  async translate(text: string, from: string, to: string): Promise<string> {
    const result = await this.translator.translate(text, {
      from,
      to,
      model: 'nllb-200-distilled-600M',
    });

    return result.translation;
  }

  async detectLanguage(text: string): Promise<string> {
    const result = await this.languageDetector.detect(text);
    return result.language;
  }
}
```

## 10. Sentiment Analysis

```typescript
// nlp/sentiment/sentiment-analyzer.service.ts
@Injectable()
export class SentimentAnalyzerService {
  async analyze(text: string): Promise<SentimentResult> {
    const result = await this.sentimentPipeline(text);

    return {
      sentiment: result.label,
      confidence: result.score,
      emotions: {
        joy: result.joy,
        anger: result.anger,
        fear: result.fear,
        sadness: result.sadness,
      },
    };
  }

  async analyzeCustomerFeedback(feedback: CustomerFeedback): Promise<FeedbackAnalysis> {
    const sentiment = await this.analyze(feedback.text);
    const entities = await this.extractEntities(feedback.text);
    const topics = await this.classifyTopics(feedback.text);

    return {
      feedbackId: feedback.id,
      sentiment,
      entities,
      topics,
      priority: this.computePriority(sentiment, topics),
      suggestedActions: this.suggestActions(sentiment, topics),
    };
  }
}
```
